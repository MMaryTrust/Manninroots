import { Link } from 'react-router-dom';
import { useI18n } from '../i18n.jsx';
import { usePlans } from '../hooks.js';
import PlanCard from '../components/PlanCard.jsx';

export default function Home() {
  const { t, bi } = useI18n();
  const plans = usePlans();
  return (
    <>
      <section className="hero"><div className="wrap hero-grid">
        <div>
          <p className="eyebrow">{bi('Heritage food for elders & families', 'பெரியோருக்கும் குடும்பத்திற்கும் மரபு உணவு')}</p>
          <h1 className="serif">{bi(<>The <em>taste of the land</em>, three times a day.</>, <>மண்ணின் சுவை, <em>தினமும் மூன்று வேளை</em>.</>)}</h1>
          <p className="lead">{bi('Thanjavur and Pudukkottai home cooking — mud-pot thalis, native millets and cold-pressed sesame oil — planned with a doctor for your family.', 'தஞ்சை, புதுக்கோட்டை மரபு சமையல் — மண்பானை தாலி, சிறுதானியம், செக்கு எண்ணெய் — மருத்துவர் ஆலோசனையுடன்.')}</p>
          <div className="row gap wrap"><Link className="btn lg" to="/plans">{t('See plans')}</Link><Link className="btn ghost lg" to="/menu">{t("This week's menu")}</Link></div>
        </div>
        <div className="hero-photos" aria-hidden="true"><img src="/assets/home-heritage-grains.jpg" alt="" /><img src="/assets/home-ragi-kanji.jpg" alt="" loading="lazy" /></div>
      </div></section>

      <section className="sec"><div className="wrap">
        <h2 className="serif">{t('Family meal plans')}</h2>
        <div className="grid plans">{plans.map((p) => <PlanCard key={p.id} p={p} />)}</div>
      </div></section>

      <section className="wrap sec roots-cta card">
        <div><h2 className="serif">Mannin Roots</h2><p>{bi('Neighbourhood restaurants, one cart, one flat fee.', 'அருகிலுள்ள உணவகங்கள், ஒரே கூடை, ஒரே கட்டணம்.')}</p></div>
        <Link className="btn" to="/roots">{t('Order Food')}</Link>
      </section>
    </>
  );
}
