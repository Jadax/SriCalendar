import { addMonths, addWeeks, startOfToday, subMonths, subWeeks } from 'date-fns';
import { useCalendarStore } from '../store/calendarStore';
import { toDateKey } from '../utils/dateUtils';

/** Exposes calendar navigation appropriate to the active month/week view. */
export function useCalendar() {
  const store = useCalendarStore();
  const shift = (direction: -1 | 1): void => store.setCurrentDate(store.viewMode === 'month' ? (direction === 1 ? addMonths(store.currentDate, 1) : subMonths(store.currentDate, 1)) : (direction === 1 ? addWeeks(store.currentDate, 1) : subWeeks(store.currentDate, 1)));
  const goToday = (): void => { const today = startOfToday(); store.setCurrentDate(today); store.selectDate(toDateKey(today)); };
  return { ...store, previous: () => shift(-1), next: () => shift(1), goToday };
}
