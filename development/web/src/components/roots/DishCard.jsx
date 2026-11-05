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
        className="bg-white border-2 border-amber-100 rounded-2xl overflow-hidden hover:shadow-xl hover:border-amber-400 transition-all transform hover:-translate-y-1 block h-full"
      >
        <div className="aspect-square bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center text-5xl relative overflow-hidden">
          <span className="group-hover:scale-110 transition-transform duration-300">🍽️</span>
        </div>
        <div className="p-4 space-y-3 flex flex-col h-full">
          <div className="flex-1">
            <h3 className="font-serif font-semibold text-gray-900 line-clamp-2 text-sm">{dish.name || 'Dish'}</h3>
            {dish.nameTa && <p className="text-xs text-gray-600 mt-1 font-medium">{dish.nameTa}</p>}
            <p className="text-xs text-gray-700 mt-2">{dish.restName || 'Restaurant'}</p>
          </div>

          <div className="space-y-2 border-t border-amber-100 pt-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Star size={13} className="fill-amber-400 text-amber-400" />
                <span className="text-xs font-bold text-amber-900">{dish.rating?.toFixed(1) || 'N/A'}</span>
              </div>
              <span className="text-xs text-gray-700 font-semibold">
                ₹{dish.priceInr || '0'}
              </span>
            </div>

            <button
              onClick={handleAdd}
              className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white py-2 rounded-xl font-semibold text-sm hover:shadow-lg transition-all flex items-center justify-center gap-2"
              aria-label={t('add')}
              title="Add to cart"
            >
              <Plus size={18} /> Add
            </button>
          </div>
        </div>
      </Link>
    </div>
  );
}
