const RecipeDetails = ({ recipe, onClose, onEdit, apiUrl }) => {
  if (!recipe) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col"
        onClick={(e) => e.stopPropagation()} // Hindra klick inuti modalen från att stänga den
      >
        {/* BILD HEADER */}
        <div className="relative h-64 bg-gray-200 w-full shrink-0">
          {recipe.image_filename ? (
            <img
              src={`${apiUrl}/images/${recipe.image_filename}`}
              className="w-full h-full object-cover"
            />
          ) : recipe.image_url ? (
            <img
              src={recipe.image_url}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-6xl">
              🍽️
            </div>
          )}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-white/80 hover:bg-white text-gray-800 rounded-full w-8 h-8 flex items-center justify-center font-bold shadow transition-all"
          >
            ✕
          </button>
        </div>

        {/* INNEHÅLL */}
        <div className="p-6 space-y-6">
          {/* Titel och Actions */}
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold text-gray-800">
                {recipe.name}
              </h2>
              <div className="text-sm text-gray-500 mt-1">
                Senast lagad: {recipe.last_cooked_date || 'Aldrig'}
              </div>
            </div>
            <button
              onClick={() => {
                onEdit(recipe);
              }}
              className="flex items-center gap-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-3 py-1.5 rounded-lg font-bold text-sm transition-colors"
            >
              ✏️ Redigera
            </button>
          </div>

          {/* Taggar & Portioner */}
          <div className="flex flex-wrap gap-3 items-center">
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-bold">
              🥘 {recipe.default_portions} portioner
            </span>
            <span className="bg-pink-100 text-pink-800 px-3 py-1 rounded-full text-sm font-bold">
              ❤️ {recipe.vote_count} röster
            </span>
            <span className="bg-cyan-100 text-cyan-800 px-3 py-1 rounded-full text-sm font-bold">
              🥡 {recipe.meal_count || 0} gånger använd
            </span>
            {recipe.tags &&
              Array.isArray(recipe.tags) &&
              recipe.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm border"
                >
                  {tag.name}
                </span>
              ))}
          </div>

          <hr className="border-gray-100" />

          {/* Anteckningar */}
          <div>
            <h3 className="text-sm font-bold uppercase text-gray-500 mb-2">
              Anteckningar
            </h3>
            {recipe.notes ? (
              <p className="bg-yellow-50 p-4 rounded-lg text-gray-700 whitespace-pre-wrap border border-yellow-100">
                {recipe.notes}
              </p>
            ) : (
              <p className="text-gray-400 italic">Inga anteckningar sparade.</p>
            )}
          </div>

          {/* Länk */}
          {recipe.link && (
            <div className="pt-2">
              <a
                href={recipe.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-bold hover:underline"
              >
                🔗 Gå till originalreceptet
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecipeDetails;
