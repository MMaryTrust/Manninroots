import { Link, useLocation } from 'react-router-dom';
import { Home, Search, ClipboardList, User } from 'lucide-react';
import { useRootsI18n } from '../../lib/roots-i18n';

export default function BottomNav() {
  const { t } = useRootsI18n();
  const location = useLocation();

  const navItems = [
    { path: '/roots', label: t('home'), icon: Home },
    { path: '/roots/search', label: t('search'), icon: Search },
    { path: '/roots/orders', label: t('orders'), icon: ClipboardList },
    { path: '/roots/account', label: t('account'), icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
      <div className="max-w-4xl mx-auto flex justify-around">
        {navItems.map(({ path, label, icon: Icon }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center justify-center py-3 px-4 flex-1 text-xs font-medium transition ${
                isActive ? 'text-blue-600 border-t-2 border-blue-600' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon size={20} className="mb-1" />
              <span className="text-center">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
