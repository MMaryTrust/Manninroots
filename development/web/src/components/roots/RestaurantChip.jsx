import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';

export default function RestaurantChip({ restaurant }) {
  if (!restaurant) return null;

  return (
    <Link
      to={`/roots/restaurant/${restaurant.id}`}
      className="flex-shrink-0 bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition cursor-pointer min-w-max"
    >
      <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center text-4xl mb-2">
        🏪
      </div>
      <h4 className="font-semibold text-gray-900 text-sm line-clamp-2">{restaurant.name || 'Restaurant'}</h4>
      {restaurant.nameTa && <p className="text-xs text-gray-600 mb-2">{restaurant.nameTa}</p>}

      <div className="flex items-center gap-2 text-xs">
        <div className="flex items-center gap-1">
          <Star size={14} className="fill-yellow-400 text-yellow-400" />
          <span className="font-medium">{restaurant.rating?.toFixed(1) || 'N/A'}</span>
        </div>
        <span className="text-gray-600">•</span>
        <span className="text-gray-600">{restaurant.dishes?.length || 0} dishes</span>
      </div>
    </Link>
  );
}
