import React, { useState } from 'react';
import TagInput from './TagInput';
import axios from 'axios';

const AddRecipe = ({ onAdded, apiUrl }) => {
  const [name, setName] = useState('');
  const [portions, setPortions] = useState(4);
  const [tags, setTags] = useState('');
  const [notes, setNotes] = useState(''); // <--- Ny state
  const [link, setLink] = useState(''); // <--- Ny state (valfritt, men bra att ha)
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData();
    formData.append('name', name);
    formData.append('portions', portions);
    formData.append('tags', tags);
    formData.append('notes', notes); // <--- Skicka med notes
    if (link) formData.append('link', link);
    if (file) formData.append('file', file);
    if (imageUrl) formData.append('image_url', imageUrl);

    try {
      await axios.post(`${apiUrl}/recipes`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Återställ formulär
      setName('');
      setTags('');
      setNotes('');
      setLink('');
      setFile(null);
      onAdded(); // Stäng modalen och uppdatera listan
    } catch (error) {
      console.error('Fel vid sparande', error);
      alert('Kunde inte spara receptet.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 max-w-lg mx-auto"
    >
      <h2 className="text-xl font-bold mb-2">Lägg till nytt recept</h2>

      {/* Namn & Portioner */}
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

      {/* Taggar */}
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

      {/* Länk (Valfritt) */}
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
        />
      </div>

      {/* Anteckningar */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">
          Anteckningar
        </label>
        <textarea
          className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none"
          placeholder="T.ex. 'Använd extra mycket vitlök' eller 'Barnen gillar inte persiljan'"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {/* Bild */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">
          Bild
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

      <button
        type="submit"
        disabled={isLoading}
        className={`bg-green-600 text-white px-4 py-3 rounded font-bold hover:bg-green-700 transition-colors ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {isLoading ? 'Sparar...' : 'Spara Recept'}
      </button>
    </form>
  );
};

export default AddRecipe;
