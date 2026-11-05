import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Star, Plus } from 'lucide-react';
import RootsShell from '../../components/roots/RootsShell';
import { useRootsI18n } from '../../lib/roots-i18n';
import { useCart } from '../../lib/roots-cart';
import { useApi } from '../../hooks';

export default function RootsDish() {
  const { dishId } = useParams();
  const { t } = useRootsI18n();
  const { add } = useCart();
  const [catalog] = useApi('/roots/catalog', { settings: {}, restaurants: [] });

  const { restaurants = [] } = catalog;

  // Find the dish
  let dish = null;
  let restaurant = null;

  for (const r of restaurants) {
    const d = r.dishes?.find((x) => x.id === dishId);
    if (d) {
      dish = { ...d, restId: r.id, restName: r.name, restTa: r.nameTa };
      restaurant = r;
      break;
    }
  }

  if (!dish) {
    return (
      <RootsShell>
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">Dish not found</p>
          <Link to="/roots" className="text-blue-600 hover:underline mt-4 inline-block">
            Back to home
          </Link>
        </div>
      </RootsShell>
    );
  }

  const handleAdd = () => {
    const result = add(dish.id, dish.restId);
    if (!result.ok) {
      alert(t('max_restaurants_error'));
    } else {
      alert(t('add') + ' successfully!');
    }
  };

  return (
    <RootsShell>
      <div className="space-y-4">
        <Link to="/roots" className="flex items-center gap-2 text-blue-600 hover:underline">
          <ArrowLeft size={20} />
          {t('home')}
        </Link>

        <div className="bg-gray-200 rounded-lg aspect-square flex items-center justify-center text-6xl">
          🍽️
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold">{dish.name}</h1>
          {dish.nameTa && <p className="text-lg text-gray-600">{dish.nameTa}</p>}

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Star size={18} className="fill-yellow-400 text-yellow-400" />
              <span className="font-semibold">{dish.rating?.toFixed(1) || 'N/A'}</span>
            </div>
            <span className="text-gray-600">•</span>
            <Link
              to={`/roots/restaurant/${dish.restId}`}
              className="text-blue-600 hover:underline font-medium"
            >
              {dish.restName}
            </Link>
          </div>
        </div>

        {dish.descEn && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-gray-700">{dish.descEn}</p>
          </div>
        )}

        {dish.descTa && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">விளக்கம்</h3>
            <p className="text-gray-700">{dish.descTa}</p>
          </div>
        )}

        {dish.tags && dish.tags.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {dish.tags.map((tag) => (
              <span key={tag} className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        )}

        {dish.allergens && dish.allergens.length > 0 && (
          <div className="bg-orange-50 p-4 rounded-lg">
            <h3 className="font-semibold text-orange-900 mb-2">Allergens</h3>
            <p className="text-orange-800">{dish.allergens.join(', ')}</p>
          </div>
        )}

        <div className="flex items-center justify-between bg-white border-t border-gray-200 -mx-4 px-4 py-4 mt-6">
          <div className="text-2xl font-bold">₹{dish.priceInr || '0'}</div>
          <button
            onClick={handleAdd}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium flex items-center gap-2"
          >
            <Plus size={20} />
            {t('add')}
          </button>
        </div>
      </div>
    </RootsShell>
  );
}
