import { Link } from 'react-router-dom';
import { useI18n } from '../i18n.jsx';

export const rupees = (n) => '₹' + Number(n).toLocaleString('en-IN');

export default function PlanCard({ p }) {
  const { bi } = useI18n();
  return (
    <article className="card plan">
      <h3 className="serif">{bi(p.name, p.nameTa)}</h3>
      <div className="price mono">{rupees(p.total)}</div>
      <p className="muted small">{p.days} {bi('days', 'நாட்கள்')} · {rupees(p.rate)}/{bi('day', 'நாள்')}</p>
      <p>{bi(p.note, p.noteTa)}</p>
      {p.saving > 0 && <span className="badge green">{bi('Save', 'சேமிப்பு')} {rupees(p.saving)}</span>}
      <Link className="btn" to="/signin">{bi('Choose', 'தேர்ந்தெடு')}</Link>
    </article>
  );
}
