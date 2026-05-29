/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PlusCircle, Search, Trash2, CalendarCheck, MapPin, Sparkles, HelpCircle, GraduationCap } from 'lucide-react';
import { Database, Schedule } from '../types';
import { motion } from 'motion/react';

interface TeacherViewProps {
  db: Database;
  onAddSchedule: (schedule: {
    date: string;
    class: string;
    subject: string;
    period: string;
    location: string;
  }) => Promise<{ success: boolean; message: string }>;
  onDeleteSchedule: (id: string) => Promise<{ success: boolean; message: string }>;
}

export default function TeacherView({ db, onAddSchedule, onDeleteSchedule }: TeacherViewProps) {
  // Form input states
  const [selectedDate, setSelectedDate] = useState(db.dates[0] || '');
  const [selectedClass, setSelectedClass] = useState(db.classes[0] || '');
  const [selectedSubject, setSelectedSubject] = useState(db.subjects[0] || '');
  const [selectedPeriod, setSelectedPeriod] = useState(db.periods[0] || '');
  const [locationInput, setLocationInput] = useState('');

  // Status message states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Search state for existing schedules list
  const [searchQuery, setSearchQuery] = useState('');

  // Auto initialize forms when database loads
  useState(() => {
    if (db.dates.length > 0 && !selectedDate) setSelectedDate(db.dates[0]);
    if (db.classes.length > 0 && !selectedClass) setSelectedClass(db.classes[0]);
    if (db.subjects.length > 0 && !selectedSubject) setSelectedSubject(db.subjects[0]);
    if (db.periods.length > 0 && !selectedPeriod) setSelectedPeriod(db.periods[0]);
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!selectedDate || !selectedClass || !selectedSubject || !selectedPeriod || !locationInput.trim()) {
      setStatusMessage({ type: 'error', text: '모든 항목을 선택하거나 입력해 주세요.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await onAddSchedule({
        date: selectedDate,
        class: selectedClass,
        subject: selectedSubject,
        period: selectedPeriod,
        location: locationInput.trim(),
      });

      if (result.success) {
        setStatusMessage({ type: 'success', text: result.message });
        setLocationInput(''); // Clear input
      } else {
        setStatusMessage({ type: 'error', text: result.message });
      }
    } catch {
      setStatusMessage({ type: 'error', text: '일정 저장 중 서버 통신 에러가 발생했습니다.' });
    } finally {
      setIsSubmitting(false);
      // Auto-fade status message after 3.5 seconds
      setTimeout(() => {
        setStatusMessage(prev => prev?.type === 'success' ? null : prev);
      }, 3500);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('정말 이 시간의 수업교실 일정을 삭제하시겠습니까?')) {
      return;
    }
    
    try {
      const result = await onDeleteSchedule(id);
      if (result.success) {
        setStatusMessage({ type: 'success', text: '성공적으로 일정을 삭제했습니다.' });
      } else {
        setStatusMessage({ type: 'error', text: result.message });
      }
    } catch {
      setStatusMessage({ type: 'error', text: '삭제 요청 중 서버 에러가 발생했습니다.' });
    }
  };

  // Convert Date (YYYY-MM-DD) to friendly Korean text
  const formatKoreanDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const days = ['일', '월', '화', '수', '목', '금', '토'];
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return `${date.getMonth() + 1}/${date.getDate()}(${days[date.getDay()]})`;
    } catch {
      return dateStr;
    }
  };

  // Filter schedules matching query
  const filteredSchedules = db.schedules.filter(s => {
    const q = searchQuery.toLowerCase();
    return (
      s.class.toLowerCase().includes(q) ||
      s.subject.toLowerCase().includes(q) ||
      s.period.toLowerCase().includes(q) ||
      s.location.toLowerCase().includes(q) ||
      s.date.includes(q)
    );
  }).sort((a, b) => {
    // Sort by date, then by class, then by period
    const dateComp = a.date.localeCompare(b.date);
    if (dateComp !== 0) return dateComp;
    const classComp = a.class.localeCompare(b.class);
    if (classComp !== 0) return classComp;
    return a.period.localeCompare(b.period, undefined, { numeric: true });
  });

  return (
    <div className="space-y-8" id="teacher-view-root">
      
      {/* Informational Hero Area */}
      <div className="relative bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-2xl px-6 sm:px-8 py-5 text-white shadow-md border border-emerald-700 min-h-28 flex items-center justify-center" id="teacher-banner">
        <div className="absolute left-6 top-4 sm:left-8">
          <div className="inline-flex items-center space-x-2 bg-emerald-500/30 text-emerald-50 px-3 py-1 rounded-full text-xs font-mono border border-emerald-400/20">
            <Sparkles className="h-3 w-3 inline-block" />
            <span>교사전용 페이지</span>
          </div>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-none text-center">
          수업 이동 교실을 간편하게 지정하세요
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="teacher-panel-grid">
        
        {/* Left Side: Registration Form */}
        <div className="lg:col-span-5" id="teacher-form-panel">
          <div className="bg-white rounded-xl border border-slate-100 p-5 sm:p-6 shadow-xs lg:sticky lg:top-24">
            <h3 className="font-extrabold text-slate-900 text-lg flex items-center space-x-2.5 mb-5 border-b border-slate-100 pb-3">
              <CalendarCheck className="h-5 w-5 text-rose-500" />
              <span>새 수업 장소 등록하기</span>
            </h3>

            {db.dates.length === 0 || db.classes.length === 0 || db.subjects.length === 0 || db.periods.length === 0 ? (
              <div className="p-4 bg-amber-50 rounded-lg text-amber-800 text-xs border border-amber-100 leading-relaxed space-y-2">
                <span className="font-bold block">🚨 사전 등록 데이터 누락</span>
                <p>
                  관리자가 사전에 학급, 과목, 교시, 날짜 정보를 등록하지 않았습니다. 우측 상단의 <strong>[관리자 설정]</strong> 탭을 사용하여 마스터 리스트를 먼저 채워주세요.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4" id="schedule-registration-form">
                
                {/* Status Message */}
                {statusMessage && (
                  <div
                    id="form-status-alert"
                    className={`p-3 rounded-lg text-sm font-medium border ${
                      statusMessage.type === 'success'
                        ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
                        : 'bg-rose-50 border-rose-100 text-rose-800'
                    }`}
                  >
                    {statusMessage.text}
                  </div>
                )}

                {/* Dropdowns Grouped */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Date Input */}
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">수업 정규날짜</label>
                    <select
                      id="select-date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 bg-slate-50"
                    >
                      <option value="">-- 날짜 선택 --</option>
                      {db.dates.map(d => (
                        <option key={d} value={d}>
                          {d} ({formatKoreanDate(d)})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Class Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">배정 학급</label>
                    <select
                      id="select-class"
                      value={selectedClass}
                      onChange={(e) => setSelectedClass(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 bg-slate-50"
                    >
                      <option value="">-- 학급 선택 --</option>
                      {db.classes.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  {/* Subject Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">교과 구분</label>
                    <select
                      id="select-subject"
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 bg-slate-50"
                    >
                      <option value="">-- 과목 선택 --</option>
                      {db.subjects.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  {/* Period Input */}
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">교시 구분</label>
                    <select
                      id="select-period"
                      value={selectedPeriod}
                      onChange={(e) => setSelectedPeriod(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 bg-slate-50"
                    >
                      <option value="">-- 교시 선택 --</option>
                      {db.periods.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Location Input (Custom text directly typed) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex justify-between">
                    <span>수업 장소 교실이름</span>
                    <span className="text-[10px] text-rose-500 lowercase font-medium">직접 주소/명칭 입력</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      id="input-location"
                      type="text"
                      placeholder="예) 제2과학실, 대강당, 3학년1반 교실"
                      value={locationInput}
                      onChange={(e) => setLocationInput(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 font-sans"
                    />
                  </div>
                  <p className="text-[10.5px] text-slate-400 leading-normal">
                    * 이미 해당 날짜/학급/교시에 수업이 소속되어 있다면 정보가 신규 입력값으로 자동 업데이트(덮어쓰기) 됩니다.
                  </p>
                </div>

                {/* Submit button */}
                <button
                  id="submit-schedule-btn"
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-semibold text-sm rounded-lg transition-colors flex items-center justify-center space-x-2 shadow-xs"
                >
                  <PlusCircle className="h-4.5 w-4.5" />
                  <span>{isSubmitting ? '저장 중...' : '실시간 교실 등록하기'}</span>
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Right Side: Existing Schedules List */}
        <div className="lg:col-span-7 space-y-6" id="teacher-list-panel">
          <div className="bg-white rounded-xl border border-slate-100 p-5 sm:p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg">전체 이동교실 등록 리스트</h3>
                <p className="text-xs text-slate-500 mt-1">현재 학교에서 교사들이 설정한 이동 수업 교실 시간표 내역 전체 목록</p>
              </div>
              <span className="text-xs font-mono font-medium bg-slate-100 text-slate-700 px-2.5 py-1 rounded-sm tracking-wide self-start sm:self-center">
                총 {db.schedules.length}개 교실 배정
              </span>
            </div>

            {/* List Search Bar */}
            <div className="relative mb-5" id="teacher-schedule-search">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="전체 등록 내용 검색 (예: 미술, 체육관, 1학년 1반)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 transition-all font-sans"
              />
            </div>

            {/* List Table/Card view */}
            {filteredSchedules.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-sm space-y-3">
                <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto">
                  <HelpCircle className="h-6 w-6 text-slate-400" />
                </div>
                <p className="font-medium text-slate-600">등록된 과목 이동 교실이 없거나 일치하는 교과가 없습니다.</p>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">좌측 폼을 작성해 첫 번째 교실 배치를 추가해 보거나 다른 조건으로 검색해 보십시오.</p>
              </div>
            ) : (
              <div className="overflow-x-auto" id="teacher-schedules-table-container">
                <table className="w-full text-left border-collapse min-w-[500px]">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 text-[11px] uppercase font-bold tracking-wider">
                      <th className="py-3 px-3">날짜</th>
                      <th className="py-3 px-2">학급</th>
                      <th className="py-3 px-2">교시</th>
                      <th className="py-3 px-2">과목</th>
                      <th className="py-3 px-3">등록장소(직접)</th>
                      <th className="py-3 px-2 text-right">관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-sm">
                    {filteredSchedules.map((sched) => (
                      <tr key={sched.id} className="hover:bg-slate-50/50 transition-colors" id={`row-${sched.id}`}>
                        <td className="py-3 px-3 font-semibold text-slate-900 whitespace-nowrap">
                          {sched.date}
                        </td>
                        <td className="py-3 px-2 text-slate-600 whitespace-nowrap">
                          <span className="bg-slate-150/60 dark:bg-slate-100 px-1.5 py-0.5 rounded-sm text-xs text-slate-700 font-medium border border-slate-200">
                            {sched.class}
                          </span>
                        </td>
                        <td className="py-3 px-2 font-mono text-xs text-slate-500 font-semibold">
                          {sched.period}
                        </td>
                        <td className="py-3 px-2">
                          <span className="bg-rose-50 text-rose-700 font-semibold px-2 py-0.5 rounded-sm text-xs">
                            {sched.subject}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-800 font-medium">
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-3 w-3 text-rose-400 shrink-0" />
                            <span className="truncate max-w-[120px] sm:max-w-none">{sched.location}</span>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <button
                            id={`delete-sched-btn-${sched.id}`}
                            onClick={() => handleDelete(sched.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-sm hover:bg-rose-50 transition-colors"
                            title="일정 삭제"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
}
