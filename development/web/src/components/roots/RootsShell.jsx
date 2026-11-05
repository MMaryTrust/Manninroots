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
    <div className="roots-shell flex flex-col min-h-screen bg-gradient-to-b from-amber-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-amber-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/roots" className="flex items-center gap-2">
            <span className="text-3xl">🌿</span>
            <div>
              <h1 className="text-lg font-serif font-bold text-amber-900">मण्णिन रूट्स</h1>
              <p className="text-xs text-amber-700">Mannin Roots</p>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <Link
              to="/roots/cart"
              className="relative p-2 rounded-full hover:bg-amber-100 transition"
              aria-label={`${t('cart')}: ${count} items`}
            >
              <ShoppingBag size={24} className="text-amber-700" />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-md">
                  {count}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-24 max-w-5xl w-full mx-auto px-4 py-8">
        {children}
      </main>

      {/* Cart Bar (floating) */}
      {count > 0 && <CartBar />}

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
