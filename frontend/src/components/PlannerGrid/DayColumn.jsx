import { format } from 'date-fns';
import { sv } from 'date-fns/locale';

import MealRow from './MealRow';

/**
 * DayColumn - Single day in the weekly calendar grid
 */
export default function DayColumn({
  day,
  isToday,
  meals,
  peopleKeys,
  peopleNames,
  plan,
  recipes,
  selectedBatchId,
  onSlotClick,
  isPlannerLocked,
}) {
  return (
    <div
      className={`bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col transition-all ${
        isToday
          ? 'ring-2 ring-blue-500 border-blue-300 shadow-lg'
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      {/* Day Header */}
      <div
        className={`p-3 text-center font-bold text-sm transition-all ${
          isToday
            ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
            : 'bg-gradient-to-r from-gray-700 to-gray-800 text-white'
        }`}
      >
        <div className="flex items-center justify-center gap-2">
          {isToday && (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          )}
          <span className="uppercase tracking-wide">
            {format(day, 'EEE', { locale: sv })}
          </span>
        </div>
        <span className="text-xs opacity-80 mt-1 block">
          {format(day, 'd/M')}
        </span>
      </div>

      {/* Meals Grid */}
      <div className="flex flex-col p-2 gap-2 flex-1">
        {meals.map((meal) => (
          <MealRow
            key={meal}
            day={day}
            meal={meal}
            peopleKeys={peopleKeys}
            peopleNames={peopleNames}
            plan={plan}
            recipes={recipes}
            selectedBatchId={selectedBatchId}
            onSlotClick={onSlotClick}
            isPlannerLocked={isPlannerLocked}
          />
        ))}
      </div>
    </div>
  );
}
