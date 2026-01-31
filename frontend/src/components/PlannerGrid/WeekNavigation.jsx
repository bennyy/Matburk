import { format, addDays } from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Edit3,
  Printer,
} from 'lucide-react';

/**
 * WeekNavigation - Week navigation header with controls
 */
export default function WeekNavigation({
  currentWeekStart,
  onPrevWeek,
  onNextWeek,
  onGoToday,
  isWeekLocked,
}) {
  return (
    <div className="bg-blue-600 px-2 md:px-4 py-2 md:py-3 border-b border-blue-700 flex justify-between items-center shadow-md z-10">
      <button
        onClick={onPrevWeek}
        className="p-1.5 md:p-2 hover:bg-white/20 rounded-lg text-white font-semibold flex items-center gap-1 transition-all"
        aria-label="Föregående vecka"
      >
        <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
        <span className="hidden sm:inline text-xs md:text-sm">
          V. {format(addDays(currentWeekStart, -7), 'w')}
        </span>
      </button>
      <div className="flex flex-col items-center text-white gap-0.5">
        <span className="text-lg md:text-xl font-bold flex items-center gap-1.5">
          <Calendar className="w-4 h-4 md:w-5 md:h-5" />
          <span>Vecka {format(currentWeekStart, 'w')}</span>
        </span>
        {!isWeekLocked && (
          <span className="bg-white/20 px-2 md:px-3 py-0.5 md:py-1 rounded-full text-[11px] md:text-xs font-semibold flex items-center gap-1">
            <Edit3 className="w-2.5 h-2.5 md:w-3 md:h-3" />
            <span>Redigerar</span>
          </span>
        )}
        <button
          onClick={onGoToday}
          className="text-[10px] md:text-xs text-blue-100 hover:text-white hover:underline font-semibold transition-all leading-tight"
          aria-label="Gå till denna vecka"
        >
          Idag
        </button>
      </div>
      <div className="flex gap-1 md:gap-2 items-center">
        <button
          onClick={() => {
            const startStr = format(currentWeekStart, 'yyyy-MM-dd');
            const url = `/print.html?weekStart=${startStr}`;
            window.open(url, '_blank');
          }}
          className="p-1.5 md:p-2 hover:bg-white/20 rounded-lg text-white font-semibold no-print flex items-center gap-1 transition-all"
          title="Öppna utskriftssida"
          aria-label="Öppna utskriftssida"
        >
          <Printer className="w-4 h-4 md:w-5 md:h-5" />
          <span className="hidden sm:inline text-xs md:text-sm">Skriv ut</span>
        </button>
        <button
          onClick={onNextWeek}
          className="p-1.5 md:p-2 hover:bg-white/20 rounded-lg text-white font-semibold flex items-center gap-1 transition-all"
          aria-label="Nästa vecka"
        >
          <span className="hidden sm:inline text-xs md:text-sm">
            V. {format(addDays(currentWeekStart, 7), 'w')}
          </span>
          <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
        </button>
      </div>
    </div>
  );
}
