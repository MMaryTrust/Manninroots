import { Routes, Route, NavLink, Link, Navigate, useLocation } from 'react-router-dom';
import { useI18n } from './i18n.jsx';
import { useAuth } from './auth.jsx';
import { CartProvider } from './lib/roots-cart.jsx';
import { RootsI18nProvider } from './lib/roots-i18n.jsx';
import Home from './pages/Home.jsx';
import Plans from './pages/Plans.jsx';
import MenuPage from './pages/Menu.jsx';
import SignIn from './pages/SignIn.jsx';
import Roots from './pages/Roots.jsx';
import RootsOrders from './pages/RootsOrders.jsx';
import Staff from './pages/Staff.jsx';
// Customer-facing Roots pages
import RootsHome from './pages/roots/RootsHome.jsx';
import RootsSearch from './pages/roots/RootsSearch.jsx';
import RootsDish from './pages/roots/RootsDish.jsx';
import RootsRestaurant from './pages/roots/RootsRestaurant.jsx';
import RootsCart from './pages/roots/RootsCart.jsx';
import RootsOrdersCustomer from './pages/roots/RootsOrders.jsx';
import RootsAccount from './pages/roots/RootsAccount.jsx';

const NAV = [['/', 'Home'], ['/plans', 'Plans'], ['/menu', 'Menu'], ['/roots/', 'Roots']];
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

function AdminOnly({ children }) {
  const { user, ready } = useAuth();
  const loc = useLocation();
  if (!ready) return <p className="wrap sec">Loading…</p>;
  if (!user) return <Navigate to="/signin" state={{ from: loc.pathname }} replace />;
  const ADMIN_ROLES = ['owner', 'admin'];
  if (!ADMIN_ROLES.includes(user.role)) return <div className="wrap sec"><h1 className="serif">Access Denied</h1><p>Only administrators can access this area.</p><Link className="btn" to="/">Home</Link></div>;
  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Admin Roots (protected) */}
      <Route path="/roots/admin" element={<AdminOnly><Roots /></AdminOnly>} />
      <Route path="/roots/admin/orders" element={<AdminOnly><RootsOrders /></AdminOnly>} />

      {/* Customer-facing Roots (public) */}
      <Route path="/roots/*" element={
        <CartProvider>
          <RootsI18nProvider>
            <Routes>
              <Route path="/" element={<RootsHome />} />
              <Route path="/search" element={<RootsSearch />} />
              <Route path="/dish/:dishId" element={<RootsDish />} />
              <Route path="/restaurant/:restaurantId" element={<RootsRestaurant />} />
              <Route path="/cart" element={<RootsCart />} />
              <Route path="/orders" element={<RootsOrdersCustomer />} />
              <Route path="/account" element={<RootsAccount />} />
              <Route path="*" element={<div className="wrap sec"><h1 className="serif">Page not found</h1><Link className="btn" to="/roots">Home</Link></div>} />
            </Routes>
          </RootsI18nProvider>
        </CartProvider>
      } />

      {/* Admin */}
      <Route path="/app/*" element={<AdminOnly><Staff /></AdminOnly>} />

      {/* Public pages */}
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
