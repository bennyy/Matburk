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
      className={`bg-white rounded shadow-sm border overflow-hidden flex flex-col ${
        isToday ? 'ring-2 ring-blue-400' : ''
      }`}
    >
      {/* Day Header */}
      <div
        className={`p-1 text-center font-bold text-sm uppercase ${
          isToday ? 'bg-blue-600 text-white' : 'bg-slate-700 text-white'
        }`}
      >
        {format(day, 'EEE', { locale: sv })}{' '}
        <span className="opacity-70 text-xs ml-1">{format(day, 'd/M')}</span>
      </div>

      {/* Meals Grid */}
      <div className="flex flex-col p-1 gap-1 flex-1">
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
