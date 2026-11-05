import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import RootsShell from '../../components/roots/RootsShell';
import SearchBox from '../../components/roots/SearchBox';
import DishCard from '../../components/roots/DishCard';
import { useRootsI18n } from '../../lib/roots-i18n';
import { useApi } from '../../hooks';
import { filterDishes } from '../../lib/roots-data';

export default function RootsSearch() {
  const { t } = useRootsI18n();
  const [searchParams] = useSearchParams();
  const [catalog] = useApi('/roots/catalog', { settings: {}, restaurants: [] });
  const [sortBy, setSortBy] = useState('rating');

  const query = searchParams.get('q') || '';
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

  const results = useMemo(() => {
    const filtered = filterDishes(allDishes, { query });

    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'popular') return (b.orders || 0) - (a.orders || 0);
      return 0;
    });

    return sorted;
  }, [allDishes, query, sortBy]);

  return (
    <RootsShell>
      <div className="space-y-4">
        <SearchBox />

        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {query ? `${t('search')}: "${query}"` : t('search')}
          </h2>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="rating">Highest Rated</option>
            <option value="popular">Most Popular</option>
          </select>
        </div>

        {results.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {results.map((d) => (
              <DishCard key={d.id} dish={d} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">{t('noResults')}</p>
            <p className="text-gray-500 text-sm mt-2">Try searching for different dishes or restaurants</p>
          </div>
        )}

        <p className="text-sm text-gray-600 text-center">
          {results.length} {t('dishes')}
        </p>
      </div>
    </RootsShell>
  );
}
