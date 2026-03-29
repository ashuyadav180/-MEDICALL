import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { fetchMedicines } from '../api/medicineApi';
import { useCart } from '../store/CartContext';

function Medicines() {
  const { t } = useTranslation();
  const { addItem } = useCart();
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    const loadMedicines = async () => {
      try {
        const data = await fetchMedicines();
        setMedicines(data);
      } catch (err) {
        console.error('Failed to load medicines:', err);
      } finally {
        setLoading(false);
      }
    };
    loadMedicines();
  }, []);

  const filteredMedicines = medicines.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || m.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [
    { id: 'all', label: t('medicines.category_all') },
    { id: 'tablet', label: t('medicines.category_tablet') },
    { id: 'syrup', label: t('medicines.category_syrup') },
    { id: 'capsule', label: t('medicines.category_capsule') },
  ];

  if (loading) return <div className="text-center p-20"><h2>Loading...</h2></div>;

  return (
    <div className="medicines-container">
      <h2 className="section-title">Common Medicines 💊</h2>

      {/* --- SEARCH BAR --- */}
      <div className="search-bar" style={{ position: 'relative', marginBottom: '30px' }}>
        <input 
          type="text" 
          placeholder={t('medicines.search_placeholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
        <span className="search-icon">🔍</span>
      </div>

      {/* --- CATEGORY TABS --- */}
      <div className="category-tabs">
        {categories.map(cat => (
          <button 
            key={cat.id} 
            className={`cat-tab ${activeCategory === cat.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* --- MEDICINES GRID --- */}
      <div className="medicines-grid">
        {filteredMedicines.length === 0 ? (
          <div className="no-results">No medicines found "{searchQuery}"</div>
        ) : (
          filteredMedicines.map(med => (
            <div key={med.id} className="medicine-card">
              <div className="medicine-badge" style={{ fontSize: '0.6rem', padding: '2px 8px', borderRadius: '10px', background: 'var(--green-pale)', color: 'var(--green)', position: 'absolute', top: '10px', right: '10px', fontWeight: 800, textTransform: 'uppercase' }}>
                {med.category}
              </div>
              <div className="med-icon-small">💊</div>
              <h3 className="med-name">{med.name}</h3>
              <p className="med-desc">{med.description}</p>
              <div className="med-foot">
                <span className="med-price">₹{med.price.toFixed(2)}</span>
                <div className="med-actions">
                  <Link to={`/medicine/${med.id}`} className="med-link-btn">
                    View
                  </Link>
                  <button 
                    className="add-to-cart-btn"
                    onClick={() => addItem({ ...med, quantity: 1 })}
                  >
                    {t('medicines.add_to_cart')}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Medicines;
