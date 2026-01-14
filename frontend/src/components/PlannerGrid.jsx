import React, { useState, useEffect } from 'react';
import { format, addDays, isSameDay } from 'date-fns';
import { sv } from 'date-fns/locale';
import EditRecipe from './EditRecipe';
import RecipeDetails from './RecipeDetails';

const PlannerGrid = ({
  recipes,
  plan,
  onUpdateSlot,
  apiUrl,
  onVote,
  onRefreshRecipes,
  currentWeekStart,
  onNextWeek,
  onPrevWeek,
  onGoToday,
  // NYA PROPS:
  sortField,
  setSortField,
  sortOrder,
  setSortOrder,
  peopleNames, // <--- HÄR
}) => {
  const [activeTab, setActiveTab] = useState('planning');
  const [sortBy, setSortBy] = useState('vote');
  const [searchQuery, setSearchQuery] = useState(''); // <--- NY STATE: Sökning

  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState(null);
  const [removedRecipeIds, setRemovedRecipeIds] = useState([]); // <--- NYTT: Ignorera-lista
  const [editingRecipe, setEditingRecipe] = useState(null); // För modalen
  const [viewingRecipe, setViewingRecipe] = useState(null); // <--- NY STATE
  const [viewMode, setViewMode] = useState('compact'); // 'compact' eller 'detailed'

  // Sorterings-state
  //const [sortField, setSortField] = useState('vote'); // 'vote', 'name', 'last_cooked'
  //const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc'
  // SEPARERA RECEPT OCH PLATSHÅLLARE
  // 1. Platshållare: Tvinga dem att sorteras på ID (skapelseordning) så de alltid ligger stilla
  const placeholderRecipes = recipes
    .filter((r) => r.is_placeholder)
    .sort((a, b) => a.id - b.id);

  // 2. Standardrecept: Dessa följer backendens sortering (Röster, Datum, Namn etc)
  const standardRecipes = recipes.filter((r) => !r.is_placeholder);

  const days = Array.from({ length: 7 }).map((_, i) =>
    addDays(currentWeekStart, i)
  );
  const meals = ['LUNCH', 'DINNER'];
  const peopleKeys = ['A', 'B'];

  // --- FILTERLOGIK ---
  // Filtrera recepten baserat på sökordet (matchar namn eller taggar)
  const filteredRecipes = standardRecipes.filter((recipe) => {
    const query = searchQuery.toLowerCase();
    const nameMatch = recipe.name.toLowerCase().includes(query);
    const tagMatch = recipe.tags && recipe.tags.toLowerCase().includes(query);
    return nameMatch || tagMatch;
  });

  // 1. SORTERING
  //useEffect(() => {
  //  onRefreshRecipes(sortField, sortOrder);
  //}, [sortField, sortOrder]);

  // 2. VECKO-SYNC
  useEffect(() => {
    setSelectedBatchId(null);
    setBatches([]);
  }, [currentWeekStart]);

  // 3. PLAN-SYNC (Fixad bugg)
  // 3. PLAN-SYNC: Bygg upp "Matlådor" säkert
  useEffect(() => {
    if (!recipes.length) return;

    const startStr = format(currentWeekStart, 'yyyy-MM-dd');
    const endStr = format(addDays(currentWeekStart, 6), 'yyyy-MM-dd');

    const currentWeekSlots = plan.filter(
      (p) => p.plan_date >= startStr && p.plan_date <= endStr
    );

    setBatches((prevBatches) => {
      const newBatches = [];
      const recipeIdsInWeek = [
        ...new Set(currentWeekSlots.map((p) => p.recipe_id)),
      ].filter(Boolean);

      recipeIdsInWeek.forEach((rId) => {
        // VIKTIGT: Om receptet ligger i "papperskorgen" (removedRecipeIds), skapa inte en batch!
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
            image: recipe.image_filename,
            targetPortions: existing
              ? existing.targetPortions
              : Math.max(recipe.default_portions, currentUsage),
          });
        }
      });

      // Behåll manuellt tillagda (som inte är i kalendern än)
      prevBatches.forEach((prev) => {
        const alreadyAdded = newBatches.find(
          (b) => b.recipeId === prev.recipeId
        );
        // Även här: Om vi precis klickat X på en manuell batch, ska den inte komma tillbaka
        if (!alreadyAdded && !removedRecipeIds.includes(prev.recipeId)) {
          newBatches.push(prev);
        }
      });

      return newBatches;
    });

    // STÄDNING: Om ett ID ligger i 'removedRecipeIds' men INTE längre finns i veckans plan...
    // Då är det säkert att ta bort det från svarta listan (så man kan lägga till det igen senare om det dyker upp).
    // Vi gör detta i en separat setter för att inte skapa loopar.
    setRemovedRecipeIds((prev) => {
      const recipeIdsInWeek = [
        ...new Set(currentWeekSlots.map((p) => p.recipe_id)),
      ].filter(Boolean);
      // Behåll bara IDn som fortfarande spökar kvar i planen (dvs vi väntar fortfarande på att de ska försvinna)
      return prev.filter((id) => recipeIdsInWeek.includes(id));
    });
  }, [plan, recipes, currentWeekStart]); // Ta INTE med removedRecipeIds här för att undvika loopar

  // --- INTERAKTIONER ---

  const addToPlanning = (recipe) => {
    // Om vi manuellt lägger till den igen, ta bort från ignorera-listan
    setRemovedRecipeIds((prev) => prev.filter((id) => id !== recipe.id));

    if (!batches.find((b) => b.recipeId === recipe.id)) {
      // ... (resten av koden är samma som förut)
      const newBatch = {
        recipeId: recipe.id,
        targetPortions: recipe.default_portions,
        recipeName: recipe.name,
        image: recipe.image_filename,
        imageUrl: recipe.image_url, // <--- SPARA DENNA
      };
      setBatches((prev) => [...prev, newBatch]);
      setSelectedBatchId(recipe.id);
      setActiveTab('planning');
      setSearchQuery('');
    } else {
      setSelectedBatchId(recipe.id);
      setActiveTab('planning');
    }
  };

  const updateBatchPortions = (id, change) => {
    setBatches(
      batches.map((b) =>
        b.recipeId === id
          ? { ...b, targetPortions: Math.max(1, b.targetPortions + change) }
          : b
      )
    );
  };

  const removeFromPlanning = (e, id) => {
    e.stopPropagation();

    // 1. Svartlista detta ID så att useEffect inte återskapar det direkt
    setRemovedRecipeIds((prev) => [...prev, id]);

    // 2. Ta bort från UI-listan direkt
    setBatches(batches.filter((b) => b.recipeId !== id));
    if (selectedBatchId === id) setSelectedBatchId(null);

    // 3. Rensa slots i backend
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
  };

  const handleSlotClick = (date, meal, person) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const existingSlot = plan.find(
      (p) =>
        p.plan_date === dateStr && p.meal_type === meal && p.person === person
    );

    if (selectedBatchId) {
      if (existingSlot && existingSlot.recipe_id === selectedBatchId) {
        onUpdateSlot({
          plan_date: dateStr,
          meal_type: meal,
          person: person,
          recipe_id: null,
        });
      } else {
        onUpdateSlot({
          plan_date: dateStr,
          meal_type: meal,
          person: person,
          recipe_id: selectedBatchId,
        });
      }
    } else {
      onUpdateSlot({
        plan_date: dateStr,
        meal_type: meal,
        person: person,
        recipe_id: null,
      });
    }
  };

  const getAllocatedCount = (recipeId) =>
    plan.filter((p) => p.recipe_id === recipeId).length;

  return (
    <div className="flex flex-col md:flex-row h-full">
      {/* --- SIDEBAR --- */}
      <div className="w-full md:w-1/3 lg:w-1/4 bg-white border-r flex flex-col h-[40vh] md:h-full">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('planning')}
            className={`flex-1 py-3 text-sm font-bold ${activeTab === 'planning' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
          >
            Matlådor
          </button>
          <button
            onClick={() => setActiveTab('library')}
            className={`flex-1 py-3 text-sm font-bold ${activeTab === 'library' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
          >
            Bibliotek
          </button>
        </div>

        {activeTab === 'planning' && (
          <div className="flex-1 overflow-y-auto p-4 bg-blue-50">
            {batches.length === 0 ? (
              <div className="text-center text-gray-400 mt-10 text-sm">
                <p>Inga matlådor denna vecka.</p>
                <button
                  onClick={() => setActiveTab('library')}
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
                      onClick={() => setSelectedBatchId(batch.recipeId)}
                      className={`bg-white p-3 rounded-lg border-2 shadow-sm cursor-pointer relative transition-all ${isSelected ? 'border-blue-500 ring-1 ring-blue-500 shadow-md' : 'border-transparent hover:border-blue-200'}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-gray-800 text-sm">
                          {batch.recipeName}
                        </span>
                        <button
                          onClick={(e) => removeFromPlanning(e, batch.recipeId)}
                          className="text-gray-300 hover:text-red-500 font-bold px-2"
                        >
                          ×
                        </button>
                      </div>

                      <div className="flex items-center justify-between bg-gray-50 rounded p-1 mb-2">
                        <span className="text-xs text-gray-500 ml-1">
                          Planerat:
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateBatchPortions(batch.recipeId, -1);
                            }}
                            className="w-6 h-6 bg-white border rounded hover:bg-gray-100 flex items-center justify-center"
                          >
                            -
                          </button>
                          <span className="font-bold text-sm w-4 text-center">
                            {batch.targetPortions}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateBatchPortions(batch.recipeId, 1);
                            }}
                            className="w-6 h-6 bg-white border rounded hover:bg-gray-100 flex items-center justify-center"
                          >
                            +
                          </button>
                        </div>
                      </div>

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

        {/* --- BIBLIOTEK (Nu med sök) --- */}
        {activeTab === 'library' && (
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 flex flex-col">
            {/* Sökfält */}
            <div className="mb-2">
              <input
                type="text"
                placeholder="🔍 Sök recept..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* LIST-VERKTYG: Sortering & Vy */}
            <div className="flex gap-2 mb-4">
              {/* 1. Sorterings-dropdown (Samma som förut) */}
              <div className="relative flex-1">
                <select
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value)}
                  className="w-full appearance-none p-2.5 pl-3 pr-8 text-xs font-medium border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow cursor-pointer"
                >
                  <option value="vote">❤️ Populärast</option>
                  <option value="last_cooked">📅 Senast lagad</option>
                  <option value="name">🔤 Namn</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                  <svg className="fill-current h-3 w-3" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>

              {/* 2. Sorterings-riktning (Samma som förut) */}
              <button
                onClick={() =>
                  setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
                }
                className="aspect-square h-full p-2 bg-white border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 hover:border-blue-300 transition-all flex items-center justify-center"
              >
                {sortOrder === 'asc' ? (
                  <span className="text-xs">⬆️</span>
                ) : (
                  <span className="text-xs">⬇️</span>
                )}
              </button>

              {/* 3. NYTT: Vy-väljare (Kompakt / Detaljerad) */}
              <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
                <button
                  onClick={() => setViewMode('compact')}
                  className={`p-1.5 rounded transition-all ${viewMode === 'compact' ? 'bg-white shadow text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                  title="Kompakt vy"
                >
                  {/* Ikon: List (Kompakt) */}
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
                  onClick={() => setViewMode('detailed')}
                  className={`p-1.5 rounded transition-all ${viewMode === 'detailed' ? 'bg-white shadow text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                  title="Detaljerad vy"
                >
                  {/* Ikon: Grid/Details (Mer info) */}
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

            {/* SNABBVAL (Platshållare) */}
            <div className="mb-4">
              <p className="text-xs font-bold text-gray-400 uppercase mb-2">
                Snabbval
              </p>
              <div className="grid grid-cols-2 gap-2">
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
            </div>

            <hr className="mb-4 border-gray-100" />

            {/* Lista med filtrerade recept */}
            <div className="space-y-2 flex-1">
              {filteredRecipes.length === 0 ? (
                <div className="text-center text-gray-400 text-sm mt-4">
                  Inga recept hittades.
                </div>
              ) : (
                filteredRecipes.map((recipe) => (
                  <div
                    key={recipe.id}
                    onClick={() => setViewingRecipe(recipe)}
                    className={`bg-white rounded border flex justify-between group hover:shadow-md transition-all cursor-pointer hover:bg-gray-50
        ${viewMode === 'detailed' ? 'p-3 items-start' : 'p-2 items-center'} /* Skillnad i padding och alignment */
    `}
                  >
                    <div className="flex gap-3 overflow-hidden w-full">
                      {/* BILD - Lite större i detailed mode */}
                      <div
                        className={`shrink-0 relative ${viewMode === 'detailed' ? 'w-16 h-16' : 'w-10 h-10'}`}
                      >
                        {recipe.image_filename ? (
                          <img
                            src={`${apiUrl}/images/${recipe.image_filename}`}
                            className="w-full h-full rounded object-cover"
                          />
                        ) : recipe.image_url ? (
                          <img
                            src={recipe.image_url}
                            className="w-full h-full rounded object-cover"
                            onError={(e) => (e.target.style.display = 'none')}
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center text-xs">
                            🍽️
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col flex-1 min-w-0 justify-center">
                        {/* TITEL */}
                        <div className="flex justify-between items-start">
                          <span
                            className={`font-medium truncate group-hover:text-blue-600 ${viewMode === 'detailed' ? 'text-base' : 'text-sm'}`}
                          >
                            {recipe.name}
                          </span>

                          {/* ACTION KNAPPAR (Ligger till höger om texten i Detailed mode för att spara plats, eller behålls i egen div) */}
                          {/* Vi låter knapparna ligga i en separat flex-div till höger för enkelhetens skull, se nedan */}
                        </div>

                        {/* TAGGAR & INFO - LOGIK BASERAT PÅ VY */}
                        {viewMode === 'detailed' ? (
                          // --- DETALJERAD VY ---
                          <div className="mt-1">
                            {/* Alla taggar */}
                            {recipe.tags && (
                              <div className="flex flex-wrap gap-1 mb-1">
                                {recipe.tags.split(',').map((tag, i) => (
                                  <span
                                    key={i}
                                    className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100 whitespace-nowrap"
                                  >
                                    {tag.trim()}
                                  </span>
                                ))}
                              </div>
                            )}
                            {/* Senast lagad */}
                            <div className="text-[10px] text-gray-500 flex items-center gap-2">
                              <span>
                                📅 Sist: {recipe.last_cooked_date || 'Aldrig'}
                              </span>
                              {recipe.notes && (
                                <span
                                  className="text-gray-400"
                                  title="Har anteckningar"
                                >
                                  📝
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          // --- KOMPAKT VY (Originalet) ---
                          <>
                            {recipe.tags && (
                              <div className="flex gap-1 mt-0.5 overflow-hidden">
                                {/* Visa max 2 taggar */}
                                {recipe.tags
                                  .split(',')
                                  .slice(0, 2)
                                  .map((tag, i) => (
                                    <span
                                      key={i}
                                      className="text-[9px] bg-gray-100 text-gray-600 px-1.5 rounded-sm whitespace-nowrap"
                                    >
                                      {tag.trim()}
                                    </span>
                                  ))}
                              </div>
                            )}
                            {/* I kompakt vy gömmer vi datumet eller visar det väldigt litet om du vill */}
                          </>
                        )}
                      </div>
                    </div>

                    {/* KNAPPAR (Röstning + Lägg till) */}
                    <div
                      className={`flex flex-col justify-center items-end gap-1 ml-2 ${viewMode === 'detailed' ? 'h-16' : ''}`}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onVote(recipe.id);
                        }}
                        className="text-xs bg-gray-50 hover:bg-pink-50 px-2 py-1 rounded text-gray-400 hover:text-pink-500 transition-colors whitespace-nowrap"
                      >
                        ❤️ {recipe.vote_count}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addToPlanning(recipe);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shadow-sm"
                        title="Lägg till matlåda"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* --- GRID (KALENDERN) --- */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-100">
        <div className="bg-white p-3 border-b flex justify-between items-center shadow-sm z-10">
          <button
            onClick={onPrevWeek}
            className="p-2 hover:bg-gray-100 rounded text-gray-600 font-bold flex items-center gap-1"
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
            <button
              onClick={onGoToday}
              className="text-xs text-blue-600 hover:underline font-medium"
            >
              Gå till idag
            </button>
          </div>
          <button
            onClick={onNextWeek}
            className="p-2 hover:bg-gray-100 rounded text-gray-600 font-bold flex items-center gap-1"
          >
            <span className="hidden sm:inline">
              V. {format(addDays(currentWeekStart, 7), 'w')}
            </span>{' '}
            &gt;
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 md:p-4">
          <div className="grid grid-cols-1 md:grid-cols-7 gap-2 pb-20">
            {days.map((day) => {
              const isToday = isSameDay(day, new Date());
              return (
                <div
                  key={day.toString()}
                  className={`bg-white rounded shadow-sm border overflow-hidden flex flex-col ${isToday ? 'ring-2 ring-blue-400' : ''}`}
                >
                  <div
                    className={`p-1 text-center font-bold text-sm uppercase ${isToday ? 'bg-blue-600 text-white' : 'bg-slate-700 text-white'}`}
                  >
                    {format(day, 'EEE', { locale: sv })}{' '}
                    <span className="opacity-70 text-xs ml-1">
                      {format(day, 'd/M')}
                    </span>
                  </div>
                  <div className="flex flex-col p-1 gap-1 flex-1">
                    {meals.map((meal) => (
                      <div key={meal} className="flex-1 flex flex-col">
                        <span className="text-[10px] font-bold text-gray-400 uppercase text-center">
                          {meal}
                        </span>

                        {/* 1. LADE TILL p-0.5: Ger lite luft så att ringen/ramen inte klipps av ytterkanten */}
                        <div className="flex gap-1 h-full min-h-[60px] p-0.5">
                          {peopleKeys.map((personKey) => {
                            const dateStr = format(day, 'yyyy-MM-dd');
                            // personKey är "A" eller "B" (för databasen)
                            const slot = plan.find(
                              (p) =>
                                p.plan_date === dateStr &&
                                p.meal_type === meal &&
                                p.person === personKey
                            );
                            const recipe = slot
                              ? recipes.find((r) => r.id === slot.recipe_id)
                              : null;
                            const isActive =
                              recipe && selectedBatchId === recipe.id;

                            // HÄR HÄMTAR VI DET RIKTIGA NAMNET
                            const displayName = peopleNames[personKey];

                            // Kolla om det är en platshållare
                            const isPlaceholder = recipe?.is_placeholder;

                            return (
                              <div
                                key={personKey}
                                onClick={() =>
                                  handleSlotClick(day, meal, personKey)
                                }
                                className={`flex-1 min-w-0 rounded border flex flex-col items-center justify-center p-1 text-center cursor-pointer transition-colors ${
                                  isActive
                                    ? 'bg-blue-600 text-white border-blue-600 ring-2 ring-blue-300 ring-inset'
                                    : recipe
                                      ? // HÄR: Om det är placeholder -> Grå/Gul stil. Annars -> Grön stil.
                                        isPlaceholder
                                        ? 'bg-amber-50 border-amber-200 text-amber-900 hover:bg-amber-100 italic'
                                        : 'bg-green-50 border-green-200 text-gray-800 hover:bg-green-100'
                                      : 'bg-gray-50 border-dashed hover:bg-gray-100 text-gray-300'
                                }`}
                              >
                                {recipe ? (
                                  <div className="w-full">
                                    {/* ÄNDRINGAR HÄR:
            1. Tog bort 'truncate'
            2. Lade till 'break-words' (så långa ord bryts)
            3. Lade till 'whitespace-normal' (så meningar bryts)
            */}
                                    <div className="text-xs font-semibold leading-tight px-1 break-words whitespace-normal">
                                      {recipe.name}
                                    </div>
                                    <div
                                      className={`text-[9px] mt-0.5 ${isActive ? 'text-blue-200' : 'text-gray-400'}`}
                                    >
                                      {displayName}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="font-bold">
                                    {displayName}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* --- EDIT MODAL --- */}
      {editingRecipe && (
        <EditRecipe
          recipe={editingRecipe}
          apiUrl={apiUrl}
          onCancel={() => setEditingRecipe(null)}
          onUpdated={() => {
            setEditingRecipe(null);
            onRefreshRecipes(sortBy); // Ladda om listan så ändringarna syns
          }}
        />
      )}

      {/* --- VIEW DETAILS MODAL --- */}
      {viewingRecipe && (
        <RecipeDetails
          recipe={viewingRecipe}
          apiUrl={apiUrl}
          onClose={() => setViewingRecipe(null)}
          onEdit={(recipeToEdit) => {
            setViewingRecipe(null); // Stäng detaljvyn
            setEditingRecipe(recipeToEdit); // Öppna redigeringsvyn
          }}
        />
      )}
    </div>
  );
};

export default PlannerGrid;
