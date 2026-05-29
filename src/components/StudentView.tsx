/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo, useRef, useState } from 'react';
import { ArrowLeft, Calendar, ClipboardList, Info, MapPin } from 'lucide-react';
import { motion } from 'motion/react';
import { Database, Schedule } from '../types';

interface StudentViewProps {
  db: Database;
}

function getLocalTodayString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatKoreanDate(dateStr: string) {
  if (!dateStr) return '';

  const [year, month, dayOfMonth] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, dayOfMonth);
  if (Number.isNaN(date.getTime())) return dateStr;

  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return `${year}년 ${month}월 ${dayOfMonth}일 (${days[date.getDay()]})`;
}

export default function StudentView({ db }: StudentViewProps) {
  const [selectedDate, setSelectedDate] = useState<string>(() => getLocalTodayString());
  const [selectedClass, setSelectedClass] = useState<string>('');
  const dateInputRef = useRef<HTMLInputElement>(null);

  const openDatePicker = () => {
    const input = dateInputRef.current;
    if (!input) return;

    if (typeof input.showPicker === 'function') {
      input.showPicker();
    } else {
      input.focus();
    }
  };

  const groupedClasses = useMemo(() => {
    const groups: Record<string, string[]> = {};

    db.classes.forEach((className) => {
      const match = className.match(/^(\d+)학년/) || className.match(/^(\d+)/);
      const grade = match ? `${match[1]}학년` : '기타';
      if (!groups[grade]) groups[grade] = [];
      groups[grade].push(className);
    });

    Object.keys(groups).forEach((grade) => {
      groups[grade].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    });

    return groups;
  }, [db.classes]);

  const classSchedulesForSelectedDate = useMemo(() => {
    if (!selectedClass || !selectedDate) return [];
    return db.schedules.filter((schedule) => (
      schedule.date === selectedDate && schedule.class === selectedClass
    ));
  }, [db.schedules, selectedDate, selectedClass]);

  const scheduleByPeriod = useMemo(() => {
    const map: Record<string, Schedule> = {};
    classSchedulesForSelectedDate.forEach((schedule) => {
      map[schedule.period] = schedule;
    });
    return map;
  }, [classSchedulesForSelectedDate]);

  return (
    <div id="student-view-root">
      <div
        className="w-full max-w-4xl mx-auto mb-5 bg-gradient-to-r from-indigo-900 to-indigo-950 rounded-lg px-6 py-7 sm:px-8 sm:py-8 lg:px-10 text-white shadow-sm border border-indigo-950"
        id="student-hero-banner"
      >
        <div className="w-full">
          <div className="text-center">
            <div
              className="inline-flex items-center justify-center space-x-2 bg-transparent text-transparent px-3 py-1.5 rounded-md text-xs font-medium border border-transparent leading-none"
              aria-hidden="true"
            >
              <span>&nbsp;</span>
            </div>
            <h2 className="mt-4 text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
              오늘 수업 교실은 어디일까요?
            </h2>
            <p className="mt-3 mx-auto text-indigo-200/90 text-sm sm:text-base max-w-3xl leading-7" aria-hidden="true">
              &nbsp;
            </p>
          </div>

          <div className="mt-6 pt-5 border-t border-white/10 flex flex-col lg:flex-row gap-3 lg:items-center" id="date-selector-bar">
            <div className="flex items-center space-x-2 text-sm text-indigo-100 font-semibold whitespace-nowrap shrink-0">
              <Calendar className="h-4.5 w-4.5 shrink-0" />
              <span>수업 일자 선택:</span>
            </div>

            <div
              className="relative w-full lg:max-w-xs cursor-pointer"
              onClick={openDatePicker}
              onTouchStart={openDatePicker}
            >
              <input
                ref={dateInputRef}
                id="student-date-picker"
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                className="h-11 w-full cursor-pointer rounded-md border border-white/20 bg-white px-4 pr-11 text-sm font-bold text-indigo-950 shadow-xs outline-hidden transition-all focus:border-white focus:ring-2 focus:ring-white/30"
                aria-label="수업 일자 선택"
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-indigo-700">
                <Calendar className="h-4.5 w-4.5" />
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:gap-8" id="student-main-grid">
        {!selectedClass ? (
          <div className="space-y-5 sm:space-y-6 max-w-4xl mx-auto w-full animate-fadeIn" id="student-classes-panel">
            <div className="bg-white rounded-lg border border-slate-200/70 p-5 sm:p-7 shadow-sm text-center">
              <div className="relative flex flex-col items-center justify-center gap-3 mb-6 pt-7">
                <h3 className="font-bold text-slate-900 text-lg flex items-center justify-center space-x-2">
                  <ClipboardList className="h-5 w-5 text-indigo-500" />
                  <span>조회할 학급 선택</span>
                </h3>
                <span className="inline-flex h-8 items-center justify-center text-xs bg-transparent text-transparent px-3 rounded-md font-semibold font-mono" aria-hidden="true">
                  &nbsp;
                </span>
              </div>

              {db.classes.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">
                  등록된 학급 정보가 없습니다.<br />관리자 모드에서 학급을 승인해 주세요.
                </div>
              ) : Object.keys(groupedClasses).length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">
                  검색 조건과 일치하는 학급이 없습니다.
                </div>
              ) : (
                <div className="space-y-6 max-h-[460px] overflow-y-auto pr-1 sm:pr-2" id="grouped-classes-list">
                  {Object.keys(groupedClasses).map((grade) => (
                    <div key={grade} className="space-y-3">
                      <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider bg-white py-1.5 text-left max-w-3xl mx-auto">
                        {grade}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 justify-center mx-auto max-w-3xl">
                        {groupedClasses[grade].map((className) => (
                          <button
                            key={className}
                            id={`class-btn-${className}`}
                            onClick={() => setSelectedClass(className)}
                            className="inline-flex h-12 w-full items-center justify-center rounded-md px-3 text-center text-sm font-semibold leading-none transition-all border bg-slate-50 hover:bg-slate-100 border-slate-200/70 text-slate-700 hover:text-slate-950 shadow-2xs"
                          >
                            {className}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg border border-slate-200/70 p-5 sm:p-6 flex items-start space-x-3 text-sm text-slate-500 shadow-sm">
              <Info className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
              <div className="space-y-1.5">
                <span className="font-bold text-slate-700">이동 교실 이용 수칙</span>
                <p className="text-sm leading-7">
                  목록에 별도 표시가 없는 수업은 일반 교실 또는 원래 선생님과 약속된 장소에서 진행됩니다.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {selectedClass ? (
          <div className="space-y-4 max-w-4xl mx-auto w-full" id="student-schedule-panel">
            <div className="flex justify-start">
              <button
                onClick={() => setSelectedClass('')}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-indigo-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-all cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <span>다른 학급 선택</span>
              </button>
            </div>

            <motion.div
              key={`${selectedClass}-${selectedDate}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-xl border border-slate-100 p-5 sm:p-6 shadow-xs space-y-6"
              id="student-timetable-card"
            >
              <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                    <span className="text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg text-sm font-bold border border-indigo-100">
                      {selectedClass}
                    </span>
                    <span>교실 및 시간표 현황</span>
                  </h3>
                  <p className="text-xs text-slate-500 font-sans mt-1">
                    선택 일자: {formatKoreanDate(selectedDate)}
                  </p>
                </div>

                <span className="text-xs font-mono text-emerald-600 bg-emerald-50 px-2 py-1 rounded-sm border border-emerald-100 font-semibold self-start sm:self-center">
                  장소
                </span>
              </div>

              {db.periods.length === 0 ? (
                <div className="text-center py-16 text-slate-400 text-sm">
                  학교에 등록된 교시 정보가 없습니다.<br />관리자 모드에서 교시를 등록해 주세요.
                </div>
              ) : (
                <div className="space-y-4 font-sans" id="timetable-timeline">
                  {db.periods.map((period) => {
                    const sched = scheduleByPeriod[period];
                    const isRegistered = !!sched;

                    return (
                      <div
                        key={period}
                        id={`timeline-row-${period}`}
                        className={`flex gap-4 items-center px-4 py-6 rounded-xl border transition-all ${
                          isRegistered
                            ? 'bg-gradient-to-r from-emerald-50/70 to-white border-emerald-200'
                            : 'bg-slate-50/50 border-slate-100 opacity-60'
                        }`}
                      >
                        <div className="w-16 sm:w-20 shrink-0 text-center border-r border-slate-200/60 pr-3">
                          <span className={`text-sm sm:text-base font-extrabold ${isRegistered ? 'text-emerald-700' : 'text-slate-500'}`}>
                            {period}
                          </span>
                        </div>

                        <div className="flex-1 min-w-0">
                          {isRegistered ? (
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                              <h4 className="text-slate-900 font-bold text-base tracking-tight flex items-center gap-1.5 sm:gap-2">
                                <span>{sched.subject}</span>
                              </h4>

                              <div className="bg-emerald-600 text-white shadow-xs px-3.5 py-1.5 rounded-lg inline-flex items-center space-x-1.5 self-start sm:self-center font-medium max-w-full">
                                <MapPin className="h-3.5 w-3.5 shrink-0" />
                                <span className="text-xs sm:text-sm font-semibold truncate leading-none">
                                  {sched.location}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between text-slate-400">
                              <span className="text-slate-400 text-sm font-medium">이동수업 일정 없음</span>
                              <span className="text-xs font-medium text-slate-400">일반 본교실 수업</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
