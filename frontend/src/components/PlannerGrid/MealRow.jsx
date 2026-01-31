import { format } from 'date-fns';
import { Sun, Plus } from 'lucide-react';

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
        {meal.name === 'LUNCH' ? (
          <Plus className="w-2.5 h-2.5 md:w-3 md:h-3 text-gray-400" />
        ) : (
          <Sun className="w-2.5 h-2.5 md:w-3 md:h-3 text-gray-400" />
        )}
        <span className="text-[9px] md:text-[10px] font-bold text-gray-500 uppercase tracking-wide">
          {meal.name}
        </span>
      </div>

      {/* Person Slots */}
      <div className="flex gap-1.5 md:gap-2 h-full min-h-[70px] md:min-h-[80px]">
        {peopleKeys.map((personKey) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const slot = plan.find(
            (p) =>
              p.plan_date === dateStr &&
              p.meal_type_id === meal.id &&
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
