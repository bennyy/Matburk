import { CheckCircle2, X, XCircle, AlertCircle } from 'lucide-react';

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
      className={`bg-white p-4 rounded-lg border shadow-sm cursor-pointer relative transition-all ${
        isSelected
          ? 'border-blue-500 ring-2 ring-blue-300 shadow-md'
          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
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
              <CheckCircle2 className="w-3 h-3" />
              Vald
            </span>
          )}
        </div>
        <button
          onClick={(e) => {
            if (isWeekLocked) return;
            onRemove(e, batch.recipeId);
          }}
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
            isWeekLocked
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-500 hover:text-red-600 hover:bg-red-50'
          }`}
          aria-disabled={isWeekLocked}
          aria-label={`Removera ${batch.recipeName}`}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Portion Controls */}
      <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3 gap-3 mb-3">
        <span className="text-xs text-gray-700 font-semibold">Planerat:</span>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (isWeekLocked) return;
              onUpdatePortions(batch.recipeId, -1);
            }}
            disabled={isWeekLocked}
            aria-disabled={isWeekLocked}
            className={`w-8 h-8 border rounded-lg flex items-center justify-center font-bold text-sm transition-all ${
              isWeekLocked
                ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-white border-gray-300 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600'
            }`}
            aria-label="Minska portioner"
          >
            −
          </button>
          <span className="font-bold text-base w-8 text-center text-gray-900">
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
            className={`w-8 h-8 border rounded-lg flex items-center justify-center font-bold text-sm transition-all ${
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
            <CheckCircle2 className="w-4 h-4" />
            Klar!
          </>
        ) : remaining < 0 ? (
          <>
            <XCircle className="w-4 h-4" />
            {Math.abs(remaining)} för många!
          </>
        ) : (
          <>
            <AlertCircle className="w-4 h-4" />
            {remaining} kvar att placera
          </>
        )}
      </div>
    </div>
  );
}
