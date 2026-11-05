import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import AdminDashboard from './AdminDashboard.jsx';
import AdminMenu from './AdminMenu.jsx';
import AdminAppointments from './AdminAppointments.jsx';

// Embeds the customer site so its own navigation, cart and fixed bottom bar work unchanged inside the admin panel.
function RootsCustomerView() {
  return <iframe className="roots-frame" src="/roots" title="Mannin Roots customer site" />;
}

const ROLE_LABEL = {
  owner: 'Shop Owner', admin: 'Admin', doctorAdmin: 'Doctor Admin', doctor: 'Doctor',
  manager: 'Manager', kitchen: 'Kitchen Staff', rider: 'Delivery Rider', customer: 'Customer',
};

export default function Staff() {
  const { user, signOut } = useAuth();
  const [activePage, setActivePage] = useState('dashboard');

  const PAGES = [
    { id: 'dashboard', label: 'Dashboard', component: AdminDashboard },
    { id: 'menu', label: 'Menu & Meals', component: AdminMenu },
    { id: 'appointments', label: 'Appointments', component: AdminAppointments },
    { id: 'roots', label: 'Mannin Roots', component: RootsCustomerView },  ];

  const currentPage = PAGES.find((p) => p.id === activePage);
  const CurrentComponent = currentPage?.component || AdminDashboard;

  return (
    <div className="app">
      <aside className="side">
        <Link className="brand" to="/"><span><b>Mannin Suvai</b><small>{ROLE_LABEL[user.role]}</small></span></Link>
        <nav>
          {PAGES.map((page) => (
            <button
              key={page.id}
              className={`nav-link ${activePage === page.id ? 'on' : ''}`}
              onClick={() => setActivePage(page.id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', padding: '8px 12px' }}
            >
              {page.label}
            </button>
          ))}
        </nav>
        <div className="side-foot"><span className="muted">{user.name}</span><button className="btn ghost sm" onClick={signOut}>Sign out</button></div>
      </aside>
      <div className="content">
        <CurrentComponent />
      </div>
    </div>
  );
}
