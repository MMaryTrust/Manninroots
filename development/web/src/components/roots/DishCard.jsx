import { Link } from 'react-router-dom';
import { Star, Plus } from 'lucide-react';
import { useRootsI18n } from '../../lib/roots-i18n';
import { useCart } from '../../lib/roots-cart';

export default function DishCard({ dish }) {
  const { t } = useRootsI18n();
  const { add } = useCart();

  if (!dish) return null;

  const handleAdd = (e) => {
    e.preventDefault();
    const result = add(dish.id, dish.restId);
    if (!result.ok) {
      alert(t('max_restaurants_error'));
    }
  };

  return (
    <Link
      to={`/roots/dish/${dish.id}`}
      className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition"
    >
      <div className="aspect-square bg-gray-200 flex items-center justify-center text-gray-400 text-4xl">
        🍽️
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 line-clamp-2">{dish.name || 'Dish'}</h3>
        {dish.nameTa && <p className="text-sm text-gray-600">{dish.nameTa}</p>}

        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Star size={16} className="fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium">{dish.rating?.toFixed(1) || 'N/A'}</span>
          </div>
          <span className="text-sm text-gray-600">{dish.restName || 'Restaurant'}</span>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-lg font-bold text-gray-900">
            ₹{dish.priceInr || '0'}
          </span>
          <button
            onClick={handleAdd}
            className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition"
            aria-label={t('add')}
          >
            <Plus size={18} />
          </button>
        </div>
      </div>
    </Link>
  );
}
