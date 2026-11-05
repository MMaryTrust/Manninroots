import { Link } from 'react-router-dom';
import { ArrowLeft, LogOut, Settings } from 'lucide-react';
import RootsShell from '../../components/roots/RootsShell';
import { useRootsI18n } from '../../lib/roots-i18n';
import { useAuth } from '../../auth';
import { LANGUAGES } from '../../lib/roots-translations';

export default function RootsAccount() {
  const { t, lang, setLang } = useRootsI18n();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      logout();
    }
  };

  return (
    <RootsShell>
      <div className="space-y-4">
        <Link to="/roots" className="flex items-center gap-2 text-blue-600 hover:underline">
          <ArrowLeft size={20} />
          {t('home')}
        </Link>

        <h1 className="text-2xl font-bold">👤 {t('account')}</h1>

        {user ? (
          <div className="space-y-4">
            {/* Profile Info */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Settings size={20} />
                {t('account_settings')}
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">{t('email')}</p>
                  <p className="font-medium">{user.email || 'Not provided'}</p>
                </div>
                {user.phone && (
                  <div>
                    <p className="text-sm text-gray-600">{t('phone')}</p>
                    <p className="font-medium">{user.phone}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600">Member since</p>
                  <p className="font-medium">{new Date(user.createdAt || Date.now()).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {/* Language Settings */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h2 className="text-lg font-semibold mb-4">🌐 {t('selectLanguage')}</h2>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(LANGUAGES).map(([code, label]) => (
                  <button
                    key={code}
                    onClick={() => setLang(code)}
                    className={`p-3 rounded-lg border-2 transition font-medium ${
                      lang === code
                        ? 'bg-blue-100 border-blue-500 text-blue-900'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Order History Link */}
            <Link
              to="/roots/orders"
              className="block bg-white rounded-lg border border-gray-200 p-4 hover:shadow-lg transition"
            >
              <h3 className="font-semibold text-blue-600">📋 View order history</h3>
              <p className="text-sm text-gray-600">Track your previous orders</p>
            </Link>

            {/* Sign Out */}
            <button
              onClick={handleLogout}
              className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition font-medium flex items-center justify-center gap-2"
            >
              <LogOut size={20} />
              {t('sign_out')}
            </button>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">Please sign in to view your account</p>
            <Link
              to="/signin"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium inline-block"
            >
              {t('sign_in')}
            </Link>
          </div>
        )}
      </div>
    </RootsShell>
  );
}
