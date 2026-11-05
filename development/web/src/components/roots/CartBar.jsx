import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { useRootsI18n } from '../../lib/roots-i18n';
import { useCart } from '../../lib/roots-cart';

export default function CartBar() {
  const { t } = useRootsI18n();
  const { count, lines } = useCart();

  if (count === 0) return null;

  // Calculate subtotal (simplified, without actual dish prices)
  const subtotal = lines.length > 0 ? `${lines.length} items` : '';

  return (
    <Link
      to="/roots/cart"
      className="fixed bottom-20 left-0 right-0 mx-auto max-w-4xl mb-3 px-4"
    >
      <div className="bg-blue-600 text-white rounded-lg p-4 flex items-center justify-between shadow-lg hover:bg-blue-700 transition">
        <div className="flex items-center gap-3">
          <ShoppingBag size={20} />
          <span className="text-sm font-medium">{count} items in cart</span>
        </div>
        <button className="bg-white text-blue-600 px-4 py-2 rounded font-medium text-sm hover:bg-gray-100">
          {t('checkout')}
        </button>
      </div>
    </Link>
  );
}
