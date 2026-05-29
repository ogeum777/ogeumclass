import { Database, Schedule } from '../types';

type DbRow = Record<string, any>;

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

const CALENDAR_DATE_COUNT = 30;

function assertConfig() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase environment variables are missing.');
  }
}

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDefaultCalendarDates(): string[] {
  const dates: string[] = [];
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  while (dates.length < CALENDAR_DATE_COUNT) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) {
      dates.push(formatLocalDate(cursor));
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

function uniqueSorted(values: string[]) {
  return [...new Set(values.filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true })
  );
}

async function supabaseRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  assertConfig();

  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SUPABASE_ANON_KEY!,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Supabase request failed: ${res.status}`);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

async function fetchRows(table: string, query: string) {
  return supabaseRequest<DbRow[]>(`${table}?${query}`);
}

async function getNamedId(table: string, name: string) {
  const rows = await fetchRows(table, `select=id&name=eq.${encodeURIComponent(name)}&limit=1`);
  if (!rows[0]?.id) {
    throw new Error(`${name} 데이터를 찾을 수 없습니다.`);
  }
  return rows[0].id as string;
}

async function getDateId(date: string) {
  const rows = await supabaseRequest<DbRow[]>(
    `school_dates?on_conflict=date`,
    {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify([{ date }]),
    }
  );
  return rows[0]?.id as string | undefined;
}

export async function fetchDatabase(): Promise<Database> {
  const [classRows, subjectRows, periodRows, dateRows, scheduleRows] = await Promise.all([
    fetchRows('classes', 'select=id,name&order=name.asc'),
    fetchRows('subjects', 'select=id,name&order=name.asc'),
    fetchRows('periods', 'select=id,name,sort_order&order=sort_order.asc,name.asc'),
    fetchRows('school_dates', 'select=date&order=date.asc'),
    fetchRows('schedules', 'select=id,school_date,class_id,subject_id,period_id,location,created_at&order=school_date.asc,created_at.asc'),
  ]);

  const classById = new Map(classRows.map((row) => [row.id, row.name]));
  const subjectById = new Map(subjectRows.map((row) => [row.id, row.name]));
  const periodById = new Map(periodRows.map((row) => [row.id, row.name]));

  const schedules: Schedule[] = scheduleRows.map((row) => ({
    id: row.id,
    date: row.school_date,
    class: classById.get(row.class_id) || '',
    subject: subjectById.get(row.subject_id) || '',
    period: periodById.get(row.period_id) || '',
    location: row.location,
    createdAt: row.created_at,
  })).filter((schedule) => schedule.class && schedule.subject && schedule.period);

  return {
    classes: uniqueSorted(classRows.map((row) => row.name)),
    subjects: uniqueSorted(subjectRows.map((row) => row.name)),
    dates: uniqueSorted([
      ...getDefaultCalendarDates(),
      ...dateRows.map((row) => row.date),
    ]),
    periods: periodRows.map((row) => row.name),
    schedules,
  };
}

export async function addClass(className: string) {
  await supabaseRequest('classes', {
    method: 'POST',
    headers: { Prefer: 'resolution=ignore-duplicates' },
    body: JSON.stringify([{ name: className }]),
  });
  return fetchDatabase();
}

export async function deleteClass(className: string) {
  await supabaseRequest(`classes?name=eq.${encodeURIComponent(className)}`, {
    method: 'DELETE',
  });
  return fetchDatabase();
}

export async function addSubject(subjectName: string) {
  await supabaseRequest('subjects', {
    method: 'POST',
    headers: { Prefer: 'resolution=ignore-duplicates' },
    body: JSON.stringify([{ name: subjectName }]),
  });
  return fetchDatabase();
}

export async function deleteSubject(subjectName: string) {
  const subjectId = await getNamedId('subjects', subjectName);
  await supabaseRequest(`schedules?subject_id=eq.${subjectId}`, { method: 'DELETE' });
  await supabaseRequest(`subjects?id=eq.${subjectId}`, { method: 'DELETE' });
  return fetchDatabase();
}

export async function addPeriod(period: string) {
  const sortOrder = parseInt(period.replace(/\D/g, ''), 10) || 0;
  await supabaseRequest('periods', {
    method: 'POST',
    headers: { Prefer: 'resolution=ignore-duplicates' },
    body: JSON.stringify([{ name: period, sort_order: sortOrder }]),
  });
  return fetchDatabase();
}

export async function deletePeriod(period: string) {
  const periodId = await getNamedId('periods', period);
  await supabaseRequest(`schedules?period_id=eq.${periodId}`, { method: 'DELETE' });
  await supabaseRequest(`periods?id=eq.${periodId}`, { method: 'DELETE' });
  return fetchDatabase();
}

export async function addSchedule(schedule: Omit<Schedule, 'id' | 'createdAt'>) {
  const [classId, subjectId, periodId] = await Promise.all([
    getNamedId('classes', schedule.class),
    getNamedId('subjects', schedule.subject),
    getNamedId('periods', schedule.period),
    getDateId(schedule.date),
  ]);

  await supabaseRequest('schedules?on_conflict=school_date,class_id,period_id', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify([{
      school_date: schedule.date,
      class_id: classId,
      subject_id: subjectId,
      period_id: periodId,
      location: schedule.location,
    }]),
  });

  return fetchDatabase();
}

export async function deleteSchedule(id: string) {
  await supabaseRequest(`schedules?id=eq.${id}`, { method: 'DELETE' });
  return fetchDatabase();
}
