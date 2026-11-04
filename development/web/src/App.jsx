import { Routes, Route, NavLink, Link, Navigate, useLocation } from 'react-router-dom';
import { useI18n } from './i18n.jsx';
import { useAuth } from './auth.jsx';
import Home from './pages/Home.jsx';
import Plans from './pages/Plans.jsx';
import MenuPage from './pages/Menu.jsx';
import SignIn from './pages/SignIn.jsx';
import Roots from './pages/Roots.jsx';
import RootsOrders from './pages/RootsOrders.jsx';
import Staff from './pages/Staff.jsx';

const NAV = [['/', 'Home'], ['/plans', 'Plans'], ['/menu', 'Menu'], ['/roots', 'Roots']];
const ADDRESS = 'Virachilai, Pudukkottai, Tamil Nadu';

function PublicShell({ children }) {
  const { t, bi, lang, setLang, big, setBig } = useI18n();
  const { user } = useAuth();
  return (
    <>
      <header className="pub-head"><div className="wrap row">
        <Link className="brand" to="/"><span><b>Mannin Suvai</b><small>{bi('Taste of the Land', 'மண்ணின் சுவை')}</small></span></Link>
        <nav aria-label="Main">{NAV.map(([to, l]) => <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => (isActive ? 'on' : '')}>{t(l)}</NavLink>)}</nav>
        <div className="row gap">
          <button className="btn ghost sm" onClick={() => setBig(!big)} aria-pressed={big} aria-label="Text size">A</button>
          <button className="btn ghost sm" onClick={() => setLang(lang === 'en' ? 'ta' : 'en')} aria-label="Language">{lang === 'en' ? 'தமிழ்' : 'English'}</button>
          {user ? <Link className="btn sm" to="/app">{t('Dashboard')}</Link> : <Link className="btn ghost sm" to="/signin">{t('Sign in')}</Link>}
        </div>
      </div></header>
      <main>{children}</main>
      <footer className="pub-foot"><div className="wrap foot-grid">
        <div><b>Mannin Suvai Unavagam</b><br /><small>{ADDRESS}</small></div>
        <nav aria-label="Footer"><b>{t('Explore')}</b>{NAV.map(([to, l]) => <Link key={to} to={to}>{t(l)}</Link>)}</nav>
        <nav aria-label="Account"><b>{t('Account')}</b><Link to="/signin">{t('Sign in')}</Link></nav>
      </div></footer>
    </>
  );
}

function RequireAuth({ children }) {
  const { user, ready } = useAuth();
  const loc = useLocation();
  if (!ready) return <p className="wrap sec">Loading…</p>;
  return user ? children : <Navigate to="/signin" state={{ from: loc.pathname }} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/roots" element={<Roots />} />
      <Route path="/roots/orders" element={<RootsOrders />} />
      <Route path="/app/*" element={<RequireAuth><Staff /></RequireAuth>} />
      <Route path="*" element={
        <PublicShell>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/plans" element={<Plans />} />
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="*" element={<div className="wrap sec"><h1 className="serif">Page not found</h1><Link className="btn" to="/">Home</Link></div>} />
          </Routes>
        </PublicShell>
      } />
    </Routes>
  );
}
