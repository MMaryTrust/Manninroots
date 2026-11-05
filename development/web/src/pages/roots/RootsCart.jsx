import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Trash2, Plus, Minus } from 'lucide-react';
import RootsShell from '../../components/roots/RootsShell';
import { useRootsI18n } from '../../lib/roots-i18n';
import { useCart } from '../../lib/roots-cart';
import { useApi } from '../../hooks';
import { submitOrder } from '../../lib/roots-data';

export default function RootsCart() {
  const { t } = useRootsI18n();
  const { lines, setQty, remove, clear, restaurantIds } = useCart();
  const [catalog] = useApi('/roots/catalog', { settings: {}, restaurants: [] });
  const [phone, setPhone] = useState('');
  const [token, setToken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();

  const { restaurants = [], settings = {} } = catalog;
  const fee = settings.feeIn || 0;

  // Build dish lookup
  const dishMap = {};
  restaurants.forEach((r) => {
    (r.dishes || []).forEach((d) => {
      dishMap[d.id] = { ...d, restId: r.id, restName: r.name };
    });
  });

  const cartLines = lines
    .map((c) => ({ ...c, dish: dishMap[c.dishId] }))
    .filter((c) => c.dish);

  const subtotal = cartLines.reduce((sum, c) => sum + (c.dish.priceInr || 0) * c.qty, 0);
  const total = subtotal + fee;

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!phone || phone.length !== 10) {
      setMessage({ type: 'error', text: 'Please enter a valid 10-digit phone number' });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitOrder({
        phone,
        token: token || undefined,
        items: cartLines.map((c) => ({ dishId: c.dishId, qty: c.qty })),
      });
      setMessage({ type: 'success', text: `Order placed: ${result.orders?.join(', ') || 'pending'}` });
      clear();
      setTimeout(() => navigate('/roots/orders'), 1000);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cartLines.length === 0) {
    return (
      <RootsShell>
        <div className="space-y-4">
          <Link to="/roots" className="flex items-center gap-2 text-blue-600 hover:underline">
            <ArrowLeft size={20} />
            {t('home')}
          </Link>

          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">{t('emptyCart')}</p>
            <Link to="/roots" className="text-blue-600 hover:underline mt-4 inline-block font-medium">
              Continue shopping
            </Link>
          </div>
        </div>
      </RootsShell>
    );
  }

  return (
    <RootsShell>
      <div className="space-y-4">
        <Link to="/roots" className="flex items-center gap-2 text-blue-600 hover:underline">
          <ArrowLeft size={20} />
          {t('home')}
        </Link>

        <h1 className="text-2xl font-bold">🛒 {t('cart')}</h1>

        {message && (
          <div
            className={`p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Cart Items */}
        <div className="bg-white rounded-lg border border-gray-200">
          {restaurantIds.map((restId) => {
            const restLines = cartLines.filter((c) => c.dish.restId === restId);
            const restName = restLines[0]?.dish.restName || 'Restaurant';

            return (
              <div key={restId} className="border-b last:border-b-0">
                <h3 className="font-semibold p-4 bg-gray-50">{restName}</h3>
                <div className="divide-y">
                  {restLines.map((c) => (
                    <div key={c.dishId} className="p-4 flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{c.dish.name}</h4>
                        <p className="text-sm text-gray-600">₹{c.dish.priceInr}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 border border-gray-300 rounded-lg">
                          <button
                            onClick={() => setQty(c.dishId, c.qty - 1)}
                            className="p-2 hover:bg-gray-100"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="px-3">{c.qty}</span>
                          <button
                            onClick={() => setQty(c.dishId, c.qty + 1)}
                            className="p-2 hover:bg-gray-100"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                        <button
                          onClick={() => remove(c.dishId)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Pricing */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <div className="flex justify-between">
            <span>{t('subtotal')}</span>
            <span className="font-semibold">₹{subtotal}</span>
          </div>
          <div className="flex justify-between">
            <span>{t('deliveryFee')}</span>
            <span className="font-semibold">₹{fee}</span>
          </div>
          <div className="border-t pt-2 flex justify-between text-lg font-bold">
            <span>{t('total')}</span>
            <span>₹{total}</span>
          </div>
        </div>

        {/* Checkout Form */}
        <form onSubmit={handleCheckout} className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Phone (10 digits)</label>
            <input
              type="tel"
              inputMode="numeric"
              pattern="[0-9]{10}"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="9876543210"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Saved payment token (optional)</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]{5}"
              maxLength="5"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="12345"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition"
          >
            {isSubmitting ? 'Processing...' : `${t('checkout')} - ₹${total}`}
          </button>
        </form>

        <p className="text-xs text-gray-600 text-center">
          {restaurantIds.length} {restaurantIds.length === 1 ? 'restaurant' : 'restaurants'} • Prices and fees are re-checked by the server
        </p>
      </div>
    </RootsShell>
  );
}
