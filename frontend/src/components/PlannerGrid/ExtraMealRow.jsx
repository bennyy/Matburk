import { format } from 'date-fns';

import MealSlot from './MealSlot';

/**
 * ExtraMealRow - Extra/snack meal row within a day
 * Similar to MealRow but with a remove button
 */
export default function ExtraMealRow({
  day,
  mealName,
  extra,
  peopleKeys,
  peopleNames,
  plan,
  recipes,
  selectedBatchId,
  onSlotClick,
  onRemoveExtra,
  isPlannerLocked,
}) {
  return (
    <div className="flex-1 flex flex-col bg-gray-50 rounded-lg p-1.5 md:p-2 relative group">
      {/* Header */}
      <div className="flex items-center justify-between gap-1 mb-1.5 md:mb-2">
        <div className="flex items-center justify-center gap-1 flex-1 min-w-0">
          <svg
            className="w-2.5 h-2.5 md:w-3 md:h-3 text-gray-400 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="text-[9px] md:text-[10px] font-bold text-gray-500 uppercase tracking-wide truncate">
            {mealName}
          </span>
        </div>
        {!isPlannerLocked && (
          <button
            onClick={() => onRemoveExtra(extra.id)}
            className="flex-shrink-0 p-0.5 rounded-md transition-all text-gray-400 hover:bg-gray-200 hover:text-red-600 opacity-0 group-hover:opacity-100"
            title="Ta bort extra måltid"
            aria-label={`Ta bort ${mealName}`}
          >
            <svg
              className="w-3 h-3 md:w-3.5 md:h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Person Slots */}
      <div className="flex gap-1.5 md:gap-2 h-full min-h-[70px] md:min-h-[80px]">
        {peopleKeys.map((personKey) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const slot = plan.find(
            (p) =>
              p.plan_date === dateStr &&
              p.meal_type_id === extra.meal_type_id &&
              p.extra_id === extra.id &&
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
                !isPlannerLocked && onSlotClick(day, extra, personKey)
              }
              isLocked={isPlannerLocked}
            />
          );
        })}
      </div>
    </div>
  );
}
