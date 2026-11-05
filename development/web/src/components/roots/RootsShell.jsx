import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { useRootsI18n } from '../../lib/roots-i18n';
import { useCart } from '../../lib/roots-cart';
import LanguageToggle from './LanguageToggle';
import BottomNav from './BottomNav';
import CartBar from './CartBar';

export default function RootsShell({ children }) {
  const { t } = useRootsI18n();
  const { count } = useCart();

  return (
    <div className="roots-shell flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/roots" className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-blue-600">🌿 Mannin Roots</h1>
          </Link>
          <div className="flex items-center gap-4">
            <LanguageToggle />
            <Link
              to="/roots/cart"
              className="relative p-2 rounded-lg hover:bg-gray-100 transition"
              aria-label={`${t('cart')}: ${count} items`}
            >
              <ShoppingBag size={24} className="text-gray-700" />
              {count > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                  {count}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-20 max-w-4xl w-full mx-auto px-4 py-6">
        {children}
      </main>

      {/* Cart Bar (floating) */}
      {count > 0 && <CartBar />}

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
