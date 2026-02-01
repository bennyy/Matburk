import {
  X,
  Clock,
  Edit3,
  Link as LinkIcon,
  UtensilsCrossed,
  Heart,
  ChefHat,
  FileText,
} from 'lucide-react';

const RecipeDetails = ({ recipe, onClose, onEdit }) => {
  if (!recipe) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* BILD HEADER */}
        <div className="relative h-64 bg-gradient-to-br from-gray-200 to-gray-300 w-full shrink-0">
          {recipe.image_url ? (
            <img
              src={recipe.image_url}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <UtensilsCrossed className="w-24 h-24" />
            </div>
          )}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-white hover:bg-gray-100 text-gray-800 rounded-full w-10 h-10 flex items-center justify-center font-bold shadow-md hover:shadow-lg transition-all border border-gray-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* INNEHÅLL */}
        <div className="p-6 space-y-6">
          {/* Titel och Actions */}
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {recipe.name}
              </h2>
              <div className="text-sm text-gray-600 flex items-center gap-2">
                <Clock className="w-4 h-4" />
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
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-semibold text-sm transition-all shadow-md hover:shadow-lg flex-shrink-0"
            >
              <Edit3 className="w-4 h-4" />
              Redigera
            </button>
          </div>

          {/* Statistik */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 border border-gray-200 px-4 py-3 rounded-lg font-semibold text-gray-900 shadow-sm flex items-center gap-2">
              <UtensilsCrossed className="w-5 h-5 text-blue-600" />
              <span>{recipe.default_portions} portioner</span>
            </div>
            <div className="bg-gray-50 border border-gray-200 px-4 py-3 rounded-lg font-semibold text-gray-900 shadow-sm flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-600" fill="currentColor" />
              <span>{recipe.vote_count} röster</span>
            </div>
            <div className="bg-gray-50 border border-gray-200 px-4 py-3 rounded-lg font-semibold text-gray-900 shadow-sm flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-green-600" />
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
                    className="bg-gray-100 text-gray-800 px-3 py-1.5 rounded-full text-sm font-medium border border-gray-300 shadow-sm hover:bg-gray-200 transition-colors"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            )}

          <hr className="border-gray-200" />

          {/* Anteckningar */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Anteckningar
            </h3>
            {recipe.notes ? (
              <p className="bg-gray-50 p-4 rounded-lg text-gray-800 whitespace-pre-wrap border border-gray-200 shadow-sm font-medium">
                {recipe.notes}
              </p>
            ) : (
              <p className="text-gray-500 italic font-medium">
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
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
              >
                <LinkIcon className="w-4 h-4" />
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
