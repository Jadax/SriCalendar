import { create } from 'zustand';
import { toDateKey } from '../utils/dateUtils';
import type { ViewMode } from '../types';

interface CalendarState { currentDate: Date; selectedDateKey: string; viewMode: ViewMode; setCurrentDate: (date: Date) => void; selectDate: (dateKey: string) => void; setViewMode: (mode: ViewMode) => void }
/** Global calendar navigation state and actions. */
export const useCalendarStore = create<CalendarState>((set) => ({
  currentDate: new Date(), selectedDateKey: toDateKey(new Date()), viewMode: 'month',
  setCurrentDate: (currentDate) => set({ currentDate }), selectDate: (selectedDateKey) => set({ selectedDateKey }), setViewMode: (viewMode) => set({ viewMode }),
}));
