import { format } from 'date-fns';

import MealSlot from './MealSlot';

/**
 * MealRow - Single meal type row within a day
 */
export default function MealRow({
  day,
  meal,
  peopleKeys,
  peopleNames,
  plan,
  recipes,
  selectedBatchId,
  onSlotClick,
  isPlannerLocked,
}) {
  return (
    <div className="flex-1 flex flex-col bg-gray-50 rounded-lg p-1.5 md:p-2">
      <div className="flex items-center justify-center gap-1 mb-1.5 md:mb-2">
        <svg
          className="w-2.5 h-2.5 md:w-3 md:h-3 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d={
              meal === 'LUNCH'
                ? 'M12 6v6m0 0v6m0-6h6m-6 0H6'
                : 'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z'
            }
          />
        </svg>
        <span className="text-[9px] md:text-[10px] font-bold text-gray-500 uppercase tracking-wide">
          {meal}
        </span>
      </div>

      {/* Person Slots */}
      <div className="flex gap-1.5 md:gap-2 h-full min-h-[70px] md:min-h-[80px]">
        {peopleKeys.map((personKey) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const slot = plan.find(
            (p) =>
              p.plan_date === dateStr &&
              p.meal_type === meal &&
              p.person === personKey
          );
          const recipe = slot
            ? recipes.find((r) => r.id === slot.recipe_id)
            : null;
          const isActive = recipe && selectedBatchId === recipe.id;
          const isPlaceholder = recipe?.is_placeholder;
          const displayName = peopleNames[personKey];

          return (
            <MealSlot
              key={personKey}
              displayName={displayName}
              recipe={recipe}
              isActive={isActive}
              isPlaceholder={isPlaceholder}
              onClick={() =>
                !isPlannerLocked && onSlotClick(day, meal, personKey)
              }
              isLocked={isPlannerLocked}
            />
          );
        })}
      </div>
    </div>
  );
}
