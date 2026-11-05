import { useEffect, useState } from 'react';
import { Users, Repeat, UtensilsCrossed, CalendarDays } from 'lucide-react';
import { api } from '../api.js';
import PatternCard from '../components/PatternCard.jsx';

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
      <div className="admin-hero">
        <h1 className="serif">Welcome back — Admin</h1>
        <p>Snapshot of today's operations across kitchens, subscriptions and consults.</p>
      </div>

      {error && <p role="alert" className="notice">{error}</p>}

      {metrics ? (
        <div className="pcards">
          <PatternCard icon={Users} value={metrics.activeCustomers} title="Active Customers" description="Registered customers currently active" />
          <PatternCard tone="sand" icon={Repeat} value={metrics.activeSubscriptions} title="Subscriptions" description="Active meal plans with payment status" />
          <PatternCard icon={UtensilsCrossed} value={metrics.mealsDeliveredToday} title="Meals Today" description="Delivered across all zones" />
          <PatternCard
            tone="sand"
            icon={CalendarDays}
            value={metrics.appointmentsToday}
            title="Appointments"
            description={`${metrics.inPersonAppointments} in-person · ${metrics.videoAppointments} video today`}
          />
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
