import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../auth.jsx';
import { api } from '../api.js';

const ROOTS_STAFF = ['owner', 'admin', 'manager', 'kitchen', 'rider'];
const NEXT_LABEL = { New: 'Start preparing', Preparing: 'Out for delivery', 'Out for delivery': 'Mark delivered' };

export default function RootsStaffPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const canRoots = ROOTS_STAFF.includes(user.role);

  const load = useCallback(() => {
    if (canRoots) api('/roots/orders/all').then(setOrders).catch((e) => setError(e.message));
  }, [canRoots]);

  useEffect(load, [load]);

  async function advance(id) {
    setError('');
    try { await api(`/roots/orders/${id}/advance`, { method: 'PATCH' }); load(); } catch (e) { setError(e.message); }
  }

  return (
    <section className="admin-section">
      <h1 className="serif">Mannin Roots Orders</h1>
      <p className="muted">Manage all Mannin Roots orders and track their status.</p>

      {!canRoots && <p className="card">Your screens are being moved to the new platform. Roots orders are visible to kitchen, rider, manager, admin and owner roles.</p>}

      {canRoots && (
        <>
          {error && <p role="alert" className="notice">{error}</p>}
          {orders.length === 0 && <p className="muted">No orders yet.</p>}
          <div className="orders-list">
            {orders.map((o) => (
              <article key={o.id} className="card">
                <div className="row between wrap gap">
                  <div><b className="mono">{o.orderNo}</b> · {o.restaurant}<br /><small className="muted">{o.items.map((i) => `${i.qty}× ${i.name}`).join(', ')}</small></div>
                  <div className="row gap"><span className="badge gold">{o.status}</span>
                    {NEXT_LABEL[o.status] && <button className="btn sm" onClick={() => advance(o.id)}>{NEXT_LABEL[o.status]}</button>}</div>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
