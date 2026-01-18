import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { startOfWeek, endOfWeek, format, addWeeks, subWeeks } from 'date-fns';
import PlannerGrid from './components/PlannerGrid';
import AddRecipe from './components/AddRecipe';
import SettingsModal from './components/SettingsModal';

// removed unused `Settings` import from lucide-react

/**
 * App - top-level application component for the meal planner.
 *
 * Responsibilities:
 * - Fetch recipes and weekly plan from the backend
 * - Maintain app-level state (recipes, plan, UI modals)
 * - Provide handlers to child components for updating the plan
 *
 * Note: API_URL uses /api path which is routed by nginx reverse proxy.
 */
const API_URL = import.meta.env.VITE_API_URL || '/api';

function App() {
  const [recipes, setRecipes] = useState([]);
  const [plan, setPlan] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [mealPlanner, setMealPlanner] = useState(true);

  // Current week's start date (Monday is start of week)
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );

  // Sorting state for the recipe list
  const [sortField, setSortField] = useState('total_meals');
  const [sortOrder, setSortOrder] = useState('desc');

  const [peopleNames, setPeopleNames] = useState({
    A: 'Person A',
    B: 'Person B',
  });
  const [showSettings, setShowSettings] = useState(false);

  /**
   * fetchData - load recipes and the plan for the current week.
   * @param {string} field sort field (defaults to `sortField`)
   * @param {string} order sort order (defaults to `sortOrder`)
   */
  const fetchData = useCallback(
    async (field = sortField, order = sortOrder) => {
      try {
        const recipeRes = await axios.get(
          `${API_URL}/recipes?sort_by=${field}&sort_order=${order}`
        );
        setRecipes(recipeRes.data);

        const startStr = format(currentWeekStart, 'yyyy-MM-dd');
        const endStr = format(
          endOfWeek(currentWeekStart, { weekStartsOn: 1 }),
          'yyyy-MM-dd'
        );

        const planRes = await axios.get(
          `${API_URL}/plan?start_date=${startStr}&end_date=${endStr}`
        );
        setPlan(planRes.data);
      } catch (error) {
        console.error('Error fetching data', error);
      }
    },
    [currentWeekStart, sortField, sortOrder]
  );

  // Load settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get(`${API_URL}/settings`);
        setPeopleNames({ A: res.data.name_A, B: res.data.name_B });
      } catch (error) {
        console.error('Kunde inte hämta inställningar', error);
      }
    };
    fetchSettings();
  }, []);

  // Reload data whenever `fetchData` changes (covers week and sorting)
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /**
   * Update one plan slot on the backend and refresh local data.
   * @param {Object} slotData slot payload for the API
   */
  const handleUpdateSlot = async (slotData) => {
    try {
      await axios.post(`${API_URL}/plan`, slotData);
      fetchData();
    } catch (error) {
      console.error('Kunde inte uppdatera plan', error);
    }
  };

  /**
   * Increment vote count for a recipe and refresh recipes.
   * @param {number} id recipe id
   */
  const handleVote = async (id) => {
    await axios.put(`${API_URL}/recipes/${id}/vote`);
    fetchData();
  };

  // Refresh recipes and plan with current sorting
  const handleRefresh = () => {
    fetchData(sortField, sortOrder);
  };

  // Week navigation helpers
  const nextWeek = () => setCurrentWeekStart(addWeeks(currentWeekStart, 1));
  const prevWeek = () => setCurrentWeekStart(subWeeks(currentWeekStart, 1));
  const goToday = () =>
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));

  return (
    <div className="h-screen flex flex-col font-sans text-gray-800">
      <header className="bg-slate-800 text-white p-4 flex justify-between items-center shadow-md z-10">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold hidden md:block">
            Hemmets Matplanerare
          </h1>
          <h1 className="text-xl font-bold md:hidden">Matplan</h1>
        </div>

        <div className="flex gap-2">
          {/* Settings button */}
          <button
            onClick={() => setShowSettings(true)}
            className="bg-slate-700 hover:bg-slate-600 p-2 rounded text-white"
            title="Inställningar"
          >
            ⚙️
          </button>

          {/* Toggle meal planner */}
          <button
            onClick={() => setMealPlanner(!mealPlanner)}
            className="bg-slate-700 hover:bg-slate-600 p-2 rounded text-white"
            title={mealPlanner ? 'Dölj kalender' : 'Visa kalender'}
          >
            {mealPlanner ? '▶' : '◀'}
          </button>

          {/* Add receipe button */}
          <button
            onClick={() => setShowAddModal(!showAddModal)}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded font-bold text-sm"
          >
            {showAddModal ? 'Stäng' : '+ Recept'}
          </button>
        </div>
      </header>

      {showAddModal && (
        <div className="bg-white border-b p-4 animate-in slide-in-from-top-10">
          <AddRecipe
            onAdded={() => {
              setShowAddModal(false);
              fetchData();
            }}
            apiUrl={API_URL}
          />
        </div>
      )}

      {showSettings && (
        <SettingsModal
          currentNames={peopleNames}
          apiUrl={API_URL}
          onClose={() => setShowSettings(false)}
          onSave={(newNames) => setPeopleNames(newNames)}
        />
      )}

      <main className="flex-1 overflow-hidden">
        <PlannerGrid
          recipes={recipes}
          plan={plan}
          onUpdateSlot={handleUpdateSlot}
          apiUrl={API_URL}
          onVote={handleVote}
          sortField={sortField}
          setSortField={setSortField}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          onRefreshRecipes={handleRefresh}
          currentWeekStart={currentWeekStart}
          onNextWeek={nextWeek}
          onPrevWeek={prevWeek}
          onGoToday={goToday}
          peopleNames={peopleNames}
          mealPlanner={mealPlanner}
          setMealPlanner={setMealPlanner}
        />
      </main>
    </div>
  );
}

export default App;
