import RecipeListItem from './RecipeListItem';
import { VIEW_MODES } from './constants';

/**
 * LibraryTab - Recipe browser with search, filters, and sorting
 */
export default function LibraryTab({
  filteredRecipes,
  placeholderRecipes,
  allTags,
  searchQuery,
  setSearchQuery,
  selectedTags,
  setSelectedTags,
  showTagFilter,
  setShowTagFilter,
  sortField,
  setSortField,
  sortOrder,
  setSortOrder,
  viewMode,
  setViewMode,
  apiUrl,
  onAddToPlan,
  onViewRecipe,
  onVote,
}) {
  return (
    <div className="flex-1 overflow-y-auto p-3 bg-gray-50 flex flex-col">
      {/* Search Bar */}
      <div className="mb-2 relative">
        <input
          type="text"
          placeholder="Sök recept..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none focus:border-transparent bg-white transition-all"
          aria-label="Sök recept"
        />
        <svg
          className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {/* Controls Row */}
      <div className="mb-3 flex gap-2">
        {/* Sort Dropdown */}
        <div className="relative flex-1">
          <select
            value={`${sortField}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortField(field);
              setSortOrder(order);
            }}
            className="w-full appearance-none pl-3 pr-8 py-2 text-xs font-medium border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
            aria-label="Sortera recept"
          >
            <option value="total_meals-desc">🥡 Mest använd</option>
            <option value="total_meals-asc">🥡 Minst använd</option>
            <option value="vote-desc">❤️ Populär</option>
            <option value="vote-asc">❤️ Opopulär</option>
            <option value="last_cooked-desc">📅 Senast</option>
            <option value="last_cooked-asc">📅 Längesen</option>
            <option value="created-desc">✨ Nytt</option>
            <option value="created-asc">✨ Gamla</option>
            <option value="name-asc">🔤 A-Ö</option>
            <option value="name-desc">🔤 Ö-A</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
            <svg className="fill-current h-3 w-3" viewBox="0 0 20 20">
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
            </svg>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex bg-white border border-gray-300 rounded-lg overflow-hidden">
          <button
            onClick={() => setViewMode(VIEW_MODES.MINIMAL)}
            className={`px-2 py-2 transition-all ${viewMode === VIEW_MODES.MINIMAL ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
            title="Minimal vy"
            aria-label="Minimal vy"
            aria-pressed={viewMode === VIEW_MODES.MINIMAL}
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <button
            onClick={() => setViewMode(VIEW_MODES.COMPACT)}
            className={`px-2 py-2 transition-all border-l border-gray-300 ${viewMode === VIEW_MODES.COMPACT ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
            title="Kompakt vy"
            aria-label="Kompakt vy"
            aria-pressed={viewMode === VIEW_MODES.COMPACT}
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 10h16M4 14h16"
              />
            </svg>
          </button>
          <button
            onClick={() => setViewMode(VIEW_MODES.DETAILED)}
            className={`px-2 py-2 transition-all border-l border-gray-300 ${viewMode === VIEW_MODES.DETAILED ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
            title="Detaljerad vy"
            aria-label="Detaljerad vy"
            aria-pressed={viewMode === VIEW_MODES.DETAILED}
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 10h16M4 14h10M4 18h10"
              />
            </svg>
          </button>
        </div>

        {/* Tag Filter Button */}
        {allTags.length > 0 && (
          <button
            onClick={() => setShowTagFilter(!showTagFilter)}
            className={`px-2 py-2 rounded-lg transition-all border flex items-center justify-center ${
              showTagFilter || selectedTags.length > 0
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
            }`}
            aria-expanded={showTagFilter}
            title="Filtrera taggar"
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
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Tag Filter */}
      {allTags.length > 0 && showTagFilter && (
        <div className="mb-3 p-2.5 bg-white border border-gray-200 rounded-lg">
          <div className="flex flex-wrap gap-1.5">
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() =>
                  setSelectedTags((prev) =>
                    prev.includes(tag)
                      ? prev.filter((t) => t !== tag)
                      : [...prev, tag]
                  )
                }
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors border ${
                  selectedTags.includes(tag)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-gray-100 text-gray-700 border-gray-100 hover:bg-gray-200 hover:border-gray-200'
                }`}
                aria-pressed={selectedTags.includes(tag)}
                aria-label={`Filtrera efter tagg: ${tag}`}
              >
                {tag}
              </button>
            ))}
          </div>
          {selectedTags.length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <button
                onClick={() => setSelectedTags([])}
                className="text-xs text-gray-500 hover:text-gray-700 font-medium underline"
              >
                Rensa alla filter
              </button>
            </div>
          )}
        </div>
      )}

      {/* Quick Add - Placeholder Recipes */}
      {placeholderRecipes.length > 0 && (
        <div className="mb-3">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5 px-0.5">
            Snabbval
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {placeholderRecipes.map((p) => (
              <button
                key={p.id}
                onClick={() => onAddToPlan(p)}
                className="flex items-center justify-center p-2 bg-white border border-dashed border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-400 transition-all text-xs font-medium text-gray-700 hover:text-blue-600 line-clamp-2"
                title={p.name}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recipe List */}
      <div className="space-y-1.5 flex-1">
        {filteredRecipes.length === 0 ? (
          <div className="text-center text-gray-400 text-sm mt-8 py-6 px-4 bg-white rounded-lg border border-dashed border-gray-200">
            <svg
              className="w-8 h-8 mx-auto mb-2 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            <p className="text-xs font-medium">Inga recept hittades</p>
            {searchQuery && (
              <p className="text-[10px] text-gray-400 mt-0.5">
                Försök med andra sökord
              </p>
            )}
          </div>
        ) : (
          filteredRecipes.map((recipe) => (
            <RecipeListItem
              key={recipe.id}
              recipe={recipe}
              viewMode={viewMode}
              apiUrl={apiUrl}
              onView={onViewRecipe}
              onVote={() => onVote(recipe.id)}
              onAddToPlan={() => onAddToPlan(recipe)}
            />
          ))
        )}
      </div>
    </div>
  );
}
