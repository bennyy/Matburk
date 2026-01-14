/**
 * RecipeListItem - Individual recipe in the library list
 * Supports minimal, compact and detailed view modes
 */
export default function RecipeListItem({
  recipe,
  viewMode,
  apiUrl,
  onView,
  onVote,
  onAddToPlan,
}) {
  const isDetailed = viewMode === 'detailed';
  const isMinimal = viewMode === 'minimal';

  const getRecipeImage = () => {
    if (recipe.image_filename) {
      return `${apiUrl}/images/${recipe.image_filename}`;
    }
    if (recipe.image_url) {
      return recipe.image_url;
    }
    return null;
  };

  // Minimal view - just title and add button
  if (isMinimal) {
    return (
      <div className="flex items-center justify-between gap-2 px-2 py-1 bg-white rounded border border-gray-200 hover:bg-gray-50 hover:shadow-sm transition-all group">
        <button
          onClick={() => onView(recipe)}
          className="flex-1 text-left text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
          aria-label={`Visa information om ${recipe.name}`}
        >
          {recipe.name}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddToPlan();
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-sm shrink-0"
          aria-label={`Lägg till ${recipe.name} till matlådor`}
        >
          +
        </button>
      </div>
    );
  }

  return (
    <div
      onClick={() => onView(recipe)}
      className={`bg-white rounded border flex justify-between group hover:shadow-md transition-all cursor-pointer hover:bg-gray-50 ${
        isDetailed ? 'p-3 items-start' : 'p-2 items-center'
      }`}
      role="button"
      tabIndex={0}
    >
      {/* Content Section */}
      <div className="flex gap-3 overflow-hidden w-full">
        {/* Recipe Image */}
        <div
          className={`shrink-0 relative ${isDetailed ? 'w-16 h-16' : 'w-10 h-10'}`}
        >
          {getRecipeImage() ? (
            <img
              src={getRecipeImage()}
              alt={recipe.name}
              className="w-full h-full rounded object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center text-xs">
              🍽️
            </div>
          )}
        </div>

        {/* Text Content */}
        <div className="flex flex-col flex-1 min-w-0 justify-center">
          <span
            className={`font-medium group-hover:text-blue-600 ${
              isDetailed ? 'text-base' : 'text-sm truncate'
            }`}
          >
            {recipe.name}
          </span>

          {/* Tags & Info */}
          {isDetailed ? (
            <div className="mt-1">
              {recipe.tags && (
                <div className="flex flex-wrap gap-1 mb-1">
                  {recipe.tags.split(',').map((tag, i) => (
                    <span
                      key={i}
                      className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100 whitespace-nowrap"
                    >
                      {tag.trim()}
                    </span>
                  ))}
                </div>
              )}
              <div className="text-[10px] text-gray-500 flex items-center gap-2">
                <span>📅 Sist: {recipe.last_cooked_date || 'Aldrig'}</span>
                {recipe.notes && <span title="Har anteckningar">📝</span>}
              </div>
            </div>
          ) : (
            recipe.tags && (
              <div className="flex gap-1 mt-0.5 overflow-hidden">
                {recipe.tags
                  .split(',')
                  .slice(0, 2)
                  .map((tag, i) => (
                    <span
                      key={i}
                      className="text-[9px] bg-gray-100 text-gray-600 px-1.5 rounded-sm whitespace-nowrap"
                    >
                      {tag.trim()}
                    </span>
                  ))}
              </div>
            )
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div
        className={`flex flex-col justify-center items-end gap-1 ml-2 ${
          isDetailed ? 'h-16' : ''
        }`}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onVote();
          }}
          className="text-xs bg-gray-50 hover:bg-pink-50 px-2 py-1 rounded text-gray-400 hover:text-pink-500 transition-colors whitespace-nowrap"
          aria-label={`Rösta för ${recipe.name}`}
        >
          ❤️ {recipe.vote_count}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddToPlan();
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shadow-sm"
          aria-label={`Lägg till ${recipe.name} till matlådor`}
        >
          +
        </button>
      </div>
    </div>
  );
}
