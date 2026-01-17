import { useState } from 'react';
import axios from 'axios';

const SettingsModal = ({ currentNames, onClose, onSave, apiUrl }) => {
  const [nameA, setNameA] = useState(currentNames.A);
  const [nameB, setNameB] = useState(currentNames.B);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await axios.post(`${apiUrl}/settings`, {
        name_A: nameA,
        name_B: nameB,
      });
      onSave({ A: nameA, B: nameB }); // Uppdatera App state
      onClose();
    } catch (error) {
      console.error('Kunde inte spara inställningar', error);
      alert('Fel vid sparande');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4">Inställningar</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              Namn på Person A
            </label>
            <input
              className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
              value={nameA}
              onChange={(e) => setNameA(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              Namn på Person B
            </label>
            <input
              className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
              value={nameB}
              onChange={(e) => setNameB(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded"
            >
              Avbryt
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700"
            >
              {isLoading ? 'Sparar...' : 'Spara'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsModal;
