/**
 * MealSlot - Individual meal allocation slot
 */
export default function MealSlot({
  displayName,
  recipe,
  isActive,
  isPlaceholder,
  onClick,
}) {
  const getSlotStyle = () => {
    if (isActive) {
      return 'bg-blue-600 text-white border-blue-600 ring-2 ring-blue-300 ring-inset';
    }
    if (recipe) {
      return isPlaceholder
        ? 'bg-amber-50 border-amber-200 text-amber-900 hover:bg-amber-100 italic'
        : 'bg-green-50 border-green-200 text-gray-800 hover:bg-green-100';
    }
    return 'bg-gray-50 border-dashed hover:bg-gray-100 text-gray-300';
  };

  return (
    <div
      onClick={onClick}
      className={`flex-1 min-w-0 rounded border flex flex-col items-center justify-center p-1 text-center cursor-pointer transition-colors ${getSlotStyle()}`}
      role="button"
      tabIndex={0}
      aria-label={`${recipe ? recipe.name : displayName} - ${displayName}`}
    >
      {recipe ? (
        <div className="w-full">
          <div className="text-xs font-semibold leading-tight px-1 break-words whitespace-normal">
            {recipe.name}
          </div>
          <div
            className={`text-[9px] mt-0.5 ${
              isActive ? 'text-blue-200' : 'text-gray-400'
            }`}
          >
            {displayName}
          </div>
        </div>
      ) : (
        <span className="font-bold">{displayName}</span>
      )}
    </div>
  );
}
