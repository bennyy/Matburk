import { useState, useCallback } from 'react';
import axios from 'axios';

import TagInput from './TagInput';
import BulkImportRecipes from './BulkImportRecipes';

/**
 * AddRecipe - Form for creating new recipes in a specific meal plan
 *
 * Handles recipe creation with:
 * - Basic info (name, portions)
 * - Tags, notes, and recipe link
 * - Image upload (file or URL)
 * - Form submission and validation
 */
export default function AddRecipe({ onAdded, apiUrl, planId }) {
  // ========== STATE MANAGEMENT ==========
  const [name, setName] = useState('');
  const [portions, setPortions] = useState(4);
  const [tags, setTags] = useState('');
  const [notes, setNotes] = useState('');
  const [link, setLink] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);

  // ========== HANDLERS ==========
  /**
   * Reset form fields to initial state
   */
  const resetForm = useCallback(() => {
    setName('');
    setPortions(4);
    setTags('');
    setNotes('');
    setLink('');
    setImageUrl('');
  }, []);

  /**
   * Handle form submission - POST new recipe to backend
   */
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setIsLoading(true);
      const formData = new FormData();
      formData.append('name', name);
      formData.append('portions', portions);
      formData.append('tags', tags);
      formData.append('notes', notes);
      if (link) formData.append('link', link);
      if (imageUrl) formData.append('image_url', imageUrl);

      try {
        await axios.post(`${apiUrl}/plans/${planId}/recipes`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        resetForm();
        onAdded();
      } catch (error) {
        console.error('Error saving recipe:', error);
        alert('Kunde inte spara receptet.');
      } finally {
        setIsLoading(false);
      }
    },
    [
      name,
      portions,
      tags,
      notes,
      link,
      imageUrl,
      apiUrl,
      planId,
      onAdded,
      resetForm,
    ]
  );

  // ========== RENDER ==========
  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Recipe Name & Portions Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Maträttens namn *
            </label>
            <input
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all placeholder-gray-400"
              placeholder="T.ex. Korvstroganoff"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              aria-label="Receptets namn"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Portioner
            </label>
            <input
              type="number"
              min="1"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              value={portions}
              onChange={(e) => setPortions(e.target.value)}
              aria-label="Antal portioner"
            />
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Taggar
          </label>
          <TagInput
            value={tags}
            onChange={setTags}
            placeholder="Skriv tagg och tryck Enter (t.ex. Snabbt, Pasta)"
          />
          <p className="text-xs text-gray-500 mt-1">
            Separera med kommatecken eller Enter
          </p>
        </div>

        {/* Recipe Link */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Länk till recept
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
            </div>
            <input
              type="url"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all placeholder-gray-400"
              placeholder="https://..."
              value={link}
              onChange={(e) => setLink(e.target.value)}
              aria-label="Länk till originalrecept"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Anteckningar
          </label>
          <textarea
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all placeholder-gray-400 resize-none"
            rows="3"
            placeholder="T.ex. 'Använd extra mycket vitlök' eller 'Barnen gillar inte persiljan'"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            aria-label="Anteckningar om receptet"
          />
        </div>

        {/* Image URL */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Bildlänk
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <input
              type="url"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all placeholder-gray-400"
              placeholder="https://exempel.se/bild.jpg"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              aria-label="URL till receptbild"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => setShowBulkImport(true)}
            className="inline-flex items-center px-6 py-3 rounded-lg font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all transform hover:scale-105"
            aria-label="Massimportera recept"
            title="Importera flera recept från CSV"
          >
            <svg
              className="w-5 h-5 mr-2"
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
            Massimportera
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className={`inline-flex items-center px-6 py-3 rounded-lg font-semibold text-white transition-all transform hover:scale-105 shadow-lg ${
              isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
            }`}
            aria-label="Spara nytt recept"
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Sparar...
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5 mr-2"
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
                Spara Recept
              </>
            )}
          </button>
        </div>
      </form>

      {/* Bulk Import Modal - Outside form to avoid reconciliation issues */}
      {showBulkImport && (
        <BulkImportRecipes
          onImported={() => {
            setShowBulkImport(false);
            onAdded();
          }}
          apiUrl={apiUrl}
          planId={planId}
          onClose={() => setShowBulkImport(false)}
        />
      )}
    </>
  );
}
