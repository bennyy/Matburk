import PlanningTab from './PlanningTab';
import LibraryTab from './LibraryTab';
import { TABS } from './constants';

/**
 * Sidebar - Container for Planning and Library tabs
 */
export default function Sidebar({
  activeTab,
  setActiveTab,
  isSplitMode,
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
      className={`bg-white flex flex-col transition-all ${isSplitMode ? 'w-full md:w-1/3 lg:w-1/4 h-[45vh] md:h-full border-b md:border-b-0 md:border-r' : 'w-full h-full'}`}
    >
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
