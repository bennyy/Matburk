import { useState } from 'react';
import axios from 'axios';
import {
  X,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  Loader2,
  Plus,
} from 'lucide-react';

/**
 * BulkImportRecipes - Component for bulk importing recipes from CSV/TSV data
 *
 * Expected format (semicolon-separated):
 * title;tags;recipe_url;image_url;portions
 *
 * - title: Required, recipe name
 * - tags: Optional, comma-separated tag list
 * - recipe_url: Optional, URL to recipe
 * - image_url: Optional, URL to recipe image
 * - portions: Optional, number of portions (defaults to 4)
 * - Use 'null' to skip a field
 */
export default function BulkImportRecipes({
  onImported,
  apiUrl,
  planId,
  onClose,
}) {
  const [csvData, setCsvData] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [showExample, setShowExample] = useState(false);

  const exampleData = `Spaghetti Bolognese;Italienskt, Pasta;https://example.com/bolognese;https://example.com/bolognese.jpg;4
Kyckling Curry;Asiatiskt, Kryddigt, Lätt;https://example.com/curry;null;3
Vegetarisk Lasagne;Italienskt, Vegetariskt;null;https://example.com/lasagne.jpg;6
Tacos;Mexikanskt, Snabbt;https://example.com/tacos;null;4`;

  const handleImport = async (e) => {
    e.preventDefault();
    console.log('handleImport called');

    if (!csvData.trim()) {
      alert('Vänligen klistra in receptdata');
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('csv_data', csvData);

      console.log(
        'Making POST request to:',
        `${apiUrl}/plans/${planId}/recipes/bulk/import`
      );
      console.log('CSV Data length:', csvData.length);

      const response = await axios.post(
        `${apiUrl}/plans/${planId}/recipes/bulk/import`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );

      console.log('Response received:', response.data);

      setResult(response.data);
      setCsvData('');

      // Auto-close modal after 2 seconds only if import was fully successful (no errors)
      if (response.data.errors === 0) {
        setTimeout(() => {
          onImported();
        }, 2000);
      }
    } catch (error) {
      console.error('Error importing recipes:', error);
      setResult({
        created: 0,
        errors: 1,
        error_messages: [
          error.response?.data?.detail || 'Kunde inte importera recepten',
        ],
        total: 1,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
          <h2 className="text-xl font-bold text-gray-900">
            Massimportera recept
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Stäng"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Format</h3>
            <p className="text-sm text-blue-800 mb-2">
              Använd semikolon (;) för att separera fälten. Komman (,) för att
              separera taggar.
            </p>
            <code className="text-xs bg-white p-2 rounded block text-gray-700 overflow-x-auto">
              title;tags;recipe_url;image_url;portions
            </code>
            <div className="mt-2 text-sm text-blue-800">
              <p>
                • <strong>title</strong> (obligatorisk): Receptets namn
              </p>
              <p>
                • <strong>tags</strong> (valfri): Kommaseparerade taggar
              </p>
              <p>
                • <strong>recipe_url</strong> (valfri): Länk till originalrecept
              </p>
              <p>
                • <strong>image_url</strong> (valfri): Länk till bild
              </p>
              <p>
                • <strong>portions</strong> (valfri): Antal portioner (standard:
                4)
              </p>
              <p className="mt-2">
                • Använd "null" för att hoppa över ett fält
              </p>
            </div>
          </div>

          {/* Example Toggle */}
          <button
            type="button"
            onClick={() => setShowExample(!showExample)}
            className="text-sm text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
          >
            {showExample ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
            {showExample ? 'Dölj exempel' : 'Visa exempel'}
          </button>

          {/* Example Data */}
          {showExample && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-gray-700 mb-2">
                Exempel:
              </p>
              <pre className="text-xs bg-white p-3 rounded overflow-x-auto border border-gray-200">
                {exampleData}
              </pre>
              <button
                type="button"
                onClick={() => setCsvData(exampleData)}
                className="mt-2 text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200"
              >
                Kopiera exempel
              </button>
            </div>
          )}

          {/* CSV Input */}
          <form onSubmit={handleImport} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Receptdata
              </label>
              <textarea
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all font-mono text-sm placeholder-gray-400 resize-none"
                rows="10"
                placeholder="Klistra in dina recept här..."
                value={csvData}
                onChange={(e) => setCsvData(e.target.value)}
                aria-label="Receptdata"
              />
              <p className="text-xs text-gray-500 mt-1">
                Varje rad är ett recept. Använd semikolon för att separera
                fälten.
              </p>
            </div>

            {/* Result Display */}
            {result && (
              <div
                className={`p-4 rounded-lg border-2 ${
                  result.errors === 0
                    ? 'bg-green-50 border-green-200'
                    : result.created > 0
                      ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-start gap-2">
                  <CheckCircle
                    className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                      result.errors === 0
                        ? 'text-green-600'
                        : result.created > 0
                          ? 'text-yellow-600'
                          : 'text-red-600'
                    }`}
                  />
                  <div className="flex-1">
                    <h4
                      className={`font-semibold ${
                        result.errors === 0
                          ? 'text-green-900'
                          : result.created > 0
                            ? 'text-yellow-900'
                            : 'text-red-900'
                      }`}
                    >
                      Importresultat
                    </h4>
                    <p
                      className={`text-sm mt-1 ${
                        result.errors === 0
                          ? 'text-green-800'
                          : result.created > 0
                            ? 'text-yellow-800'
                            : 'text-red-800'
                      }`}
                    >
                      Skapat: <strong>{result.created}</strong> | Fel:{' '}
                      <strong>{result.errors}</strong>
                    </p>
                    {result.error_messages &&
                      result.error_messages.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {result.error_messages.map((msg, idx) => (
                            <p key={idx} className="text-xs text-red-700">
                              • {msg}
                            </p>
                          ))}
                        </div>
                      )}
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 rounded-lg font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all"
              >
                Avbryt
              </button>
              <button
                type="submit"
                disabled={isLoading || !csvData.trim()}
                className={`inline-flex items-center px-6 py-2 rounded-lg font-semibold text-white transition-all ${
                  isLoading || !csvData.trim()
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
                }`}
                aria-label="Importera recept"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                    Importerar...
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5 mr-2" />
                    Importera{' '}
                    {
                      csvData
                        .trim()
                        .split('\n')
                        .filter((l) => l.trim()).length
                    }{' '}
                    recept
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
