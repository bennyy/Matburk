import { format } from 'date-fns';
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
              <svg
                className="w-5 h-5"
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
              Redigera veckan
            </>
          ) : (
            <>
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Klar med redigering
            </>
          )}
        </button>
      </div>

      {batches.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center text-gray-400 mt-10 py-8 px-4 bg-white rounded-xl border border-dashed border-gray-200">
          <svg
            className="w-16 h-16 mb-4 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <p className="text-sm font-semibold mb-2">
            Inga matlådor denna vecka
          </p>
          <button
            onClick={() => setActiveTab(TABS.LIBRARY)}
            className="text-blue-600 hover:text-blue-700 font-semibold mt-2 flex items-center gap-1 text-sm"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Hämta från biblioteket
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="bg-white rounded-lg px-3 py-2 border border-gray-200 shadow-sm">
            <p className="text-xs text-gray-500 font-semibold text-center flex items-center justify-center gap-2">
              <svg
                className="w-4 h-4"
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
