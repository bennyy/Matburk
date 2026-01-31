import { TABS } from './constants';
import PlanningTab from './PlanningTab';
import LibraryTab from './LibraryTab';

/**
 * Sidebar - Container for Planning and Library tabs
 */
export default function Sidebar({
  activeTab,
  setActiveTab,
  mealPlanner,
  setMealPlanner,
  // Planning tab props
  batches,
  currentWeekStart,
  selectedBatchId,
  setSelectedBatchId,
  getAllocatedCount,
  updateBatchPortions,
  removeFromPlanning,
  isWeekLocked,
  toggleWeekLock,
  // Library tab props
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

      {/* Tab Content */}
      {activeTab === TABS.PLANNING && (
        <PlanningTab
          batches={batches}
          currentWeekStart={currentWeekStart}
          selectedBatchId={selectedBatchId}
          setSelectedBatchId={setSelectedBatchId}
          getAllocatedCount={getAllocatedCount}
          updateBatchPortions={updateBatchPortions}
          removeFromPlanning={removeFromPlanning}
          isWeekLocked={isWeekLocked}
          toggleWeekLock={toggleWeekLock}
          setActiveTab={setActiveTab}
        />
      )}

      {activeTab === TABS.LIBRARY && (
        <LibraryTab
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
          onAddToPlan={onAddToPlan}
          onViewRecipe={onViewRecipe}
          onVote={onVote}
        />
      )}
    </div>
  );
}
