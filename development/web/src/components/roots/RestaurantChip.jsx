import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';

export default function RestaurantChip({ restaurant }) {
  if (!restaurant) return null;

  return (
    <Link
      to={`/roots/restaurant/${restaurant.id}`}
      className="group flex-shrink-0 bg-white border-2 border-amber-100 rounded-2xl p-4 hover:shadow-xl hover:border-amber-400 transition-all cursor-pointer min-w-max hover:-translate-y-1"
    >
      <div className="w-36 h-36 bg-gradient-to-br from-orange-100 to-amber-100 rounded-xl flex items-center justify-center text-5xl mb-3 relative overflow-hidden">
        <span className="group-hover:scale-110 transition-transform duration-300">🏪</span>
      </div>
      <div className="space-y-2">
        <div>
          <h4 className="font-serif font-semibold text-gray-900 text-sm line-clamp-2">{restaurant.name || 'Restaurant'}</h4>
          {restaurant.nameTa && <p className="text-xs text-gray-600 mt-1">{restaurant.nameTa}</p>}
        </div>

        <div className="flex items-center gap-3 text-xs border-t border-amber-100 pt-2">
          <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-full">
            <Star size={12} className="fill-amber-400 text-amber-400" />
            <span className="font-semibold text-gray-700">{restaurant.rating?.toFixed(1) || 'N/A'}</span>
          </div>
          <span className="text-gray-600">{restaurant.dishes?.length || 0} dishes</span>
        </div>
      </div>
    </Link>
  );
}
