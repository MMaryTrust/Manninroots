import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Package } from 'lucide-react';
import RootsShell from '../../components/roots/RootsShell';
import { useRootsI18n } from '../../lib/roots-i18n';
import { useAuth } from '../../auth';
import { api } from '../../api';

const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };

export default function RootsOrders() {
  const { t } = useRootsI18n();
  const { user } = useAuth();
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const batches = load('roots_batches', []);
    if (!batches.length) return setOrders([]);

    api(`/roots/orders?batches=${batches.join(',')}`)
      .then(setOrders)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <RootsShell>
      <div className="space-y-4">
        <Link to="/roots" className="flex items-center gap-2 text-blue-600 hover:underline">
          <ArrowLeft size={20} />
          {t('home')}
        </Link>

        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Package size={28} />
          {t('orders')}
        </h1>

        {error && (
          <div className="bg-red-100 text-red-800 p-4 rounded-lg">
            {error}
          </div>
        )}

        {!user && (
          <div className="text-center py-12 bg-blue-50 rounded-lg p-6">
            <p className="text-gray-600 mb-4">{t('orders_empty')}</p>
            <Link
              to="/signin"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium inline-block"
            >
              {t('sign_in')}
            </Link>
          </div>
        )}

        {user && orders !== null && (
          <>
            {orders.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg p-6">
                <p className="text-gray-600 text-lg mb-4">{t('orders_empty')}</p>
                <Link
                  to="/roots"
                  className="text-blue-600 hover:underline font-medium"
                >
                  Start ordering
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-lg transition"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-lg">{order.restaurant}</p>
                        <p className="text-sm text-gray-600 font-mono">{order.orderNo}</p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          order.status === 'delivered'
                            ? 'bg-green-100 text-green-800'
                            : order.status === 'preparing'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-orange-100 text-orange-800'
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>

                    <div className="space-y-1 mb-3">
                      {order.items?.map((item, idx) => (
                        <p key={idx} className="text-sm text-gray-700">
                          {item.qty}× {item.name}
                        </p>
                      ))}
                    </div>

                    <div className="border-t pt-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Items</span>
                        <span className="font-medium">
                          {order.region === 'IN' ? '₹' : '$'}
                          {order.itemTotal}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Fee</span>
                        <span className="font-medium">
                          {order.region === 'IN' ? '₹' : '$'}
                          {order.fee}
                        </span>
                      </div>
                      <div className="flex justify-between font-bold pt-2 border-t">
                        <span>Total</span>
                        <span>
                          {order.region === 'IN' ? '₹' : '$'}
                          {(order.itemTotal || 0) + (order.fee || 0)}
                        </span>
                      </div>
                    </div>

                    {order.payment && (
                      <p className="text-xs text-gray-500 mt-3">💳 {order.payment}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {orders === null && !error && (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading orders...</p>
          </div>
        )}
      </div>
    </RootsShell>
  );
}
