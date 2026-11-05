import { useState, useMemo, useRef } from 'react';
import { Mic, ChefHat, Leaf, Star, Gift, Store } from 'lucide-react';
import RootsShell from '../../components/roots/RootsShell';
import DishCard from '../../components/roots/DishCard';
import RestaurantChip from '../../components/roots/RestaurantChip';
import { useRootsI18n } from '../../lib/roots-i18n';
import { useApi } from '../../hooks';
import dosaImg from '../../assets/dosa.jpg';
import biryaniImg from '../../assets/biryani.jpg';
import mealsImg from '../../assets/meals.jpg';
import kothuImg from '../../assets/kothu.jpg';
import currencyImg from '../../assets/chettinad.jpg';
import sweetsImg from '../../assets/sweets.jpg';

const CUISINES = [
  { name: 'South Indian', image: dosaImg },
  { name: 'Biryani', image: biryaniImg },
  { name: 'Traditional Meals', image: mealsImg },
  { name: 'Street Food', image: kothuImg },
  { name: 'Curries', image: currencyImg },
  { name: 'Sweets', image: sweetsImg },
];

const QUICK_ACTIONS = [
  { icon: ChefHat, label: 'Order Food', color: 'from-amber-600 to-orange-600' },
  { icon: Mic, label: 'Voice Order', color: 'from-gray-700 to-gray-800' },
  { icon: Store, label: 'Explore', color: 'from-gray-700 to-gray-800' },
  { icon: Leaf, label: 'Healthy', color: 'from-gray-700 to-gray-800' },
  { icon: Star, label: 'Top Rated', color: 'from-gray-700 to-gray-800' },
  { icon: Gift, label: 'Offers', color: 'from-gray-700 to-gray-800' },
];

export default function RootsHome() {
  const { lang } = useRootsI18n();
  const [catalog] = useApi('/roots/catalog', { settings: {}, restaurants: [] });
  const carouselRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { restaurants = [] } = catalog;

  const allDishes = useMemo(() => {
    return restaurants.flatMap((r) =>
      (r.dishes || []).map((d) => ({
        ...d,
        restId: r.id,
        restName: r.name,
        restTa: r.nameTa,
      }))
    );
  }, [restaurants]);

  const topDishes = useMemo(() => {
    return allDishes.sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 12);
  }, [allDishes]);

  const scrollCarousel = (direction) => {
    if (carouselRef.current) {
      const scrollAmount = 400;
      carouselRef.current.scrollBy({
        left: direction === 'next' ? scrollAmount : -scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <RootsShell fullHero={true}>
      {/* HERO SECTION - Dark Professional Design */}
      <div className="relative w-screen -ml-[calc((100vw-100%)/2)] bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 pt-16 pb-20 px-4 overflow-hidden">
        {/* Background Glow Effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-96 bg-gradient-to-b from-orange-500/20 via-orange-500/10 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute top-0 right-0 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto">
          {/* Logo & Branding */}
          <div className="text-center mb-10">
            <div className="text-7xl mb-6">🌿</div>
            <h1 className="text-5xl font-serif font-bold text-white mb-2 leading-tight">
              தமிழ் மண்ணின் வேர்கள்
            </h1>
            <h2 className="text-3xl font-bold text-orange-400 mb-4">MANNIN ROOTS</h2>
            <p className="text-xl text-gray-300 font-medium">
              {lang === 'ta' ? 'நம் மண். நம் சுவை.' : 'Our Roots. Our Taste.'}
            </p>
          </div>

          {/* Search Bar with Voice */}
          <div className="mb-8 flex gap-3 max-w-2xl mx-auto">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder={lang === 'ta' ? 'உணவுக்கடை, உணவு தேடுங்கள்...' : 'Search restaurants, dishes...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-6 py-4 rounded-full bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 text-lg font-medium"
              />
            </div>
            <button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white p-4 rounded-full hover:shadow-lg transition-all transform hover:scale-105">
              <Mic size={24} />
            </button>
          </div>

          {/* Quick Action Pills */}
          <div className="flex flex-wrap gap-3 justify-center">
            {QUICK_ACTIONS.map(({ icon: Icon, label, color }) => (
              <button
                key={label}
                className={`flex flex-col items-center gap-2 px-5 py-3 rounded-2xl border-2 border-gray-700 hover:border-orange-500 transition-all bg-gradient-to-br ${color} hover:shadow-xl transform hover:scale-105`}
              >
                <Icon size={20} className="text-white" />
                <span className="text-xs font-bold text-white whitespace-nowrap">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="space-y-16 px-4 py-12 max-w-6xl mx-auto w-full">
        {/* CUISINES CAROUSEL */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-serif font-bold text-gray-900">
              {lang === 'ta' ? 'சமையல் வகைகளை ஆராயுங்கள்' : 'Explore Our Cuisines'}
            </h2>
            <div className="flex gap-3">
              <button
                onClick={() => scrollCarousel('prev')}
                className="w-12 h-12 rounded-full bg-gray-300 hover:bg-gray-400 flex items-center justify-center text-xl transition-all transform hover:scale-110"
              >
                ‹
              </button>
              <button
                onClick={() => scrollCarousel('next')}
                className="w-12 h-12 rounded-full bg-gray-300 hover:bg-gray-400 flex items-center justify-center text-xl transition-all transform hover:scale-110"
              >
                ›
              </button>
            </div>
          </div>

          {/* Carousel Container */}
          <div
            ref={carouselRef}
            className="flex gap-5 overflow-x-auto pb-4 scroll-smooth"
          >
            {CUISINES.map((cuisine, idx) => (
              <div key={idx} className="flex-shrink-0 w-56 group cursor-pointer">
                <div className="relative h-48 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all transform hover:scale-105">
                  <img
                    src={cuisine.image}
                    alt={cuisine.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex items-end p-5">
                    <span className="text-white font-serif font-bold text-lg">{cuisine.name}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Carousel Dots */}
          <div className="flex justify-center gap-2 mt-6">
            {[0, 1, 2].map((i) => (
              <div key={i} className="w-2 h-2 rounded-full bg-orange-500"></div>
            ))}
          </div>
        </section>

        {/* TOP RESTAURANTS GRID */}
        {restaurants.length > 0 && (
          <section>
            <h2 className="text-3xl font-serif font-bold text-gray-900 mb-8">
              ⭐ {lang === 'ta' ? 'உங்கள் அருகிலுள்ள சமையலறைகள்' : 'Top Rated Kitchens'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {restaurants.slice(0, 6).map((r) => (
                <RestaurantChip key={r.id} restaurant={r} />
              ))}
            </div>
          </section>
        )}

        {/* RECOMMENDED DISHES GRID */}
        <section>
          <h2 className="text-3xl font-serif font-bold text-gray-900 mb-8">
            🔥 {lang === 'ta' ? 'உங்களுக்கான பரிந்துரைகள்' : 'Recommended for You'}
          </h2>
          {topDishes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {topDishes.slice(0, 9).map((d) => (
                <DishCard key={d.id} dish={d} />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-600 py-12 text-lg">
              {lang === 'ta' ? 'உணவுகள் கிடைக்கவில்லை' : 'No dishes available yet'}
            </p>
          )}
        </section>
      </div>
    </RootsShell>
  );
}
