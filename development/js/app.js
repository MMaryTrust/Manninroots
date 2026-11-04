import { init, db } from './store.js';
import { $, $$, acts, routes, mounts } from './util.js';
import './public.js';
import './staff.js';
import './roots.js';
import './workflow.js';

function render() {
  const path = location.hash.slice(1).split('?')[0] || '/';
  const view = $('#view');
  document.body.classList.toggle('is-roots', path.startsWith('/roots'));
  const r = routes[path] || (() => `<div class="wrap sec"><h1 class="serif">Page not found</h1><a class="btn" href="#/">Home</a></div>`);
  const html = r();
  if (typeof html === 'string') view.innerHTML = html;
  const io = 'IntersectionObserver' in window ? new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.15 }) : null;
  mounts.forEach((m) => m());
  $$('.reveal').forEach((el, i) => { el.style.transitionDelay = (i % 4) * 90 + 'ms'; io ? io.observe(el) : el.classList.add('in'); });
}
let lastPath = null;
window.addEventListener('hashchange', () => { render(); const p = location.hash.split('?')[0]; if (p !== lastPath) window.scrollTo(0, 0); lastPath = p; });
window.addEventListener('mannin:rerender', () => { const y = scrollY; render(); scrollTo(0, y); });
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (el && acts[el.dataset.act]) { e.preventDefault(); acts[el.dataset.act](el, e); }
});
init().then(render);
