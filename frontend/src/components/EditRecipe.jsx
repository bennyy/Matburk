import { useState, useCallback } from 'react';
import axios from 'axios';

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
export default function EditRecipe({ recipe, apiUrl, onUpdated, onCancel }) {
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
        await axios.put(`${apiUrl}/recipes/${recipe.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
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
      await axios.delete(`${apiUrl}/recipes/${recipe.id}`);
      onUpdated();
    } catch (error) {
      console.error('Error deleting recipe:', error);
      alert('Fel vid borttagning');
      setIsLoading(false);
    }
  }, [recipe.id, apiUrl, onUpdated]);

  // ========== RENDER ==========
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-lg sticky top-0">
          <h2 className="text-xl font-bold">Redigera recept</h2>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 font-bold text-xl"
            aria-label="Stäng formulär"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {/* Recipe Name & Portions */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Namn
              </label>
              <input
                className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                aria-label="Receptets namn"
              />
            </div>
            <div className="w-24">
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Portioner
              </label>
              <input
                type="number"
                className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                value={portions}
                onChange={(e) => setPortions(e.target.value)}
                aria-label="Antal portioner"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
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
            <label className="block text-sm font-bold text-gray-700 mb-1">
              Länk
            </label>
            <input
              type="url"
              className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              aria-label="Länk till originalrecept"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              Anteckningar
            </label>
            <textarea
              className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              aria-label="Anteckningar om receptet"
            />
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              Bildlänk (lämna tom för att behålla)
            </label>
            <input
              type="url"
              className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              placeholder="https://exempel.se/bild.jpg"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              aria-label="URL till receptbild"
            />
          </div>

          <hr className="my-2" />

          {/* Form Footer - Delete & Action Buttons */}
          <div className="flex justify-between items-center mt-2">
            {/* Delete Button (Left) */}
            <button
              type="button"
              onClick={handleDelete}
              disabled={isLoading}
              className="text-red-500 hover:text-red-700 text-sm font-bold px-2 py-1 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Ta bort receptet"
            >
              🗑️ Ta bort recept
            </button>

            {/* Action Buttons (Right) */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded transition-colors"
                aria-label="Avbryt redigering"
              >
                Avbryt
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="bg-blue-600 text-white px-6 py-2 rounded font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Spara ändringar"
              >
                {isLoading ? 'Sparar...' : 'Spara ändringar'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
