import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';

const batches = () => { try { return JSON.parse(localStorage.getItem('roots_batches')) || []; } catch { return []; } };

export default function RootsOrders() {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    const b = batches();
    if (!b.length) return setOrders([]);
    api('/roots/orders?batches=' + b.join(',')).then(setOrders).catch((e) => setError(e.message));
  }, []);
  return (
    <section className="wrap sec">
      <p><Link to="/roots">← Mannin Roots</Link></p>
      <h1 className="serif">My orders</h1>
      {error && <p role="alert" className="notice">{error}</p>}
      {orders && orders.length === 0 && <p className="muted">No orders from this device yet.</p>}
      {(orders || []).map((o) => (
        <article className="card" key={o.id}>
          <div className="row between wrap gap"><div><b className="mono">{o.orderNo}</b> · {o.restaurant}</div><span className="badge gold">{o.status}</span></div>
          <p className="small">{o.items.map((i) => `${i.qty}× ${i.name}`).join(', ')}</p>
          <p className="small mono">{o.region === 'IN' ? '₹' : '$'}{o.itemTotal} + fee {o.fee} · {o.payment}</p>
        </article>
      ))}
    </section>
  );
}
