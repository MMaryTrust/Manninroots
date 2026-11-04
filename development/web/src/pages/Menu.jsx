import { useI18n } from '../i18n.jsx';
import { useApi } from '../hooks.js';

const SLOTS = ['Breakfast', 'Lunch', 'Dinner'];

export default function MenuPage() {
  const { t, bi } = useI18n();
  const [dishes, error] = useApi('/menu', []);
  return (
    <section className="wrap sec">
      <h1 className="serif">{bi("This week's menu", 'இந்த வார உணவுப்பட்டியல்')}</h1>
      {error && <p role="alert" className="notice">{error}</p>}
      {SLOTS.map((slot) => (
        <div key={slot}>
          <h2 className="serif">{t(slot)}</h2>
          <div className="grid dishes">
            {dishes.filter((d) => d.slot === slot).map((d) => (
              <article key={d.id} className="card dish">
                <div className="dish-art" aria-hidden="true">{d.name[0]}</div>
                <b>{bi(d.name, d.nameTa)}</b>
                <p className="small muted">{d.kcal} kcal · {d.protein}g protein · {d.carbs}g carbs</p>
                <div>
                  <span className={'badge ' + (d.gi === 'Low-GI' ? 'green' : 'gold')}>{d.gi}</span>
                  {d.tags.map((x) => <span key={x} className="badge">{x}</span>)}
                  {d.allergens.map((x) => <span key={x} className="badge berry">{x}</span>)}
                </div>
              </article>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
