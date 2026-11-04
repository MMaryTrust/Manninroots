import { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/admin/dashboard')
      .then(setMetrics)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <section className="admin-section">
      <h1 className="serif">Welcome back — Admin</h1>
      <p className="muted">Snapshot of today's operations across kitchens, subscriptions and consults.</p>

      {error && <p role="alert" className="notice">{error}</p>}

      {metrics ? (
        <div className="metrics-grid">
          <article className="metric-card">
            <div className="metric-header">
              <span className="metric-label">ACTIVE CUSTOMERS</span>
              <span className="metric-icon">👥</span>
            </div>
            <div className="metric-value">{metrics.activeCustomers}</div>
            <p className="metric-description">View all registered customers</p>
          </article>

          <article className="metric-card">
            <div className="metric-header">
              <span className="metric-label">ACTIVE SUBSCRIPTIONS</span>
              <span className="metric-icon">↔️</span>
            </div>
            <div className="metric-value">{metrics.activeSubscriptions}</div>
            <p className="metric-description">Subscribers with payment status</p>
          </article>

          <article className="metric-card">
            <div className="metric-header">
              <span className="metric-label">MEALS DELIVERED TODAY</span>
              <span className="metric-icon">🍱</span>
            </div>
            <div className="metric-value">{metrics.mealsDeliveredToday}</div>
            <p className="metric-description">Across all zones</p>
          </article>

          <article className="metric-card">
            <div className="metric-header">
              <span className="metric-label">TODAY'S APPOINTMENTS</span>
              <span className="metric-icon">📷</span>
            </div>
            <div className="metric-value">{metrics.appointmentsToday}</div>
            <p className="metric-description">{metrics.inPersonAppointments} in-person · {metrics.videoAppointments} video</p>
          </article>
        </div>
      ) : (
        <p className="muted">Loading metrics...</p>
      )}

      {metrics && (
        <section className="admin-section">
          <h2 className="serif">Renewals due</h2>
          <p className="muted">THIS WEEK — UNTIL {new Date(new Date().setDate(new Date().getDate() + 7)).toLocaleDateString('en-GB', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
          {metrics.renewalsDue && metrics.renewalsDue.length > 0 ? (
            <div className="renewals-list">
              {metrics.renewalsDue.map((r) => (
                <article key={r.customerId} className="card">
                  <div className="row between">
                    <div>
                      <b>{r.customerName}</b>
                      <br />
                      <small className="muted">{r.planName} ends {r.endDate}</small>
                    </div>
                    <button className="btn sm">Renew</button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="muted">No renewals due this week.</p>
          )}
        </section>
      )}
    </section>
  );
}
