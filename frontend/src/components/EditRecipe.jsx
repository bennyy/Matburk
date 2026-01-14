import React, { useState } from 'react';
import axios from 'axios';
import TagInput from './TagInput'; // Se till att du har denna från förra steget

const EditRecipe = ({ recipe, onUpdated, onCancel, apiUrl }) => {
  const [name, setName] = useState(recipe.name);
  const [portions, setPortions] = useState(recipe.default_portions);
  const [tags, setTags] = useState(recipe.tags || '');
  const [notes, setNotes] = useState(recipe.notes || '');
  const [link, setLink] = useState(recipe.link || '');
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState(recipe?.image_url || '');

  // --- SPARA ÄNDRINGAR ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData();
    formData.append('name', name);
    formData.append('portions', portions);
    formData.append('tags', tags);
    formData.append('notes', notes);
    if (link) formData.append('link', link);
    if (file) formData.append('file', file);
    if (imageUrl) formData.append('image_url', imageUrl);

    try {
      await axios.put(`${apiUrl}/recipes/${recipe.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onUpdated();
    } catch (error) {
      console.error('Fel vid uppdatering', error);
      alert('Kunde inte uppdatera receptet.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- TA BORT RECEPT (SOFT DELETE) ---
  const handleDelete = async () => {
    if (
      window.confirm(
        'Är du säker på att du vill ta bort detta recept?\n(Det kan återställas i databasen, men försvinner från listan)'
      )
    ) {
      try {
        setIsLoading(true);
        await axios.delete(`${apiUrl}/recipes/${recipe.id}`);
        onUpdated(); // Uppdaterar listan så receptet försvinner
      } catch (error) {
        console.error('Kunde inte ta bort', error);
        alert('Fel vid borttagning');
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-lg">
          <h2 className="text-xl font-bold">Redigera recept</h2>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 font-bold text-xl"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
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
              />
            </div>
          </div>

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

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              Länk
            </label>
            <input
              type="url"
              className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
              value={link}
              onChange={(e) => setLink(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              Anteckningar
            </label>
            <textarea
              className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              Byt bild (lämna tom för att behålla)
            </label>
            <input
              type="file"
              className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              onChange={(e) => setFile(e.target.files[0])}
            />
          </div>

          {/* Bild URL */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              Eller klistra in bildlänk
            </label>
            <input
              type="url"
              className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              placeholder="https://exempel.se/bild.jpg"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
          </div>

          <hr className="my-2" />

          {/* FOOTER MED KNAPPAR */}
          <div className="flex justify-between items-center mt-2">
            {/* Vänster: TA BORT */}
            <button
              type="button"
              onClick={handleDelete}
              className="text-red-500 hover:text-red-700 text-sm font-bold px-2 py-1 hover:bg-red-50 rounded transition-colors"
            >
              🗑️ Ta bort recept
            </button>

            {/* Höger: AVBRYT / SPARA */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded"
              >
                Avbryt
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="bg-blue-600 text-white px-6 py-2 rounded font-bold hover:bg-blue-700 transition-colors"
              >
                {isLoading ? 'Sparar...' : 'Spara ändringar'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditRecipe;
