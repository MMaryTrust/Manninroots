// Supabase Edge Function: admin-users
// The ONLY server-side code in this project. It does one job: create login accounts,
// because that needs the service_role key, which must never reach a browser.
//   POST { action: "approve_signup", request_id }   → Owner/Admin approves a paid sign-up
//   POST { action: "create_staff", name, email, role } → Owner/Admin creates a staff account
// Both return { temp_password } exactly once. It is never stored or logged.
// Secrets SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided by Supabase automatically.
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';

const cors = {
  'Access-Control-Allow-Origin': '*', // tighten to your site's domain once it is hosted
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const STAFF_ROLES = ['owner', 'admin', 'doctorAdmin', 'doctor', 'manager', 'kitchen', 'rider'];

function tempPassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  return Array.from(crypto.getRandomValues(new Uint32Array(12)), (n) => chars[n % chars.length]).join('');
}
const addDays = (iso: string, n: number) => { const d = new Date(iso + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const todayIST = () => new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });

  // who is calling? must be an active Owner or Admin
  const jwt = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  const { data: caller } = await admin.auth.getUser(jwt);
  if (!caller?.user) return json({ error: 'Not signed in' }, 401);
  const { data: me } = await admin.from('profiles').select('id,status,user_roles(role)').eq('id', caller.user.id).single();
  const myRole = (me as any)?.user_roles?.role ?? (me as any)?.user_roles?.[0]?.role;
  if (!me || me.status !== 'active' || !['owner', 'admin'].includes(myRole)) return json({ error: 'Only Owner or Admin' }, 403);

  let body: any;
  try { body = await req.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }
  const pw = tempPassword();

  async function createLogin(email: string, name: string, phone: string | null, role: string) {
    const { data, error } = await admin.auth.admin.createUser({ email, password: pw, email_confirm: true });
    if (error || !data.user) throw new Error(error?.message || 'Could not create login');
    const id = data.user.id;
    const p = await admin.from('profiles').insert({ id, name, email, phone, must_change_password: true });
    const r = p.error ? p : await admin.from('user_roles').insert({ user_id: id, role, granted_by: me!.id });
    if (p.error || r.error) { await admin.auth.admin.deleteUser(id); throw new Error((p.error || r.error)!.message); }
    return id;
  }

  try {
    if (body.action === 'approve_signup') {
      const { data: rq } = await admin.from('signup_requests').select('*').eq('id', body.request_id).eq('status', 'pending').single();
      if (!rq) return json({ error: 'Request not found or already handled' }, 404);
      const { data: plan } = await admin.from('plans').select('*').eq('id', rq.plan_id).single();
      const userId = await createLogin(rq.email, rq.name, rq.phone, 'customer');
      const start = todayIST();
      const { data: cust, error: ce } = await admin.from('customers').insert({ user_id: userId, name: rq.name, phone: rq.phone, plan_id: plan.id, plan_start: start, plan_end: addDays(start, plan.days) }).select('id,code').single();
      if (ce) throw new Error(ce.message);
      const { data: pay, error: pe } = await admin.from('payments').insert({ ref: rq.payment_ref, customer_id: cust.id, user_id: userId, customer_name: rq.name, plan_id: plan.id, amount: plan.total }).select('id').single();
      if (pe) throw new Error(pe.message);
      await admin.from('payments').update({ status: 'confirmed', confirmed_by: me.id }).eq('id', pay.id);
      await admin.from('signup_requests').update({ status: 'approved' }).eq('id', rq.id);
      await admin.from('audit_log').insert({ actor: me.id, action: 'Account approved', detail: `${rq.email} · ${cust.code} · ${plan.name}` });
      await admin.from('notifications').insert({ user_id: userId, created_by: me.id, text: `Welcome to Mannin Suvai! Your ${plan.name} plan is active. Next step: share your family health profile.`, link: '#/app/me' });
      return json({ temp_password: pw, customer_code: cust.code });
    }

    if (body.action === 'create_staff') {
      const { name, email, role } = body;
      if (!name || !email || !STAFF_ROLES.includes(role)) return json({ error: 'Name, email and a staff role are required' }, 400);
      if (role === 'owner' && myRole !== 'owner') return json({ error: 'Only the Owner can create another Owner' }, 403);
      await createLogin(email, name, null, role);
      await admin.from('audit_log').insert({ actor: me.id, action: 'Staff created', detail: `${email} (${role})` });
      return json({ temp_password: pw });
    }

    return json({ error: 'Unknown action' }, 400);
  } catch (e) {
    return json({ error: (e as Error).message }, 400);
  }
});
