export type RepeatType = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RepeatInfo {
  id?: string; // UUID for grouping repeat events
  type: RepeatType;
  interval: number;
  endDate?: string; // YYYY-MM-DD format
  endCount?: number;
  weekdays?: number[]; // [1,2,3,4,5] for 월~금
  monthlyType?: 'date' | 'weekday';
  skipInvalidDates?: boolean;
}

export interface EventForm {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  description: string;
  location: string;
  category: string;
  repeat: RepeatInfo;
  notificationTime: number; // 분 단위로 저장
}

export interface Event extends EventForm {
  id: string;
}
