import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useRootsI18n } from '../../lib/roots-i18n';
import { useState } from 'react';

export default function SearchBox() {
  const { t } = useRootsI18n();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/roots/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className="w-full">
      <div className="relative">
        <Search size={20} className="absolute left-4 top-3.5 text-amber-600" />
        <input
          type="text"
          placeholder={t('search_dishes')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border-2 border-amber-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition placeholder:text-gray-500 text-gray-900 font-medium"
        />
      </div>
    </form>
  );
}
