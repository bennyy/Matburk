import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { startOfWeek, endOfWeek, format, addWeeks, subWeeks } from 'date-fns';
import { Plus, Settings, X, AlertCircle, Info } from 'lucide-react';
import PlannerGrid from './components/PlannerGrid';
import AddRecipe from './components/AddRecipe';
import PlanSettingsModal from './components/PlanSettingsModal';
import {
  auth,
  logout,
  onAuthStateChanged,
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

  // Save selected plan to localStorage whenever it changes
  useEffect(() => {
    if (selectedPlanId !== null) {
      localStorage.setItem('selectedPlanId', selectedPlanId.toString());
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
            } catch (err) {
              console.log(`Token retry ${6 - retries}/5`, err);
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

  // Fetch data when selected plan or week changes (only if user is authenticated)
  useEffect(() => {
    if (!user || !authReady) return;
    fetchRecipes();
    fetchPlanSlots();
    fetchSettings();
  }, [fetchRecipes, fetchPlanSlots, fetchSettings, user, authReady]);

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
      <div className="min-h-screen bg-gradient-to-br from-orange-100 via-yellow-50 to-green-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
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

          {/* Login Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            {/* Error Messages */}
            {authError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                  <p className="text-red-700 text-sm">{authError}</p>
                </div>
              </div>
            )}

            {joinMessage && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center">
                  <Info className="w-5 h-5 text-blue-500 mr-2" />
                  <p className="text-blue-700 text-sm">{joinMessage}</p>
                </div>
              </div>
            )}

            {/* Login Form */}
            {auth.emulatorConfig ? (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">
                  Logga in (Testläge)
                </h2>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleLoginEmulator();
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      E-postadress
                    </label>
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                      placeholder="test@example.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Lösenord
                    </label>
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                      placeholder="minst 6 tecken"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold py-3 px-4 rounded-lg transition-all transform hover:scale-105 shadow-lg"
                  >
                    Logga in
                  </button>
                </form>
                <p className="text-gray-500 text-sm mt-4 text-center">
                  Skapa/hantera testkonton i Firebase Emulator UI
                </p>
              </div>
            ) : (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">
                  Välkommen tillbaka
                </h2>
                <button
                  onClick={handleLogin}
                  className="w-full bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold py-3 px-4 rounded-lg transition-all transform hover:scale-105 shadow-lg flex items-center justify-center space-x-3"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span>Logga in med Google</span>
                </button>
              </div>
            )}
          </div>

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
            onLogout={handleLogout}
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
