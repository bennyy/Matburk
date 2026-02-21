import {
  Search,
  ChevronDown,
  List,
  AlignJustify,
  FileText,
  Tag,
  BookOpen,
} from 'lucide-react';
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
  const isGridView =
    viewMode === VIEW_MODES.DETAILED || viewMode === VIEW_MODES.COMPACT;

  return (
    <div className="flex-1 overflow-y-auto p-4 bg-gray-50 flex flex-col">
      {/* Search Bar */}
      <div className="mb-4 relative">
        <input
          type="text"
          placeholder="Sök recept..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none focus:border-transparent bg-white transition-all"
          aria-label="Sök recept"
        />
        <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
      </div>

      {/* Controls Row */}
      <div className="mb-4 flex gap-3">
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
            <option value="total_meals-desc">Mest använd</option>
            <option value="total_meals-asc">Minst använd</option>
            <option value="vote-desc">Populär</option>
            <option value="vote-asc">Opopulär</option>
            <option value="last_cooked-desc">Senast lagad</option>
            <option value="last_cooked-asc">Länge sedan</option>
            <option value="created-desc">Nyast</option>
            <option value="created-asc">Gammal</option>
            <option value="name-asc">A-Ö</option>
            <option value="name-desc">Ö-A</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-500" />
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
            <List className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode(VIEW_MODES.COMPACT)}
            className={`px-2 py-2 transition-all border-l border-gray-300 ${viewMode === VIEW_MODES.COMPACT ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
            title="Kompakt vy"
            aria-label="Kompakt vy"
            aria-pressed={viewMode === VIEW_MODES.COMPACT}
          >
            <AlignJustify className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode(VIEW_MODES.DETAILED)}
            className={`px-2 py-2 transition-all border-l border-gray-300 ${viewMode === VIEW_MODES.DETAILED ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
            title="Detaljerad vy"
            aria-label="Detaljerad vy"
            aria-pressed={viewMode === VIEW_MODES.DETAILED}
          >
            <FileText className="h-4 w-4" />
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
            <Tag className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Tag Filter */}
      {allTags.length > 0 && showTagFilter && (
        <div className="mb-4 p-3 bg-white border border-gray-200 rounded-lg">
          <div className="flex flex-wrap gap-2">
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
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                  selectedTags.includes(tag)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
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
      <div
        className={
          isGridView
            ? 'grid [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))] gap-2.5 flex-1 content-start'
            : 'space-y-1.5 flex-1'
        }
      >
        {filteredRecipes.length === 0 ? (
          <div className="text-center text-gray-400 text-sm mt-8 py-6 px-4 bg-white rounded-lg border border-dashed border-gray-200">
            <BookOpen className="w-8 h-8 mx-auto mb-2 text-gray-300" />
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
