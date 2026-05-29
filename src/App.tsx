/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Database, ViewMode } from './types';
import Header from './components/Header';
import StudentView from './components/StudentView';
import TeacherView from './components/TeacherView';
import AdminView from './components/AdminView';
import { GraduationCap, UserCog, ShieldCheck, RefreshCw, AlertTriangle, Copyright, HelpCircle } from 'lucide-react';

const INITIAL_DB: Database = {
  classes: [],
  subjects: [],
  dates: [],
  periods: [],
  schedules: []
};

export default function App() {
  const [currentView, setCurrentView] = useState<ViewMode>('student');
  const [db, setDb] = useState<Database>(INITIAL_DB);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch the full database from the Express server api
  const fetchDb = async () => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      const res = await fetch('/api/db');
      if (!res.ok) {
        throw new Error('데이터베이스를 가져오는 도중 통신에 문제가 발생했습니다.');
      }
      const data = await res.json();
      setDb(data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('서버와 동기화하지 못했습니다. 연결 상태를 확인하고 잠시 후 다시 시도하세요.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDb();
  }, []);

  // Generic handle for posting and updating the DB on response
  const handleApiAction = async (
    url: string,
    method: 'POST' | 'DELETE',
    body?: any
  ): Promise<{ success: boolean; message: string }> => {
    try {
      let finalUrl = url;
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      };
      if (body) {
        options.body = JSON.stringify(body);
        if (method === 'DELETE') {
          const params = new URLSearchParams();
          Object.keys(body).forEach(key => {
            params.append(key, String(body[key]));
          });
          finalUrl = `${url}?${params.toString()}`;
        }
      }

      const res = await fetch(finalUrl, options);
      const data = await res.json();

      if (!res.ok) {
        return { success: false, message: data.error || '에러가 발생했습니다.' };
      }

      setDb(data); // Server always returns full updated DB in our controllers
      return { success: true, message: '정상 처리되었습니다.' };
    } catch (err) {
      console.error(err);
      return { success: false, message: '네트워크 요청 오류가 발생했습니다.' };
    }
  };

  // Admin APIs
  const handleAddClass = (className: string) => handleApiAction('/api/classes', 'POST', { className });
  const handleDeleteClass = (className: string) => handleApiAction('/api/classes', 'DELETE', { className });

  const handleAddSubject = (subjectName: string) => handleApiAction('/api/subjects', 'POST', { subjectName });
  const handleDeleteSubject = (subjectName: string) => handleApiAction('/api/subjects', 'DELETE', { subjectName });

  const handleAddDate = (date: string) => handleApiAction('/api/dates', 'POST', { date });
  const handleDeleteDate = (date: string) => handleApiAction('/api/dates', 'DELETE', { date });

  const handleAddPeriod = (period: string) => handleApiAction('/api/periods', 'POST', { period });
  const handleDeletePeriod = (period: string) => handleApiAction('/api/periods', 'DELETE', { period });

  // Teacher APIs
  const handleAddSchedule = (schedule: {
    date: string;
    class: string;
    subject: string;
    period: string;
    location: string;
  }) => handleApiAction('/api/schedules', 'POST', schedule);

  const handleDeleteSchedule = (id: string) => handleApiAction(`/api/schedules/${id}`, 'DELETE');

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans select-none" id="app-root-container">
      {/* Global Sync Error banner */}
      {errorMsg && (
        <div className="bg-rose-600 text-white px-4 py-3 text-xs sm:text-sm shadow-md flex justify-between items-center z-50 sticky top-0" id="sync-error-banner">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4.5 w-4.5 text-amber-300 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={fetchDb}
            className="bg-white/10 hover:bg-white/20 active:bg-white/30 px-3 py-1 text-xs rounded-md border border-white/20 font-semibold transition-all flex items-center gap-1.5 shrink-0"
          >
            <RefreshCw className="h-3 w-3 animate-spin-pulse" />
            <span>새로고침</span>
          </button>
        </div>
      )}

      {/* Primary Header */}
      <Header currentView={currentView} onViewChange={setCurrentView} />

      {/* Main Container */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8" id="main-content-area">
        {isLoading && db.classes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4" id="loading-spinner-state">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              <RefreshCw className="absolute inset-0 m-auto h-5 w-5 text-indigo-500 animate-pulse" />
            </div>
            <div className="text-center">
              <p className="font-extrabold text-slate-700 tracking-tight">실시간 데이터를 동기화하는 중입니다</p>
              <p className="text-xs text-slate-400 mt-1">서버의 최신 스마트 교실 정보를 불러오고 있습니다.</p>
            </div>
          </div>
        ) : (
          <div id="active-view-rendering">
            {currentView === 'student' && <StudentView db={db} />}
            {currentView === 'teacher' && (
              <TeacherView
                db={db}
                onAddSchedule={handleAddSchedule}
                onDeleteSchedule={handleDeleteSchedule}
              />
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
              />
            )}
          </div>
        )}
      </main>

      {/* Bottom Footer with Explicit Dedicated Links */}
      <footer className="bg-white border-t border-slate-100 py-10 mt-auto shadow-inner" id="app-footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          {/* Bottom Branding info */}
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
