import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { fetchMedicines, getCachedMedicines, primeMedicineCache } from '../api/medicineApi';
import { useCart } from '../store/CartContext';
import { buildPackLabel, getMedicineImage, getMedicineTheme } from '../utils/medicineDisplay';

const formatPrice = (value) => `Rs.${Number(value || 0).toFixed(2)}`;

const formatMedicineCardData = (medicine) => {
  const price = Number(medicine.price || 0);
  const stock = Number(medicine.stock || 0);
  const theme = getMedicineTheme(medicine.category);
  const discountPercent = stock > 20 ? 18 : stock > 10 ? 14 : stock > 0 ? 9 : 0;
  const mrp = discountPercent > 0 ? price / (1 - discountPercent / 100) : price;
  const rating = (4.1 + ((medicine.name?.length || 0) % 8) * 0.1).toFixed(1);
  const reviewCount = 120 + ((medicine.name?.length || 1) * 37) % 2300;
  const packLabel = buildPackLabel(medicine);
  const manufacturer = medicine.manufacturer || 'Trusted healthcare brand';
  const headlineWord = (medicine.name || 'Care').split(' ')[0];

  return {
    theme,
    rating,
    reviewCount,
    discountPercent,
    mrp,
    packLabel,
    manufacturer,
    headlineWord,
    deliveryText: stock > 0 ? (stock > 15 ? 'Get by Tomorrow' : 'Get by Tue, 31 Mar') : 'Currently unavailable',
    stockText: stock > 0 ? `${stock} units in stock` : 'Out of stock',
  };
};

function MedicineCard({ medicine, addItem, t }) {
  const [isAdded, setIsAdded] = useState(false);
  const display = formatMedicineCardData(medicine);

  const handleAdd = () => {
    addItem({ ...medicine, quantity: 1 });
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  return (
    <div key={medicine.id} className="medicine-card medicine-card-shop">
      <div
        className="medicine-visual"
        style={{ background: `linear-gradient(180deg, #ffffff 0%, ${display.theme.glow} 100%)` }}
      >
        <span className="medicine-badge-shop">{medicine.category}</span>
        <img
          src={getMedicineImage(medicine)}
          alt={medicine.name}
          className="medicine-photo"
          loading="lazy"
          onError={(e) => {
            e.target.onerror = null; 
            e.target.src = getMedicineImage({ ...medicine, imageUrl: '' });
          }}
        />
      </div>

      <h3 className="med-name med-name-shop">{medicine.name}</h3>
      <p className="medicine-subcopy">{display.packLabel}</p>
      {medicine.dosage && (
        <p className="medicine-subcopy medicine-subcopy-dose">{medicine.dosage}</p>
      )}
      <p className="medicine-subcopy medicine-subcopy-muted">{display.manufacturer}</p>

      <div className="medicine-rating-row">
        <span className="medicine-stars">★★★★★</span>
        <span className="medicine-rating-text">{display.rating}</span>
        <span className="medicine-rating-count">({display.reviewCount})</span>
      </div>

      <div className="medicine-delivery">{display.deliveryText}</div>
      <div
        className={`medicine-stock-note ${medicine.stock > 0 ? 'is-available' : 'is-empty'}`}
      >
        {display.stockText}
      </div>

      <div className="medicine-price-block">
        <span className="medicine-price-shop">{formatPrice(medicine.price)}</span>
        {display.discountPercent > 0 && (
          <>
            <span className="medicine-mrp-shop">{formatPrice(display.mrp)}</span>
            <span className="medicine-discount-shop">{display.discountPercent}% off</span>
          </>
        )}
      </div>

      <div className="med-foot med-foot-shop">
        <Link
          to={`/medicine/${medicine.id}`}
          state={{ medicine }}
          className="med-link-btn"
          onMouseEnter={() => primeMedicineCache(medicine)}
          onFocus={() => primeMedicineCache(medicine)}
        >
          View
        </Link>
        <button
          className={`add-to-cart-btn ${isAdded ? 'added' : ''}`}
          disabled={medicine.stock === 0}
          onClick={handleAdd}
        >
          {isAdded ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              ✓ Added
            </span>
          ) : medicine.stock > 0 ? (
            t('medicines.add_to_cart')
          ) : (
            'Unavailable'
          )}
        </button>
      </div>
    </div>
  );
}

function Medicines() {
  const { t } = useTranslation();
  const { addItem } = useCart();
  const [medicines, setMedicines] = useState(() => getCachedMedicines());
  const [loading, setLoading] = useState(() => getCachedMedicines().length === 0);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [showInStockOnly, setShowInStockOnly] = useState(false);

  useEffect(() => {
    const loadMedicines = async () => {
      const cachedMedicines = getCachedMedicines();
      if (cachedMedicines.length) {
        setMedicines(cachedMedicines);
        setLoading(false);
      }

      try {
        const data = await fetchMedicines({ forceRefresh: cachedMedicines.length > 0 });
        setMedicines(data);
      } catch (err) {
        console.error('Failed to load medicines:', err);
      } finally {
        setLoading(false);
      }
    };
    loadMedicines();
  }, []);

  const filteredMedicines = medicines
    .filter((medicine) => {
      const searchText = searchQuery.toLowerCase();
      const matchesSearch =
        medicine.name.toLowerCase().includes(searchText) ||
        (medicine.manufacturer || '').toLowerCase().includes(searchText) ||
        (medicine.description || '').toLowerCase().includes(searchText);
      const matchesCategory = activeCategory === 'all' || medicine.category === activeCategory;
      const matchesStock = !showInStockOnly || medicine.stock > 0;
      return matchesSearch && matchesCategory && matchesStock;
    })
    .sort((a, b) => {
      if (sortBy === 'priceLow') return a.price - b.price;
      if (sortBy === 'priceHigh') return b.price - a.price;
      if (sortBy === 'stock') return b.stock - a.stock;
      return a.name.localeCompare(b.name);
    });

  const categories = [
    { id: 'all', label: t('medicines.category_all') },
    { id: 'tablet', label: t('medicines.category_tablet') },
    { id: 'syrup', label: t('medicines.category_syrup') },
    { id: 'capsule', label: t('medicines.category_capsule') },
    { id: 'cream', label: 'Cream' },
    { id: 'drops', label: 'Drops' },
    { id: 'injection', label: 'Injection' },
  ];

  if (loading) return <div className="text-center p-20"><h2>Loading...</h2></div>;

  return (
    <div className="medicines-container">
      <h2 className="section-title">Common Medicines</h2>

      <div className="search-bar" style={{ position: 'relative', marginBottom: '22px' }}>
        <input
          type="text"
          placeholder={`${t('medicines.search_placeholder')} / manufacturer`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
          style={{ paddingRight: '52px' }}
        />
        <div className="search-icon" style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </div>
      </div>

      <div className="category-tabs-wrapper" style={{ margin: '0 -26px', padding: '0 26px', overflow: 'hidden' }}>
        <div className="category-tabs">
        {categories.map((cat) => (
          <button
            key={cat.id}
            className={`cat-tab ${activeCategory === cat.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.id)}
          >
            {cat.label}
          </button>
        ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px', alignItems: 'center' }}>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ padding: '10px 12px', borderRadius: '10px', border: '1.5px solid var(--border)' }}>
          <option value="name">Sort: Name</option>
          <option value="priceLow">Price: Low to High</option>
          <option value="priceHigh">Price: High to Low</option>
          <option value="stock">Stock: High to Low</option>
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: 'var(--green)' }}>
          <input type="checkbox" checked={showInStockOnly} onChange={(e) => setShowInStockOnly(e.target.checked)} />
          In stock only
        </label>
      </div>

      <div className="medicines-grid">
        {filteredMedicines.length === 0 ? (
          <div className="no-results">No medicines found "{searchQuery}"</div>
        ) : (
          filteredMedicines.map((medicine) => (
            <MedicineCard key={medicine.id} medicine={medicine} addItem={addItem} t={t} />
          ))
        )}
      </div>
    </div>
  );
}

export default Medicines;
