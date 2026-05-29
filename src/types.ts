/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Schedule {
  id: string;
  date: string;
  class: string;
  subject: string;
  period: string;
  location: string;
  createdAt: string;
}

export interface Database {
  classes: string[];
  subjects: string[];
  dates: string[];
  periods: string[];
  schedules: Schedule[];
}

export type ViewMode = 'student' | 'teacher' | 'admin';
