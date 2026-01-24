import { useState } from 'react';
import axios from 'axios';

/**
 * PlanSelector - Displays available meal plans and allows user to:
 * 1. Create a new plan
 * 2. Join an existing plan using a share code
 * 3. Select an active plan
 */
function PlanSelector({
  user,
  selectedPlanId,
  onSelectPlan,
  mealPlans,
  onRefreshPlans,
  apiUrl,
}) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlanName, setNewPlanName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [joinCode, setJoinCode] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState(null);
  const [joinSuccess, setJoinSuccess] = useState(null);

  const handleCreatePlan = async () => {
    if (!newPlanName.trim()) {
      setError('Plan namn kan inte vara tomt');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${apiUrl}/plans`, { name: newPlanName });
      setNewPlanName('');
      setShowCreateModal(false);
      setError(null);
      await onRefreshPlans();
    } catch (err) {
      setError(err.response?.data?.detail || 'Kunde inte skapa plan');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinPlan = async () => {
    const code = joinCode.trim();
    if (!code) {
      setJoinError('Klistra in en inbjudningskod först');
      return;
    }
    setJoinLoading(true);
    setJoinError(null);
    setJoinSuccess(null);
    try {
      const res = await axios.post(
        `${apiUrl}/plans/join?share_code=${encodeURIComponent(code)}`
      );
      await onRefreshPlans();
      const joinedId = Number(res.data?.plan_id);
      if (!Number.isNaN(joinedId)) {
        onSelectPlan(joinedId);
      }
      setJoinSuccess('Du har gått med i planen.');
      setJoinCode('');
    } catch (err) {
      setJoinError(
        err?.response?.data?.detail ||
          'Kunde inte gå med i plan — kontrollera koden'
      );
    } finally {
      setJoinLoading(false);
      window.setTimeout(() => {
        setJoinSuccess(null);
      }, 3000);
    }
  };

  return (
    <div className="border-b bg-gray-50 p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-gray-600">Inloggad som: {user.email}</p>
          <h2 className="text-lg font-semibold">Mina matplaner</h2>
        </div>
      </div>

      {/* Plan list */}
      <div className="flex flex-wrap gap-2 mb-4">
        {mealPlans.map((plan) => (
          <button
            key={plan.id}
            onClick={() => onSelectPlan(plan.id)}
            className={`px-4 py-2 rounded font-medium transition ${
              selectedPlanId === plan.id
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-300 text-gray-800 hover:bg-gray-50'
            }`}
          >
            {plan.name}
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          <button
            onClick={() => {
              setShowCreateModal(true);
              setError(null);
            }}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-medium"
          >
            + Ny plan
          </button>
        </div>

        {/* Join via code */}
        <div className="bg-white border border-gray-200 rounded p-3">
          <p className="text-sm font-medium mb-2">Gå med via kod</p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Klistra in kod här"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              className="flex-1 border border-gray-300 rounded px-3 py-2"
            />
            <button
              onClick={handleJoinPlan}
              disabled={joinLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium disabled:opacity-50"
            >
              {joinLoading ? 'Går med...' : 'Gå med'}
            </button>
          </div>
          {joinError && (
            <p className="text-red-600 mt-2 text-sm">{joinError}</p>
          )}
          {joinSuccess && (
            <p className="text-green-700 mt-2 text-sm">{joinSuccess}</p>
          )}
        </div>
      </div>

      {/* Error message for create */}
      {error && <p className="text-red-600 mt-2 text-sm">{error}</p>}

      {/* Create plan modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">Skapa ny plan</h3>
            <input
              type="text"
              placeholder="Namn på planen"
              value={newPlanName}
              onChange={(e) => setNewPlanName(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreatePlan}
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-medium disabled:opacity-50"
              >
                {loading ? 'Skapar...' : 'Skapa'}
              </button>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewPlanName('');
                }}
                className="flex-1 bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded font-medium"
              >
                Avbryt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PlanSelector;
