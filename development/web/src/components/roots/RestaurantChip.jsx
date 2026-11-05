import { Link } from 'react-router-dom';
import { Star, MapPin, Clock } from 'lucide-react';

export default function RestaurantChip({ restaurant }) {
  if (!restaurant) return null;

  return (
    <Link
      to={`/roots/restaurant/${restaurant.id}`}
      className="group flex-shrink-0 bg-white border-2 border-amber-100 rounded-2xl overflow-hidden hover:shadow-xl hover:border-amber-400 hover:border-amber-500 transition-all cursor-pointer min-w-72 hover:-translate-y-1"
    >
      {/* Image */}
      <div className="w-full h-40 bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center text-6xl relative overflow-hidden">
        <span className="group-hover:scale-110 transition-transform duration-300">🏪</span>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div>
          <h4 className="font-serif font-semibold text-gray-900 line-clamp-2">{restaurant.name || 'Restaurant'}</h4>
          {restaurant.nameTa && <p className="text-xs text-gray-700 font-medium">{restaurant.nameTa}</p>}
        </div>

        {/* Stats Row */}
        <div className="flex items-center justify-between text-xs border-t border-amber-100 pt-2">
          <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-full">
            <Star size={12} className="fill-amber-400 text-amber-400" />
            <span className="font-bold text-amber-900">{restaurant.rating?.toFixed(1) || 'N/A'}</span>
          </div>
          <span className="text-gray-600 font-medium">{restaurant.dishes?.length || 0} items</span>
          {restaurant.prepMin && (
            <div className="flex items-center gap-1 text-gray-600">
              <Clock size={12} />
              <span>{restaurant.prepMin} min</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
