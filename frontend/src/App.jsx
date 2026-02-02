import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { startOfWeek, endOfWeek, format, addWeeks, subWeeks } from 'date-fns';
import { Plus, Settings, X } from 'lucide-react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { SignIn } from '@clerk/clerk-react';
import PlannerGrid from './components/PlannerGrid';
import AddRecipe from './components/AddRecipe';
import PlanSettingsModal from './components/PlanSettingsModal';

const API_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * App - Main meal planner application
 *
 * Now supports multiple meal plans per user with:
 * - Plan selection/creation
 * - Plan sharing with permission levels
 * - Per-plan recipes and meal slots
 */
function App() {
  // Clerk auth hooks
  const { getToken } = useAuth();
  const { user: clerkUser, isLoaded, isSignedIn } = useUser();

  // Auth state
  const [user, setUser] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [joinMessage, setJoinMessage] = useState(null);

  // Plan management
  const [mealPlans, setMealPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState(() => {
    // Load saved plan from localStorage on mount
    const saved = localStorage.getItem('selectedPlanId');
    return saved ? parseInt(saved, 10) : null;
  });
  const [showPlanSettings, setShowPlanSettings] = useState(false);

  // Recipe and meal data
  const [recipes, setRecipes] = useState([]);
  const [plan, setPlan] = useState([]);

  // UI state
  const [showAddModal, setShowAddModal] = useState(false);
  const [mealPlanner, setMealPlanner] = useState(true);

  // Week navigation
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );

  // Sorting
  const [sortField, setSortField] = useState('total_meals');
  const [sortOrder, setSortOrder] = useState('desc');

  // Settings
  const [peopleNames, setPeopleNames] = useState({
    A: 'Person A',
    B: 'Person B',
  });

  // Fetch list of user's meal plans
  const fetchMealPlans = useCallback(async () => {
    try {
      const token = await getToken();
      if (token) {
        axios.defaults.headers.common.Authorization = `Bearer ${token}`;
      }
      const res = await axios.get(`${API_URL}/plans`);
      setMealPlans(res.data);

      // Auto-select first plan if available
      const currentExists = res.data.some((p) => p.id === selectedPlanId);
      if (res.data.length > 0 && (!selectedPlanId || !currentExists)) {
        setSelectedPlanId(res.data[0].id);
      }
      if (res.data.length === 0) {
        setSelectedPlanId(null);
      }
    } catch (error) {
      console.error('Kunde inte hämta planer', error);
    }
  }, [selectedPlanId, getToken]);

  // Save selected plan to localStorage whenever it changes
  useEffect(() => {
    if (selectedPlanId !== null) {
      localStorage.setItem('selectedPlanId', selectedPlanId.toString());
    }
  }, [selectedPlanId]);

  // Clerk auth effect - handle authentication and token setup
  useEffect(() => {
    const setupAuth = async () => {
      if (!isLoaded) return;

      if (isSignedIn && clerkUser) {
        try {
          // Get Clerk token and set up axios header
          const token = await getToken();
          if (token) {
            axios.defaults.headers.common.Authorization = `Bearer ${token}`;
          }

          // Set user state
          setUser({
            uid: clerkUser.id,
            email:
              clerkUser.emailAddresses?.[0]?.emailAddress || clerkUser.username,
          });

          // Register user and load plans
          try {
            await axios.post(`${API_URL}/auth/register`);
            await fetchMealPlans();
          } catch (error) {
            console.error('Failed to register/load plans:', error);
          }
        } catch (error) {
          console.error('Auth setup error:', error);
          setAuthError('Inloggningsfel. Försök igen.');
        }
      } else {
        // User is not signed in
        delete axios.defaults.headers.common.Authorization;
        setUser(null);
        setMealPlans([]);
        setSelectedPlanId(null);
        setAuthError(null);
      }
    };

    setupAuth();
  }, [isLoaded, isSignedIn, clerkUser, getToken, fetchMealPlans]);

  // Handle deep-link join: /join/<token>
  useEffect(() => {
    if (!user) return;
    const match = window.location.pathname.match(/^\/join\/([A-Za-z0-9_-]+)$/);
    if (!match) return;

    const token = match[1];
    setJoinMessage('Går med i plan...');
    (async () => {
      try {
        const res = await axios.post(
          `${API_URL}/plans/join?share_code=${encodeURIComponent(token)}`
        );
        // Refresh plans and select the joined plan
        await fetchMealPlans();
        const joinedId = Number(res.data?.plan_id);
        if (!Number.isNaN(joinedId)) {
          setSelectedPlanId(joinedId);
        }
        setJoinMessage('Du har gått med i planen.');
      } catch (err) {
        const msg = err?.response?.data?.detail || 'Kunde inte gå med i plan';
        setJoinMessage(msg);
      } finally {
        // Clear join path so normal app renders
        window.history.replaceState(null, '', '/');
        // Hide message after a short delay
        window.setTimeout(() => setJoinMessage(null), 3500);
      }
    })();
  }, [user, fetchMealPlans]);

  // Fetch recipes for selected plan
  const fetchRecipes = useCallback(
    async (field = sortField, order = sortOrder) => {
      if (!selectedPlanId) return;

      try {
        const res = await axios.get(
          `${API_URL}/plans/${selectedPlanId}/recipes?sort_by=${field}&sort_order=${order}`
        );
        setRecipes(res.data);
      } catch (error) {
        console.error('Kunde inte hämta recept', error);
      }
    },
    [selectedPlanId, sortField, sortOrder]
  );

  // Fetch meal plan slots for selected plan
  const fetchPlanSlots = useCallback(async () => {
    if (!selectedPlanId) return;

    try {
      const startStr = format(currentWeekStart, 'yyyy-MM-dd');
      const endStr = format(
        endOfWeek(currentWeekStart, { weekStartsOn: 1 }),
        'yyyy-MM-dd'
      );

      const res = await axios.get(
        `${API_URL}/plans/${selectedPlanId}/plan?start_date=${startStr}&end_date=${endStr}`
      );
      setPlan(res.data);
    } catch (error) {
      console.error('Kunde inte hämta planslots', error);
    }
  }, [selectedPlanId, currentWeekStart]);

  // Fetch settings for selected plan
  const fetchSettings = useCallback(async () => {
    if (!selectedPlanId) return;

    try {
      const res = await axios.get(
        `${API_URL}/plans/${selectedPlanId}/settings`
      );
      setPeopleNames({ A: res.data.name_A, B: res.data.name_B });
    } catch (error) {
      console.error('Kunde inte hämta inställningar', error);
    }
  }, [selectedPlanId]);

  // Fetch data when selected plan or week changes (only if user is authenticated)
  useEffect(() => {
    if (!user) return;
    fetchRecipes();
    fetchPlanSlots();
    fetchSettings();
  }, [fetchRecipes, fetchPlanSlots, fetchSettings, user]);

  // Plan handlers
  const handleSelectPlan = (planId) => {
    setSelectedPlanId(planId);
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
    setRecipes([]);
    setPlan([]);
    setShowAddModal(false);
  };

  // Recipe and plan slot handlers
  const handleUpdateSlot = async (slotData) => {
    try {
      await axios.post(`${API_URL}/plans/${selectedPlanId}/plan`, slotData);
      fetchPlanSlots();
    } catch (error) {
      console.error('Kunde inte uppdatera plan', error);
    }
  };

  const handleVote = async (id) => {
    try {
      await axios.put(`${API_URL}/plans/${selectedPlanId}/recipes/${id}/vote`);
      fetchRecipes();
    } catch (error) {
      console.error('Kunde inte rösta', error);
    }
  };

  const handleAddRecipe = async () => {
    fetchRecipes();
    setShowAddModal(false);
  };

  const handleRefresh = () => {
    fetchRecipes(sortField, sortOrder);
  };

  const handleUpdateSettings = async (newNames) => {
    try {
      await axios.post(`${API_URL}/plans/${selectedPlanId}/settings`, newNames);
      setPeopleNames(newNames);
    } catch (error) {
      console.error('Kunde inte uppdatera inställningar', error);
    }
  };

  // Plan name update handler
  const handleUpdatePlanName = (newName) => {
    if (typeof newName === 'string') {
      setMealPlans((prevPlans) =>
        prevPlans.map((p) =>
          p.id === selectedPlanId ? { ...p, name: newName } : p
        )
      );
    }
  };

  // Week navigation
  const nextWeek = () => setCurrentWeekStart(addWeeks(currentWeekStart, 1));
  const prevWeek = () => setCurrentWeekStart(subWeeks(currentWeekStart, 1));
  const goToday = () =>
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));

  // Loading screen
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg font-semibold">Läser in...</p>
      </div>
    );
  }

  // Login screen
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-100 via-yellow-50 to-green-100 flex items-center justify-center p-4">
        <div className="flex flex-col items-center">
          {/* Header with icon */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-orange-400 to-red-500 rounded-full mb-4 shadow-lg">
              <Plus className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              Matplanerare
            </h1>
            <p className="text-gray-600">- - -</p>
          </div>

          {/* Clerk SignIn Component */}
          <SignIn
            appearance={{
              elements: {
                rootBox: 'w-full max-w-md',
                card: 'rounded-2xl shadow-xl border border-gray-100',
              },
            }}
            redirectUrl="/"
          />

          {/* Footer */}
          <div className="text-center mt-6">
            <p className="text-gray-500 text-sm">Nom • Nom • Nom</p>
          </div>
        </div>
      </div>
    );
  }

  // No plans yet
  if (mealPlans.length === 0) {
    return (
      <div className="h-screen flex flex-col">
        <header className="bg-white border-b border-gray-200 px-2 md:px-4 py-2 md:py-3 flex justify-between items-center shadow-sm">
          <h1 className="text-lg md:text-xl font-bold text-gray-900">
            Hemmets Matplanerare
          </h1>
          <button
            onClick={() => setShowPlanSettings(true)}
            className="p-1.5 md:p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-all"
            title="Inställningar"
          >
            <Settings className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </header>

        <div className="flex items-center justify-center flex-1">
          <div className="text-center">
            <p className="text-gray-600 mb-4">Du har inga matplaner ännu</p>
            <button
              onClick={() => setShowPlanSettings(true)}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded text-white font-semibold"
            >
              Hantera planer
            </button>
          </div>
        </div>

        {showPlanSettings && (
          <PlanSettingsModal
            user={user}
            selectedPlanId={selectedPlanId}
            mealPlans={mealPlans}
            onSelectPlan={handleSelectPlan}
            onRefreshPlans={fetchMealPlans}
            onClose={() => setShowPlanSettings(false)}
            apiUrl={API_URL}
            onUpdateNames={handleUpdateSettings}
            onUpdatePlanName={handleUpdatePlanName}
          />
        )}
      </div>
    );
  }

  // Main app
  return (
    <div className="h-screen flex flex-col font-sans text-gray-800">
      <header className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200 px-2 md:px-4 py-2 md:py-3 flex justify-between items-center shadow-sm z-10">
        <div className="flex items-center gap-2 md:gap-4 flex-1">
          <h1 className="text-lg md:text-xl font-bold text-slate-900 truncate">
            {mealPlans.find((p) => p.id === selectedPlanId)?.name ||
              'Hemmets Matplanerare'}
          </h1>
        </div>

        <div className="flex gap-1 md:gap-2 items-center flex-shrink-0">
          <span className="hidden sm:inline text-xs md:text-sm text-gray-600">
            {user.email}
          </span>
          <button
            onClick={() => setShowPlanSettings(true)}
            className="p-1.5 md:p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-all"
            title="Inställningar"
          >
            <Settings className="w-5 h-5 md:w-6 md:h-6" />
          </button>

          <button
            onClick={() => setShowAddModal(!showAddModal)}
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 px-2 md:px-4 py-1.5 md:py-2 rounded-lg font-semibold text-xs md:text-sm text-white shadow-sm hover:shadow-md transition-all flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" />
            <span className="hidden sm:inline">
              {showAddModal ? 'Stäng' : 'Recept'}
            </span>
          </button>
        </div>
      </header>{' '}
      {authError && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <p className="text-red-700">{authError}</p>
        </div>
      )}
      {joinMessage && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-3">
          <p className="text-blue-700 text-sm">{joinMessage}</p>
        </div>
      )}
      {showAddModal && selectedPlanId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-slideUp overflow-hidden">
            {/* Header */}
            <div className="flex-shrink-0 bg-gradient-to-r from-green-600 to-emerald-700 text-white px-6 py-5 flex justify-between items-center shadow-md">
              <div>
                <h2 className="text-2xl font-bold">Lägg till nytt recept</h2>
                <p className="text-green-100 text-sm mt-1">
                  Skapa ett nytt recept i din matplan
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-all duration-200 hover:rotate-90"
                aria-label="Stäng"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50 min-h-0">
              <AddRecipe
                onAdded={() => {
                  handleAddRecipe();
                  setShowAddModal(false);
                }}
                apiUrl={API_URL}
                planId={selectedPlanId}
              />
            </div>
          </div>
        </div>
      )}
      {showPlanSettings && (
        <PlanSettingsModal
          user={user}
          selectedPlanId={selectedPlanId}
          mealPlans={mealPlans}
          onSelectPlan={handleSelectPlan}
          onRefreshPlans={fetchMealPlans}
          onClose={() => setShowPlanSettings(false)}
          apiUrl={API_URL}
          onUpdateNames={handleUpdateSettings}
          onUpdatePlanName={handleUpdatePlanName}
        />
      )}
      {selectedPlanId && (
        <main className="flex-1 overflow-hidden">
          <PlannerGrid
            recipes={recipes}
            plan={plan}
            onUpdateSlot={handleUpdateSlot}
            apiUrl={API_URL}
            planId={selectedPlanId}
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
      )}
    </div>
  );
}

export default App;
