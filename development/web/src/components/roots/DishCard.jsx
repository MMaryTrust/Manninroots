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
    <div className="group">
      <Link
        to={`/roots/dish/${dish.id}`}
        className="bg-white border-2 border-amber-100 rounded-2xl overflow-hidden hover:shadow-xl hover:border-amber-300 transition-all transform hover:-translate-y-1"
      >
        <div className="aspect-square bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center text-5xl relative overflow-hidden">
          <span className="group-hover:scale-110 transition-transform duration-300">🍽️</span>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <h3 className="font-serif font-semibold text-gray-900 line-clamp-2 text-lg">{dish.name || 'Dish'}</h3>
            {dish.nameTa && <p className="text-sm text-gray-600 mt-1">{dish.nameTa}</p>}
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1">
              <Star size={14} className="fill-amber-400 text-amber-400" />
              <span className="text-sm font-semibold text-gray-700">{dish.rating?.toFixed(1) || 'N/A'}</span>
            </div>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{dish.restName || 'Restaurant'}</span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-amber-100">
            <span className="text-xl font-serif font-bold text-amber-900">
              ₹{dish.priceInr || '0'}
            </span>
            <button
              onClick={handleAdd}
              className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white p-2 rounded-full hover:shadow-lg transition-all transform hover:scale-110"
              aria-label={t('add')}
              title="Add to cart"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>
      </Link>
    </div>
  );
}
