import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { startOfWeek, endOfWeek, format, addWeeks, subWeeks } from 'date-fns';
import PlannerGrid from './components/PlannerGrid';
import AddRecipe from './components/AddRecipe';
import PlanSettingsModal from './components/PlanSettingsModal';
import {
  auth,
  logout,
  onAuthStateChanged,
  onIdTokenChanged,
  signInWithGoogle,
  signInWithEmailPassword,
} from './firebase';

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
  // Auth state
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [joinMessage, setJoinMessage] = useState(null);

  // Plan management
  const [mealPlans, setMealPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
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

  // Firebase auth listener will be declared below, after fetchMealPlans

  // Fetch list of user's meal plans with retry logic
  const fetchMealPlans = useCallback(async () => {
    try {
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

      // Retry på 401 om vi har en användare
      if (error.response?.status === 401 && auth.currentUser) {
        console.log('401 error, retrying with fresh token...');
        try {
          const token = await auth.currentUser.getIdToken(true);
          axios.defaults.headers.common.Authorization = `Bearer ${token}`;
          const retryRes = await axios.get(`${API_URL}/plans`);
          setMealPlans(retryRes.data);

          const currentExists = retryRes.data.some(
            (p) => p.id === selectedPlanId
          );
          if (retryRes.data.length > 0 && (!selectedPlanId || !currentExists)) {
            setSelectedPlanId(retryRes.data[0].id);
          }
          if (retryRes.data.length === 0) {
            setSelectedPlanId(null);
          }
        } catch (retryError) {
          console.error('Retry också misslyckades:', retryError);
        }
      }
    }
  }, [selectedPlanId]);

  // Firebase auth listener - förbättrad token-hantering
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Vänta på att token blir tillgänglig
          let retries = 5;
          let token = null;

          while (retries > 0 && !token) {
            try {
              token = await firebaseUser.getIdToken(true); // Force refresh
              break;
            } catch (error) {
              console.log(`Token retry ${6 - retries}/5`);
              retries--;
              if (retries > 0) {
                await new Promise((resolve) => setTimeout(resolve, 200));
              }
            }
          }

          if (token) {
            axios.defaults.headers.common.Authorization = `Bearer ${token}`;
            setUser({ uid: firebaseUser.uid, email: firebaseUser.email });

            // Register user and load plans
            try {
              await axios.post(`${API_URL}/auth/register`);
              await fetchMealPlans();
            } catch (error) {
              console.error('Failed to register/load plans:', error);
              // Retry efter kort delay
              setTimeout(async () => {
                try {
                  await axios.post(`${API_URL}/auth/register`);
                  await fetchMealPlans();
                } catch (retryError) {
                  console.error('Retry failed:', retryError);
                }
              }, 1000);
            }
          } else {
            console.error('Could not get Firebase token after retries');
            setAuthError(
              'Kunde inte hämta autentisering. Försök logga in igen.'
            );
          }
        } else {
          delete axios.defaults.headers.common.Authorization;
          setUser(null);
          setMealPlans([]);
          setSelectedPlanId(null);
          setAuthError(null);
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        setAuthError('Inloggningsfel. Försök igen.');
      } finally {
        setAuthReady(true);
      }
    });

    return () => unsubscribe();
  }, [fetchMealPlans]);

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

  // Fetch data when selected plan or week changes
  useEffect(() => {
    fetchRecipes();
    fetchPlanSlots();
    fetchSettings();
  }, [fetchRecipes, fetchPlanSlots, fetchSettings]);

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

  // Auth handlers
  const handleLogin = async () => {
    try {
      setAuthError(null);
      await signInWithGoogle();
    } catch (error) {
      console.error('Inloggning misslyckades', error);
      setAuthError('Inloggning misslyckades. Försök igen.');
    }
  };

  const handleLoginEmulator = async () => {
    try {
      setAuthError(null);
      await signInWithEmailPassword(loginEmail, loginPassword);
    } catch (error) {
      console.error('Inloggning (emulator) misslyckades', error);
      setAuthError('Inloggning misslyckades. Kontrollera e-post och lösenord.');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setRecipes([]);
      setPlan([]);
      setMealPlans([]);
    } catch (error) {
      console.error('Kunde inte logga ut', error);
    }
  };

  // Loading screen
  if (!authReady) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg font-semibold">Läser in...</p>
      </div>
    );
  }

  // Login screen
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-6">Hemmets Matplanerare</h1>
          {authError && <p className="text-red-600 mb-4">{authError}</p>}
          {joinMessage && <p className="text-blue-700 mb-2">{joinMessage}</p>}
          {auth.emulatorConfig ? (
            <div className="max-w-sm mx-auto text-left">
              <label className="block text-sm font-medium mb-1">E-post</label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="border rounded w-full px-3 py-2 mb-3"
                placeholder="test@example.com"
              />
              <label className="block text-sm font-medium mb-1">Lösenord</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="border rounded w-full px-3 py-2 mb-4"
                placeholder="minst 6 tecken"
              />
              <button
                onClick={handleLoginEmulator}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold w-full"
              >
                Logga in (Emulator)
              </button>
              <p className="text-gray-600 text-sm mt-2">
                Skapa/hantera testkonton i Firebase Emulator UI.
              </p>
            </div>
          ) : (
            <button
              onClick={handleLogin}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold"
            >
              Logga in med Google
            </button>
          )}
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
            <svg
              className="w-5 h-5 md:w-6 md:h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
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
            onLogout={handleLogout}
          />
        )}
      </div>
    );
  }

  // Main app
  return (
    <div className="h-screen flex flex-col font-sans text-gray-800">
      <header className="bg-white border-b border-gray-200 px-2 md:px-4 py-2 md:py-3 flex justify-between items-center shadow-sm z-10">
        <div className="flex items-center gap-2 md:gap-4 flex-1">
          <h1 className="text-lg md:text-xl font-bold text-gray-900 truncate">
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
            <svg
              className="w-5 h-5 md:w-6 md:h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>

          <button
            onClick={() => setShowAddModal(!showAddModal)}
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 px-2 md:px-4 py-1.5 md:py-2 rounded-lg font-semibold text-xs md:text-sm text-white shadow-sm hover:shadow-md transition-all flex items-center gap-1"
          >
            <svg
              className="w-3.5 h-3.5 md:w-4 md:h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M12 4v16m8-8H4"
              />
            </svg>
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
        <div className="bg-white border-b p-4 animate-in slide-in-from-top-10">
          <AddRecipe
            onAdded={handleAddRecipe}
            apiUrl={API_URL}
            planId={selectedPlanId}
          />
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
          onLogout={handleLogout}
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
