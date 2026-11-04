/* Payment module boundary. Every screen goes through these two functions.
   Today's provider is a manual bank/UPI reference that an Admin verifies.
   A gateway (Razorpay / Cashfree / Stripe) later replaces requestPayment's body and calls
   confirmPayment from its webhook — screens and workflows stay unchanged. */
import { db, save, log, PLANS, planTotal, uid, today, addDays, notify } from './store.js';

export const PROVIDER = { id: 'manual-reference', label: 'Bank transfer / UPI — reference verified by Admin' };

export function requestPayment({ customer, planId, ref, userId = null, renewalFor = null }) {
  const plan = PLANS.find((p) => p.id === planId);
  const p = { id: uid('p'), ref, customer, plan: plan.id, amount: planTotal(plan), status: 'pending', date: today(), userId, renewalFor, provider: PROVIDER.id };
  db().payments.unshift(p);
  notify({ roles: ['owner', 'admin'] }, `${renewalFor ? 'Renewal' : 'New subscription'} payment to verify: ${customer} · ${ref}`, renewalFor ? '#/app/finance' : '#/app/people');
  save();
  return p;
}

/* Marks a payment confirmed and applies its effect (renewal extends the plan). */
export function confirmPayment(p, byName) {
  if (p.status === 'confirmed') return p;
  p.status = 'confirmed'; p.confirmedAt = new Date().toISOString();
  if (p.renewalFor) {
    const c = db().customers.find((x) => x.id === p.renewalFor), pl = PLANS.find((x) => x.id === p.plan);
    const from = c.planEnd > today() ? c.planEnd : today();
    c.planId = p.plan; c.planEnd = addDays(from, pl.days);
    log(byName, 'Plan renewed', `${c.code} → ${c.planEnd}`);
    if (c.userId) notify({ userId: c.userId }, `Your ${pl.name} renewal is confirmed. Meals continue until ${c.planEnd}.`, '#/app/me');
  }
  log(byName, 'Payment confirmed', `${p.ref} ₹${p.amount} (${p.customer})`);
  save();
  return p;
}

export const pendingPaymentFor = (user) => db().payments.find((x) => x.status === 'pending' && !x.renewalFor && (x.userId === user.id || (!x.userId && x.customer === user.name)));
