const RecipeDetails = ({ recipe, onClose, onEdit }) => {
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
        <div className="relative h-64 bg-gradient-to-br from-gray-200 to-gray-300 w-full shrink-0">
          {recipe.image_url ? (
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
            className="absolute top-4 right-4 bg-white hover:bg-gray-100 text-gray-800 rounded-full w-10 h-10 flex items-center justify-center font-bold shadow-lg hover:shadow-xl transition-all border border-gray-200"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* INNEHÅLL */}
        <div className="p-6 space-y-6">
          {/* Titel och Actions */}
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent mb-2">
                {recipe.name}
              </h2>
              <div className="text-sm text-gray-500 flex items-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Senast lagad:{' '}
                <span className="font-semibold text-gray-700">
                  {recipe.last_cooked_date || 'Aldrig'}
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                onEdit(recipe);
              }}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-4 py-2.5 rounded-lg font-bold text-sm transition-all shadow-md hover:shadow-lg flex-shrink-0"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Redigera
            </button>
          </div>

          {/* Taggar & Portioner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-300 px-4 py-3 rounded-lg font-semibold text-blue-800 shadow-sm flex items-center gap-2">
              {/* Plate with utensils icon - portions */}
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h12v2H6V4zm-1 4h2v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8h2V6h-2V4h-2v2H7V4H5v2H3v2zm2 2h10v10H7V10zm6 3h-2v4h2v-4zm-4 0H9v4h2v-4z" />
              </svg>
              <span>{recipe.default_portions} portioner</span>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-300 px-4 py-3 rounded-lg font-semibold text-red-800 shadow-sm flex items-center gap-2">
              {/* Heart icon - votes */}
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              <span>{recipe.vote_count} röster</span>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-300 px-4 py-3 rounded-lg font-semibold text-green-800 shadow-sm flex items-center gap-2">
              {/* Pot/cooking icon - meal count */}
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4 6h16v2H4V6zm1 3h14v9a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V9zm3-3V3h2v3h4V3h2v3h1a2 2 0 0 1 2 2v11a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8a2 2 0 0 1 2-2h1z" />
              </svg>
              <span>{recipe.meal_count || 0} använd</span>
            </div>
          </div>

          {/* Tags */}
          {recipe.tags &&
            Array.isArray(recipe.tags) &&
            recipe.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {recipe.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="bg-gray-200 text-gray-800 px-4 py-2 rounded-full text-sm font-semibold border border-gray-300 shadow-sm hover:bg-gray-300 transition-colors"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            )}

          <hr className="border-gray-200" />

          {/* Anteckningar */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-gray-600 mb-3 flex items-center gap-2">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Anteckningar
            </h3>
            {recipe.notes ? (
              <p className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-lg text-gray-800 whitespace-pre-wrap border border-amber-300 shadow-sm font-medium">
                {recipe.notes}
              </p>
            ) : (
              <p className="text-gray-400 italic font-medium">
                Inga anteckningar sparade.
              </p>
            )}
          </div>

          {/* Länk */}
          {recipe.link && (
            <div className="pt-2">
              <a
                href={recipe.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2.5 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.658 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  />
                </svg>
                Gå till originalreceptet
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecipeDetails;
