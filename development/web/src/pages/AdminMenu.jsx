import { useEffect, useState } from 'react';
import { useI18n } from '../i18n.jsx';
import { api } from '../api.js';

export default function AdminMenu() {
  const { t, bi, lang, setLang } = useI18n();
  const [dishes, setDishes] = useState([]);
  const [error, setError] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('Breakfast');
  const [selectedTag, setSelectedTag] = useState('');

  useEffect(() => {
    api('/api/menu')
      .then(setDishes)
      .catch((e) => setError(e.message));
  }, []);

  const filtered = dishes.filter(d =>
    d.slot === selectedSlot &&
    (!selectedTag || d.tags.includes(selectedTag))
  );

  const slotDishes = {
    Breakfast: dishes.filter(d => d.slot === 'Breakfast'),
    Lunch: dishes.filter(d => d.slot === 'Lunch'),
    Dinner: dishes.filter(d => d.slot === 'Dinner'),
  };

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

      <div className="slot-selector">
        <button className="pill" aria-label="Filter by language">🌐 {lang === 'en' ? 'தமிழ்' : 'English'}</button>
        <button className="pill" title="Diabetic-friendly">📊 HC</button>
      </div>

      <p className="order-cutoff">⏰ Order before 8:00 PM — 20h 9m remaining for tomorrow's meals.</p>

      <div className="tag-filters">
        {['All', 'Veg', 'Non-Veg', 'Diabetes-friendly', 'High Protein'].map((tag) => (
          <button
            key={tag}
            className={`tag-filter ${tag === 'All' || tag === selectedTag ? 'on' : ''}`}
            onClick={() => setSelectedTag(tag === 'All' ? '' : tag)}
          >
            {tag === 'Veg' ? '🟢' : tag === 'Non-Veg' ? '🟤' : tag === 'Diabetes-friendly' ? '📊' : tag === 'High Protein' ? '💪' : '✓'} {tag}
          </button>
        ))}
      </div>

      <div className="menu-sections">
        {Object.entries(slotDishes).map(([slot, slotItems]) => (
          <section key={slot} className="menu-slot">
            <h2 className="slot-title">
              {slot === 'Breakfast' ? '🥣' : slot === 'Lunch' ? '🍽️' : '🌙'} {t(slot)}
            </h2>
            <p className="slot-count">{slotItems.length} dishes</p>

            <div className="dishes-grid">
              {slotItems.map((d) => (
                <article key={d.id} className="dish-card">
                  <div className="dish-header">
                    <b>{d.name}</b>
                    {d.tags.includes('Signature') && <span className="badge">⭐ Signature</span>}
                  </div>

                  <div className="dish-info">
                    <span className="rating">⭐ {d.rating?.toFixed(1) || '4.5'}</span>
                    <span className="price">₹{d.priceInr || d.price || 100}</span>
                  </div>

                  <div className="dish-tags">
                    {d.tags.map((tag) => (
                      <span key={tag} className="badge green">{tag}</span>
                    ))}
                  </div>

                  <div className="dish-nutrition">
                    <small>
                      {d.gi && <span>🍂 {d.gi}</span>}
                      {d.kcal && <span>🔥 {d.kcal} kcal</span>}
                      {d.protein && <span>💪 {d.protein}g</span>}
                    </small>
                  </div>

                  <div className="dish-actions">
                    <button className="btn sm">Edit</button>
                    <button className="btn ghost sm">Delete</button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}
