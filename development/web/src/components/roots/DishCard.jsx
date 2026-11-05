import { Link } from 'react-router-dom';
import { Star, Plus } from 'lucide-react';
import { useRootsI18n } from '../../lib/roots-i18n';
import { useCart } from '../../lib/roots-cart';
import { cuisineImage } from '../../lib/roots-images';

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
      className="group flex flex-col bg-white border border-amber-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={cuisineImage(dish.cuisine)}
          alt=""
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <span className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-xs font-bold text-amber-900 shadow">
          <Star size={12} className="fill-amber-400 text-amber-400" />
          {dish.rating?.toFixed(1) || '–'}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex-1">
          <h3 className="font-serif text-lg font-semibold text-gray-900 line-clamp-2">{dish.name || 'Dish'}</h3>
          <p className="mt-1 text-sm text-gray-500">{dish.restName}</p>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-gray-900">₹{dish.priceInr ?? 0}</span>
          <button
            onClick={handleAdd}
            className="flex items-center gap-1 rounded-full bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 transition"
            aria-label={`${t('add')}: ${dish.name}`}
          >
            <Plus size={16} /> Add
          </button>
        </div>
      </div>
    </Link>
  );
}
