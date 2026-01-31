import { format, addDays } from 'date-fns';

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
        <svg
          className="w-4 h-4 md:w-5 md:h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        <span className="hidden sm:inline text-xs md:text-sm">
          V. {format(addDays(currentWeekStart, -7), 'w')}
        </span>
      </button>
      <div className="flex flex-col items-center text-white gap-0.5">
        <span className="text-lg md:text-xl font-bold flex items-center gap-1.5">
          <svg
            className="w-4 h-4 md:w-5 md:h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span>Vecka {format(currentWeekStart, 'w')}</span>
        </span>
        {!isWeekLocked && (
          <span className="bg-white/20 px-2 md:px-3 py-0.5 md:py-1 rounded-full text-[11px] md:text-xs font-semibold flex items-center gap-1">
            <svg
              className="w-2.5 h-2.5 md:w-3 md:h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
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
          <svg
            className="w-4 h-4 md:w-5 md:h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
            />
          </svg>
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
          <svg
            className="w-4 h-4 md:w-5 md:h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
