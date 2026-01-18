import { useState, useEffect, useCallback } from 'react';
import { format, addDays, isSameDay } from 'date-fns';
// eslint-disable-next-line no-unused-vars
import { sv } from 'date-fns/locale';

import RecipeDetails from '../RecipeDetails';

import RecipeListItem from './RecipeListItem';

import DayColumn from './DayColumn';

import EditRecipe from '../EditRecipe';

/**
 * PlannerGrid - Main meal planning component
 *
 * Displays a weekly planning grid with:
 * - Sidebar with meal batches and recipe library
 * - Calendar grid showing allocated recipes per person/meal
 * - Support for filtering, searching, and managing portions
 */
export default function PlannerGrid({
  recipes,
  plan,
  onUpdateSlot,
  apiUrl,
  onVote,
  currentWeekStart,
  onNextWeek,
  onPrevWeek,
  onGoToday,
  sortField,
  setSortField,
  sortOrder,
  setSortOrder,
  peopleNames,
  onRefreshRecipes,
  mealPlanner,
  setMealPlanner,
}) {
  // ========== CONSTANTS ==========
  const MEALS = ['LUNCH', 'DINNER'];
  const PEOPLE_KEYS = ['A', 'B'];
  const VIEW_MODES = {
    MINIMAL: 'minimal',
    COMPACT: 'compact',
    DETAILED: 'detailed',
  };
  const TABS = { PLANNING: 'planning', LIBRARY: 'library' };

  // ========== STATE MANAGEMENT ==========
  const [activeTab, setActiveTab] = useState(TABS.PLANNING);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [showTagFilter, setShowTagFilter] = useState(false);
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState(null);
  const [removedRecipeIds, setRemovedRecipeIds] = useState([]);
  const [viewingRecipe, setViewingRecipe] = useState(null);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [viewMode, setViewMode] = useState(VIEW_MODES.COMPACT);

  // Per-week lock state - stored with week as key
  const weekKey = format(currentWeekStart, 'yyyy-MM-dd');
  const [isWeekLocked, setIsWeekLocked] = useState(() => {
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line no-undef
      const stored = localStorage.getItem(`weekLock_${weekKey}`);
      return stored === null ? true : stored === 'true';
    }
    return false;
  });

  // ========== COMPUTED VALUES ==========
  /** Placeholder recipes (quick add buttons) - sorted by ID for stability */
  const placeholderRecipes = recipes
    .filter((r) => r.is_placeholder)
    .sort((a, b) => a.id - b.id);

  /** Standard recipes - follow backend sorting (votes, date, name, etc) */
  const standardRecipes = recipes.filter((r) => !r.is_placeholder);

  /** All days in current week */
  const days = Array.from({ length: 7 }).map((_, i) =>
    addDays(currentWeekStart, i)
  );

  /** All unique tags from all recipes */
  const allTags = Array.from(
    new Set(
      standardRecipes
        .filter((r) => r.tags && Array.isArray(r.tags))
        .flatMap((r) => r.tags.map((t) => (typeof t === 'string' ? t : t.name)))
    )
  ).sort();

  /** Recipes filtered by search query (name or tags) and selected tag filters */
  const filteredRecipes = standardRecipes.filter((recipe) => {
    const query = searchQuery.toLowerCase();
    const nameMatch = recipe.name.toLowerCase().includes(query);

    // Handle tags that are now objects instead of strings
    const recipeTagNames =
      recipe.tags && Array.isArray(recipe.tags)
        ? recipe.tags.map((t) => (typeof t === 'string' ? t : t.name))
        : [];
    const tagMatch = recipeTagNames.some((tag) =>
      tag.toLowerCase().includes(query)
    );
    const searchPasses = nameMatch || tagMatch;

    // If no tags selected, don't filter by tags
    if (selectedTags.length === 0) {
      return searchPasses;
    }

    // If tags are selected, recipe must have at least one of the selected tags
    const hasSelectedTag = selectedTags.some((tag) =>
      recipeTagNames.includes(tag)
    );

    return searchPasses && hasSelectedTag;
  });

  // ========== EFFECTS ==========
  /**
   * Reset batch selection when navigating to a different week
   */
  useEffect(() => {
    setSelectedBatchId(null);
    setBatches([]);
  }, [currentWeekStart]);

  /**
   * Sync lock state when week changes
   */
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line no-undef
      const stored = localStorage.getItem(`weekLock_${weekKey}`);
      const locked = stored === null ? true : stored === 'true';
      setIsWeekLocked(locked);
    }
  }, [weekKey]);

  /**
   * Reset batch selection when navigating to a different week
   */
  useEffect(() => {
    setSelectedBatchId(null);
    setBatches([]);
  }, [currentWeekStart]);

  /**
   * Synchronize meal batches with current week's plan
   * - Adds new recipes that are allocated in the week
   * - Removes recipes that are no longer in the plan
   * - Preserves manually added batches that aren't allocated yet
   */
  useEffect(() => {
    if (!recipes.length) return;

    const startStr = format(currentWeekStart, 'yyyy-MM-dd');
    const endStr = format(addDays(currentWeekStart, 6), 'yyyy-MM-dd');

    const currentWeekSlots = plan.filter(
      (p) => p.plan_date >= startStr && p.plan_date <= endStr
    );

    const recipeIdsInWeek = [
      ...new Set(currentWeekSlots.map((p) => p.recipe_id)),
    ].filter(Boolean);

    setBatches((prevBatches) => {
      const newBatches = [];

      // Add recipes that are allocated in this week
      recipeIdsInWeek.forEach((rId) => {
        // Skip if recipe was explicitly removed by user
        if (removedRecipeIds.includes(rId)) return;

        const recipe = recipes.find((r) => r.id === rId);
        if (recipe) {
          const currentUsage = currentWeekSlots.filter(
            (p) => p.recipe_id === rId
          ).length;
          const existing = prevBatches.find((b) => b.recipeId === rId);

          newBatches.push({
            recipeId: recipe.id,
            recipeName: recipe.name,
            image: recipe.image_url,
            targetPortions: existing
              ? existing.targetPortions
              : Math.max(recipe.default_portions, currentUsage),
          });
        }
      });

      // Keep manually added batches (not yet in calendar)
      prevBatches.forEach((prev) => {
        const alreadyAdded = newBatches.find(
          (b) => b.recipeId === prev.recipeId
        );
        if (!alreadyAdded && !removedRecipeIds.includes(prev.recipeId)) {
          newBatches.push(prev);
        }
      });

      return newBatches;
    });

    // Clean up removed recipe IDs that are no longer in the plan
    setRemovedRecipeIds((prev) => {
      return prev.filter((id) => recipeIdsInWeek.includes(id));
    });
  }, [plan, recipes, currentWeekStart, removedRecipeIds]);

  // ========== HANDLERS ==========
  /**
   * Add a recipe to the meal planning batches
   */
  const addToPlanning = useCallback(
    (recipe) => {
      // Remove from ignore list if re-adding
      setRemovedRecipeIds((prev) => prev.filter((id) => id !== recipe.id));

      setBatches((prevBatches) => {
        const exists = prevBatches.find((b) => b.recipeId === recipe.id);
        if (!exists) {
          return [
            ...prevBatches,
            {
              recipeId: recipe.id,
              targetPortions: recipe.default_portions,
              recipeName: recipe.name,
              image: recipe.image_url,
              imageUrl: recipe.image_url,
            },
          ];
        }
        return prevBatches;
      });

      setSelectedBatchId(recipe.id);
      setActiveTab(TABS.PLANNING);
      setSearchQuery('');
    },
    [TABS.PLANNING]
  );

  /**
   * Update target portions for a meal batch
   */
  const updateBatchPortions = useCallback((id, change) => {
    setBatches((prevBatches) =>
      prevBatches.map((b) =>
        b.recipeId === id
          ? { ...b, targetPortions: Math.max(1, b.targetPortions + change) }
          : b
      )
    );
  }, []);

  /**
   * Remove a recipe from meal planning
   * - Removes from UI immediately
   * - Clears all allocated slots in backend
   * - Adds to ignore list to prevent auto-re-adding
   */
  const removeFromPlanning = useCallback(
    (e, id) => {
      e.stopPropagation();

      // Add to ignore list
      setRemovedRecipeIds((prev) => [...prev, id]);

      // Remove from UI
      setBatches((prevBatches) => prevBatches.filter((b) => b.recipeId !== id));
      setSelectedBatchId((current) => (current === id ? null : current));

      // Clear all slots with this recipe in backend
      plan.forEach((slot) => {
        if (slot.recipe_id === id) {
          onUpdateSlot({
            plan_date: slot.plan_date,
            meal_type: slot.meal_type,
            person: slot.person,
            recipe_id: null,
          });
        }
      });
    },
    [plan, onUpdateSlot]
  );

  /**
   * Toggle recipe allocation in a specific time slot
   */
  const handleSlotClick = useCallback(
    (date, meal, person) => {
      if (isWeekLocked) return; // Don't update if week is locked

      const dateStr = format(date, 'yyyy-MM-dd');
      const existingSlot = plan.find(
        (p) =>
          p.plan_date === dateStr && p.meal_type === meal && p.person === person
      );

      // If a batch is selected, toggle its presence in this slot
      if (selectedBatchId) {
        const isAlreadyAllocated =
          existingSlot && existingSlot.recipe_id === selectedBatchId;

        onUpdateSlot({
          plan_date: dateStr,
          meal_type: meal,
          person: person,
          recipe_id: isAlreadyAllocated ? null : selectedBatchId,
        });
      } else {
        // If no batch selected, clear the slot
        onUpdateSlot({
          plan_date: dateStr,
          meal_type: meal,
          person: person,
          recipe_id: null,
        });
      }
    },
    [selectedBatchId, plan, onUpdateSlot, isWeekLocked]
  );

  /**
   * Toggle lock for the current week
   */
  const handleToggleWeekLock = useCallback(() => {
    const newLocked = !isWeekLocked;
    setIsWeekLocked(newLocked);
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line no-undef
      localStorage.setItem(`weekLock_${weekKey}`, newLocked.toString());
    }
  }, [isWeekLocked, weekKey]);

  /**
   * Count how many times a recipe is allocated in the current plan
   */
  const getAllocatedCount = useCallback(
    (recipeId) => plan.filter((p) => p.recipe_id === recipeId).length,
    [plan]
  );

  // ========== RENDER ==========
  return (
    <div className="flex flex-col md:flex-row h-full relative">
      {/* ========== SIDEBAR ========== */}
      <div
        className={`bg-white flex flex-col transition-all ${mealPlanner ? 'w-full md:w-1/3 lg:w-1/4 h-[40vh] md:h-full border-b md:border-b-0 md:border-r' : 'w-full h-full border-r'}`}
      >
        {/* Tab Navigation */}
        <div className="flex border-b items-center justify-between md:hidden">
          <div className="flex flex-1">
            <button
              onClick={() => setActiveTab(TABS.PLANNING)}
              aria-selected={activeTab === TABS.PLANNING}
              className={`flex-1 py-3 text-sm font-bold ${activeTab === TABS.PLANNING ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
            >
              Matlådor
            </button>
            <button
              onClick={() => setActiveTab(TABS.LIBRARY)}
              aria-selected={activeTab === TABS.LIBRARY}
              className={`flex-1 py-3 text-sm font-bold ${activeTab === TABS.LIBRARY ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
            >
              Bibliotek
            </button>
          </div>
        </div>

        {/* Tab Navigation - Desktop */}
        <div className="hidden md:flex border-b items-center justify-between">
          <div className="flex flex-1">
            <button
              onClick={() => setActiveTab(TABS.PLANNING)}
              aria-selected={activeTab === TABS.PLANNING}
              className={`flex-1 py-3 text-sm font-bold ${activeTab === TABS.PLANNING ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
            >
              Matlådor
            </button>
            <button
              onClick={() => setActiveTab(TABS.LIBRARY)}
              aria-selected={activeTab === TABS.LIBRARY}
              className={`flex-1 py-3 text-sm font-bold ${activeTab === TABS.LIBRARY ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
            >
              Bibliotek
            </button>
          </div>
          <button
            onClick={() => setMealPlanner(!mealPlanner)}
            className="px-3 py-2 hover:bg-gray-100 rounded text-gray-600 font-bold"
            title={mealPlanner ? 'Dölj kalender' : 'Visa kalender'}
            aria-label={mealPlanner ? 'Dölj kalender' : 'Visa kalender'}
          >
            {mealPlanner ? '▶' : '◀'}
          </button>
        </div>

        {/* Planning Tab - Meal Batches */}
        {activeTab === TABS.PLANNING && (
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 flex flex-col">
            {/* Edit Mode Toggle */}
            <div className="mb-4">
              <button
                onClick={handleToggleWeekLock}
                className={`w-full py-2 px-3 rounded-lg font-bold text-sm transition-colors border ${
                  isWeekLocked
                    ? 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                }`}
                title={isWeekLocked ? 'Redigera veckan' : 'Avsluta redigering'}
              >
                {isWeekLocked ? '✏️ Redigera' : '✔️ Klar'}
              </button>
            </div>

            {batches.length === 0 ? (
              <div className="text-center text-gray-400 mt-10 text-sm">
                <p>Inga matlådor denna vecka.</p>
                <button
                  onClick={() => setActiveTab(TABS.LIBRARY)}
                  className="text-blue-600 underline mt-2"
                >
                  Hämta från biblioteket
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-gray-500 uppercase font-bold text-center mb-2">
                  Vecka {format(currentWeekStart, 'w')}
                </p>
                {batches.map((batch) => {
                  const used = getAllocatedCount(batch.recipeId);
                  const remaining = batch.targetPortions - used;
                  const isSelected = selectedBatchId === batch.recipeId;

                  return (
                    <div
                      key={batch.recipeId}
                      onClick={() =>
                        setSelectedBatchId(isSelected ? null : batch.recipeId)
                      }
                      className={`bg-white p-3 rounded-lg border-2 shadow-sm cursor-pointer relative transition-all ${isSelected ? 'border-blue-500 ring-1 ring-blue-500 shadow-md' : 'border-transparent hover:border-blue-200'}`}
                      role="button"
                      tabIndex={0}
                      aria-pressed={isSelected}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-gray-800 text-sm">
                          {batch.recipeName}
                        </span>
                        <button
                          onClick={(e) => {
                            if (isWeekLocked) return;
                            removeFromPlanning(e, batch.recipeId);
                          }}
                          className={`${
                            isWeekLocked
                              ? 'text-gray-300 cursor-not-allowed'
                              : 'text-gray-600 hover:text-red-500'
                          } font-bold px-2`}
                          aria-disabled={isWeekLocked}
                          aria-label={`Removera ${batch.recipeName}`}
                        >
                          ×
                        </button>
                      </div>

                      {/* Portion Controls */}
                      <div className="flex items-center justify-between bg-gray-50 rounded p-1 mb-2">
                        <span className="text-xs text-gray-500 ml-1">
                          Planerat:
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isWeekLocked) return;
                              updateBatchPortions(batch.recipeId, -1);
                            }}
                            disabled={isWeekLocked}
                            aria-disabled={isWeekLocked}
                            className={`w-6 h-6 border rounded flex items-center justify-center ${
                              isWeekLocked
                                ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-white hover:bg-gray-100'
                            }`}
                            aria-label="Minska portioner"
                          >
                            −
                          </button>
                          <span className="font-bold text-sm w-4 text-center">
                            {batch.targetPortions}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isWeekLocked) return;
                              updateBatchPortions(batch.recipeId, 1);
                            }}
                            disabled={isWeekLocked}
                            aria-disabled={isWeekLocked}
                            className={`w-6 h-6 border rounded flex items-center justify-center ${
                              isWeekLocked
                                ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-white hover:bg-gray-100'
                            }`}
                            aria-label="Öka portioner"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Status Indicator */}
                      <div
                        className={`text-xs font-bold text-center py-1 rounded ${remaining === 0 ? 'bg-green-100 text-green-700' : remaining < 0 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}
                      >
                        {remaining === 0
                          ? '✔️ Klar!'
                          : remaining < 0
                            ? `${Math.abs(remaining)} för många!`
                            : `${remaining} kvar att placera`}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Library Tab - Recipe Browser */}
        {activeTab === TABS.LIBRARY && (
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 flex flex-col">
            {/* Search Input and Tag Filter Button */}
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="🔍 Sök recept..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                aria-label="Sök recept"
              />
              {allTags.length > 0 && (
                <button
                  onClick={() => setShowTagFilter(!showTagFilter)}
                  className={`px-3 py-2 rounded text-sm font-medium transition-all border ${
                    showTagFilter
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                  aria-expanded={showTagFilter}
                  title="Visa/dölj taggfilter"
                >
                  🏷️ Taggar
                </button>
              )}
            </div>

            {/* Filter & View Controls */}
            <div className="flex gap-2 mb-4">
              {/* Sort By */}
              <div className="relative flex-1">
                <select
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value)}
                  className="w-full appearance-none p-2.5 pl-3 pr-8 text-xs font-medium border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow cursor-pointer"
                  aria-label="Sorteringsfält"
                >
                  <option value="total_meals">🥡 Mest använd</option>
                  <option value="vote">❤️ Populärast</option>
                  <option value="last_cooked">📅 Senast lagad</option>
                  <option value="created">✨ Nyligen tillagd</option>
                  <option value="name">🔤 Namn</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                  <svg className="fill-current h-3 w-3" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>

              {/* Sort Direction Toggle */}
              <button
                onClick={() =>
                  setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
                }
                className="aspect-square h-full p-2 bg-white border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 hover:border-blue-300 transition-all flex items-center justify-center"
                aria-label={`Sorteringsriktning: ${sortOrder === 'asc' ? 'stigande' : 'fallande'}`}
              >
                {sortOrder === 'asc' ? '⬆️' : '⬇️'}
              </button>

              {/* View Mode Toggle */}
              <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
                <button
                  onClick={() => setViewMode(VIEW_MODES.MINIMAL)}
                  className={`p-1.5 rounded transition-all ${viewMode === VIEW_MODES.MINIMAL ? 'bg-white shadow text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                  title="Minimal vy"
                  aria-label="Växla till minimal vy"
                  aria-pressed={viewMode === VIEW_MODES.MINIMAL}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
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
                  className={`p-1.5 rounded transition-all ${viewMode === VIEW_MODES.COMPACT ? 'bg-white shadow text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                  title="Kompakt vy"
                  aria-label="Växla till kompakt vy"
                  aria-pressed={viewMode === VIEW_MODES.COMPACT}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 6h16M4 10h16M4 14h7M4 18h7"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode(VIEW_MODES.DETAILED)}
                  className={`p-1.5 rounded transition-all ${viewMode === VIEW_MODES.DETAILED ? 'bg-white shadow text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                  title="Detaljerad vy"
                  aria-label="Växla till detaljerad vy"
                  aria-pressed={viewMode === VIEW_MODES.DETAILED}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 6h16M4 10h16M4 14h7M4 18h7"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Tag Filter */}
            {allTags.length > 0 && showTagFilter && (
              <div className="mb-4 p-3 bg-white border border-gray-200 rounded-lg">
                <div className="flex flex-wrap gap-2 mb-3">
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
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                        selectedTags.includes(tag)
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                      aria-pressed={selectedTags.includes(tag)}
                      aria-label={`Filtrera efter tagg: ${tag}`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                {selectedTags.length > 0 && (
                  <button
                    onClick={() => setSelectedTags([])}
                    className="text-xs text-gray-500 hover:text-gray-700 underline"
                  >
                    Rensa filter
                  </button>
                )}
              </div>
            )}

            {/* Quick Add - Placeholder Recipes */}
            {placeholderRecipes.length > 0 && (
              <>
                <p className="text-xs font-bold text-gray-400 uppercase mb-2">
                  Snabbval
                </p>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {placeholderRecipes.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => addToPlanning(p)}
                      className="flex items-center justify-center gap-2 p-2 bg-white border border-dashed border-gray-300 rounded hover:bg-gray-50 hover:border-blue-400 transition-colors text-sm font-medium text-gray-600"
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
                <hr className="mb-4 border-gray-100" />
              </>
            )}

            {/* Recipe List */}
            <div className="space-y-2 flex-1">
              {filteredRecipes.length === 0 ? (
                <div className="text-center text-gray-400 text-sm mt-4">
                  Inga recept hittades.
                </div>
              ) : (
                filteredRecipes.map((recipe) => (
                  <RecipeListItem
                    key={recipe.id}
                    recipe={recipe}
                    viewMode={viewMode}
                    apiUrl={apiUrl}
                    onView={(r) => setViewingRecipe(r)}
                    onVote={() => onVote(recipe.id)}
                    onAddToPlan={() => addToPlanning(recipe)}
                  />
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* ========== CALENDAR GRID ========== */}
      {mealPlanner && (
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-100">
          {/* Header - Week Navigation */}
          <div className="bg-white p-3 border-b flex justify-between items-center shadow-sm z-10">
            <button
              onClick={onPrevWeek}
              className="p-2 hover:bg-gray-100 rounded text-gray-600 font-bold flex items-center gap-1"
              aria-label="Föregående vecka"
            >
              &lt;{' '}
              <span className="hidden sm:inline">
                V. {format(addDays(currentWeekStart, -7), 'w')}
              </span>
            </button>
            <div className="flex flex-col items-center">
              <span className="text-lg font-bold text-slate-800">
                Vecka {format(currentWeekStart, 'w')}
              </span>
              {!isWeekLocked && (
                <span className="mt-1 text-blue-600 text-xs" title="Redigerar">
                  ✏️ Redigerar
                </span>
              )}
              <button
                onClick={onGoToday}
                className="text-xs text-blue-600 hover:underline font-medium"
                aria-label="Gå till denna vecka"
              >
                Gå till idag
              </button>
            </div>
            <div className="flex gap-2 items-center">
              <button
                onClick={() => {
                  const startStr = format(currentWeekStart, 'yyyy-MM-dd');
                  const url = `/print.html?weekStart=${startStr}`;
                  window.open(url, '_blank');
                }}
                className="px-3 py-2 hover:bg-gray-100 rounded text-gray-600 font-bold no-print"
                title="Öppna utskriftssida"
                aria-label="Öppna utskriftssida"
              >
                🖨️ Skriv ut
              </button>
              <button
                onClick={onNextWeek}
                className="p-2 hover:bg-gray-100 rounded text-gray-600 font-bold flex items-center gap-1"
                aria-label="Nästa vecka"
              >
                <span className="hidden sm:inline">
                  V. {format(addDays(currentWeekStart, 7), 'w')}
                </span>{' '}
                &gt;
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="flex-1 overflow-y-auto p-2 md:p-4">
            <div className="grid grid-cols-1 md:grid-cols-7 gap-2 pb-20">
              {days.map((day) => {
                const isToday = isSameDay(day, new Date());
                return (
                  <DayColumn
                    key={day.toString()}
                    day={day}
                    isToday={isToday}
                    meals={MEALS}
                    peopleKeys={PEOPLE_KEYS}
                    peopleNames={peopleNames}
                    plan={plan}
                    recipes={recipes}
                    selectedBatchId={selectedBatchId}
                    onSlotClick={handleSlotClick}
                    isPlannerLocked={isWeekLocked}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========== MODALS ========== */}
      {viewingRecipe && (
        <RecipeDetails
          recipe={viewingRecipe}
          apiUrl={apiUrl}
          onClose={() => setViewingRecipe(null)}
          onEdit={(recipe) => {
            setEditingRecipe(recipe);
            setViewingRecipe(null);
          }}
        />
      )}

      {editingRecipe && (
        <EditRecipe
          recipe={editingRecipe}
          apiUrl={apiUrl}
          onUpdated={() => {
            setEditingRecipe(null);
            onRefreshRecipes?.();
          }}
          onCancel={() => {
            setEditingRecipe(null);
          }}
        />
      )}
    </div>
  );
}
