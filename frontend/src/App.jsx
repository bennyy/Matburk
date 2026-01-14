import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { startOfWeek, endOfWeek, format, addWeeks, subWeeks } from 'date-fns'; // <--- Nya imports
import PlannerGrid from './components/PlannerGrid';
import AddRecipe from './components/AddRecipe';
import SettingsModal from './components/SettingsModal'; // <--- IMPORTERA

import { Settings } from 'lucide-react'; // Om du vill ha en ikon, annars text

// Kom ihåg att byta till din IP om localhost krånglar i WSL!
const API_URL = 'http://localhost:8000';

function App() {
  const [recipes, setRecipes] = useState([]);
  const [plan, setPlan] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCalendar, setShowCalendar] = useState(true);

  // Håll koll på vilken vecka vi tittar på (startar alltid måndag)
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );

  // --- NYTT: Vi flyttar sorterings-state hit upp ---
  const [sortField, setSortField] = useState('vote');
  const [sortOrder, setSortOrder] = useState('desc');

  const [peopleNames, setPeopleNames] = useState({
    A: 'Person A',
    B: 'Person B',
  }); // <--- NY STATE
  const [showSettings, setShowSettings] = useState(false); // <--- NY STATE

  // --- UPPDATERAD: fetchData använder nu argumenten (eller defaults) ---
  const fetchData = async (field = sortField, order = sortOrder) => {
    try {
      // Vi använder parametrarna som skickas in, så vi alltid får det senaste
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
  };

  // Hämta inställningar vid start
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

  // Uppdatera när veckan byts
  useEffect(() => {
    fetchData(sortField, sortOrder);
  }, [currentWeekStart, sortField, sortOrder]);

  const handleUpdateSlot = async (slotData) => {
    try {
      await axios.post(`${API_URL}/plan`, slotData);
      fetchData();
    } catch (error) {
      console.error('Kunde inte uppdatera plan', error);
    }
  };

  const handleVote = async (id) => {
    await axios.put(`${API_URL}/recipes/${id}/vote`);
    fetchData();
  };

  // När vi sparar ett nytt recept eller uppdaterar, vill vi ladda om med nuvarande sortering
  const handleRefresh = () => {
    fetchData(sortField, sortOrder);
  };

  // --- NYA FUNKTIONER FÖR NAVIGERING ---
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
          {/* INSTÄLLNINGSKNAPP */}
          <button
            onClick={() => setShowSettings(true)}
            className="bg-slate-700 hover:bg-slate-600 p-2 rounded text-white"
            title="Inställningar"
          >
            ⚙️
          </button>

          {/* TOGGLE CALENDAR BUTTON */}
          <button
            onClick={() => setShowCalendar(!showCalendar)}
            className="bg-slate-700 hover:bg-slate-600 p-2 rounded text-white"
            title={showCalendar ? 'Dölj kalender' : 'Visa kalender'}
          >
            {showCalendar ? '▶' : '◀'}
          </button>

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
          // SKICKA NER STATET OCH SETTERS
          sortField={sortField}
          setSortField={setSortField}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          // Vi behöver inte längre onRefreshRecipes för sorteringens skull,
          // men EditRecipe/AddRecipe kan behöva en refresh-funktion.
          onRefreshRecipes={handleRefresh}
          currentWeekStart={currentWeekStart}
          onNextWeek={nextWeek}
          onPrevWeek={prevWeek}
          onGoToday={goToday}
          peopleNames={peopleNames} // <--- SKICKA NER HÄR
          showCalendar={showCalendar}
          setShowCalendar={setShowCalendar}
        />
      </main>
    </div>
  );
}

export default App;
