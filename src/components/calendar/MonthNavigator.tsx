import type { ReactElement } from 'react';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCalendar } from '../../hooks/useCalendar';

/** Controls month/week movement, Today navigation, and view selection. */
export function MonthNavigator(): ReactElement {
  const calendar = useCalendar();
  return <div className="month-nav"><div className="month-title"><button className="icon-button" onClick={calendar.previous} aria-label="Previous period"><ChevronLeft/></button><h2>{format(calendar.currentDate, calendar.viewMode === 'month' ? 'MMMM yyyy' : "'Week of' d MMMM")}</h2><button className="icon-button" onClick={calendar.next} aria-label="Next period"><ChevronRight/></button></div><div className="view-controls"><button className="today-button" onClick={calendar.goToday}>Today</button><div className="segmented"><button className={calendar.viewMode === 'month' ? 'active' : ''} onClick={() => calendar.setViewMode('month')}>Month</button><button className={calendar.viewMode === 'week' ? 'active' : ''} onClick={() => calendar.setViewMode('week')}>Week</button></div></div></div>;
}
