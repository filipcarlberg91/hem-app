import React, { useState } from 'react';
import {
  Plus,
  Camera,
  Link2,
  Star,
  Clock,
  Users,
  ShoppingBag,
  Trash2,
  X,
  UtensilsCrossed,
  Loader2,
} from 'lucide-react';
import { RecipeIngredient, RecipeItem } from '../types';
import {
  extractRecipeFromImage,
  extractRecipeFromUrl,
} from '../utils/recipeExtractorClient';
import { CameraModal } from './CameraModal';

interface RecipesViewProps {
  recipes: RecipeItem[];
  onAddRecipe: (recipe: Omit<RecipeItem, 'id' | 'createdAt'>) => void;
  onUpdateRating: (id: string, rating: number) => void;
  onToggleFavorite: (id: string) => void;
  onDeleteRecipe: (id: string) => void;
  onSendIngredientsToShopping: (ingredients: RecipeIngredient[], recipeTitle: string) => void;
}

export const RecipesView: React.FC<RecipesViewProps> = ({
  recipes,
  onAddRecipe,
  onUpdateRating,
  onToggleFavorite,
  onDeleteRecipe,
  onSendIngredientsToShopping,
}) => {
  const [selectedTag, setSelectedTag] = useState<string>('Alla');
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'rating-desc' | 'newest' | 'title'>('rating-desc');
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeItem | null>(null);

  // Add Recipe Modals
  const [showManualModal, setShowManualModal] = useState(false);
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [recipeUrlInput, setRecipeUrlInput] = useState('');

  // Manual form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [prepTime, setPrepTime] = useState('30 min');
  const [servings, setServings] = useState(4);
  const [rating, setRating] = useState(5);
  const [tagsInput, setTagsInput] = useState('Vardagsmat, Snabbt');
  const [ingredientsText, setIngredientsText] = useState(
    '500 g Laxfilé\n3 dl Crème fraiche\n1 st Citron'
  );
  const [stepsText, setStepsText] = useState(
    'Skär råvarorna och förbered såsen.\nTillaga på medelvärme och servera direkt.'
  );
  const [capturedImageUrl, setCapturedImageUrl] = useState<string | undefined>(undefined);
  const [sourceType, setSourceType] = useState<'manual' | 'camera' | 'url'>('manual');
  const [favorite, setFavorite] = useState(false);

  // Gather unique tags across all recipes
  const allTags = Array.from(
    new Set(recipes.flatMap((r) => r.tags.map((t) => t.trim())).filter(Boolean))
  );

  // Filter & Sort
  const filteredRecipes = recipes
    .filter((r) => {
      if (selectedTag !== 'Alla' && !r.tags.includes(selectedTag)) return false;
      if (r.rating < minRating) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'rating-desc') return b.rating - a.rating;
      if (sortBy === 'title') return a.title.localeCompare(b.title, 'sv');
      return b.createdAt.localeCompare(a.createdAt);
    });

  const openBlankManualModal = () => {
    setTitle('');
    setDescription('');
    setPrepTime('30 min');
    setServings(4);
    setRating(5);
    setTagsInput('Vardagsmat, Hemlagat');
    setIngredientsText('');
    setStepsText('');
    setCapturedImageUrl(undefined);
    setSourceType('manual');
    setFavorite(false);
    setShowManualModal(true);
  };

  const populateFormFromExtracted = (
    data: any,
    source: 'camera' | 'url',
    imgUrl?: string
  ) => {
    setTitle(data.title || 'Nytt tolkat recept');
    setDescription(data.description || '');
    setPrepTime(data.prepTime || '30 min');
    setServings(Number(data.servings) || 4);
    setRating(5);
    setTagsInput(Array.isArray(data.tags) ? data.tags.join(', ') : 'Importerat');
    const ingLines = Array.isArray(data.ingredients)
      ? data.ingredients
          .map((i: any) => `${i.amount || 1} ${i.unit || 'st'} ${i.name || ''}`)
          .join('\n')
      : '';
    setIngredientsText(ingLines);
    const stepLines = Array.isArray(data.steps) ? data.steps.join('\n') : '';
    setStepsText(stepLines);
    setCapturedImageUrl(imgUrl);
    setSourceType(source);
    setFavorite(true);
    setShowManualModal(true);
  };

  const handleCameraCapture = async (base64DataUrl: string, mimeType: string) => {
    setIsExtracting(true);
    setExtractError(null);
    try {
      const data = await extractRecipeFromImage(base64DataUrl, mimeType);
      populateFormFromExtracted(data, 'camera', base64DataUrl);
    } catch (err: any) {
      setExtractError(err.message || 'Fel vid bildtolkning.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleUrlExtract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipeUrlInput.trim()) return;
    setIsExtracting(true);
    setExtractError(null);
    try {
      const data = await extractRecipeFromUrl(recipeUrlInput.trim());
      setShowUrlModal(false);
      populateFormFromExtracted(data, 'url', data.imageUrl);
    } catch (err: any) {
      const rawMsg = String(err?.message || '');
      const cleanMsg =
        rawMsg.includes('RESOURCE_EXHAUSTED') || rawMsg.includes('402')
          ? 'Kunde inte nå receptsidan direkt. Kontrollera länken och försök igen.'
          : rawMsg || 'Kunde inte tolka URL.';
      setExtractError(cleanMsg);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleManualSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const parsedIngredients: RecipeIngredient[] = ingredientsText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const match = line.match(/^(\d+(?:[.,]\d+)?)\s+(\S+)\s+(.+)$/);
        if (match) {
          return {
            amount: parseFloat(match[1].replace(',', '.')),
            unit: match[2],
            name: match[3],
          };
        }
        return { name: line, amount: 1, unit: 'st' };
      });

    const parsedSteps = stepsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    onAddRecipe({
      title: title.trim(),
      description: description.trim() || 'Gott hemlagat recept.',
      prepTime: prepTime.trim() || '30 min',
      servings: Number(servings) || 4,
      rating,
      tags: parsedTags.length > 0 ? parsedTags : ['Vardagsmat'],
      ingredients: parsedIngredients,
      steps: parsedSteps.length > 0 ? parsedSteps : ['Tillaga enligt instruktion.'],
      imageUrl: capturedImageUrl,
      sourceType,
      sourceUrl: sourceType === 'url' ? recipeUrlInput : undefined,
      favorite,
    });
    setShowManualModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-3xl bg-white border border-[#D8E6DD] p-6">
        <div>
          <h1 className="text-2xl font-extrabold text-[#141E18]">Recept</h1>
          <p className="mt-1 text-xs text-[#54685C]">
            Lägg in recept manuellt, via foto eller URL · Sortera på taggar eller betyg (0–5 stjärnor)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowCameraModal(true)}
            className="min-h-[44px] rounded-2xl bg-[#E7F3EC] px-4 py-2 text-xs font-bold text-[#183D2C] hover:bg-[#D8F3E3] flex items-center gap-2 whitespace-nowrap"
          >
            <Camera className="h-4 w-4" />
            Via foto / kamera
          </button>
          <button
            onClick={() => {
              setExtractError(null);
              setRecipeUrlInput('');
              setShowUrlModal(true);
            }}
            className="min-h-[44px] rounded-2xl bg-[#E7F3EC] px-4 py-2 text-xs font-bold text-[#183D2C] hover:bg-[#D8F3E3] flex items-center gap-2 whitespace-nowrap"
          >
            <Link2 className="h-4 w-4" />
            Importera via URL
          </button>
          <button
            onClick={openBlankManualModal}
            className="min-h-[44px] rounded-2xl bg-[#183D2C] px-4 py-2 text-xs font-bold text-white hover:bg-[#0F291E] flex items-center gap-2 whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            Lägg in manuellt
          </button>
        </div>
      </div>

      {/* Extraction Loading Banner */}
      {isExtracting && (
        <div className="rounded-3xl bg-[#183D2C] text-white p-5 flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-[#A6F2C6]" />
          <span className="text-sm font-semibold">
            Tolkar receptet, ingredienser och mått på svenska...
          </span>
        </div>
      )}

      {extractError && (
        <div className="rounded-2xl bg-[#FADAD8] text-[#9E2A2B] p-4 text-xs font-semibold flex items-center justify-between">
          <span>{extractError}</span>
          <button onClick={() => setExtractError(null)} className="underline">
            Stäng
          </button>
        </div>
      )}

      {/* Tag & Rating Filter Toolbar */}
      <div className="rounded-3xl bg-white border border-[#D8E6DD] p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 flex-wrap">
          {['Alla', ...allTags].map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`min-h-[36px] rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                selectedTag === tag
                  ? 'bg-[#183D2C] text-white'
                  : 'bg-[#EBF3EE] text-[#38493F] hover:text-[#141E18]'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#2E4035]">
            <span>Minsta betyg:</span>
            <select
              value={minRating}
              onChange={(e) => setMinRating(Number(e.target.value))}
              className="min-h-[38px] rounded-xl bg-[#F6FBF7] border border-[#CDE0D4] px-3 py-1.5 text-xs font-mono tabular-nums"
            >
              <option value={0}>Alla (0–5 ★)</option>
              <option value={3}>Minst 3 ★</option>
              <option value={4}>Minst 4 ★</option>
              <option value={5}>Endast 5 ★</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-[#2E4035]">
            <span>Sortera:</span>
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as 'rating-desc' | 'newest' | 'title')
              }
              className="min-h-[38px] rounded-xl bg-[#F6FBF7] border border-[#CDE0D4] px-3 py-1.5 text-xs"
            >
              <option value="rating-desc">Högst betyg (5–0 ★)</option>
              <option value="newest">Senast tillagda</option>
              <option value="title">Bokstavsordning (A–Ö)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Recipes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRecipes.map((rec) => (
          <div
            key={rec.id}
            className="rounded-3xl bg-white border border-[#D8E6DD] overflow-hidden flex flex-col justify-between"
          >
            <div>
              {/* Visual Cover / Custom Artwork Fallback */}
              <div
                onClick={() => setSelectedRecipe(rec)}
                className="relative aspect-4/3 bg-gradient-to-br from-[#183D2C] via-[#255C43] to-[#0E241A] cursor-pointer overflow-hidden flex items-center justify-center"
              >
                {rec.imageUrl ? (
                  <img
                    src={rec.imageUrl}
                    alt={rec.title}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="p-6 text-center text-[#D8F3E3] flex flex-col items-center">
                    <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center mb-3">
                      <UtensilsCrossed className="h-7 w-7 text-[#A6F2C6]" />
                    </div>
                    <span className="text-xs font-mono uppercase tracking-wider text-[#A6F2C6]">
                      {rec.tags.join(' · ')}
                    </span>
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent flex items-end justify-between p-4">
                  <div className="text-xs text-white/90 font-mono tabular-nums">
                    {rec.prepTime} · {rec.servings} port
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(rec.id);
                    }}
                    className={`flex h-9 w-9 items-center justify-center rounded-xl backdrop-blur-xs ${
                      rec.favorite
                        ? 'bg-[#FDF1E1] text-[#B86B11]'
                        : 'bg-black/40 text-white hover:bg-black/60'
                    }`}
                    title="Favoritmarkera recept"
                  >
                    <Star className={`h-4 w-4 ${rec.favorite ? 'fill-current' : ''}`} />
                  </button>
                </div>
              </div>

              <div className="p-5">
                <h2
                  onClick={() => setSelectedRecipe(rec)}
                  className="text-lg font-bold text-[#141E18] hover:text-[#183D2C] cursor-pointer"
                >
                  {rec.title}
                </h2>
                <p className="mt-1 text-xs text-[#54685C] line-clamp-2 leading-relaxed">
                  {rec.description}
                </p>

                {/* Clean unboxed metadata */}
                <div className="mt-2.5 text-xs text-[#4E6357]">
                  {rec.tags.join(' · ')}
                </div>

                {/* Interactive 0-5 Star Rating */}
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((starValue) => (
                      <button
                        key={starValue}
                        type="button"
                        onClick={() =>
                          onUpdateRating(rec.id, rec.rating === starValue ? 0 : starValue)
                        }
                        className="p-1 text-[#B86B11] hover:scale-110 transition-transform"
                        title={`Sätt betyg ${starValue} av 5`}
                      >
                        <Star
                          className={`h-4 w-4 ${
                            starValue <= rec.rating
                              ? 'fill-[#B86B11] text-[#B86B11]'
                              : 'text-[#C5D4CA]'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="ml-1 text-xs font-bold font-mono tabular-nums text-[#38493F]">
                      {rec.rating}/5
                    </span>
                  </div>

                  <button
                    onClick={() => onDeleteRecipe(rec.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-[#9E2A2B] hover:bg-[#FADAD8]"
                    title="Ta bort recept"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="px-5 pb-5 pt-2 flex items-center gap-2">
              <button
                onClick={() => setSelectedRecipe(rec)}
                className="flex-1 min-h-[42px] rounded-2xl bg-[#E7F3EC] px-3 py-2 text-xs font-bold text-[#183D2C] hover:bg-[#D8F3E3] whitespace-nowrap"
              >
                Visa recept
              </button>
              <button
                onClick={() => onSendIngredientsToShopping(rec.ingredients, rec.title)}
                className="min-h-[42px] rounded-2xl bg-[#183D2C] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#0F291E] flex items-center gap-1.5 whitespace-nowrap"
                title="Lägg alla ingredienser i den självsorterande inköpslistan"
              >
                <ShoppingBag className="h-3.5 w-3.5" />
                <span>Till inköp</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Recipe Detail Modal */}
      {selectedRecipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-[#F6FBF7] border border-[#CDE0D4] p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-semibold text-[#21513B]">
                  {selectedRecipe.tags.join(' · ')}
                </div>
                <h2 className="mt-1 text-2xl font-extrabold text-[#141E18]">
                  {selectedRecipe.title}
                </h2>
                <p className="mt-1 text-sm text-[#4E6357]">{selectedRecipe.description}</p>
              </div>
              <button
                onClick={() => setSelectedRecipe(null)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#38493F] hover:bg-[#E3EFE7]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-xs text-[#2E4035] font-mono tabular-nums border-y border-[#DCEAE1] py-3">
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-[#183D2C]" />
                Tillagningstid: {selectedRecipe.prepTime}
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-[#183D2C]" />
                Portioner: {selectedRecipe.servings} st
              </span>
              <span>Betyg: {selectedRecipe.rating}/5 ★</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-5 rounded-2xl bg-white border border-[#DCEAE1] p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-[#141E18]">Ingredienser</h3>
                  <button
                    onClick={() => {
                      onSendIngredientsToShopping(
                        selectedRecipe.ingredients,
                        selectedRecipe.title
                      );
                      setSelectedRecipe(null);
                    }}
                    className="text-xs font-bold text-[#183D2C] hover:underline flex items-center gap-1"
                  >
                    <ShoppingBag className="h-3.5 w-3.5" />
                    Lägg i inköp
                  </button>
                </div>
                <ul className="space-y-2 text-sm text-[#2E4035]">
                  {selectedRecipe.ingredients.map((ing, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between border-b border-[#F1F6F3] pb-1.5 last:border-none"
                    >
                      <span>{ing.name}</span>
                      <span className="font-mono tabular-nums font-semibold text-[#183D2C]">
                        {ing.amount} {ing.unit}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="md:col-span-7 rounded-2xl bg-white border border-[#DCEAE1] p-5">
                <h3 className="text-sm font-bold text-[#141E18] mb-3">Gör så här</h3>
                <ol className="space-y-3 text-sm text-[#2E4035]">
                  {selectedRecipe.steps.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#D8F3E3] text-[#183D2C] text-xs font-bold font-mono tabular-nums">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* URL Import Modal */}
      {showUrlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <form
            onSubmit={handleUrlExtract}
            className="w-full max-w-md rounded-3xl bg-[#F6FBF7] border border-[#CDE0D4] p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#141E18]">Hämta recept via URL</h3>
              <button
                type="button"
                onClick={() => setShowUrlModal(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full text-[#38493F] hover:bg-[#E3EFE7]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs text-[#4E6357]">
              Klistra in valfri receptlänk så hämtas ingredienser, mått och tillagningssteg automatiskt på svenska.
            </p>
            <input
              type="url"
              required
              value={recipeUrlInput}
              onChange={(e) => setRecipeUrlInput(e.target.value)}
              placeholder="https://..."
              className="w-full min-h-[44px] rounded-2xl bg-white border border-[#CDE0D4] px-4 py-2 text-sm"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowUrlModal(false)}
                className="min-h-[44px] rounded-2xl px-4 py-2 text-xs font-semibold text-[#38493F]"
              >
                Avbryt
              </button>
              <button
                type="submit"
                disabled={isExtracting}
                className="min-h-[44px] rounded-2xl bg-[#183D2C] px-5 py-2 text-xs font-semibold text-white hover:bg-[#0F291E] flex items-center gap-2"
              >
                {isExtracting && <Loader2 className="h-4 w-4 animate-spin" />}
                Hämta & tolka recept
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Manual / Review Extracted Recipe Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <form
            onSubmit={handleManualSave}
            className="w-full max-w-xl rounded-3xl bg-[#F6FBF7] border border-[#CDE0D4] p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#141E18]">
                {sourceType === 'camera'
                  ? 'Granska skannat kamerarecept'
                  : sourceType === 'url'
                  ? 'Granska importerat URL-recept'
                  : 'Lägg till recept manuellt'}
              </h3>
              <button
                type="button"
                onClick={() => setShowManualModal(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full text-[#38493F] hover:bg-[#E3EFE7]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2E4035] mb-1">Receptnamn</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="t.ex. Kantarellrisotto med västerbottensost"
                className="w-full min-h-[44px] rounded-2xl bg-white border border-[#CDE0D4] px-4 py-2 text-sm font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2E4035] mb-1">Beskrivning</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Kort beskrivning av rätten..."
                className="w-full min-h-[44px] rounded-2xl bg-white border border-[#CDE0D4] px-4 py-2 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#2E4035] mb-1">Tid</label>
                <input
                  type="text"
                  value={prepTime}
                  onChange={(e) => setPrepTime(e.target.value)}
                  placeholder="35 min"
                  className="w-full min-h-[44px] rounded-2xl bg-white border border-[#CDE0D4] px-3 py-2 text-sm font-mono tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#2E4035] mb-1">Portioner</label>
                <input
                  type="number"
                  min={1}
                  value={servings}
                  onChange={(e) => setServings(Number(e.target.value))}
                  className="w-full min-h-[44px] rounded-2xl bg-white border border-[#CDE0D4] px-3 py-2 text-sm font-mono tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#2E4035] mb-1">
                  Betyg (0–5 ★)
                </label>
                <select
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  className="w-full min-h-[44px] rounded-2xl bg-white border border-[#CDE0D4] px-3 py-2 text-sm font-mono tabular-nums"
                >
                  {[5, 4, 3, 2, 1, 0].map((r) => (
                    <option key={r} value={r}>
                      {r} stjärnor
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2E4035] mb-1">
                Taggar (separera med kommatecken)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="Vardagsmat, Vegetariskt, Snabbt"
                className="w-full min-h-[44px] rounded-2xl bg-white border border-[#CDE0D4] px-4 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2E4035] mb-1">
                Ingredienser (en per rad, t.ex. "500 g Laxfilé")
              </label>
              <textarea
                rows={4}
                value={ingredientsText}
                onChange={(e) => setIngredientsText(e.target.value)}
                className="w-full rounded-2xl bg-white border border-[#CDE0D4] px-4 py-2.5 text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2E4035] mb-1">
                Tillagningssteg (ett steg per rad)
              </label>
              <textarea
                rows={4}
                value={stepsText}
                onChange={(e) => setStepsText(e.target.value)}
                className="w-full rounded-2xl bg-white border border-[#CDE0D4] px-4 py-2.5 text-sm"
              />
            </div>

            <label className="flex items-center gap-2.5 text-sm font-medium text-[#141E18] cursor-pointer">
              <input
                type="checkbox"
                checked={favorite}
                onChange={(e) => setFavorite(e.target.checked)}
                className="h-4 w-4 accent-[#183D2C]"
              />
              Fäst som favorit på startsidan
            </label>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowManualModal(false)}
                className="min-h-[44px] rounded-2xl px-5 py-2.5 text-xs font-semibold text-[#38493F]"
              >
                Avbryt
              </button>
              <button
                type="submit"
                className="min-h-[44px] rounded-2xl bg-[#183D2C] px-6 py-2.5 text-xs font-semibold text-white hover:bg-[#0F291E]"
              >
                Spara recept
              </button>
            </div>
          </form>
        </div>
      )}

      {/* WebRTC Camera Modal */}
      <CameraModal
        open={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        onCapture={handleCameraCapture}
      />
    </div>
  );
};
