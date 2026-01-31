import { format } from 'date-fns';
import { Edit3, Check, ClipboardList, Plus, Calendar } from 'lucide-react';
import MealBatchCard from './MealBatchCard';
import { TABS } from './constants';

/**
 * PlanningTab - Displays meal batches for the week
 */
export default function PlanningTab({
  batches,
  currentWeekStart,
  selectedBatchId,
  setSelectedBatchId,
  getAllocatedCount,
  updateBatchPortions,
  removeFromPlanning,
  isWeekLocked,
  toggleWeekLock,
  setActiveTab,
}) {
  return (
    <div className="flex-1 overflow-y-auto p-4 bg-gray-50 flex flex-col">
      {/* Edit Mode Toggle */}
      <div className="mb-4">
        <button
          onClick={toggleWeekLock}
          className={`w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all shadow-sm flex items-center justify-center gap-2 ${
            isWeekLocked
              ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-md'
              : 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 shadow-md'
          }`}
          title={isWeekLocked ? 'Redigera veckan' : 'Avsluta redigering'}
        >
          {isWeekLocked ? (
            <>
              <Edit3 className="w-5 h-5" />
              Redigera veckan
            </>
          ) : (
            <>
              <Check className="w-5 h-5" />
              Klar med redigering
            </>
          )}
        </button>
      </div>

      {batches.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center text-gray-400 mt-10 py-8 px-4 bg-white rounded-xl border border-dashed border-gray-200">
          <ClipboardList className="w-16 h-16 mb-4 text-gray-300" />
          <p className="text-sm font-semibold mb-2">
            Inga matlådor denna vecka
          </p>
          <button
            onClick={() => setActiveTab(TABS.LIBRARY)}
            className="text-blue-600 hover:text-blue-700 font-semibold mt-2 flex items-center gap-1 text-sm"
          >
            <Plus className="w-4 h-4" />
            Hämta från biblioteket
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="bg-white rounded-lg px-3 py-2 border border-gray-200 shadow-sm">
            <p className="text-xs text-gray-500 font-semibold text-center flex items-center justify-center gap-2">
              <Calendar className="w-4 h-4" />
              Vecka {format(currentWeekStart, 'w')}
            </p>
          </div>
          {batches.map((batch) => (
            <MealBatchCard
              key={batch.recipeId}
              batch={batch}
              isSelected={selectedBatchId === batch.recipeId}
              getAllocatedCount={getAllocatedCount}
              onSelect={setSelectedBatchId}
              onUpdatePortions={updateBatchPortions}
              onRemove={removeFromPlanning}
              isWeekLocked={isWeekLocked}
            />
          ))}
        </div>
      )}
    </div>
  );
}
