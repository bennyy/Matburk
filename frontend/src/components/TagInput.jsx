import { useState } from 'react';

const TagInput = ({ value, onChange, placeholder }) => {
  // Vi håller en intern input-state för det man skriver just nu
  const [inputValue, setInputValue] = useState('');

  // Konvertera den inkommande strängen (från databasen) till en array för att kunna visa blocken
  // Om value är "Pasta, Snabbt" -> ['Pasta', 'Snabbt']
  const tags = value
    ? value
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0)
    : [];

  const handleKeyDown = (e) => {
    // Om man trycker Enter eller Komma
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
    // Om man trycker Backspace och fältet är tomt -> ta bort sista taggen
    if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  const addTag = () => {
    const trimmedInput = inputValue.trim();
    // Lägg bara till om det finns text och taggen inte redan finns (case insensitive)
    if (
      trimmedInput &&
      !tags.some((t) => t.toLowerCase() === trimmedInput.toLowerCase())
    ) {
      const newTags = [...tags, trimmedInput];
      updateParent(newTags);
      setInputValue('');
    } else if (trimmedInput === '') {
      setInputValue(''); // Rensa om man bara skrev mellanslag
    }
  };

  const removeTag = (indexToRemove) => {
    const newTags = tags.filter((_, index) => index !== indexToRemove);
    updateParent(newTags);
  };

  // Hjälpfunktion för att skicka tillbaka strängen till föräldern (AddRecipe/EditRecipe)
  const updateParent = (newTagsArray) => {
    onChange(newTagsArray.join(', '));
  };

  return (
    <div
      className="flex flex-wrap items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-green-500 focus-within:border-transparent bg-white cursor-text transition-all"
      onClick={() => document.getElementById('tag-input-field').focus()}
    >
      {tags.map((tag, index) => (
        <span
          key={index}
          className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full flex items-center gap-1"
        >
          {tag}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              removeTag(index);
            }}
            className="text-green-600 hover:text-green-800 font-bold focus:outline-none ml-1"
          >
            &times;
          </button>
        </span>
      ))}

      <input
        id="tag-input-field"
        type="text"
        className="flex-1 outline-none min-w-[120px] text-sm placeholder-gray-400"
        placeholder={tags.length === 0 ? placeholder : ''}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        // Lägg till taggen om man klickar utanför (blur)
        onBlur={addTag}
      />
    </div>
  );
};

export default TagInput;
