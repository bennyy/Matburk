import { useState, useCallback } from 'react';
import axios from 'axios';
import { Trash2 } from 'lucide-react';

import TagInput from './TagInput';

/**
 * EditRecipe - Modal form for editing existing recipes
 *
 * Features:
 * - Update recipe info (name, portions, tags, notes, link)
 * - Change recipe image (file or URL)
 * - Soft delete recipe
 * - Confirmation dialogs for destructive actions
 */
export default function EditRecipe({
  recipe,
  apiUrl,
  planId,
  onUpdated,
  onCancel,
}) {
  // ========== STATE MANAGEMENT ==========
  const [name, setName] = useState(recipe.name);
  const [portions, setPortions] = useState(recipe.default_portions);
  // Convert tag objects to comma-separated string for editing
  const [tags, setTags] = useState(
    recipe.tags && Array.isArray(recipe.tags)
      ? recipe.tags
          .map((tag) => (typeof tag === 'string' ? tag : tag.name))
          .join(', ')
      : recipe.tags || ''
  );
  const [notes, setNotes] = useState(recipe.notes || '');
  const [link, setLink] = useState(recipe.link || '');
  const [imageUrl, setImageUrl] = useState(recipe?.image_url || '');
  const [isLoading, setIsLoading] = useState(false);

  // ========== HANDLERS ==========
  /**
   * Handle form submission - PUT updated recipe to backend
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
        await axios.put(
          `${apiUrl}/plans/${planId}/recipes/${recipe.id}`,
          formData,
          {
            headers: { 'Content-Type': 'multipart/form-data' },
          }
        );
        onUpdated();
      } catch (error) {
        console.error('Error updating recipe:', error);
        alert('Kunde inte uppdatera receptet.');
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
      recipe.id,
      apiUrl,
      planId,
      onUpdated,
    ]
  );

  /**
   * Handle recipe deletion - soft delete with confirmation
   */
  const handleDelete = useCallback(async () => {
    if (
      !window.confirm(
        'Är du säker på att du vill ta bort detta recept?\n(Det kan återställas i databasen, men försvinner från listan)'
      )
    ) {
      return;
    }

    try {
      setIsLoading(true);
      await axios.delete(`${apiUrl}/plans/${planId}/recipes/${recipe.id}`);
      onUpdated();
    } catch (error) {
      console.error('Error deleting recipe:', error);
      alert('Fel vid borttagning');
      setIsLoading(false);
    }
  }, [recipe.id, apiUrl, planId, onUpdated]);

  // ========== RENDER ==========
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-lg sticky top-0">
          <h2 className="text-xl font-bold text-gray-900">Redigera recept</h2>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 font-bold text-xl"
            aria-label="Stäng formulär"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6">
          {/* Recipe Name & Portions */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Namn
              </label>
              <input
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
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
              placeholder="Lägg till taggar..."
            />
          </div>

          {/* Recipe Link */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Länk
            </label>
            <input
              type="url"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              aria-label="Länk till originalrecept"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Anteckningar
            </label>
            <textarea
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
              rows="4"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              aria-label="Anteckningar om receptet"
            />
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Bildlänk (lämna tom för att behålla)
            </label>
            <input
              type="url"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
              placeholder="https://exempel.se/bild.jpg"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              aria-label="URL till receptbild"
            />
          </div>

          <hr className="border-gray-200" />

          {/* Form Footer - Delete & Action Buttons */}
          <div className="flex justify-between items-center">
            {/* Delete Button (Left) */}
            <button
              type="button"
              onClick={handleDelete}
              disabled={isLoading}
              className="text-red-600 hover:text-red-700 text-sm font-semibold px-3 py-2 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              aria-label="Ta bort receptet"
            >
              <Trash2 className="w-4 h-4" />
              Ta bort recept
            </button>

            {/* Action Buttons (Right) */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-gray-700 font-semibold hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                aria-label="Avbryt redigering"
              >
                Avbryt
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Spara ändringar"
              >
                {isLoading ? 'Sparar...' : 'Spara'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
