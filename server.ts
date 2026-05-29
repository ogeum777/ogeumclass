import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "db.json");

// Structure of our Database
interface Schedule {
  id: string;
  date: string;
  class: string;
  subject: string;
  period: string;
  location: string;
  createdAt: string;
}

interface Database {
  classes: string[];
  subjects: string[];
  dates: string[];
  periods: string[];
  schedules: Schedule[];
}

const CALENDAR_DATE_COUNT = 30;

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
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

function normalizeDb(data: Database): Database {
  return {
    ...data,
    dates: getDefaultCalendarDates(),
  };
}

// Default initial data
const defaultData: Database = {
  classes: ["1학년 1반", "1학년 2반", "1학년 3반", "2학년 1반", "2학년 2반", "3학년 1반", "3학년 2반"],
  subjects: ["국어", "수학", "영어", "과학", "사회", "정보기술", "음악", "체육", "미술"],
  dates: getDefaultCalendarDates(),
  periods: ["1교시", "2교시", "3교시", "4교시", "5교시", "6교시", "7교시"],
  schedules: [
    {
      id: "schedule-1",
      date: "2026-05-28",
      class: "1학년 1반",
      subject: "수학",
      period: "1교시",
      location: "제1수학실 (본관 3층)",
      createdAt: new Date().toISOString()
    },
    {
      id: "schedule-2",
      date: "2026-05-28",
      class: "1학년 1반",
      subject: "과학",
      period: "2교시",
      location: "과학실험실 (신관 2층)",
      createdAt: new Date().toISOString()
    },
    {
      id: "schedule-3",
      date: "2026-05-28",
      class: "1학년 1반",
      subject: "영어",
      period: "3교시",
      location: "어학실 (본관 4층)",
      createdAt: new Date().toISOString()
    },
    {
      id: "schedule-4",
      date: "2026-05-28",
      class: "1학년 1반",
      subject: "국어",
      period: "4교시",
      location: "교실 (일반교실)",
      createdAt: new Date().toISOString()
    },
    {
      id: "schedule-5",
      date: "2026-05-28",
      class: "1학년 2반",
      subject: "체육",
      period: "1교시",
      location: "체육관 (대강당)",
      createdAt: new Date().toISOString()
    },
    {
      id: "schedule-6",
      date: "2026-05-28",
      class: "1학년 2반",
      subject: "음악",
      period: "2교시",
      location: "음악실 (신관 5층)",
      createdAt: new Date().toISOString()
    },
    {
      id: "schedule-7",
      date: "2026-05-28",
      class: "2학년 1반",
      subject: "정보기술",
      period: "3교시",
      location: "컴퓨터실 (본관 5층)",
      createdAt: new Date().toISOString()
    },
    {
      id: "schedule-8",
      date: "2026-05-29",
      class: "1학년 1반",
      subject: "미술",
      period: "1교시",
      location: "미술실 (신관 4층)",
      createdAt: new Date().toISOString()
    }
  ]
};

// Helper to read DB
function readDb(): Database {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2), "utf-8");
      return normalizeDb(defaultData);
    }
    const content = fs.readFileSync(DB_FILE, "utf-8");
    return normalizeDb(JSON.parse(content));
  } catch (error) {
    console.error("Error reading database file, resetting to defaults...", error);
    return normalizeDb(defaultData);
  }
}

// Helper to write DB
function writeDb(data: Database): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing database file:", error);
  }
}

// Enable JSON parsing
app.use(express.json());

// API Endpoints
// Get full DB state
app.get("/api/db", (req, res) => {
  const db = readDb();
  res.json(db);
});

// Admin: Add a class
app.post("/api/classes", (req, res) => {
  const { className } = req.body;
  if (!className || typeof className !== "string" || className.trim() === "") {
    return res.status(400).json({ error: "올바른 학급 이름을 입력해주세요." });
  }
  const db = readDb();
  const normalized = className.trim();
  if (db.classes.includes(normalized)) {
    return res.status(400).json({ error: "이미 존재하는 학급입니다." });
  }
  db.classes.push(normalized);
  writeDb(db);
  res.json(db);
});

// Admin: Delete a class
app.delete("/api/classes", (req, res) => {
  const className = req.body?.className || req.query?.className;
  if (!className) {
    return res.status(400).json({ error: "학급 이름이 필요합니다." });
  }
  const db = readDb();
  db.classes = db.classes.filter(c => c !== className);
  // Also clean up schedules for deleted class? Let's keep them or drop them. Let's drop them for cleanliness.
  db.schedules = db.schedules.filter(s => s.class !== className);
  writeDb(db);
  res.json(db);
});

// Admin: Add a subject
app.post("/api/subjects", (req, res) => {
  const { subjectName } = req.body;
  if (!subjectName || typeof subjectName !== "string" || subjectName.trim() === "") {
    return res.status(400).json({ error: "올바른 과목 이름을 입력해주세요." });
  }
  const db = readDb();
  const normalized = subjectName.trim();
  if (db.subjects.includes(normalized)) {
    return res.status(400).json({ error: "이미 존재하는 과목입니다." });
  }
  db.subjects.push(normalized);
  writeDb(db);
  res.json(db);
});

// Admin: Delete a subject
app.delete("/api/subjects", (req, res) => {
  const subjectName = req.body?.subjectName || req.query?.subjectName;
  if (!subjectName) {
    return res.status(400).json({ error: "과목 이름이 필요합니다." });
  }
  const db = readDb();
  db.subjects = db.subjects.filter(s => s !== subjectName);
  // Delete schedules associated with subject
  db.schedules = db.schedules.filter(s => s.subject !== subjectName);
  writeDb(db);
  res.json(db);
});

// Admin: Add a date
app.post("/api/dates", (req, res) => {
  const { date } = req.body; // expected format: YYYY-MM-DD
  if (!date || typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: "올바른 날짜 형식(YYYY-MM-DD)을 입력해주세요." });
  }
  const db = readDb();
  if (db.dates.includes(date)) {
    return res.status(400).json({ error: "이미 존재하는 날짜입니다." });
  }
  db.dates.push(date);
  // Keep dates sorted
  db.dates.sort();
  writeDb(db);
  res.json(db);
});

// Admin: Delete a date
app.delete("/api/dates", (req, res) => {
  const date = req.body?.date || req.query?.date;
  if (!date) {
    return res.status(400).json({ error: "날짜 정보가 필요합니다." });
  }
  const db = readDb();
  db.dates = db.dates.filter(d => d !== date);
  db.schedules = db.schedules.filter(s => s.date !== date);
  writeDb(db);
  res.json(db);
});

// Admin: Add a period
app.post("/api/periods", (req, res) => {
  const { period } = req.body; // e.g. "1교시"
  if (!period || typeof period !== "string" || period.trim() === "") {
    return res.status(400).json({ error: "올바른 교시 정보(예: 1교시)를 입력해주세요." });
  }
  const db = readDb();
  const normalized = period.trim();
  if (db.periods.includes(normalized)) {
    return res.status(400).json({ error: "이미 존재하는 교시 구분입니다." });
  }
  db.periods.push(normalized);
  // Try to sort numerically if possible
  db.periods.sort((a, b) => {
    const numA = parseInt(a.replace(/\D/g, "")) || 0;
    const numB = parseInt(b.replace(/\D/g, "")) || 0;
    return numA - numB;
  });
  writeDb(db);
  res.json(db);
});

// Admin: Delete a period
app.delete("/api/periods", (req, res) => {
  const period = req.body?.period || req.query?.period;
  if (!period) {
    return res.status(400).json({ error: "교시 정보가 필요합니다." });
  }
  const db = readDb();
  db.periods = db.periods.filter(p => p !== period);
  db.schedules = db.schedules.filter(s => s.period !== period);
  writeDb(db);
  res.json(db);
});

// Teacher: Register / Replace classroom location
// Teacher defines properties: date, class, subject, period, location
app.post("/api/schedules", (req, res) => {
  const { date, class: className, subject, period, location } = req.body;
  
  if (!date || !className || !subject || !period || !location) {
    return res.status(400).json({ error: "날짜, 학급, 과목, 교시 및 장소를 모두 입력해주세요." });
  }

  const db = readDb();

  // Validate that the fields are from pre-registered dropdowns
  if (!db.dates.includes(date)) {
    return res.status(400).json({ error: "등록되지 않은 날짜입니다. 관리자에게 승인을 요청하거나 다른 날짜를 선택하세요." });
  }
  if (!db.classes.includes(className)) {
    return res.status(400).json({ error: "등록되지 않은 학급입니다." });
  }
  if (!db.subjects.includes(subject)) {
    return res.status(400).json({ error: "등록되지 않은 과목입니다." });
  }
  if (!db.periods.includes(period)) {
    return res.status(400).json({ error: "등록되지 않은 교시입니다." });
  }
  if (typeof location !== "string" || location.trim() === "") {
    return res.status(400).json({ error: "장소를 올바르게 입력해주세요." });
  }

  // Find if there is an existing schedule for this date, class, and period.
  // Overwrite it if it exists. Keep multiple subjects in same period? Often, schools have 1 lesson per period per class.
  // Let's replace if exists, or do a nice update.
  const existingIndex = db.schedules.findIndex(
    s => s.date === date && s.class === className && s.period === period
  );

  const newSchedule: Schedule = {
    id: existingIndex !== -1 ? db.schedules[existingIndex].id : "schedule-" + Date.now() + Math.random().toString(36).substr(2, 4),
    date,
    class: className,
    subject,
    period,
    location: location.trim(),
    createdAt: new Date().toISOString()
  };

  if (existingIndex !== -1) {
    db.schedules[existingIndex] = newSchedule;
  } else {
    db.schedules.push(newSchedule);
  }

  writeDb(db);
  res.json(db);
});

// Teacher/Admin: Delete a specific schedule
app.delete("/api/schedules/:id", (req, res) => {
  const { id } = req.params;
  const db = readDb();
  const initialLen = db.schedules.length;
  db.schedules = db.schedules.filter(s => s.id !== id);
  if (db.schedules.length === initialLen) {
    return res.status(404).json({ error: "해당 일정을 찾을 수 없습니다." });
  }
  writeDb(db);
  res.json(db);
});

// Configure Vite or Static server
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
}

startServer();
