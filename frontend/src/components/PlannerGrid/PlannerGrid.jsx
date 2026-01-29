import { useState, useEffect, useCallback } from 'react';
import { format, addDays, isSameDay } from 'date-fns';
import axios from 'axios';
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
  planId,
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
  const [meals, setMeals] = useState([]);
  const [extraPresets, setExtraPresets] = useState([]);

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

  // Extras management - per day extras
  const [dayExtras, setDayExtras] = useState(() => {
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line no-undef
      const stored = localStorage.getItem(`dayExtras_${weekKey}`);
      return stored ? JSON.parse(stored) : {};
    }
    return {};
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
   * Fetch meal types from backend
   */
  useEffect(() => {
    const fetchMealTypes = async () => {
      try {
        const response = await axios.get(
          `${apiUrl}/plans/${planId}/meal-types`
        );
        if (response.data) {
          setMeals(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch meal types:', error);
        // Fallback to defaults
        setMeals([
          { id: 1, name: 'LUNCH', is_standard: true },
          { id: 2, name: 'DINNER', is_standard: true },
        ]);
      }
    };

    if (planId && apiUrl) {
      fetchMealTypes();
    }
  }, [planId, apiUrl]);

  /**
   * Reset extras for new week - check localStorage for saved extras
   */
  useEffect(() => {
    setSelectedBatchId(null);
    setBatches([]);
    // Reset extras for new week - check localStorage for saved extras
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line no-undef
      const stored = localStorage.getItem(`dayExtras_${weekKey}`);
      setDayExtras(stored ? JSON.parse(stored) : {});
    }
  }, [currentWeekStart, weekKey]);

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
   * Persist extras to localStorage whenever they change
   */
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line no-undef
      localStorage.setItem(`dayExtras_${weekKey}`, JSON.stringify(dayExtras));
    }
  }, [dayExtras, weekKey]);

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

      // Handle both regular meals (objects with id, name) and extras (objects with meal_type_id)
      const isExtra = meal.meal_type_id !== undefined;
      const mealTypeId = isExtra ? meal.meal_type_id : meal.id;
      const extraId = isExtra ? meal.id : null; // Only set for extras

      const existingSlot = plan.find(
        (p) =>
          p.plan_date === dateStr &&
          p.meal_type_id === mealTypeId &&
          p.extra_id === extraId &&
          p.person === person
      );

      // If a batch is selected, toggle its presence in this slot
      if (selectedBatchId) {
        const isAlreadyAllocated =
          existingSlot && existingSlot.recipe_id === selectedBatchId;

        const updatePayload = {
          plan_date: dateStr,
          meal_type_id: mealTypeId,
          extra_id: extraId,
          person: person,
          recipe_id: isAlreadyAllocated ? null : selectedBatchId,
        };
        onUpdateSlot(updatePayload);
      } else {
        // If no batch selected, clear the slot
        const updatePayload = {
          plan_date: dateStr,
          meal_type_id: mealTypeId,
          extra_id: extraId,
          person: person,
          recipe_id: null,
        };
        onUpdateSlot(updatePayload);
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

  /**
   * Add a new extra meal to a day
   */
  const handleAddExtra = useCallback(
    (date, presetName) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayExtrasArray = dayExtras[dateStr] || [];

      // Find the meal type in the meals list that matches this preset
      let mealTypeId = null;
      const mealType = meals.find(
        (m) => !m.is_standard && m.name === presetName
      );

      if (mealType) {
        mealTypeId = mealType.id;
      } else {
        // Fallback: create a temporary meal type or find by alternate matching
        // Try to find ANY non-standard meal type as fallback (shouldn't happen)
        const anyExtra = meals.find((m) => !m.is_standard);
        if (anyExtra) {
          mealTypeId = anyExtra.id;
        }
      }

      if (!mealTypeId) {
        return;
      }

      // Count existing extras with same meal type on this day
      const countSameType = dayExtrasArray.filter(
        (e) => e.meal_type_id === mealTypeId
      ).length;

      // Generate a unique local ID for UI display: "snack_1", "mellanmål_2", etc.
      const localExtraId = `${presetName.toLowerCase()}_${countSameType + 1}`;

      const newExtra = {
        id: localExtraId,
        meal_type_id: mealTypeId, // Store the actual database ID
        preset_name: presetName,
        name: presetName,
      };

      setDayExtras((prev) => ({
        ...prev,
        [dateStr]: [...dayExtrasArray, newExtra],
      }));
    },
    [dayExtras, meals]
  );

  /**
   * Remove an extra meal from a day
   * Clears all slots for that extra
   */
  const handleRemoveExtra = useCallback(
    (date, extraId) => {
      const dateStr = format(date, 'yyyy-MM-dd');

      // Clear all plan slots with this specific extra
      plan.forEach((slot) => {
        if (slot.plan_date === dateStr && slot.extra_id === extraId) {
          onUpdateSlot({
            plan_date: slot.plan_date,
            meal_type_id: slot.meal_type_id,
            extra_id: slot.extra_id,
            person: slot.person,
            recipe_id: null,
          });
        }
      });

      // Remove the extra from state
      setDayExtras((prev) => ({
        ...prev,
        [dateStr]: (prev[dateStr] || []).filter(
          (extra) => extra.id !== extraId
        ),
      }));
    },
    [plan, onUpdateSlot]
  );

  // ========== RENDER ==========
  return (
    <div className="flex flex-col md:flex-row h-full relative">
      {/* ========== SIDEBAR ========== */}
      <div
        className={`bg-white flex flex-col transition-all ${mealPlanner ? 'w-full md:w-1/3 lg:w-1/4 h-[40vh] md:h-full border-b md:border-b-0 md:border-r' : 'w-full h-full border-r'}`}
      >
        {/* Tab Navigation with Toggle Button */}
        <div className="flex border-b bg-gray-50 items-center justify-between">
          <div className="flex flex-1">
            <button
              onClick={() => setActiveTab(TABS.PLANNING)}
              aria-selected={activeTab === TABS.PLANNING}
              className={`flex-1 py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm font-semibold transition-all relative ${activeTab === TABS.PLANNING ? 'bg-white text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
            >
              <span className="flex items-center justify-center gap-1 md:gap-2">
                <svg
                  className="w-4 h-4 md:w-5 md:h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                <span>Veckoplan</span>
              </span>
              {activeTab === TABS.PLANNING && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab(TABS.LIBRARY)}
              aria-selected={activeTab === TABS.LIBRARY}
              className={`flex-1 py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm font-semibold transition-all relative ${activeTab === TABS.LIBRARY ? 'bg-white text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
            >
              <span className="flex items-center justify-center gap-1 md:gap-2">
                <svg
                  className="w-4 h-4 md:w-5 md:h-5"
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
                <span>Recept</span>
              </span>
              {activeTab === TABS.LIBRARY && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
              )}
            </button>
          </div>
          <button
            onClick={() => setMealPlanner(!mealPlanner)}
            className="p-1.5 md:p-2 hover:bg-gray-100 rounded-lg text-gray-600 font-semibold transition-all flex-shrink-0"
            title={mealPlanner ? 'Dölj kalender' : 'Visa kalender'}
            aria-label={mealPlanner ? 'Dölj kalender' : 'Visa kalender'}
          >
            <svg
              className="w-4 h-4 md:w-5 md:h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={mealPlanner ? 'M9 5l7 7-7 7' : 'M15 19l-7-7 7-7'}
              />
            </svg>
          </button>
        </div>

        {/* Planning Tab - Meal Batches */}
        {activeTab === TABS.PLANNING && (
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 flex flex-col">
            {/* Edit Mode Toggle */}
            <div className="mb-4">
              <button
                onClick={handleToggleWeekLock}
                className={`w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all shadow-sm flex items-center justify-center gap-2 ${
                  isWeekLocked
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-md'
                    : 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 shadow-md'
                }`}
                title={isWeekLocked ? 'Redigera veckan' : 'Avsluta redigering'}
              >
                {isWeekLocked ? (
                  <>
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
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    Redigera veckan
                  </>
                ) : (
                  <>
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
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Klar med redigering
                  </>
                )}
              </button>
            </div>

            {batches.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center text-gray-400 mt-10 py-8 px-4 bg-white rounded-xl border border-dashed border-gray-200">
                <svg
                  className="w-16 h-16 mb-4 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                <p className="text-sm font-semibold mb-2">
                  Inga matlådor denna vecka
                </p>
                <button
                  onClick={() => setActiveTab(TABS.LIBRARY)}
                  className="text-blue-600 hover:text-blue-700 font-semibold mt-2 flex items-center gap-1 text-sm"
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
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Hämta från biblioteket
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-white rounded-lg px-3 py-2 border border-gray-200 shadow-sm">
                  <p className="text-xs text-gray-500 font-semibold text-center flex items-center justify-center gap-2">
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
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    Vecka {format(currentWeekStart, 'w')}
                  </p>
                </div>
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
                              <svg
                                className="w-3 h-3"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
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
                            removeFromPlanning(e, batch.recipeId);
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
                        <span className="text-xs text-gray-600 font-semibold">
                          Planerat:
                        </span>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isWeekLocked) return;
                              updateBatchPortions(batch.recipeId, -1);
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
                              updateBatchPortions(batch.recipeId, 1);
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
                            <svg
                              className="w-4 h-4"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
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
                            <svg
                              className="w-4 h-4"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
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
                            <svg
                              className="w-4 h-4"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
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
                })}
              </div>
            )}
          </div>
        )}

        {/* Library Tab - Recipe Browser */}
        {activeTab === TABS.LIBRARY && (
          <div className="flex-1 overflow-y-auto p-3 bg-gray-50 flex flex-col">
            {/* Search Bar - Full width */}
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

            {/* Controls Row - Sort, View Mode, Tags */}
            <div className="mb-3 flex gap-2">
              {/* Sort Dropdown - Takes more space */}
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
                      onClick={() => addToPlanning(p)}
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
          <div className="bg-blue-600 px-2 md:px-4 py-2 md:py-3 border-b border-blue-700 flex justify-between items-center shadow-md z-10">
            <button
              onClick={onPrevWeek}
              className="p-1.5 md:p-2 hover:bg-white/20 rounded-lg text-white font-semibold flex items-center gap-1 transition-all"
              aria-label="Föregående vecka"
            >
              <svg
                className="w-4 h-4 md:w-5 md:h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              <span className="hidden sm:inline text-xs md:text-sm">
                V. {format(addDays(currentWeekStart, -7), 'w')}
              </span>
            </button>
            <div className="flex flex-col items-center text-white gap-0.5">
              <span className="text-lg md:text-xl font-bold flex items-center gap-1.5">
                <svg
                  className="w-4 h-4 md:w-5 md:h-5"
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
                <span>Vecka {format(currentWeekStart, 'w')}</span>
              </span>
              {!isWeekLocked && (
                <span className="bg-white/20 px-2 md:px-3 py-0.5 md:py-1 rounded-full text-[11px] md:text-xs font-semibold flex items-center gap-1">
                  <svg
                    className="w-2.5 h-2.5 md:w-3 md:h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  <span>Redigerar</span>
                </span>
              )}
              <button
                onClick={onGoToday}
                className="text-[10px] md:text-xs text-blue-100 hover:text-white hover:underline font-semibold transition-all leading-tight"
                aria-label="Gå till denna vecka"
              >
                Idag
              </button>
            </div>
            <div className="flex gap-1 md:gap-2 items-center">
              <button
                onClick={() => {
                  const startStr = format(currentWeekStart, 'yyyy-MM-dd');
                  const url = `/print.html?weekStart=${startStr}`;
                  window.open(url, '_blank');
                }}
                className="p-1.5 md:p-2 hover:bg-white/20 rounded-lg text-white font-semibold no-print flex items-center gap-1 transition-all"
                title="Öppna utskriftssida"
                aria-label="Öppna utskriftssida"
              >
                <svg
                  className="w-4 h-4 md:w-5 md:h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                  />
                </svg>
                <span className="hidden sm:inline text-xs md:text-sm">
                  Skriv ut
                </span>
              </button>
              <button
                onClick={onNextWeek}
                className="p-1.5 md:p-2 hover:bg-white/20 rounded-lg text-white font-semibold flex items-center gap-1 transition-all"
                aria-label="Nästa vecka"
              >
                <span className="hidden sm:inline text-xs md:text-sm">
                  V. {format(addDays(currentWeekStart, 7), 'w')}
                </span>
                <svg
                  className="w-4 h-4 md:w-5 md:h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="flex-1 overflow-y-auto overflow-x-auto p-2 md:p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 pb-20 items-start">
              {days.map((day) => {
                const isToday = isSameDay(day, new Date());
                const dateStr = format(day, 'yyyy-MM-dd');
                const dayExtrasList = dayExtras[dateStr] || [];

                return (
                  <DayColumn
                    key={day.toString()}
                    day={day}
                    isToday={isToday}
                    meals={meals}
                    peopleKeys={PEOPLE_KEYS}
                    peopleNames={peopleNames}
                    plan={plan}
                    recipes={recipes}
                    selectedBatchId={selectedBatchId}
                    onSlotClick={handleSlotClick}
                    isPlannerLocked={isWeekLocked}
                    extras={dayExtrasList}
                    onAddExtra={handleAddExtra}
                    onRemoveExtra={(extraId) => handleRemoveExtra(day, extraId)}
                    planId={planId}
                    apiUrl={apiUrl}
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
          planId={planId}
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
