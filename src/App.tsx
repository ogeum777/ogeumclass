import { FormEvent, useEffect, useState } from 'react';
import { AlertTriangle, Copyright, LockKeyhole, RefreshCw } from 'lucide-react';
import Header from './components/Header';
import StudentView from './components/StudentView';
import TeacherView from './components/TeacherView';
import AdminView from './components/AdminView';
import { Database, ViewMode } from './types';
import {
  addClass,
  addPeriod,
  addSchedule,
  addSubject,
  deleteClass,
  deletePeriod,
  deleteSchedule,
  deleteSubject,
  fetchDatabase,
  fetchTeacherPassword,
  updateTeacherPassword,
} from './lib/supabaseDb';

const INITIAL_DB: Database = {
  classes: [],
  subjects: [],
  dates: [],
  periods: [],
  schedules: [],
};

export default function App() {
  const [currentView, setCurrentView] = useState<ViewMode>('student');
  const [db, setDb] = useState<Database>(INITIAL_DB);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [teacherPassword, setTeacherPassword] = useState('');
  const [teacherUnlocked, setTeacherUnlocked] = useState(false);
  const [teacherPasswordInput, setTeacherPasswordInput] = useState('');
  const [teacherAccessError, setTeacherAccessError] = useState<string | null>(null);

  const fetchDb = async () => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      const [nextDb, savedTeacherPassword] = await Promise.all([
        fetchDatabase(),
        fetchTeacherPassword(),
      ]);
      setDb(nextDb);
      setTeacherPassword(savedTeacherPassword);
    } catch (error) {
      console.error(error);
      setErrorMsg('서버와 동기화하지 못했습니다. Supabase 연결 상태와 환경 변수를 확인해 주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDb();
  }, []);

  const handleDataAction = async (
    action: () => Promise<Database>
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const nextDb = await action();
      setDb(nextDb);
      return { success: true, message: '정상 처리되었습니다.' };
    } catch (error: any) {
      console.error(error);
      return {
        success: false,
        message: error?.message || 'Supabase 요청 중 오류가 발생했습니다.',
      };
    }
  };

  const handleAddClass = (className: string) => handleDataAction(() => addClass(className));
  const handleDeleteClass = (className: string) => handleDataAction(() => deleteClass(className));
  const handleAddSubject = (subjectName: string) => handleDataAction(() => addSubject(subjectName));
  const handleDeleteSubject = (subjectName: string) => handleDataAction(() => deleteSubject(subjectName));
  const handleAddPeriod = (period: string) => handleDataAction(() => addPeriod(period));
  const handleDeletePeriod = (period: string) => handleDataAction(() => deletePeriod(period));
  const handleAddSchedule = (schedule: {
    date: string;
    class: string;
    subject: string;
    period: string;
    location: string;
  }) => handleDataAction(() => addSchedule(schedule));
  const handleDeleteSchedule = (id: string) => handleDataAction(() => deleteSchedule(id));

  const handleViewChange = (view: ViewMode) => {
    setCurrentView(view);
    setTeacherAccessError(null);
    setTeacherPasswordInput('');
  };

  const handleTeacherPasswordSubmit = (event: FormEvent) => {
    event.preventDefault();

    if (!teacherPassword || teacherPasswordInput === teacherPassword) {
      setTeacherUnlocked(true);
      setTeacherAccessError(null);
      setTeacherPasswordInput('');
      return;
    }

    setTeacherAccessError('비밀번호가 올바르지 않습니다.');
  };

  const handleUpdateTeacherPassword = async (password: string) => {
    try {
      const savedPassword = await updateTeacherPassword(password);
      setTeacherPassword(savedPassword);
      setTeacherUnlocked(false);
      return { success: true, message: '교사 전용 페이지 비밀번호가 변경되었습니다.' };
    } catch (error: any) {
      console.error(error);
      return {
        success: false,
        message: error?.message || '비밀번호 저장 중 오류가 발생했습니다.',
      };
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans select-none" id="app-root-container">
      {errorMsg && (
        <div className="bg-rose-600 text-white px-4 py-3 text-xs sm:text-sm shadow-md flex justify-between items-center z-50 sticky top-0" id="sync-error-banner">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4.5 w-4.5 text-amber-300 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={fetchDb}
            className="bg-white/10 hover:bg-white/20 active:bg-white/30 px-3 py-1 text-xs rounded-md border border-white/20 font-semibold transition-all flex items-center gap-1.5 shrink-0"
          >
            <RefreshCw className="h-3 w-3" />
            <span>새로고침</span>
          </button>
        </div>
      )}

      <Header currentView={currentView} onViewChange={handleViewChange} />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8" id="main-content-area">
        {isLoading && db.classes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4" id="loading-spinner-state">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
              <RefreshCw className="absolute inset-0 m-auto h-5 w-5 text-indigo-500" />
            </div>
            <div className="text-center">
              <p className="font-extrabold text-slate-700 tracking-tight">데이터를 불러오는 중입니다</p>
              <p className="text-xs text-slate-400 mt-1">Supabase에서 최신 교실 정보를 가져오고 있습니다.</p>
            </div>
          </div>
        ) : (
          <div id="active-view-rendering">
            {currentView === 'student' && <StudentView db={db} />}
            {currentView === 'teacher' && (
              teacherPassword && !teacherUnlocked ? (
                <div className="max-w-md mx-auto bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
                      <LockKeyhole className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-extrabold text-slate-900">교사 전용 페이지</h2>
                      <p className="text-xs text-slate-500 mt-0.5">관리자 시스템에서 설정한 비밀번호를 입력하세요.</p>
                    </div>
                  </div>

                  <form onSubmit={handleTeacherPasswordSubmit} className="space-y-3">
                    <input
                      type="password"
                      value={teacherPasswordInput}
                      onChange={(event) => setTeacherPasswordInput(event.target.value)}
                      className="w-full h-11 rounded-lg border border-slate-200 px-3 text-sm outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                      placeholder="비밀번호 입력"
                      autoFocus
                    />
                    {teacherAccessError && (
                      <div className="rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
                        {teacherAccessError}
                      </div>
                    )}
                    <button
                      type="submit"
                      className="w-full h-11 rounded-lg bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-colors"
                    >
                      접속하기
                    </button>
                  </form>
                </div>
              ) : (
                <TeacherView
                  db={db}
                  onAddSchedule={handleAddSchedule}
                  onDeleteSchedule={handleDeleteSchedule}
                />
              )
            )}
            {currentView === 'admin' && (
              <AdminView
                db={db}
                onAddClass={handleAddClass}
                onDeleteClass={handleDeleteClass}
                onAddSubject={handleAddSubject}
                onDeleteSubject={handleDeleteSubject}
                onAddPeriod={handleAddPeriod}
                onDeletePeriod={handleDeletePeriod}
                teacherPassword={teacherPassword}
                onUpdateTeacherPassword={handleUpdateTeacherPassword}
              />
            )}
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-slate-100 py-10 mt-auto shadow-inner" id="app-footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex justify-center items-center gap-4 text-slate-400 text-xs text-center" id="footer-branding-info">
            <div className="flex items-center space-x-1 font-sans text-[11px] text-slate-400">
              <Copyright className="h-3 w-3 inline" />
              <span>Developed by sangmin</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
