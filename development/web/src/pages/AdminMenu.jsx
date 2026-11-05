import { useEffect, useMemo, useState } from 'react';
import { Sunrise, Sun, Moon } from 'lucide-react';
import { useI18n } from '../i18n.jsx';
import { api } from '../api.js';
import PatternCard from '../components/PatternCard.jsx';

const SLOTS = [
  { id: 'Breakfast', icon: Sunrise },
  { id: 'Lunch', icon: Sun },
  { id: 'Dinner', icon: Moon },
];

const dishCount = (n) => `${n} ${n === 1 ? 'dish' : 'dishes'}`;

export default function AdminMenu() {
  const { t, lang, setLang } = useI18n();
  const [dishes, setDishes] = useState([]);
  const [error, setError] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('Breakfast');
  const [selectedTag, setSelectedTag] = useState('');

  useEffect(() => {
    api('/menu')
      .then(setDishes)
      .catch((e) => setError(e.message));
  }, []);

  const tags = useMemo(() => [...new Set(dishes.flatMap((d) => d.tags))].sort(), [dishes]);
  const filtered = dishes.filter((d) => d.slot === selectedSlot && (!selectedTag || d.tags.includes(selectedTag)));

  return (
    <section className="admin-section">
      <div className="admin-hero">
        <h1 className="serif">{t('Today\'s Menu')}</h1>
        <p>Home-style cooking · {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      <div className="admin-header">
        <div className="tabs">
          {['Today', 'This Week', 'Browse', 'Bundles', 'For You', 'My Ratings'].map((tab) => (
            <button key={tab} className={tab === 'Today' ? 'tab on' : 'tab'}>
              {tab}
            </button>
          ))}
        </div>
        <button className="btn ghost sm" onClick={() => setLang(lang === 'en' ? 'ta' : 'en')}>
          🌐 {lang === 'en' ? 'தமிழ்' : 'English'}
        </button>
      </div>

      {error && <p role="alert" className="notice">{error}</p>}

      <p className="order-cutoff">⏰ Order before 8:00 PM — 20h 9m remaining for tomorrow's meals.</p>

      <div className="pcards" role="group" aria-label="Meal slot">
        {SLOTS.map(({ id, icon }) => {
          const slotDishes = dishes.filter((d) => d.slot === id);
          const diabetic = slotDishes.filter((d) => d.tags.includes('Diabetic')).length;
          return (
            <PatternCard
              key={id}
              icon={icon}
              value={slotDishes.length}
              title={t(id)}
              description={`${dishCount(slotDishes.length)} · ${diabetic} diabetic-friendly`}
              tone={selectedSlot === id ? 'forest' : 'sand'}
              selected={selectedSlot === id}
              onClick={() => setSelectedSlot(id)}
            />
          );
        })}
      </div>

      <div className="tag-filters" role="group" aria-label="Filter by tag">
        {['', ...tags].map((tag) => (
          <button
            key={tag || 'all'}
            className={`tag-filter ${tag === selectedTag ? 'on' : ''}`}
            aria-pressed={tag === selectedTag}
            onClick={() => setSelectedTag(tag)}
          >
            {tag || 'All'}
          </button>
        ))}
      </div>

      <section className="menu-slot">
        <h2 className="slot-title">{t(selectedSlot)}</h2>
        <p className="slot-count">{dishCount(filtered.length)}{selectedTag && ` · ${selectedTag}`}</p>

        {filtered.length === 0 ? (
          <p className="muted">No dishes match this filter.</p>
        ) : (
          <div className="dishes-grid">
            {filtered.map((d) => (
              <article key={d.id} className="dish-card">
                <div className="dish-header">
                  <div>
                    <b>{d.name}</b>
                    {d.nameTa && <><br /><small className="muted">{d.nameTa}</small></>}
                  </div>
                  {d.gi && <span className="badge">{d.gi}</span>}
                </div>

                <div className="dish-tags">
                  {d.tags.map((tag) => (
                    <span key={tag} className="badge green">{tag}</span>
                  ))}
                </div>

                <div className="dish-nutrition">
                  <small>
                    {d.kcal != null && <span>🔥 {d.kcal} kcal</span>}
                    {d.protein != null && <span>💪 {d.protein}g protein</span>}
                    {d.carbs != null && <span>🌾 {d.carbs}g carbs</span>}
                  </small>
                </div>

                <div className="dish-actions">
                  <button className="btn sm">Edit</button>
                  <button className="btn ghost sm">Delete</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
