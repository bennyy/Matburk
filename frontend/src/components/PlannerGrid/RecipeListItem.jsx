/**
 * RecipeListItem - Individual recipe in the library list
 * Supports minimal, compact and detailed view modes
 */
export default function RecipeListItem({
  recipe,
  viewMode,
  onView,
  onVote,
  onAddToPlan,
}) {
  const isDetailed = viewMode === 'detailed';
  const isMinimal = viewMode === 'minimal';

  const getRecipeImage = () => {
    if (recipe.image_url) {
      return recipe.image_url;
    }
    return null;
  };

  // Minimal view - just title and add button
  if (isMinimal) {
    return (
      <div className="flex items-center justify-between gap-2 px-2 md:px-3 py-1.5 md:py-2 bg-white rounded-lg border hover:bg-blue-50 hover:border-blue-400 hover:shadow-md transition-all group shadow-sm">
        <button
          onClick={() => onView(recipe)}
          className="flex-1 text-left text-xs md:text-sm font-semibold text-gray-800 hover:text-blue-600 transition-colors truncate"
          aria-label={`Visa information om ${recipe.name}`}
        >
          {recipe.name}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddToPlan();
          }}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center font-bold shadow-md hover:shadow-lg transition-all flex-shrink-0"
          aria-label={`Lägg till ${recipe.name} till matlådor`}
        >
          <svg
            className="w-3.5 h-3.5 md:w-4 md:h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div
      onClick={() => onView(recipe)}
      className={`bg-white rounded-lg border hover:shadow-lg hover:border-blue-400 transition-all cursor-pointer hover:bg-blue-50 flex justify-between group ${
        isDetailed ? 'p-2 md:p-3 items-start' : 'p-2 md:p-2.5 items-center'
      } shadow-sm`}
      role="button"
      tabIndex={0}
    >
      {/* Content Section */}
      <div className="flex gap-2 md:gap-3 overflow-hidden w-full">
        {/* Recipe Image */}
        <div
          className={`shrink-0 relative rounded-lg overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300 flex-shrink-0 ${isDetailed ? 'w-14 h-14 md:w-16 md:h-16' : 'w-9 h-9 md:w-10 md:h-10'}`}
        >
          {getRecipeImage() ? (
            <img
              src={getRecipeImage()}
              alt={recipe.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.style.display = 'none';
              }}
            />
          ) : null}
          {!getRecipeImage() && (
            <div className="w-full h-full flex items-center justify-center">
              <svg
                className="w-5 h-5 md:w-6 md:h-6 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Text Content */}
        <div className="flex flex-col flex-1 min-w-0 justify-center">
          <span
            className={`font-semibold group-hover:text-blue-600 ${
              isDetailed
                ? 'text-sm md:text-base text-gray-900'
                : 'text-xs md:text-sm text-gray-800 truncate'
            }`}
          >
            {recipe.name}
          </span>

          {/* Tags & Info */}
          {isDetailed ? (
            <div className="mt-1.5 md:mt-2 space-y-1">
              {recipe.tags &&
                Array.isArray(recipe.tags) &&
                recipe.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {recipe.tags.map((tag) => (
                      <span
                        key={tag.id}
                        className="text-[9px] md:text-[10px] bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 px-2 md:px-2.5 py-0.5 md:py-1 rounded-full border border-blue-300 font-semibold whitespace-nowrap shadow-sm"
                      >
                        {typeof tag === 'string' ? tag : tag.name}
                      </span>
                    ))}
                  </div>
                )}
              <div className="text-[10px] md:text-[11px] text-gray-600 flex items-center gap-2 md:gap-3 font-medium flex-wrap">
                <span className="flex items-center gap-0.5">
                  <svg
                    className="w-3 h-3"
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
                  {recipe.last_cooked_date || 'Aldrig'}
                </span>
                {recipe.notes && (
                  <span
                    className="flex items-center gap-0.5"
                    title="Har anteckningar"
                  >
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Anteckningar
                  </span>
                )}
              </div>
            </div>
          ) : (
            recipe.tags &&
            Array.isArray(recipe.tags) &&
            recipe.tags.length > 0 && (
              <div className="flex gap-1 mt-0.5 md:mt-1 overflow-hidden">
                {recipe.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag.id}
                    className="text-[8px] md:text-[9px] bg-gray-200 text-gray-700 px-1.5 md:px-2 py-0.5 rounded-full font-medium whitespace-nowrap"
                  >
                    {typeof tag === 'string' ? tag : tag.name}
                  </span>
                ))}
                {recipe.tags.length > 2 && (
                  <span className="text-[8px] md:text-[9px] text-gray-500 font-medium">
                    +{recipe.tags.length - 2}
                  </span>
                )}
              </div>
            )
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div
        className={`flex flex-col justify-center items-end gap-1 ml-1 md:ml-2 ${
          isDetailed ? 'h-14 md:h-16' : ''
        }`}
      >
        <div className="flex gap-1 md:gap-1.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onVote();
            }}
            className="text-[9px] md:text-xs bg-gradient-to-r from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 px-1 md:px-2 py-0.5 md:py-1 rounded-lg text-red-600 hover:text-red-700 transition-all whitespace-nowrap font-semibold border border-red-300 shadow-sm flex items-center gap-0.5 md:gap-1"
            aria-label={`Rösta för ${recipe.name}`}
          >
            {/* Heart icon - votes */}
            <svg
              className="w-2.5 h-2.5 md:w-3 md:h-3"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            <span>{recipe.vote_count}</span>
          </button>
          <div className="text-[9px] md:text-xs bg-gradient-to-r from-green-50 to-green-100 px-1 md:px-2 py-0.5 md:py-1 rounded-lg text-green-700 whitespace-nowrap font-semibold border border-green-300 shadow-sm flex items-center gap-0.5 md:gap-1">
            {/* Pot/cooking icon - meal count */}
            <svg
              className="w-2.5 h-2.5 md:w-3 md:h-3"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M4 6h16v2H4V6zm1 3h14v9a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V9zm3-3V3h2v3h4V3h2v3h1a2 2 0 0 1 2 2v11a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8a2 2 0 0 1 2-2h1z" />
            </svg>
            <span>{recipe.meal_count || 0}</span>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddToPlan();
          }}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center font-bold shadow-md hover:shadow-lg transition-all"
          aria-label={`Lägg till ${recipe.name} till matlådor`}
        >
          <svg
            className="w-3.5 h-3.5 md:w-4 md:h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
