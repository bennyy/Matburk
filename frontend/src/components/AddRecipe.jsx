import { useState, useCallback } from 'react';
import axios from 'axios';

import TagInput from './TagInput';

/**
 * AddRecipe - Form for creating new recipes
 *
 * Handles recipe creation with:
 * - Basic info (name, portions)
 * - Tags, notes, and recipe link
 * - Image upload (file or URL)
 * - Form submission and validation
 */
export default function AddRecipe({ onAdded, apiUrl }) {
  // ========== STATE MANAGEMENT ==========
  const [name, setName] = useState('');
  const [portions, setPortions] = useState(4);
  const [tags, setTags] = useState('');
  const [notes, setNotes] = useState('');
  const [link, setLink] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
        await axios.post(`${apiUrl}/recipes`, formData, {
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
      onAdded,
      resetForm,
    ]
  );

  // ========== RENDER ==========
  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 max-w-lg mx-auto"
    >
      <h2 className="text-xl font-bold mb-2">Lägg till nytt recept</h2>

      {/* Recipe Name & Portions */}
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-sm font-bold text-gray-700 mb-1">
            Maträttens namn
          </label>
          <input
            className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="T.ex. Korvstroganoff"
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
          Taggar (komma-separerade)
        </label>
        <TagInput
          value={tags}
          onChange={setTags}
          placeholder="Skriv tagg och tryck Enter (t.ex. Snabbt, Pasta)"
        />
      </div>

      {/* Recipe Link */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">
          Länk till recept (valfritt)
        </label>
        <input
          type="url"
          className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="https://..."
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
          placeholder="T.ex. 'Använd extra mycket vitlök' eller 'Barnen gillar inte persiljan'"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          aria-label="Anteckningar om receptet"
        />
      </div>

      {/* Image URL */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">
          Bildlänk (valfritt)
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

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className={`bg-green-600 text-white px-4 py-3 rounded font-bold hover:bg-green-700 transition-colors ${
          isLoading ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        aria-label="Spara nytt recept"
      >
        {isLoading ? 'Sparar...' : 'Spara Recept'}
      </button>
    </form>
  );
}
