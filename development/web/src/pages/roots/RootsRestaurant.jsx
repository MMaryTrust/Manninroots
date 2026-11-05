import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Star } from 'lucide-react';
import RootsShell from '../../components/roots/RootsShell';
import DishCard from '../../components/roots/DishCard';
import { useRootsI18n } from '../../lib/roots-i18n';
import { useApi } from '../../hooks';

export default function RootsRestaurant() {
  const { restaurantId } = useParams();
  const { t } = useRootsI18n();
  const [catalog] = useApi('/roots/catalog', { settings: {}, restaurants: [] });

  const { restaurants = [] } = catalog;
  const restaurant = restaurants.find((r) => r.id === restaurantId);

  if (!restaurant) {
    return (
      <RootsShell>
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">Restaurant not found</p>
          <Link to="/roots" className="text-blue-600 hover:underline mt-4 inline-block">
            Back to home
          </Link>
        </div>
      </RootsShell>
    );
  }

  const dishes = restaurant.dishes || [];

  return (
    <RootsShell>
      <div className="space-y-4">
        <Link to="/roots" className="flex items-center gap-2 text-blue-600 hover:underline">
          <ArrowLeft size={20} />
          {t('home')}
        </Link>

        <div className="bg-gradient-to-r from-gray-400 to-gray-600 rounded-lg aspect-video flex items-center justify-center text-8xl">
          🏪
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold">{restaurant.name}</h1>
          {restaurant.nameTa && <p className="text-xl text-gray-600">{restaurant.nameTa}</p>}

          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-1">
              <Star size={20} className="fill-yellow-400 text-yellow-400" />
              <span className="font-semibold text-lg">{restaurant.rating?.toFixed(1) || 'N/A'}</span>
            </div>
            <span className="text-gray-600">•</span>
            <span className="text-gray-600">{dishes.length} dishes</span>
            <span className="text-gray-600">•</span>
            <span className={restaurant.open ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
              {restaurant.open ? 'Open' : 'Closed'}
            </span>
          </div>
        </div>

        {restaurant.area && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-gray-700">📍 {restaurant.area}</p>
          </div>
        )}

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Details</h3>
          <ul className="space-y-1 text-sm text-gray-700">
            {restaurant.hours && <li>⏰ {restaurant.hours}</li>}
            {restaurant.rating && <li>⭐ Rating: {restaurant.rating}</li>}
            {restaurant.dishes?.length && <li>🍽️ Dishes: {restaurant.dishes.length}</li>}
          </ul>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-4">Menu</h2>
          {dishes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {dishes.map((d) => (
                <DishCard
                  key={d.id}
                  dish={{
                    ...d,
                    restId: restaurant.id,
                    restName: restaurant.name,
                    restTa: restaurant.nameTa,
                  }}
                />
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
