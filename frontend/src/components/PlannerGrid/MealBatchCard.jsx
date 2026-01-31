/**
 * MealBatchCard - Displays a meal batch with portion controls
 */
export default function MealBatchCard({
  batch,
  isSelected,
  getAllocatedCount,
  onSelect,
  onUpdatePortions,
  onRemove,
  isWeekLocked,
}) {
  const used = getAllocatedCount(batch.recipeId);
  const remaining = batch.targetPortions - used;

  return (
    <div
      onClick={() => onSelect(isSelected ? null : batch.recipeId)}
      className={`bg-white p-4 rounded-xl border shadow-sm cursor-pointer relative transition-all ${
        isSelected
          ? 'border-blue-500 ring-2 ring-blue-200 shadow-lg transform scale-[1.02]'
          : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
      }`}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <span className="font-bold text-gray-900 text-base block mb-1">
            {batch.recipeName}
          </span>
          {isSelected && (
            <span className="inline-flex items-center gap-1 text-xs text-blue-600 font-semibold">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Vald
            </span>
          )}
        </div>
        <button
          onClick={(e) => {
            if (isWeekLocked) return;
            onRemove(e, batch.recipeId);
          }}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
            isWeekLocked
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
          }`}
          aria-disabled={isWeekLocked}
          aria-label={`Removera ${batch.recipeName}`}
        >
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Portion Controls */}
      <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3 mb-3">
        <span className="text-xs text-gray-600 font-semibold">Planerat:</span>
        <div className="flex items-center gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (isWeekLocked) return;
              onUpdatePortions(batch.recipeId, -1);
            }}
            disabled={isWeekLocked}
            aria-disabled={isWeekLocked}
            className={`w-8 h-8 border rounded-lg flex items-center justify-center font-bold transition-all ${
              isWeekLocked
                ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-white border-gray-300 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600'
            }`}
            aria-label="Minska portioner"
          >
            −
          </button>
          <span className="font-bold text-lg w-8 text-center text-gray-900">
            {batch.targetPortions}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (isWeekLocked) return;
              onUpdatePortions(batch.recipeId, 1);
            }}
            disabled={isWeekLocked}
            aria-disabled={isWeekLocked}
            className={`w-8 h-8 border rounded-lg flex items-center justify-center font-bold transition-all ${
              isWeekLocked
                ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-white border-gray-300 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600'
            }`}
            aria-label="Öka portioner"
          >
            +
          </button>
        </div>
      </div>

      {/* Status Indicator */}
      <div
        className={`text-xs font-semibold text-center py-2 px-3 rounded-lg flex items-center justify-center gap-2 ${
          remaining === 0
            ? 'bg-green-100 text-green-700'
            : remaining < 0
              ? 'bg-red-100 text-red-700'
              : 'bg-yellow-100 text-yellow-700'
        }`}
      >
        {remaining === 0 ? (
          <>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Klar!
          </>
        ) : remaining < 0 ? (
          <>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            {Math.abs(remaining)} för många!
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {remaining} kvar att placera
          </>
        )}
      </div>
    </div>
  );
}
