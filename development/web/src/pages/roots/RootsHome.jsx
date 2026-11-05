import { useEffect, useState, useMemo } from 'react';
import RootsShell from '../../components/roots/RootsShell';
import SearchBox from '../../components/roots/SearchBox';
import DishCard from '../../components/roots/DishCard';
import RestaurantChip from '../../components/roots/RestaurantChip';
import { useRootsI18n } from '../../lib/roots-i18n';
import { useApi } from '../../hooks';

const CUISINES = [
  { name: 'South Indian', nameTa: 'தென்னிந்திய', emoji: '🍚' },
  { name: 'Biryani', nameTa: 'பிரியாணி', emoji: '🍛' },
  { name: 'Meals', nameTa: 'சாப்பாடு', emoji: '🍽️' },
  { name: 'Sweets', nameTa: 'இனிப்புகள்', emoji: '🍰' },
  { name: 'Parotta', nameTa: 'பரோட்டா', emoji: '🥘' },
  { name: 'Curries', nameTa: 'குழம்பு', emoji: '🌶️' },
];

export default function RootsHome() {
  const { t } = useRootsI18n();
  const [catalog, error] = useApi('/roots/catalog', { settings: {}, restaurants: [] });
  const [selectedCuisine, setSelectedCuisine] = useState('');

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
    if (selectedCuisine) {
      dishes = dishes.filter((d) => d.cuisine === selectedCuisine);
    }
    return dishes.sort((a, b) => b.rating - a.rating).slice(0, 8);
  }, [allDishes, selectedCuisine]);

  return (
    <RootsShell>
      <div className="space-y-6">
        {/* Search */}
        <SearchBox />

        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg p-6 text-center">
          <h2 className="text-3xl font-bold mb-2">தமிழ் மண்ணின் வேர்கள்</h2>
          <p className="text-xl">MANNIN ROOTS</p>
          <p className="mt-2 text-blue-100">{t('tagline')}</p>
        </div>

        {/* Error Message */}
        {error && <p className="bg-red-100 text-red-700 p-3 rounded-lg">{error}</p>}

        {/* Cuisines */}
        <div>
          <h3 className="text-lg font-semibold mb-3">{t('exploring_cuisines')}</h3>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {CUISINES.map(({ name, nameTa, emoji }) => (
              <button
                key={name}
                onClick={() => setSelectedCuisine(selectedCuisine === name ? '' : name)}
                className={`p-3 rounded-lg text-center transition flex flex-col items-center gap-1 ${
                  selectedCuisine === name
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                <span className="text-2xl">{emoji}</span>
                <span className="text-xs font-medium">{name}</span>
                <span className="text-xs text-gray-600">{nameTa}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Top Kitchens */}
        <div>
          <h3 className="text-lg font-semibold mb-3">🏪 {t('kitchens')}</h3>
          {restaurants.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
              {restaurants.slice(0, 5).map((r) => (
                <RestaurantChip key={r.id} restaurant={r} />
              ))}
            </div>
          ) : (
            <p className="text-gray-600">{t('noResults')}</p>
          )}
        </div>

        {/* Top Dishes */}
        <div>
          <h3 className="text-lg font-semibold mb-3">
            {selectedCuisine ? `🍽️ ${selectedCuisine}` : t('recommended_for_you')}
          </h3>
          {topDishes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {topDishes.map((d) => (
                <DishCard key={d.id} dish={d} />
              ))}
            </div>
          ) : (
            <p className="text-gray-600">{t('noResults')}</p>
          )}
        </div>
      </div>
    </RootsShell>
  );
}
