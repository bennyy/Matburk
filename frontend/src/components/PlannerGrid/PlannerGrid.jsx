import { useState, useEffect, useCallback } from 'react';
import { format, addDays, isSameDay } from 'date-fns';
import axios from 'axios';
import { Calendar, ClipboardList, BookOpen, LayoutGrid } from 'lucide-react';

import RecipeDetails from '../RecipeDetails';
import EditRecipe from '../EditRecipe';

import DayColumn from './DayColumn';
import Sidebar from './Sidebar';
import WeekNavigation from './WeekNavigation';
import { PEOPLE_KEYS, VIEW_MODES, TABS, MOBILE_VIEWS } from './constants';
import { useWeekLock, useDayExtras, useMealBatches } from './hooks';

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
}) {
  // ========== STATE MANAGEMENT ==========
  const [activeTab, setActiveTab] = useState(TABS.PLANNING);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [showTagFilter, setShowTagFilter] = useState(false);
  const [viewingRecipe, setViewingRecipe] = useState(null);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [viewMode, setViewMode] = useState(VIEW_MODES.COMPACT);
  const [meals, setMeals] = useState([]);
  const [mobileView, setMobileView] = useState(MOBILE_VIEWS.PLANNER);

  // Custom hooks for complex state management
  const { isWeekLocked, toggleWeekLock } = useWeekLock(currentWeekStart);
  const { dayExtras, addExtra, removeExtra } = useDayExtras(currentWeekStart);
  const {
    batches,
    selectedBatchId,
    setSelectedBatchId,
    addToPlanning,
    updateBatchPortions,
    removeFromPlanning,
    getAllocatedCount,
  } = useMealBatches(recipes, plan, currentWeekStart);

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

  // ========== HANDLERS ==========
  /**
   * Handle adding a recipe to planning and switch to planning tab
   */
  const handleAddToPlanning = useCallback(
    (recipe) => {
      addToPlanning(recipe);
      setActiveTab(TABS.PLANNING);
      if (
        mobileView === MOBILE_VIEWS.LIBRARY ||
        mobileView === MOBILE_VIEWS.CALENDAR
      ) {
        setMobileView(MOBILE_VIEWS.PLANNING);
      }
      setSearchQuery('');
    },
    [addToPlanning, mobileView]
  );

  const handleSetActiveTab = useCallback(
    (tab) => {
      setActiveTab(tab);
      if (mobileView === MOBILE_VIEWS.PLANNER) return;
      if (tab === TABS.PLANNING) {
        setMobileView(MOBILE_VIEWS.PLANNING);
      } else if (tab === TABS.LIBRARY) {
        setMobileView(MOBILE_VIEWS.LIBRARY);
      }
    },
    [mobileView]
  );

  /**
   * Handle removing a recipe from planning
   */
  const handleRemoveFromPlanning = useCallback(
    (e, id) => {
      removeFromPlanning(e, id, onUpdateSlot);
    },
    [removeFromPlanning, onUpdateSlot]
  );

  /**
   * Toggle recipe allocation in a specific time slot
   */
  const handleSlotClick = useCallback(
    (date, meal, person) => {
      if (isWeekLocked) return;

      const dateStr = format(date, 'yyyy-MM-dd');
      const isExtra = meal.meal_type_id !== undefined;
      const mealTypeId = isExtra ? meal.meal_type_id : meal.id;
      const extraId = isExtra ? meal.id : null;

      const existingSlot = plan.find(
        (p) =>
          p.plan_date === dateStr &&
          p.meal_type_id === mealTypeId &&
          p.extra_id === extraId &&
          p.person === person
      );

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
   * Handle adding an extra meal to a day
   */
  const handleAddExtra = useCallback(
    (date, presetName) => {
      addExtra(date, presetName, meals);
    },
    [addExtra, meals]
  );

  /**
   * Handle removing an extra meal from a day
   */
  const handleRemoveExtra = useCallback(
    (date, extraId) => {
      removeExtra(date, extraId, plan, onUpdateSlot);
    },
    [removeExtra, plan, onUpdateSlot]
  );

  // ========== RENDER ==========
  const showSidebar =
    mobileView === MOBILE_VIEWS.PLANNING ||
    mobileView === MOBILE_VIEWS.LIBRARY ||
    mobileView === MOBILE_VIEWS.PLANNER;

  const showCalendar =
    mobileView === MOBILE_VIEWS.CALENDAR || mobileView === MOBILE_VIEWS.PLANNER;

  const isSplitMode = mobileView === MOBILE_VIEWS.PLANNER;

  const setViewCalendar = () => setMobileView(MOBILE_VIEWS.CALENDAR);
  const setViewPlanning = () => {
    setActiveTab(TABS.PLANNING);
    setMobileView(MOBILE_VIEWS.PLANNING);
  };
  const setViewLibrary = () => {
    setActiveTab(TABS.LIBRARY);
    setMobileView(MOBILE_VIEWS.LIBRARY);
  };
  const setViewPlanner = () => setMobileView(MOBILE_VIEWS.PLANNER);

  return (
    <div className="flex flex-col h-full relative pb-20 md:pb-0">
      {/* ========== DESKTOP VIEW SWITCHER ========== */}
      <div className="hidden md:grid bg-white border-b border-slate-200 px-2 py-2 grid-cols-4 gap-2">
        <button
          onClick={setViewCalendar}
          className={`py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${mobileView === MOBILE_VIEWS.CALENDAR ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}
          aria-pressed={mobileView === MOBILE_VIEWS.CALENDAR}
        >
          <Calendar className="w-4 h-4" />
          Kalender
        </button>
        <button
          onClick={setViewPlanning}
          className={`py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${mobileView === MOBILE_VIEWS.PLANNING ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}
          aria-pressed={mobileView === MOBILE_VIEWS.PLANNING}
        >
          <ClipboardList className="w-4 h-4" />
          Veckoplan
        </button>
        <button
          onClick={setViewLibrary}
          className={`py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${mobileView === MOBILE_VIEWS.LIBRARY ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}
          aria-pressed={mobileView === MOBILE_VIEWS.LIBRARY}
        >
          <BookOpen className="w-4 h-4" />
          Recept
        </button>
        <button
          onClick={setViewPlanner}
          className={`py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${mobileView === MOBILE_VIEWS.PLANNER ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}
          aria-pressed={mobileView === MOBILE_VIEWS.PLANNER}
        >
          <LayoutGrid className="w-4 h-4" />
          Planner
        </button>
      </div>

      {/* ========== MOBILE BOTTOM NAVIGATION ========== */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur border-t border-slate-200 pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-4 gap-1 px-2 py-2">
          <button
            onClick={setViewCalendar}
            className={`py-2 rounded-lg text-[11px] font-semibold transition-all flex flex-col items-center justify-center gap-1 border-t-2 ${mobileView === MOBILE_VIEWS.CALENDAR ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'text-slate-700 border-transparent hover:bg-slate-100'}`}
            aria-pressed={mobileView === MOBILE_VIEWS.CALENDAR}
          >
            <Calendar className="w-4 h-4" />
            Kalender
          </button>
          <button
            onClick={setViewPlanning}
            className={`py-2 rounded-lg text-[11px] font-semibold transition-all flex flex-col items-center justify-center gap-1 border-t-2 ${mobileView === MOBILE_VIEWS.PLANNING ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'text-slate-700 border-transparent hover:bg-slate-100'}`}
            aria-pressed={mobileView === MOBILE_VIEWS.PLANNING}
          >
            <ClipboardList className="w-4 h-4" />
            Veckoplan
          </button>
          <button
            onClick={setViewLibrary}
            className={`py-2 rounded-lg text-[11px] font-semibold transition-all flex flex-col items-center justify-center gap-1 border-t-2 ${mobileView === MOBILE_VIEWS.LIBRARY ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'text-slate-700 border-transparent hover:bg-slate-100'}`}
            aria-pressed={mobileView === MOBILE_VIEWS.LIBRARY}
          >
            <BookOpen className="w-4 h-4" />
            Recept
          </button>
          <button
            onClick={setViewPlanner}
            className={`py-2 rounded-lg text-[11px] font-semibold transition-all flex flex-col items-center justify-center gap-1 border-t-2 ${mobileView === MOBILE_VIEWS.PLANNER ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'text-slate-700 border-transparent hover:bg-slate-100'}`}
            aria-pressed={mobileView === MOBILE_VIEWS.PLANNER}
          >
            <LayoutGrid className="w-4 h-4" />
            Planner
          </button>
        </div>
      </nav>

      {isSplitMode ? (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          <Sidebar
            activeTab={activeTab}
            setActiveTab={handleSetActiveTab}
            isSplitMode={isSplitMode}
            batches={batches}
            currentWeekStart={currentWeekStart}
            selectedBatchId={selectedBatchId}
            setSelectedBatchId={setSelectedBatchId}
            getAllocatedCount={getAllocatedCount}
            updateBatchPortions={updateBatchPortions}
            removeFromPlanning={handleRemoveFromPlanning}
            isWeekLocked={isWeekLocked}
            toggleWeekLock={toggleWeekLock}
            filteredRecipes={filteredRecipes}
            placeholderRecipes={placeholderRecipes}
            allTags={allTags}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedTags={selectedTags}
            setSelectedTags={setSelectedTags}
            showTagFilter={showTagFilter}
            setShowTagFilter={setShowTagFilter}
            sortField={sortField}
            setSortField={setSortField}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
            viewMode={viewMode}
            setViewMode={setViewMode}
            apiUrl={apiUrl}
            onAddToPlan={handleAddToPlanning}
            onViewRecipe={setViewingRecipe}
            onVote={onVote}
          />

          {showCalendar && (
            <div className="flex-1 flex flex-col overflow-hidden bg-slate-100">
              <WeekNavigation
                currentWeekStart={currentWeekStart}
                onPrevWeek={onPrevWeek}
                onNextWeek={onNextWeek}
                onGoToday={onGoToday}
                isWeekLocked={isWeekLocked}
              />

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
                        onRemoveExtra={(extraId) =>
                          handleRemoveExtra(day, extraId)
                        }
                        planId={planId}
                        apiUrl={apiUrl}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-hidden">
          {showCalendar ? (
            <div className="h-full flex flex-col overflow-hidden bg-slate-100">
              <WeekNavigation
                currentWeekStart={currentWeekStart}
                onPrevWeek={onPrevWeek}
                onNextWeek={onNextWeek}
                onGoToday={onGoToday}
                isWeekLocked={isWeekLocked}
              />

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
                        onRemoveExtra={(extraId) =>
                          handleRemoveExtra(day, extraId)
                        }
                        planId={planId}
                        apiUrl={apiUrl}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            showSidebar && (
              <Sidebar
                activeTab={activeTab}
                setActiveTab={handleSetActiveTab}
                isSplitMode={false}
                batches={batches}
                currentWeekStart={currentWeekStart}
                selectedBatchId={selectedBatchId}
                setSelectedBatchId={setSelectedBatchId}
                getAllocatedCount={getAllocatedCount}
                updateBatchPortions={updateBatchPortions}
                removeFromPlanning={handleRemoveFromPlanning}
                isWeekLocked={isWeekLocked}
                toggleWeekLock={toggleWeekLock}
                filteredRecipes={filteredRecipes}
                placeholderRecipes={placeholderRecipes}
                allTags={allTags}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                selectedTags={selectedTags}
                setSelectedTags={setSelectedTags}
                showTagFilter={showTagFilter}
                setShowTagFilter={setShowTagFilter}
                sortField={sortField}
                setSortField={setSortField}
                sortOrder={sortOrder}
                setSortOrder={setSortOrder}
                viewMode={viewMode}
                setViewMode={setViewMode}
                apiUrl={apiUrl}
                onAddToPlan={handleAddToPlanning}
                onViewRecipe={setViewingRecipe}
                onVote={onVote}
              />
            )
          )}
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
