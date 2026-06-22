import React, { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { fetchMedicines, getCachedMedicines, primeMedicineCache } from '../api/medicineApi';
import { useCart } from '../store/CartContext';
import { getMedicineImage, getMedicineTheme } from '../utils/medicineDisplay';
import '../styles/pharma-premium.css';

const fmtPrice = (v) => `₹${Number(v || 0).toFixed(0)}`;
const getDisc = (stock) => stock > 20 ? 18 : stock > 10 ? 14 : stock > 0 ? 9 : 0;
const getMrp = (price, stock) => { const d = getDisc(stock); return d > 0 ? Math.round(price / (1 - d / 100)) : price; };

const CATS = [
  { id: 'all', label: 'All', emoji: '💊' },
  { id: 'tablet', label: 'Tablets', emoji: '🔵' },
  { id: 'capsule', label: 'Capsules', emoji: '🟡' },
  { id: 'syrup', label: 'Syrups', emoji: '🧴' },
  { id: 'cream', label: 'Skin Care', emoji: '🫙' },
  { id: 'drops', label: 'Drops', emoji: '💧' },
  { id: 'injection', label: 'Injections', emoji: '💉' },
];

/* ── Premium Card (reuse ph-prod-card) ── */
function MedCard({ medicine, onAdd, isAdded }) {
  const [wished, setWished] = useState(false);
  const disc = getDisc(medicine.stock);
  const mrp = getMrp(medicine.price, medicine.stock);
  const save = mrp - medicine.price;
  const inStock = medicine.stock > 0;

  return (
    <div className="ph-prod-card ph-fadein">
      {disc > 0 && <span className="ph-prod-badge">{disc}% OFF</span>}
      <button className={`ph-prod-wish ${wished ? 'wished' : ''}`} onClick={() => setWished(v => !v)}>
        {wished ? '❤️' : '🤍'}
      </button>

      <Link
        to={`/medicine/${medicine.id}`}
        state={{ medicine }}
        className="ph-prod-img-wrap"
        style={{ display: 'flex', textDecoration: 'none' }}
        onMouseEnter={() => primeMedicineCache(medicine)}
      >
        <img
          src={getMedicineImage(medicine)}
          alt={medicine.name}
          className="ph-prod-img"
          loading="lazy"
          onError={e => { e.target.onerror = null; e.target.src = getMedicineImage({ ...medicine, imageUrl: '' }); }}
        />
      </Link>

      <p className="ph-prod-name">{medicine.name}</p>
      {medicine.dosage && <p className="ph-prod-dose">{medicine.dosage}</p>}
      {disc > 0
        ? <p className="ph-prod-mrp">MRP <s>{fmtPrice(mrp)}</s></p>
        : <p className="ph-prod-mrp">&nbsp;</p>
      }
      <div className="ph-prod-price-row">
        <span className="ph-prod-price">{fmtPrice(medicine.price)}</span>
        {save > 0 && <span className="ph-prod-save">Save {fmtPrice(save)}</span>}
      </div>

      {!inStock ? (
        <div className="ph-prod-oos">Out of Stock</div>
      ) : (
        <div className="ph-prod-btns">
          <button
            className={`ph-prod-btn-cart ${isAdded ? 'added' : ''}`}
            onClick={() => onAdd(medicine)}
          >
            {isAdded ? '✓ Added' : 'Add to Cart'}
          </button>
          <Link to={`/medicine/${medicine.id}`} state={{ medicine }} className="ph-prod-btn-buy">
            Buy Now
          </Link>
        </div>
      )}
    </div>
  );
}

/* ── Skeleton ── */
function SkeletonGrid() {
  return (
    <div className="ph-prod-grid">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="ph-prod-card" style={{ gap: 10 }}>
          <div className="ph-skeleton" style={{ width: '100%', height: 155, borderRadius: 14 }} />
          <div className="ph-skeleton" style={{ width: '85%', height: 12 }} />
          <div className="ph-skeleton" style={{ width: '60%', height: 10 }} />
          <div className="ph-skeleton" style={{ width: '45%', height: 13 }} />
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <div className="ph-skeleton" style={{ flex: 1, height: 32, borderRadius: 999 }} />
            <div className="ph-skeleton" style={{ flex: 1, height: 32, borderRadius: 999 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Main ── */
function Medicines() {
  const { t } = useTranslation();
  const { addItem } = useCart();
  const [searchParams] = useSearchParams();
  const [medicines, setMedicines] = useState(() => getCachedMedicines());
  const [loading, setLoading] = useState(() => getCachedMedicines().length === 0);
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('q') || '');
  const [activeCat, setActiveCat] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [addedIds, setAddedIds] = useState(new Set());
  const dq = useDeferredValue(searchQuery);

  useEffect(() => {
    const load = async () => {
      const cached = getCachedMedicines();
      if (cached.length) { setMedicines(cached); setLoading(false); }
      try {
        const data = await fetchMedicines({ forceRefresh: cached.length > 0 });
        setMedicines(data);
      } catch { /* keep cache */ } finally { setLoading(false); }
    };
    load();
  }, []);

  const handleAdd = (med) => {
    addItem({ ...med, quantity: 1 });
    setAddedIds(prev => { const s = new Set(prev); s.add(med.id); return s; });
    setTimeout(() => setAddedIds(prev => { const s = new Set(prev); s.delete(med.id); return s; }), 2000);
  };

  const filtered = useMemo(() => {
    const q = dq.trim().toLowerCase();
    return medicines
      .filter(m => {
        const matchQ = !q || m.name.toLowerCase().includes(q) || (m.manufacturer || '').toLowerCase().includes(q);
        const matchCat = activeCat === 'all' || m.category === activeCat;
        const matchSt = !inStockOnly || m.stock > 0;
        return matchQ && matchCat && matchSt;
      })
      .sort((a, b) => {
        if (sortBy === 'priceLow') return a.price - b.price;
        if (sortBy === 'priceHigh') return b.price - a.price;
        if (sortBy === 'stock') return b.stock - a.stock;
        return a.name.localeCompare(b.name);
      });
  }, [medicines, dq, activeCat, sortBy, inStockOnly]);

  return (
    <div className="pharma-page" style={{ paddingBottom: 60 }}>

      {/* ── Page Hero ── */}
      <div style={{
        background: 'linear-gradient(135deg, #0F9D58, #087443)',
        padding: '28px 24px 36px',
        textAlign: 'center',
      }}>
        <h1 style={{
          fontFamily: 'Poppins,sans-serif', fontSize: 'clamp(1.4rem,3vw,2rem)',
          fontWeight: 800, color: '#fff', margin: '0 0 16px',
        }}>
          🏥 All Medicines & Healthcare Products
        </h1>

        {/* Search */}
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <div className="ph-search-box" style={{ height: 52 }}>
            <div className="ph-search-icon-wrap">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <input
              id="med-search"
              type="text"
              className="ph-search-field"
              placeholder="Search medicines, brands..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{ padding: '0 16px', color: '#9ca3af', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '1.1rem' }}
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Category Tabs ── */}
      <div className="ph-tabs-section" style={{ top: 70 }}>
        <div className="ph-tabs-inner ph-filters-container">
          <div className="ph-tabs">
            {CATS.map(cat => (
              <button
                key={cat.id}
                className={`ph-tab ${activeCat === cat.id ? 'active' : ''}`}
                onClick={() => setActiveCat(cat.id)}
                id={`med-cat-${cat.id}`}
              >
                <span className="ph-tab-emoji">{cat.emoji}</span>
                {cat.label}
              </button>
            ))}
          </div>

          {/* Sort + Filters */}
          <div className="ph-sort-filter-row">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              style={{
                padding: '7px 12px', borderRadius: 999, border: '1.5px solid #e8ecf2',
                fontSize: '0.82rem', fontWeight: 600, color: '#374151',
                background: '#fff', cursor: 'pointer', outline: 'none',
              }}
              id="med-sort"
            >
              <option value="name">A–Z</option>
              <option value="priceLow">Price ↑</option>
              <option value="priceHigh">Price ↓</option>
              <option value="stock">Stock</option>
            </select>

            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', fontWeight: 600, color: '#374151', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={e => setInStockOnly(e.target.checked)}
                style={{ accentColor: '#0F9D58', width: 15, height: 15 }}
              />
              In Stock
            </label>

            <span style={{
              background: '#E6F7EE', color: '#0F9D58', borderRadius: 999,
              padding: '5px 12px', fontSize: '0.78rem', fontWeight: 700, whiteSpace: 'nowrap',
            }}>
              {filtered.length} items
            </span>
          </div>
        </div>
      </div>

      {/* ── Free Delivery Strip ── */}
      <div style={{
        background: 'linear-gradient(90deg, #ECFDF3, #D1FAE5)',
        borderBottom: '1px solid #A7F3D0',
        padding: '10px 20px',
        textAlign: 'center',
        fontSize: '0.84rem',
        fontWeight: 600,
        color: '#065f46',
      }}>
        🚚 FREE DELIVERY on orders above ₹299 &nbsp;·&nbsp; 🕐 Same-day dispatch available
      </div>

      {/* ── Products Grid ── */}
      <div style={{ maxWidth: 1200, margin: '28px auto', padding: '0 20px' }}>
        {loading && medicines.length === 0 ? (
          <SkeletonGrid />
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>🔍</div>
            <p style={{ fontSize: '1.1rem', color: '#6b7280', marginBottom: 20 }}>
              No medicines found for <strong>"{searchQuery}"</strong>
            </p>
            <button
              onClick={() => { setSearchQuery(''); setActiveCat('all'); }}
              style={{
                padding: '12px 28px', borderRadius: 999,
                background: '#0F9D58', color: '#fff', border: 'none',
                fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem',
              }}
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="ph-prod-grid">
            {filtered.map(med => (
              <MedCard
                key={med.id}
                medicine={med}
                onAdd={handleAdd}
                isAdded={addedIds.has(med.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Medicines;
