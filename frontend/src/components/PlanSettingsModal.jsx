import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import PlanSelector from './PlanSelector';

/**
 * PlanSettingsModal - Combined modal for plan management and sharing
 */
function PlanSettingsModal({
  user,
  selectedPlanId,
  mealPlans,
  onSelectPlan,
  onRefreshPlans,
  onClose,
  apiUrl,
  onUpdateNames,
  onUpdatePlanName,
  onLogout,
}) {
  const [activeTab, setActiveTab] = useState('plans'); // 'plans' | 'share' | 'settings' | 'account'

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-slideUp overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-5 flex justify-between items-center shadow-md">
          <div>
            <h2 className="text-2xl font-bold">Matplaner</h2>
            <p className="text-blue-100 text-sm mt-1">
              Hantera dina matplaner och inställningar
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-all duration-200 hover:rotate-90"
            aria-label="Stäng"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex-shrink-0 flex border-b bg-gray-50 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveTab('plans')}
            className={`flex-1 min-w-max py-3 px-3 sm:py-4 sm:px-6 text-xs sm:text-sm font-semibold transition-all duration-200 relative whitespace-nowrap ${
              activeTab === 'plans'
                ? 'text-blue-600 bg-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <span className="flex items-center justify-center gap-1 sm:gap-2">
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              <span className="hidden sm:inline">Mina planer</span>
              <span className="sm:hidden">Planer</span>
            </span>
            {activeTab === 'plans' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
            )}
          </button>
          {selectedPlanId && (
            <button
              onClick={() => setActiveTab('share')}
              className={`flex-1 min-w-max py-3 px-3 sm:py-4 sm:px-6 text-xs sm:text-sm font-semibold transition-all duration-200 relative whitespace-nowrap ${
                activeTab === 'share'
                  ? 'text-blue-600 bg-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <span className="flex items-center justify-center gap-1 sm:gap-2">
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
                Dela
              </span>
              {activeTab === 'share' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
              )}
            </button>
          )}
          {selectedPlanId && (
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex-1 min-w-max py-3 px-3 sm:py-4 sm:px-6 text-xs sm:text-sm font-semibold transition-all duration-200 relative whitespace-nowrap ${
                activeTab === 'settings'
                  ? 'text-blue-600 bg-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <span className="flex items-center justify-center gap-1 sm:gap-2">
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
                <span className="hidden sm:inline">Användare</span>
                <span className="sm:hidden">Användare</span>
              </span>
              {activeTab === 'settings' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
              )}
            </button>
          )}
          <button
            onClick={() => setActiveTab('account')}
            className={`flex-1 min-w-max py-3 px-3 sm:py-4 sm:px-6 text-xs sm:text-sm font-semibold transition-all duration-200 relative whitespace-nowrap ${
              activeTab === 'account'
                ? 'text-blue-600 bg-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <span className="flex items-center justify-center gap-1 sm:gap-2">
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              Konto
            </span>
            {activeTab === 'account' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50 min-h-0">
          {activeTab === 'plans' && (
            <div className="max-w-3xl">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                <p className="text-sm text-blue-800 flex items-start gap-2">
                  <svg
                    className="w-5 h-5 mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>
                    {mealPlans.length === 0
                      ? 'Du har inga matplaner ännu. Skapa din första plan för att komma igång!'
                      : `Du har tillgång till ${mealPlans.length} matplan${mealPlans.length !== 1 ? 'er' : ''}. Välj en för att visa recept och veckomeny.`}
                  </span>
                </p>
              </div>
              <PlanSelector
                user={user}
                selectedPlanId={selectedPlanId}
                onSelectPlan={(planId) => {
                  onSelectPlan(planId);
                  setActiveTab('share');
                }}
                mealPlans={mealPlans}
                onRefreshPlans={onRefreshPlans}
                apiUrl={apiUrl}
              />
            </div>
          )}

          {activeTab === 'share' && selectedPlanId && (
            <SharePlanModalContent
              planId={selectedPlanId}
              planName={
                mealPlans.find((p) => p.id === selectedPlanId)?.name || ''
              }
              apiUrl={apiUrl}
              onRefreshPlans={onRefreshPlans}
              onSelectPlan={onSelectPlan}
            />
          )}

          {activeTab === 'settings' && selectedPlanId && (
            <SettingsTabContent
              apiUrl={apiUrl}
              planId={selectedPlanId}
              onUpdateNames={onUpdateNames}
              onClose={onClose}
              planName={
                mealPlans.find((p) => p.id === selectedPlanId)?.name || ''
              }
              onUpdatePlanName={onUpdatePlanName}
            />
          )}

          {activeTab === 'account' && (
            <AccountTabContent user={user} onLogout={onLogout} />
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Inner content component for share tab (avoids nested modal issues)
 */
function SharePlanModalContent({
  planId,
  planName,
  apiUrl,
  onRefreshPlans,
  onSelectPlan,
}) {
  const [invites, setInvites] = useState([]);
  const [viewLink, setViewLink] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [copied, setCopied] = useState(null);

  const fetchInvites = useCallback(async () => {
    try {
      const res = await axios.get(`${apiUrl}/plans/${planId}/shares`);
      // Separate view link (reusable) from edit invites (one-time)
      const viewShare = res.data.find(
        (item) => item.permission === 'view' && !item.is_one_time
      );
      const editInvites = res.data.filter(
        (item) => item.permission === 'edit' && item.is_one_time
      );
      setViewLink(viewShare);
      setInvites(editInvites);
    } catch (err) {
      console.error('Kunde inte ladda inbjudningar', err);
    }
  }, [apiUrl, planId]);

  useEffect(() => {
    fetchInvites();
  }, [fetchInvites]);

  const copyToClipboard = (code, id) => {
    if (window?.navigator?.clipboard) {
      window.navigator.clipboard.writeText(code);
      setCopied(id);
      window.setTimeout(() => setCopied(null), 2000);
    }
  };

  const handleGenerateOneTimeInvite = async (permission = 'edit') => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await axios.post(
        `${apiUrl}/plans/${planId}/invite?permission=${permission}`
      );
      if (permission === 'view') {
        setSuccess('Visningslänk skapad!');
      } else {
        setSuccess('Redigeringslänk skapad!');
      }
      // Small delay before fetching to ensure DB is updated
      await new Promise((resolve) => window.setTimeout(resolve, 100));
      await fetchInvites();
    } catch (err) {
      console.error('Error creating invite:', err);
      setError(err.response?.data?.detail || 'Kunde inte skapa inbjudan');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteInvite = async (inviteId) => {
    if (!window.confirm('Är du säker på att du vill ta bort denna inbjudan?')) {
      return;
    }

    setLoading(true);
    try {
      await axios.delete(`${apiUrl}/plans/${planId}/shares/${inviteId}`);
      setSuccess('Inbjudan borttagen.');
      setError(null);
      await fetchInvites();
    } catch (err) {
      setError(err.response?.data?.detail || 'Kunde inte ta bort inbjudan');
    } finally {
      setLoading(false);
    }
  };

  const getOneTimeInviteUrl = (token) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/join/${token}`;
  };

  const handleLeavePlan = async () => {
    if (!window.confirm('Är du säker på att du vill lämna denna plan?')) {
      return;
    }
    setLoading(true);
    try {
      await axios.delete(`${apiUrl}/plans/${planId}/leave`);
      // Refresh plans in parent and clear current selection
      if (onRefreshPlans) {
        await onRefreshPlans();
      }
      if (onSelectPlan) {
        onSelectPlan(null);
      }
      setSuccess('Du har lämnat planen.');
      setError(null);
    } catch (err) {
      setError(err.response?.data?.detail || 'Kunde inte lämna plan');
      setSuccess(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{planName}</h3>
        <p className="text-sm text-gray-600">
          Dela denna plan med andra eller lämna planen
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 flex items-start gap-3 animate-slideDown">
          <svg
            className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-red-800 text-sm flex-1">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4 flex items-start gap-3 animate-slideDown">
          <svg
            className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-green-800 text-sm flex-1">{success}</p>
        </div>
      )}

      {/* Universal view link */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg
              className="w-6 h-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900">Visningslänk</h4>
            <p className="text-sm text-gray-600">
              Återanvändbar länk - endast läsrättigheter
            </p>
          </div>
        </div>

        {viewLink ? (
          <div className="space-y-3">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <label className="block text-xs font-medium text-green-800 mb-2">
                Länk till plan
              </label>
              <input
                type="text"
                value={getOneTimeInviteUrl(viewLink.share_code)}
                readOnly
                className="w-full bg-white border border-green-300 px-3 py-2 rounded-lg text-sm font-mono focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                onClick={(e) => e.target.select()}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  copyToClipboard(
                    getOneTimeInviteUrl(viewLink.share_code),
                    `view-${viewLink.id}`
                  )
                }
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow"
              >
                {copied === `view-${viewLink.id}` ? (
                  <>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Kopierad!
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    Kopiera länk
                  </>
                )}
              </button>
              <button
                onClick={() => handleDeleteInvite(viewLink.id)}
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-lg transition-all duration-200 disabled:opacity-50 shadow-sm hover:shadow"
                title="Ta bort visningslänken"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => handleGenerateOneTimeInvite('view')}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 shadow-sm hover:shadow-md flex items-center justify-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Skapa visningslänk
          </button>
        )}
      </div>

      {/* One-time edit invites */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg
              className="w-6 h-6 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900">Redigeringslänkar</h4>
            <p className="text-sm text-gray-600">
              Engångslänkar - full redigeringsåtkomst
            </p>
          </div>
        </div>

        {invites.length > 0 && (
          <div className="space-y-3 mb-4">
            {invites.map((invite) => (
              <div
                key={invite.id}
                className={`border rounded-lg p-4 transition-all ${
                  invite.consumed_at
                    ? 'bg-gray-50 border-gray-300'
                    : 'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      {invite.consumed_at ? '✓ Använd länk' : 'Aktiv länk'}
                    </label>
                    <input
                      type="text"
                      value={getOneTimeInviteUrl(invite.share_code)}
                      readOnly
                      className="w-full bg-white border border-blue-300 px-3 py-2 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      onClick={(e) => e.target.select()}
                    />
                    {invite.consumed_at && (
                      <p className="text-xs text-gray-600 mt-2 flex items-center gap-1">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        Använd{' '}
                        {new Date(invite.consumed_at).toLocaleDateString(
                          'sv-SE'
                        )}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        copyToClipboard(
                          getOneTimeInviteUrl(invite.share_code),
                          `edit-${invite.id}`
                        )
                      }
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow"
                    >
                      {copied === `edit-${invite.id}` ? (
                        <>
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          Kopierad!
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                          Kopiera
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleDeleteInvite(invite.id)}
                      disabled={loading}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-all duration-200 disabled:opacity-50 shadow-sm hover:shadow"
                      title="Ta bort denna inbjudan"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => handleGenerateOneTimeInvite('edit')}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 shadow-sm hover:shadow-md flex items-center justify-center gap-2"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Skapa ny redigeringslänk
        </button>
      </div>

      {/* Danger zone: leave plan */}
      <div className="bg-red-50 rounded-xl border-2 border-red-200 p-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg
              className="w-6 h-6 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-red-900 mb-1">
              Lämna denna plan
            </h4>
            <p className="text-sm text-red-700 mb-4">
              Du kommer inte längre ha tillgång till planens recept och
              veckomeny.
            </p>
            <button
              onClick={handleLeavePlan}
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 shadow-sm hover:shadow-md flex items-center justify-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Lämna plan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PlanSettingsModal;

function SettingsTabContent({
  apiUrl,
  planId,
  onUpdateNames,
  planName,
  onUpdatePlanName,
}) {
  const [nameA, setNameA] = useState('Person A');
  const [nameB, setNameB] = useState('Person B');
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [newPlanName, setNewPlanName] = useState(planName || '');
  const [nameLoading, setNameLoading] = useState(false);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [settingsRes, usersRes] = await Promise.all([
          axios.get(`${apiUrl}/plans/${planId}/settings`),
          axios.get(`${apiUrl}/plans/${planId}/users`),
        ]);
        setNameA(settingsRes.data.name_A);
        setNameB(settingsRes.data.name_B);
        setUsers(usersRes.data || []);
      } catch (err) {
        console.error('Kunde inte ladda inställningar/användare', err);
      }
    };
    load();
  }, [apiUrl, planId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await axios.post(`${apiUrl}/plans/${planId}/settings`, {
        name_A: nameA,
        name_B: nameB,
      });
      if (onUpdateNames) {
        onUpdateNames({ A: nameA, B: nameB });
      }
      setSuccess('Inställningar sparade!');
      window.setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Kunde inte spara inställningar', error);
      alert('Fel vid sparande');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNameChange = async (e) => {
    e.preventDefault();
    setNameLoading(true);
    try {
      await axios.post(`${apiUrl}/plans/${planId}/name`, { name: newPlanName });
      if (onUpdatePlanName) {
        onUpdatePlanName(newPlanName);
      }
      setShowNameModal(false);
      setSuccess('Plannamn uppdaterat!');
      window.setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Kunde inte ändra namn på plan', error);
      alert('Fel vid namnbyte');
    } finally {
      setNameLoading(false);
    }
  };

  return (
    <div className="max-w-3xl">
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-start gap-3 animate-slideDown">
          <svg
            className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-green-800 text-sm flex-1">{success}</p>
        </div>
      )}

      {/* Plan name section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg
              className="w-6 h-6 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900">Planens namn</h4>
            <p className="text-sm text-gray-600">{planName}</p>
          </div>
          <button
            type="button"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow flex items-center gap-2"
            onClick={() => setShowNameModal(true)}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Ändra
          </button>
        </div>
      </div>

      {/* Person names section */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg
              className="w-6 h-6 text-purple-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900">Personer i planen</h4>
            <p className="text-sm text-gray-600">
              Ange namn för matpreferenser i veckoplaneraren
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Person A
            </label>
            <input
              className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              value={nameA}
              onChange={(e) => setNameA(e.target.value)}
              placeholder="T.ex. Kalle"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Person B
            </label>
            <input
              className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              value={nameB}
              onChange={(e) => setNameB(e.target.value)}
              placeholder="T.ex. Lisa"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
          <button
            type="submit"
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 shadow-sm hover:shadow-md flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Sparar...
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Spara ändringar
              </>
            )}
          </button>
        </div>
      </form>

      {/* Users list */}
      {users.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">
                Deltagare i planen
              </h4>
              <p className="text-sm text-gray-600">{users.length} användare</p>
            </div>
          </div>
          <div className="space-y-2">
            {users.map((u, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
              >
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {u.email?.[0]?.toUpperCase() || '?'}
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {u.email}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal for changing plan name */}
      {showNameModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-slideUp">
            <div className="p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Ändra plannamn
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Välj ett nytt namn för din matplan
              </p>
              <form onSubmit={handleNameChange} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nytt namn
                  </label>
                  <input
                    className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    value={newPlanName}
                    onChange={(e) => setNewPlanName(e.target.value)}
                    placeholder="T.ex. Familjen Anderssons matplan"
                    autoFocus
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowNameModal(false)}
                    className="px-6 py-3 text-gray-700 font-semibold hover:bg-gray-100 rounded-lg transition-all"
                  >
                    Avbryt
                  </button>
                  <button
                    type="submit"
                    disabled={nameLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 shadow-sm hover:shadow-md flex items-center gap-2"
                  >
                    {nameLoading ? (
                      <>
                        <svg
                          className="animate-spin h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Sparar...
                      </>
                    ) : (
                      'Spara'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AccountTabContent({ user, onLogout }) {
  return (
    <div className="max-w-3xl">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg
              className="w-6 h-6 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900">Din profil</h4>
            <p className="text-sm text-gray-600">
              Kontoinformation och inställningar
            </p>
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
              {user?.email?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <p className="text-xs text-blue-700 font-medium">Inloggad som</p>
              <p className="text-base font-semibold text-blue-900">
                {user?.email}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-red-50 rounded-xl border-2 border-red-200 p-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg
              className="w-6 h-6 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-red-900 mb-1">Logga ut</h4>
            <p className="text-sm text-red-700 mb-4">
              Du kommer att loggas ut från din session
            </p>
            <button
              onClick={onLogout}
              className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Logga ut
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
