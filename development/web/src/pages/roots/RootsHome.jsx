import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mic, ChefHat, Leaf, Star, Gift, Store, Search, Globe, ShoppingBag, ChevronLeft, ChevronRight } from 'lucide-react';
import RootsShell from '../../components/roots/RootsShell';
import DishCard from '../../components/roots/DishCard';
import RestaurantChip from '../../components/roots/RestaurantChip';
import { useRootsI18n } from '../../lib/roots-i18n';
import { useCart } from '../../lib/roots-cart';
import { LANGUAGES } from '../../lib/roots-translations';
import { CUISINE_IMAGES } from '../../lib/roots-images';
import { useApi } from '../../hooks';

export default function RootsHome() {
  const { lang, setLang } = useRootsI18n();
  const { count } = useCart();
  const navigate = useNavigate();
  const [catalog] = useApi('/roots/catalog', { settings: {}, restaurants: [] });
  const [query, setQuery] = useState('');
  const carouselRef = useRef(null);
  const searchRef = useRef(null);
  const kitchensRef = useRef(null);

  const { restaurants = [] } = catalog;
  const ta = lang === 'ta';

  const topDishes = useMemo(
    () =>
      restaurants
        .flatMap((r) => (r.dishes || []).map((d) => ({ ...d, restId: r.id, restName: r.name })))
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 6),
    [restaurants]
  );
  const topKitchens = useMemo(
    () => [...restaurants].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 6),
    [restaurants]
  );

  const goSearch = (q) => navigate(`/roots/search?q=${encodeURIComponent(q)}`);
  const scrollCarousel = (dir) => carouselRef.current?.scrollBy({ left: dir * 400, behavior: 'smooth' });
  const scrollToKitchens = () => kitchensRef.current?.scrollIntoView({ behavior: 'smooth' });

  const actions = [
    { icon: ChefHat, label: ta ? 'உணவு ஆர்டர்' : 'Order Food', onClick: () => searchRef.current?.focus(), primary: true },
    { icon: Mic, label: ta ? 'குரல் ஆர்டர்' : 'Voice Order', onClick: () => searchRef.current?.focus() },
    { icon: Store, label: ta ? 'உணவகங்கள்' : 'Explore Restaurants', onClick: scrollToKitchens },
    { icon: Leaf, label: ta ? 'ஆரோக்கியம்' : 'Healthy Choices', onClick: () => goSearch('Healthy') },
    { icon: Star, label: ta ? 'சிறந்தவை' : 'Top Rated', onClick: scrollToKitchens },
    { icon: Gift, label: ta ? 'சலுகைகள்' : 'Offers & Deals', onClick: () => goSearch('') },
  ];

  return (
    <RootsShell fullHero>
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 px-4 pb-16 pt-5 text-white">
        <div className="pointer-events-none absolute left-1/2 top-1/3 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-500/20 blur-3xl" />

        <div className="relative mx-auto flex max-w-6xl items-center justify-between">
          <label className="flex items-center gap-2 rounded-full border border-white/25 bg-white/5 px-4 py-2 text-sm backdrop-blur">
            <Globe size={18} aria-hidden />
            <span className="sr-only">Language</span>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="cursor-pointer bg-transparent pr-1 text-white outline-none [&>option]:text-gray-900"
            >
              {Object.entries(LANGUAGES).map(([code, label]) => (
                <option key={code} value={code}>{label}</option>
              ))}
            </select>
          </label>
          <Link
            to="/roots/cart"
            className="relative flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-white/5 hover:bg-white/15 transition"
            aria-label={`Cart: ${count} items`}
          >
            <ShoppingBag size={20} />
            {count > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-xs font-bold">
                {count}
              </span>
            )}
          </Link>
        </div>

        <div className="relative mx-auto mt-6 max-w-3xl text-center">
          <div className="text-6xl" aria-hidden>🌿</div>
          <h1 className="mt-4 font-serif text-4xl font-bold leading-tight sm:text-5xl">தமிழ் மண்ணின் வேர்கள்</h1>
          <p className="mt-2 font-serif text-2xl font-semibold tracking-widest text-orange-400 sm:text-3xl">MANNIN ROOTS</p>
          <p className="mt-4 text-lg font-semibold text-amber-300">நம் மண். நம் சுவை.</p>
          <p className="text-lg text-gray-200">Our Roots. Our Taste.</p>

          <form
            onSubmit={(e) => { e.preventDefault(); goSearch(query); }}
            className="mx-auto mt-8 flex max-w-2xl items-center rounded-full bg-white p-1.5 pl-5 shadow-2xl"
            role="search"
          >
            <Search size={20} className="shrink-0 text-gray-500" aria-hidden />
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={ta ? 'உணவகம், உணவு தேடுங்கள்...' : 'Search restaurants, dishes or cuisines...'}
              aria-label="Search"
              className="min-w-0 flex-1 bg-transparent px-3 py-2 text-base text-gray-900 outline-none"
            />
            <button type="submit" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-orange-500 hover:bg-orange-600 transition" aria-label="Search">
              <Mic size={20} />
            </button>
          </form>

          <div className="mt-8 grid grid-cols-3 gap-3 sm:grid-cols-6">
            {actions.map(({ icon: Icon, label, onClick, primary }) => (
              <button
                key={label}
                onClick={onClick}
                className={`flex flex-col items-center justify-center gap-2 rounded-2xl border px-2 py-3 text-xs font-semibold leading-tight backdrop-blur transition hover:-translate-y-0.5 ${
                  primary
                    ? 'border-orange-400 bg-orange-500/25 text-orange-100'
                    : 'border-white/20 bg-white/5 text-white hover:border-orange-400'
                }`}
              >
                <Icon size={22} className={primary ? 'text-orange-300' : 'text-white'} aria-hidden />
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-14 px-4 py-12">
        <section>
          <div className="mb-6 flex items-end justify-between">
            <h2 className="font-serif text-3xl font-bold text-gray-900">
              {ta ? 'எங்கள் உணவு வகைகள்' : 'Explore Our Cuisines'}
              <span className="mt-2 block h-1 w-12 rounded bg-orange-500" />
            </h2>
            <div className="hidden gap-2 sm:flex">
              <button onClick={() => scrollCarousel(-1)} className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 hover:bg-gray-100" aria-label="Previous">
                <ChevronLeft size={20} />
              </button>
              <button onClick={() => scrollCarousel(1)} className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 hover:bg-gray-100" aria-label="Next">
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
          <div ref={carouselRef} className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none]">
            {Object.entries(CUISINE_IMAGES).map(([name, img]) => (
              <button
                key={name}
                onClick={() => goSearch(name)}
                className="group relative h-44 w-44 shrink-0 snap-start overflow-hidden rounded-2xl shadow-md sm:w-52"
              >
                <img src={img} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110" />
                <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                <span className="absolute bottom-3 left-0 right-0 text-center text-base font-semibold text-white">{name}</span>
              </button>
            ))}
          </div>
        </section>

        {topKitchens.length > 0 && (
          <section ref={kitchensRef} className="scroll-mt-6">
            <h2 className="mb-6 font-serif text-3xl font-bold text-gray-900">{ta ? 'சிறந்த சமையலறைகள்' : 'Top Rated Kitchens'}</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {topKitchens.map((r) => <RestaurantChip key={r.id} restaurant={r} />)}
            </div>
          </section>
        )}

        {topDishes.length > 0 && (
          <section>
            <h2 className="mb-6 font-serif text-3xl font-bold text-gray-900">{ta ? 'உங்களுக்கான பரிந்துரைகள்' : 'Recommended for You'}</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {topDishes.map((d) => <DishCard key={d.id} dish={d} />)}
            </div>
          </section>
        )}
      </div>
    </RootsShell>
  );
}
