/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { School, User, GraduationCap, Settings } from 'lucide-react';
import { ViewMode } from '../types';

interface HeaderProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

export default function Header({ currentView, onViewChange }: HeaderProps) {
  return (
    <header className="bg-white border-b border-slate-100 shadow-xs sticky top-0 z-40 transition-colors" id="header-main">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & School Name */}
          <div 
            className="flex items-center space-x-3 cursor-pointer" 
            onClick={() => onViewChange('student')}
            id="header-logo-container"
          >
            <div className="bg-indigo-50 text-indigo-600 p-2.5 rounded-xl border border-indigo-100/50">
              <School className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold font-sans text-slate-900 tracking-tight flex items-center gap-1.5">
                Today Classroom
                <span className="text-xs font-mono font-medium bg-emerald-50 text-emerald-700/90 px-2 py-0.5 rounded-full border border-emerald-100">
                  실시간
                </span>
              </h1>
              <p className="text-xs text-slate-500 font-sans hidden sm:block">스마트 교실 매칭 시스템</p>
            </div>
          </div>

          {/* Navigation Control */}
          <div className="flex items-center space-x-1 sm:space-x-2" id="header-nav-container">
            <button
              id="nav-btn-student"
              onClick={() => onViewChange('student')}
              title="학생 페이지"
              className={`flex items-center space-x-1.5 px-2.5 py-2 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                currentView === 'student'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="h-4 w-4 shrink-0" />
              <span className="hidden xs:inline">학생 페이지</span>
            </button>

            <button
              id="nav-btn-teacher"
              onClick={() => onViewChange('teacher')}
              title="교사용 입력"
              className={`flex items-center space-x-1.5 px-2.5 py-2 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                currentView === 'teacher'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-emerald-600'
              }`}
            >
              <User className="h-4 w-4 shrink-0" />
              <span className="hidden xs:inline">교사용 입력</span>
            </button>

            <button
              id="nav-btn-admin"
              onClick={() => onViewChange('admin')}
              title="관리자 설정"
              className={`flex items-center space-x-1.5 px-2.5 py-2 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                currentView === 'admin'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Settings className="h-4 w-4 shrink-0" />
              <span className="hidden xs:inline">관리자 설정</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
