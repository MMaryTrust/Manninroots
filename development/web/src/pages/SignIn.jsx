import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { useI18n } from '../i18n.jsx';

export default function SignIn() {
  const { signIn } = useAuth();
  const { t } = useI18n();
  const nav = useNavigate();
  const loc = useLocation();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true); setError('');
    try {
      await signIn(f.get('email'), f.get('password'));
      nav(loc.state?.from || '/app', { replace: true });
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  return (
    <section className="wrap narrow sec">
      <h1 className="serif">{t('Sign in')}</h1>
      <form className="form card" onSubmit={submit}>
        <label>{t('Email')}<input name="email" type="email" required autoComplete="username" /></label>
        <label>{t('Password')}<input name="password" type="password" required autoComplete="current-password" /></label>
        {error && <p role="alert" className="notice">{error}</p>}
        <button className="btn lg" disabled={busy}>{t('Sign in')}</button>
      </form>
    </section>
  );
}
