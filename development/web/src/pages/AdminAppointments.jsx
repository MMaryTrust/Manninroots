import { useEffect, useState } from 'react';
import { useI18n } from '../i18n.jsx';
import { api } from '../api.js';

export default function AdminAppointments() {
  const { t } = useI18n();
  const [appointments, setAppointments] = useState(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('appointments');

  useEffect(() => {
    api('/admin/appointments')
      .then(setAppointments)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <section className="admin-section">
      <div className="admin-hero">
        <h1 className="serif">Care Scheduling</h1>
        <p>Today's visits, upcoming duty schedule and appointment settings for every subscribed family member.</p>
      </div>

      {error && <p role="alert" className="notice">{error}</p>}

      <div className="tabs-container">
        <button
          className={`tab-button ${activeTab === 'appointments' ? 'on' : ''}`}
          onClick={() => setActiveTab('appointments')}
        >
          Appointment ({appointments?.todayCount || 0})
        </button>
        <button
          className={`tab-button ${activeTab === 'duty' ? 'on' : ''}`}
          onClick={() => setActiveTab('duty')}
        >
          My Duty ({appointments?.dutyCount || 0})
        </button>
      </div>

      {appointments === null ? (
        <p className="muted">Loading...</p>
      ) : activeTab === 'appointments' ? (
        <div>
          <h2 className="serif" style={{ marginTop: '24px' }}>
            Same-day appointments · {new Date().toLocaleDateString('en-GB', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
          </h2>

          {appointments.appointments && appointments.appointments.length > 0 ? (
            <div className="appointments-list">
              {appointments.appointments.map((appt) => (
                <article key={appt.id} className="card">
                  <div className="row between wrap">
                    <div>
                      <b>{appt.customerName}</b>
                      <br />
                      <small className="muted">
                        {appt.type === 'in-person' ? '🏥 In-person' : appt.type === 'video' ? '📹 Video' : '☎️ Phone'} · {appt.appointmentTime}
                      </small>
                    </div>
                    <div className="row gap">
                      <span className="badge gold">{appt.status}</span>
                      <button className="btn sm">Complete</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="muted" style={{ marginTop: '16px' }}>No appointments scheduled for today.</p>
          )}
        </div>
      ) : (
        <div>
          <h2 className="serif" style={{ marginTop: '24px' }}>My Duty Schedule</h2>
          {appointments.duty && appointments.duty.length > 0 ? (
            <div className="duty-list">
              {appointments.duty.map((duty) => (
                <article key={duty.id} className="card">
                  <div className="row between">
                    <div>
                      <b>{duty.description}</b>
                      <br />
                      <small className="muted">{duty.date} · {duty.time}</small>
                    </div>
                    <button className="btn ghost sm">Mark Complete</button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="muted" style={{ marginTop: '16px' }}>No duties scheduled.</p>
          )}
        </div>
      )}
    </section>
  );
}
