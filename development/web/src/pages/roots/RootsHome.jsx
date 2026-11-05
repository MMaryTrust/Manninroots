import { useState, useMemo } from 'react';
import { MapPin } from 'lucide-react';
import RootsShell from '../../components/roots/RootsShell';
import SearchBox from '../../components/roots/SearchBox';
import DishCard from '../../components/roots/DishCard';
import RestaurantChip from '../../components/roots/RestaurantChip';
import { useRootsI18n } from '../../lib/roots-i18n';
import { useApi } from '../../hooks';

const CATEGORIES = [
  { name: 'Dosa', nameTa: 'தோசை', bg: '#FFE4B5' },
  { name: 'Biryani', nameTa: 'பிரியாணி', bg: '#FFD7A8' },
  { name: 'Meals', nameTa: 'சாப்பாடு', bg: '#FFDAB9' },
  { name: 'Parotta', nameTa: 'பரோட்டா', bg: '#FFE4C4' },
  { name: 'Curry', nameTa: 'குழம்பு', bg: '#FFEAA7' },
  { name: 'Sweets', nameTa: 'இனிப்புகள்', bg: '#FFE0BD' },
];

const CATEGORY_EMOJI = {
  'Dosa': '🥘',
  'Biryani': '🍛',
  'Meals': '🍽️',
  'Parotta': '🥙',
  'Curry': '🌶️',
  'Sweets': '🍰',
};

export default function RootsHome() {
  const { t, lang } = useRootsI18n();
  const [catalog, error] = useApi('/roots/catalog', { settings: {}, restaurants: [] });
  const [selectedCategory, setSelectedCategory] = useState('');

  const { restaurants = [] } = catalog;

  const allDishes = useMemo(() => {
    return restaurants.flatMap((r) =>
      (r.dishes || []).map((d) => ({
        ...d,
        restId: r.id,
        restName: r.name,
        restTa: r.nameTa,
      }))
    );
  }, [restaurants]);

  const topDishes = useMemo(() => {
    let dishes = allDishes;
    if (selectedCategory) {
      dishes = dishes.filter((d) => d.cuisine === selectedCategory);
    }
    return dishes.sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 12);
  }, [allDishes, selectedCategory]);

  return (
    <RootsShell>
      <div className="space-y-8">
        {/* Location Header */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MapPin className="w-4 h-4" />
          <span>Delivering to: <strong>Pudukkottai Region</strong></span>
        </div>

        {/* Search */}
        <SearchBox />

        {/* Hero Section with gradient */}
        <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 rounded-2xl p-8 border border-amber-200">
          <h1 className="text-4xl font-serif font-bold text-amber-900 mb-2">
            மண்ணின் வேர்கள்
          </h1>
          <h2 className="text-2xl font-semibold text-amber-800 mb-3">
            Mannin Roots
          </h2>
          <p className="text-lg text-amber-700">
            {lang === 'ta' ? 'தமிழ்நாட்டின் சுவையுள்ள உணவு' : 'Taste of Tamil Nadu'}
          </p>
        </div>

        {/* Error Message */}
        {error && <p className="bg-red-100 text-red-700 p-4 rounded-lg">{error}</p>}

        {/* Categories Section */}
        <div>
          <h2 className="text-2xl font-serif font-bold text-gray-900 mb-4">
            {lang === 'ta' ? 'சமையல் வகைகள்' : 'Categories'}
          </h2>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {CATEGORIES.map(({ name, nameTa, bg }) => (
              <button
                key={name}
                onClick={() => setSelectedCategory(selectedCategory === name ? '' : name)}
                className={`py-4 px-3 rounded-2xl text-center transition-all transform hover:scale-105 flex flex-col items-center gap-2 border-2 ${
                  selectedCategory === name
                    ? 'border-amber-600 bg-amber-100'
                    : 'border-amber-200 hover:border-amber-400'
                }`}
                style={{ backgroundColor: selectedCategory === name ? '#FFF3E0' : bg }}
              >
                <span className="text-3xl">{CATEGORY_EMOJI[name]}</span>
                <span className="text-xs font-semibold text-gray-800">{name}</span>
                <span className="text-xs text-gray-600">{nameTa}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Top Restaurants/Kitchens */}
        {restaurants.length > 0 && (
          <div>
            <h2 className="text-2xl font-serif font-bold text-gray-900 mb-4">
              {lang === 'ta' ? '📍 உங்கள் அருகிலுள்ள சமையலறைகள்' : '📍 Nearby Kitchens'}
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4">
              {restaurants.slice(0, 8).map((r) => (
                <RestaurantChip key={r.id} restaurant={r} />
              ))}
            </div>
          </div>
        )}

        {/* Recommended Dishes */}
        <div>
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-2xl font-serif font-bold text-gray-900">
              {selectedCategory
                ? `${CATEGORY_EMOJI[selectedCategory]} ${selectedCategory} ${lang === 'ta' ? 'உணவுகள்' : 'Dishes'}`
                : (lang === 'ta' ? '🔥 உங்களுக்கான பரிந்துரைகள்' : '🔥 Recommended for You')
              }
            </h2>
          </div>
          {topDishes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {topDishes.map((d) => (
                <DishCard key={d.id} dish={d} />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-600 py-8">
              {lang === 'ta' ? 'உணவுகள் கிடைக்கவில்லை' : 'No dishes found'}
            </p>
          )}
        </div>
      </div>
    </RootsShell>
  );
}
