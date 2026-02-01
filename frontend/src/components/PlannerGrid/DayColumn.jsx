import { useState } from 'react';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { CheckCircle, Plus } from 'lucide-react';

import MealRow from './MealRow';
import ExtraMealRow from './ExtraMealRow';
import ExtraPresetModal from './ExtraPresetModal';

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
  extras,
  onAddExtra,
  onRemoveExtra,
  planId,
  apiUrl,
}) {
  const [showPresetModal, setShowPresetModal] = useState(false);

  const handleAddExtraClick = () => {
    setShowPresetModal(true);
  };

  const handlePresetSelect = (presetName) => {
    onAddExtra(day, presetName);
    setShowPresetModal(false);
  };
  return (
    <div
      className={`bg-white rounded-lg shadow-sm border overflow-hidden flex flex-col transition-all ${
        isToday
          ? 'ring-2 ring-blue-500 border-blue-300 shadow-md'
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      {/* Day Header */}
      <div
        className={`p-3 text-center font-bold text-sm transition-all ${
          isToday
            ? 'bg-blue-600 text-white shadow-sm'
            : 'bg-gray-700 text-white'
        }`}
      >
        <div className="flex items-center justify-center gap-2">
          {isToday && <CheckCircle className="w-4 h-4" />}
          <span className="uppercase tracking-wide">
            {format(day, 'EEE', { locale: sv })}
          </span>
        </div>
        <span className="text-xs opacity-80 mt-1 block">
          {format(day, 'd/M')}
        </span>
      </div>

      {/* Meals Grid */}
      <div className="flex flex-col p-2 gap-2 flex-1 overflow-y-auto">
        {/* Standard meals */}
        {meals
          .filter((meal) => meal.is_standard)
          .map((meal) => (
            <MealRow
              key={meal.id}
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

        {/* Extra meals */}
        {extras &&
          extras.map((extra) => (
            <ExtraMealRow
              key={extra.id}
              day={day}
              mealName={extra.name}
              extra={extra}
              peopleKeys={peopleKeys}
              peopleNames={peopleNames}
              plan={plan}
              recipes={recipes}
              selectedBatchId={selectedBatchId}
              onSlotClick={onSlotClick}
              onRemoveExtra={onRemoveExtra}
              isPlannerLocked={isPlannerLocked}
            />
          ))}

        {/* Add Extra Button - Only show in edit mode */}
        {!isPlannerLocked && (
          <button
            onClick={handleAddExtraClick}
            className="flex items-center justify-center gap-1.5 p-2 rounded-lg text-xs font-semibold transition-all bg-gradient-to-r from-purple-100 to-indigo-100 hover:from-purple-200 hover:to-indigo-200 text-purple-900 border border-purple-300 hover:shadow-md"
            title="Lägg till extra måltid"
            aria-label="Lägg till extra måltid"
          >
            <Plus className="w-4 h-4" />
            <span>Extra</span>
          </button>
        )}
      </div>

      {/* Extra Preset Modal */}
      {showPresetModal && (
        <ExtraPresetModal
          day={day}
          planId={planId}
          apiUrl={apiUrl}
          onSelectPreset={handlePresetSelect}
          onCancel={() => setShowPresetModal(false)}
        />
      )}
    </div>
  );
}
