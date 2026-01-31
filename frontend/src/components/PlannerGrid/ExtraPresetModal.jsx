import { useState, useEffect } from 'react';
import { Popcorn, Sandwich, Salad, FileText } from 'lucide-react';

/**
 * ExtraPresetModal - Modal for selecting an extra meal preset
 */
const DEFAULT_PRESETS = [
  { id: 'snack', name: 'Snack', Icon: Popcorn },
  { id: 'mellanmål', name: 'Mellanmål', Icon: Sandwich },
  { id: 'tillbehör', name: 'Tillbehör', Icon: Salad },
  { id: 'övrigt', name: 'Övrigt', Icon: FileText },
];

export default function ExtraPresetModal({
  day,
  planId,
  apiUrl,
  onSelectPreset,
  onCancel,
}) {
  const [presets] = useState(DEFAULT_PRESETS);
  const [loading] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">
          Välj extra måltid
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {presets.map((preset) => {
                const Icon = preset.Icon;
                return (
                  <button
                    key={preset.name}
                    onClick={() => onSelectPreset(preset.name)}
                    className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all font-semibold text-gray-700 hover:text-blue-600"
                  >
                    <Icon className="w-8 h-8" />
                    <span className="text-sm">{preset.name}</span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={onCancel}
              className="w-full py-2 px-4 rounded-lg border border-gray-300 text-gray-600 font-semibold hover:bg-gray-50 transition-all"
            >
              Avbryt
            </button>
          </>
        )}
      </div>
    </div>
  );
}
