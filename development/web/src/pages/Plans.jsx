import { useI18n } from '../i18n.jsx';
import { usePlans } from '../hooks.js';
import PlanCard from '../components/PlanCard.jsx';

export default function Plans() {
  const { bi } = useI18n();
  const plans = usePlans();
  return (
    <section className="wrap sec">
      <h1 className="serif">{bi('Meal plans', 'உணவுத் திட்டங்கள்')}</h1>
      <p className="lead">{bi('Three meals a day. Longer plans cost less per day.', 'தினமும் மூன்று வேளை. நீண்ட திட்டங்கள் நாளுக்குக் குறைவு.')}</p>
      <div className="grid plans">{plans.map((p) => <PlanCard key={p.id} p={p} />)}</div>
    </section>
  );
}
