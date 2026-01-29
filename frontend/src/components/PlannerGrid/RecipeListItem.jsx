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

  // Minimal view - ultra-clean list for quick scanning
  if (isMinimal) {
    return (
      <div className="flex items-center gap-2 px-2.5 py-1.5 bg-white rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-400 transition-all group">
        <button
          onClick={() => onView(recipe)}
          className="flex-1 text-left text-sm font-medium text-gray-800 hover:text-blue-600 transition-colors truncate min-w-0"
          aria-label={`Visa information om ${recipe.name}`}
        >
          {recipe.name}
        </button>
        {/* Quick metrics */}
        <div className="flex items-center gap-1.5 text-[10px] text-gray-500 flex-shrink-0">
          <span
            className="flex items-center gap-0.5"
            title="Antal gånger lagad"
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4 6h16v2H4V6zm1 3h14v9a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V9zm3-3V3h2v3h4V3h2v3h1a2 2 0 0 1 2 2v11a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8a2 2 0 0 1 2-2h1z" />
            </svg>
            {recipe.meal_count || 0}
          </span>
          <span className="flex items-center gap-0.5" title="Röster">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            {recipe.vote_count}
          </span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddToPlan();
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white w-7 h-7 rounded-full flex items-center justify-center transition-all flex-shrink-0"
          aria-label={`Lägg till ${recipe.name} till matlådor`}
        >
          <svg
            className="w-3.5 h-3.5"
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

  // Compact & Detailed views
  return (
    <div
      onClick={() => onView(recipe)}
      className={`bg-white rounded-lg border border-gray-200 hover:border-blue-400 transition-all cursor-pointer hover:bg-blue-50 flex gap-2.5 group ${
        isDetailed ? 'p-3 items-start relative' : 'p-2 items-center'
      }`}
      role="button"
      tabIndex={0}
    >
      {/* Recipe Image */}
      <div
        className={`shrink-0 relative rounded-md overflow-hidden bg-gray-100 flex-shrink-0 ${
          isDetailed ? 'w-16 h-16' : 'w-10 h-10'
        }`}
      >
        {getRecipeImage() ? (
          <img
            src={getRecipeImage()}
            alt={recipe.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl">
            🍽️
          </div>
        )}
      </div>

      {/* Text Content */}
      <div
        className={`flex flex-col flex-1 min-w-0 justify-center ${isDetailed ? 'pr-20' : ''}`}
      >
        <span
          className={`font-medium group-hover:text-blue-600 leading-tight ${
            isDetailed
              ? 'text-base text-gray-900 mb-1.5'
              : 'text-sm text-gray-800 truncate'
          }`}
        >
          {recipe.name}
        </span>

        {/* Tags & Info */}
        {isDetailed ? (
          <div className="space-y-1.5">
            {recipe.tags &&
              Array.isArray(recipe.tags) &&
              recipe.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {recipe.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-200 font-medium"
                    >
                      {typeof tag === 'string' ? tag : tag.name}
                    </span>
                  ))}
                </div>
              )}
            <div className="flex items-center gap-2 text-[10px] text-gray-500 font-medium">
              <span className="flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded">
                <svg
                  className="w-3 h-3"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M4 6h16v2H4V6zm1 3h14v9a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V9zm3-3V3h2v3h4V3h2v3h1a2 2 0 0 1 2 2v11a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8a2 2 0 0 1 2-2h1z" />
                </svg>
                {recipe.meal_count || 0}x lagad
              </span>
              <span className="flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded">
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
                  className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded"
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
                  Info
                </span>
              )}
            </div>
          </div>
        ) : (
          recipe.tags &&
          Array.isArray(recipe.tags) &&
          recipe.tags.length > 0 && (
            <div className="flex gap-1 mt-0.5 overflow-hidden">
              {recipe.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag.id}
                  className="text-[9px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-medium"
                >
                  {typeof tag === 'string' ? tag : tag.name}
                </span>
              ))}
              {recipe.tags.length > 2 && (
                <span className="text-[9px] text-gray-400 font-medium">
                  +{recipe.tags.length - 2}
                </span>
              )}
            </div>
          )
        )}
      </div>

      {/* Action Buttons */}
      {isDetailed ? (
        <>
          {/* Detailed view - absolute positioning */}
          <div className="absolute top-2 right-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onVote();
              }}
              className="bg-red-50 hover:bg-red-100 text-red-600 transition-all font-medium border border-red-200 flex items-center gap-1 text-[10px] px-2 py-1 rounded"
              aria-label={`Rösta för ${recipe.name}`}
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              <span>{recipe.vote_count}</span>
            </button>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToPlan();
            }}
            className="absolute bottom-2 right-2 bg-blue-600 hover:bg-blue-700 text-white transition-all flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-medium gap-1"
            aria-label={`Lägg till ${recipe.name} till matlådor`}
          >
            <svg
              className="w-3.5 h-3.5"
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
            <span>Lägg till</span>
          </button>
        </>
      ) : (
        <>
          {/* Compact view - flex column layout */}
          <div className="flex flex-col gap-1.5 ml-2 flex-shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onVote();
              }}
              className="bg-red-50 hover:bg-red-100 text-red-600 transition-all font-medium border border-red-200 flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded"
              aria-label={`Rösta för ${recipe.name}`}
            >
              <svg
                className="w-2.5 h-2.5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              <span>{recipe.vote_count}</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddToPlan();
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white w-7 h-7 rounded-full flex items-center justify-center transition-all"
              aria-label={`Lägg till ${recipe.name} till matlådor`}
            >
              <svg
                className="w-3.5 h-3.5"
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
        </>
      )}
    </div>
  );
}
