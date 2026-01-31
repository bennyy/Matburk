import { User } from 'lucide-react';

/**
 * MealSlot - Individual meal allocation slot
 */
export default function MealSlot({
  displayName,
  recipe,
  isActive,
  isPlaceholder,
  onClick,
  isLocked,
}) {
  const getSlotStyle = () => {
    if (isLocked) {
      return isPlaceholder
        ? 'bg-gradient-to-br from-amber-50 to-amber-100 border-amber-300 text-amber-900 italic shadow-sm'
        : recipe
          ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-300 text-gray-800 shadow-sm'
          : 'bg-white border border-dashed border-gray-400 text-gray-400 shadow-sm';
    }
    if (isActive) {
      return 'bg-gradient-to-br from-blue-600 to-blue-700 text-white border-blue-500 ring-2 ring-blue-300 shadow-lg transform scale-105';
    }
    if (recipe) {
      return isPlaceholder
        ? 'bg-gradient-to-br from-amber-50 to-amber-100 border-amber-300 text-amber-900 hover:from-amber-100 hover:to-amber-200 hover:shadow-md italic'
        : 'bg-gradient-to-br from-green-50 to-green-100 border-green-300 text-gray-800 hover:from-green-100 hover:to-green-200 hover:shadow-md';
    }
    return 'bg-white border-2 border-dashed border-gray-300 hover:bg-gray-50 hover:border-blue-400 text-gray-400';
  };

  return (
    <div
      onClick={onClick}
      className={`flex-1 min-w-0 rounded-lg border flex flex-col items-center justify-center p-2 text-center transition-all duration-200 ${
        isLocked
          ? 'cursor-not-allowed opacity-90'
          : 'cursor-pointer hover:-translate-y-0.5'
      } ${getSlotStyle()}`}
      role="button"
      tabIndex={isLocked ? -1 : 0}
      aria-label={`${recipe ? recipe.name : displayName} - ${displayName}`}
    >
      {recipe ? (
        <div className="w-full">
          <div className="text-xs font-bold leading-tight px-1 break-words whitespace-normal mb-1">
            {recipe.name}
          </div>
          <div className="flex items-center justify-center gap-1">
            <User
              className={`w-3 h-3 ${
                isLocked
                  ? 'text-gray-400'
                  : isActive
                    ? 'text-blue-200'
                    : 'text-gray-400'
              }`}
            />
            <span
              className={`text-[9px] font-medium ${
                isLocked
                  ? 'text-gray-500'
                  : isActive
                    ? 'text-blue-100'
                    : 'text-gray-500'
              }`}
            >
              {displayName}
            </span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-1">
          <User className="w-5 h-5" />
          <span className="font-semibold text-xs">{displayName}</span>
        </div>
      )}
    </div>
  );
}
