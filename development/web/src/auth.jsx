import { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api.js';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    api('/auth/me').then((r) => setUser(r.user)).catch(() => setUser(null)).finally(() => setReady(true));
  }, []);
  const signIn = async (email, password) => { const r = await api('/auth/login', { method: 'POST', body: { email, password } }); setUser(r.user); return r.user; };
  const signOut = async () => { await api('/auth/logout', { method: 'POST' }); setUser(null); };
  return <Ctx.Provider value={{ user, ready, signIn, signOut }}>{children}</Ctx.Provider>;
}
