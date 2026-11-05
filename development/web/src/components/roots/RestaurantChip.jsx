import { Link } from 'react-router-dom';
import { Star, MapPin } from 'lucide-react';
import { cuisineImage } from '../../lib/roots-images';

export default function RestaurantChip({ restaurant }) {
  if (!restaurant) return null;

  return (
    <Link
      to={`/roots/restaurant/${restaurant.id}`}
      className="group flex flex-col bg-white border border-amber-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all"
    >
      <div className="relative h-40 overflow-hidden">
        <img
          src={cuisineImage(restaurant.cuisine)}
          alt=""
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <span className="absolute bottom-3 left-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-gray-800">
          {restaurant.cuisine}
        </span>
      </div>
      <div className="flex flex-col gap-2 p-4">
        <div>
          <h4 className="font-serif text-lg font-semibold text-gray-900 line-clamp-1">{restaurant.name}</h4>
          {restaurant.nameTa && <p className="text-sm text-gray-600">{restaurant.nameTa}</p>}
        </div>
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span className="flex items-center gap-1">
            <MapPin size={14} className="text-orange-600" />
            {restaurant.area}
          </span>
          <span className="flex items-center gap-1 rounded-full bg-green-700 px-2 py-0.5 text-xs font-bold text-white">
            <Star size={12} className="fill-white text-white" />
            {restaurant.rating?.toFixed(1) || '–'}
          </span>
        </div>
      </div>
    </Link>
  );
}
