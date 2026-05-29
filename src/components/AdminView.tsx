/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Calendar, School, BookOpen, Clock, Plus, Trash2, ShieldAlert, AlertCircle, LockKeyhole } from 'lucide-react';
import { Database } from '../types';

interface AdminViewProps {
  db: Database;
  onAddClass: (className: string) => Promise<{ success: boolean; message: string }>;
  onDeleteClass: (className: string) => Promise<{ success: boolean; message: string }>;
  onAddSubject: (subjectName: string) => Promise<{ success: boolean; message: string }>;
  onDeleteSubject: (subjectName: string) => Promise<{ success: boolean; message: string }>;
  onAddPeriod: (period: string) => Promise<{ success: boolean; message: string }>;
  onDeletePeriod: (period: string) => Promise<{ success: boolean; message: string }>;
  teacherPassword: string;
  onUpdateTeacherPassword: (password: string) => Promise<{ success: boolean; message: string }>;
}

export default function AdminView({
  db,
  onAddClass,
  onDeleteClass,
  onAddSubject,
  onDeleteSubject,
  onAddPeriod,
  onDeletePeriod,
  teacherPassword,
  onUpdateTeacherPassword,
}: AdminViewProps) {
  // Local form inputs
  const [newClassInput, setNewClassInput] = useState('');
  const [newSubjectInput, setNewSubjectInput] = useState('');
  const [newPeriodInput, setNewPeriodInput] = useState('');
  const [teacherPasswordInput, setTeacherPasswordInput] = useState(teacherPassword);

  // Local helper feedback states
  const [activeFeedback, setActiveFeedback] = useState<{ section: string; type: 'success' | 'error'; text: string } | null>(null);

  const displayFeedback = (section: string, type: 'success' | 'error', text: string) => {
    setActiveFeedback({ section, type, text });
    setTimeout(() => {
      setActiveFeedback(null);
    }, 3500);
  };

  useEffect(() => {
    setTeacherPasswordInput(teacherPassword);
  }, [teacherPassword]);

  const handleUpdateTeacherPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = await onUpdateTeacherPassword(teacherPasswordInput);
    displayFeedback('teacher-password', result.success ? 'success' : 'error', result.message);
  };

  // Handlers for adding items
  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassInput.trim()) return;
    try {
      const result = await onAddClass(newClassInput.trim());
      if (result.success) {
        setNewClassInput('');
        displayFeedback('class', 'success', '학급이 성공적으로 등록되었습니다.');
      } else {
        displayFeedback('class', 'error', result.message);
      }
    } catch {
      displayFeedback('class', 'error', '네트워크 요청에 실패하였습니다.');
    }
  };

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectInput.trim()) return;
    try {
      const result = await onAddSubject(newSubjectInput.trim());
      if (result.success) {
        setNewSubjectInput('');
        displayFeedback('subject', 'success', '과목이 성공적으로 등록되었습니다.');
      } else {
        displayFeedback('subject', 'error', result.message);
      }
    } catch {
      displayFeedback('subject', 'error', '네트워크 요청에 실패하였습니다.');
    }
  };

  const handleAddPeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPeriodInput.trim()) return;
    try {
      const result = await onAddPeriod(newPeriodInput.trim());
      if (result.success) {
        setNewPeriodInput('');
        displayFeedback('period', 'success', '교시가 성공적으로 등록되었습니다.');
      } else {
        displayFeedback('period', 'error', result.message);
      }
    } catch {
      displayFeedback('period', 'error', '네트워크 요청에 실패하였습니다.');
    }
  };

  // Handlers for deleting items
  const handleDeleteClass = async (className: string) => {
    if (!window.confirm(`'${className}'을 삭제하시겠습니까?\n주의: 해당 학급에 매칭되어 등록된 교사의 시간표 일정도 함께 삭제됩니다.`)) return;
    try {
      const result = await onDeleteClass(className);
      if (result.success) {
        displayFeedback('class', 'success', '학급을 성공적으로 삭제했습니다.');
      } else {
        displayFeedback('class', 'error', result.message);
      }
    } catch {
      displayFeedback('class', 'error', '교실 삭제 중 요청에 실패했습니다.');
    }
  };

  const handleDeleteSubject = async (subjectName: string) => {
    if (!window.confirm(`'${subjectName}' 과목을 목록에서 완전히 제외하시겠습니까?`)) return;
    try {
      const result = await onDeleteSubject(subjectName);
      if (result.success) {
        displayFeedback('subject', 'success', '과목을 성공적으로 제외했습니다.');
      } else {
        displayFeedback('subject', 'error', result.message);
      }
    } catch {
      displayFeedback('subject', 'error', '과목 삭제 중 에러가 발생했습니다.');
    }
  };

  const handleDeletePeriod = async (period: string) => {
    if (!window.confirm(`'${period}' 교시 구분을 제외하시겠습니까?\n주의: 해당 교시에 배정되었던 학급 시간표 목록이 함께 초기화됩니다.`)) return;
    try {
      const result = await onDeletePeriod(period);
      if (result.success) {
        displayFeedback('period', 'success', '교시와 관련 일정을 무효화 처리했습니다.');
      } else {
        displayFeedback('period', 'error', result.message);
      }
    } catch {
      displayFeedback('period', 'error', '교시 삭제 요청 중 에러가 발생했습니다.');
    }
  };

  return (
    <div className="space-y-8" id="admin-view-root">
      
      {/* Intro Header */}
      <div className="relative bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl px-6 sm:px-8 py-5 text-white shadow-md border border-slate-900 flex items-center justify-center min-h-24" id="admin-banner">
        <div className="absolute left-6 top-4 sm:left-8">
          <div className="inline-flex items-center justify-center space-x-2 bg-slate-700/60 text-slate-200 px-3 py-1 rounded-full text-xs font-mono border border-slate-700">
            <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0" />
            <span>최상위 관리자 제어 대시보드</span>
          </div>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-center">당일 시간표 등록 기준 데이터 구성</h2>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-xs" id="admin-module-teacher-password">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <h3 className="font-extrabold text-slate-900 flex items-center gap-1.5">
              <LockKeyhole className="h-5 w-5 text-emerald-600" />
              <span>교사 전용 페이지 비밀번호</span>
            </h3>
            <p className="text-xs text-slate-500">
              교사 입력 페이지에 접속할 때 필요한 비밀번호입니다. 비워두면 비밀번호 없이 접속됩니다.
            </p>
          </div>

          <form onSubmit={handleUpdateTeacherPassword} className="flex w-full gap-2 sm:max-w-md">
            <input
              type="text"
              value={teacherPasswordInput}
              onChange={(e) => setTeacherPasswordInput(e.target.value)}
              placeholder="예) 1234"
              className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-600"
            />
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-4 py-2 text-sm font-semibold flex items-center gap-1 shrink-0 transition-colors"
            >
              저장
            </button>
          </form>
        </div>

        {activeFeedback?.section === 'teacher-password' && (
          <div className={`mt-4 p-2.5 rounded-lg text-xs leading-none border ${
            activeFeedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : 'bg-rose-50 text-rose-800 border-rose-100'
          }`}>
            {activeFeedback.text}
          </div>
        )}
      </div>

      {/* Main Grid for 4 control modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8" id="admin-management-modules">
        
        {/* Module 1: Date Controller (날짜 관리) */}
        <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-xs flex flex-col justify-between" id="admin-module-date">
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 flex items-center gap-1.5">
                <Calendar className="h-5 w-5 text-indigo-500" />
            <span>날짜 선택</span>
          </h3>
          <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-mono font-bold">
                {db.dates.length}일 자동
              </span>
            </div>

            <div className="rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs font-medium text-indigo-700">
              날짜는 오늘 기준 캘린더의 평일 일정으로 자동 생성됩니다.
            </div>

            {/* Scrollable list */}
            <div className="border border-slate-100 rounded-lg max-h-48 overflow-y-auto divide-y divide-slate-100 bg-slate-50">
              {db.dates.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">등록된 유효 날짜가 존재하지 않습니다.</div>
              ) : (
                db.dates.map((d) => (
                  <div key={d} className="flex justify-between items-center py-2.5 px-3 bg-white hover:bg-slate-50/50 transition-colors">
                    <span className="text-sm font-medium text-slate-800 font-mono">{d}</span>
                    <span className="text-[11px] font-medium text-slate-400">기본값</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Module 2: Class Controller (학급 관리) */}
        <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-xs flex flex-col justify-between" id="admin-module-class">
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 flex items-center gap-1.5">
                <School className="h-5 w-5 text-indigo-500" />
                <span>학급 추가</span>
              </h3>
              <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-mono font-bold">
                {db.classes.length}개 반
              </span>
            </div>

            {/* Inline Add Form */}
            <form onSubmit={handleAddClass} className="flex gap-2">
              <input
                type="text"
                placeholder="예) 1학년 1반, 1학년 2반"
                required
                value={newClassInput}
                onChange={(e) => setNewClassInput(e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-500/10 focus:border-slate-800"
              />
              <button
                type="submit"
                className="bg-slate-800 hover:bg-slate-900 text-white rounded-lg px-4 py-2 text-sm font-semibold flex items-center gap-1 shrink-0 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>추가</span>
              </button>
            </form>

            {activeFeedback?.section === 'class' && (
              <div className={`p-2.5 rounded-lg text-xs leading-none border ${
                activeFeedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : 'bg-rose-50 text-rose-800 border-rose-100'
              }`}>
                {activeFeedback.text}
              </div>
            )}

            {/* Scrollable list */}
            <div className="border border-slate-100 rounded-lg max-h-48 overflow-y-auto divide-y divide-slate-100 bg-slate-50">
              {db.classes.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">등록된 학급 정보가 없습니다.</div>
              ) : (
                db.classes.map((c) => (
                  <div key={c} className="flex justify-between items-center py-2.5 px-3 bg-white hover:bg-slate-50/50 transition-colors">
                    <span className="text-sm font-semibold text-slate-700">{c}</span>
                    <button
                      type="button"
                      id={`del-class-btn-${c}`}
                      onClick={() => handleDeleteClass(c)}
                      className="text-slate-400 hover:text-rose-600 p-1.5 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Module 3: Subject Controller (과목 관리) */}
        <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-xs flex flex-col justify-between" id="admin-module-subject">
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 flex items-center gap-1.5">
                <BookOpen className="h-5 w-5 text-indigo-500" />
                <span>개설 교과목 목록</span>
              </h3>
              <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-mono font-bold">
                {db.subjects.length}과목 지정
              </span>
            </div>

            {/* Inline Add Form */}
            <form onSubmit={handleAddSubject} className="flex gap-2">
              <input
                type="text"
                placeholder="예) 수학, 국어, 정보기술, 체육"
                required
                value={newSubjectInput}
                onChange={(e) => setNewSubjectInput(e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-500/10 focus:border-slate-800"
              />
              <button
                type="submit"
                className="bg-slate-800 hover:bg-slate-900 text-white rounded-lg px-4 py-2 text-sm font-semibold flex items-center gap-1 shrink-0 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>추가</span>
              </button>
            </form>

            {activeFeedback?.section === 'subject' && (
              <div className={`p-2.5 rounded-lg text-xs leading-none border ${
                activeFeedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : 'bg-rose-50 text-rose-800 border-rose-100'
              }`}>
                {activeFeedback.text}
              </div>
            )}

            {/* Scrollable list */}
            <div className="border border-slate-100 rounded-lg max-h-48 overflow-y-auto divide-y divide-slate-100 bg-slate-50">
              {db.subjects.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">기본 지정된 교과가 없습니다.</div>
              ) : (
                db.subjects.map((sub) => (
                  <div key={sub} className="flex justify-between items-center py-2.5 px-3 bg-white hover:bg-slate-50/50 transition-colors">
                    <span className="text-sm font-semibold text-rose-600">{sub}</span>
                    <button
                      type="button"
                      id={`del-sub-btn-${sub}`}
                      onClick={() => handleDeleteSubject(sub)}
                      className="text-slate-400 hover:text-rose-600 p-1.5 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Module 4: Period Controller (교시 관리) */}
        <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-xs flex flex-col justify-between" id="admin-module-period">
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 flex items-center gap-1.5">
                <Clock className="h-5 w-5 text-indigo-500" />
                <span>수업 교시 추가</span>
              </h3>
              <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-mono font-bold">
                {db.periods.length}교과 단계
              </span>
            </div>

            {/* Inline Add Form */}
            <form onSubmit={handleAddPeriod} className="flex gap-2">
              <input
                type="text"
                placeholder="예) 1교시, 방과후 1"
                required
                value={newPeriodInput}
                onChange={(e) => setNewPeriodInput(e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-500/10 focus:border-slate-800"
              />
              <button
                type="submit"
                className="bg-slate-800 hover:bg-slate-900 text-white rounded-lg px-4 py-2 text-sm font-semibold flex items-center gap-1 shrink-0 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>추가</span>
              </button>
            </form>

            {activeFeedback?.section === 'period' && (
              <div className={`p-2.5 rounded-lg text-xs leading-none border ${
                activeFeedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : 'bg-rose-50 text-rose-800 border-rose-100'
              }`}>
                {activeFeedback.text}
              </div>
            )}

            {/* Scrollable list */}
            <div className="border border-slate-100 rounded-lg max-h-48 overflow-y-auto divide-y divide-slate-100 bg-slate-50">
              {db.periods.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">등록된 교과 단위 교시 구분이 없습니다.</div>
              ) : (
                db.periods.map((p) => (
                  <div key={p} className="flex justify-between items-center py-2.5 px-3 bg-white hover:bg-slate-50/50 transition-colors">
                    <span className="text-sm font-bold text-slate-600 font-mono uppercase">{p}</span>
                    <button
                      type="button"
                      id={`del-period-btn-${p}`}
                      onClick={() => handleDeletePeriod(p)}
                      className="text-slate-400 hover:text-rose-600 p-1.5 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Safety Notice Banner */}
      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-start gap-3 text-amber-900" id="admin-safety-notice">
        <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="space-y-1.5">
          <span className="font-bold text-sm text-slate-900 block">⚠️ 실시간 데이터 정합성 주의 경보</span>
          <p className="text-xs text-slate-700 leading-relaxed">
            여기서 특정 날짜, 학급 혹은 특정 교시를 임의로 <strong>삭제할 경우</strong>, 해당 카테고리에 매핑되어 등록되어 있던 <strong>교사들의 기존 일정도 무결성 보호를 위해 시스템에서 즉각 배제</strong>됩니다. 실제 현업에서 기준 데이터를 정리하실 때 사전에 조율된 뒤 관리하는 것을 적극 권장 드립니다.
          </p>
        </div>
      </div>

    </div>
  );
}
