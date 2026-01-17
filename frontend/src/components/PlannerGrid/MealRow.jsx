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
    <div className="flex-1 flex flex-col">
      <span className="text-[10px] font-bold text-gray-400 uppercase text-center">
        {meal}
      </span>

      {/* Person Slots */}
      <div className="flex gap-1 h-full min-h-[60px] p-0.5">
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
