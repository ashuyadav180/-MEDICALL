import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import PremiumPageShell from '../components/ui/PremiumPageShell';
import { fetchMedicineById, getCachedMedicineById, primeMedicineCache } from '../api/medicineApi';
import { useCart } from '../store/CartContext';
import { buildPackLabel, getMedicineImage } from '../utils/medicineDisplay';

function MedicineDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const initialMedicine = location.state?.medicine || getCachedMedicineById(id);
  const [medicine, setMedicine] = useState(initialMedicine || null);
  const [isLoading, setIsLoading] = useState(!initialMedicine);
  const { addItem, items } = useCart();

  useEffect(() => {
    const getMedicine = async () => {
      const cachedMedicine = location.state?.medicine || getCachedMedicineById(id);
      if (cachedMedicine) {
        setMedicine(cachedMedicine);
        setIsLoading(false);
      } else {
        setIsLoading(true);
      }

      try {
        const data = await fetchMedicineById(id);
        setMedicine(data);
        primeMedicineCache(data);
      } catch (error) {
        console.error('Failed to load medicine details:', error);
        if (!cachedMedicine) {
          setMedicine(null);
        }
      } finally {
        setIsLoading(false);
      }
    };
    getMedicine();
  }, [id, location.state]);

  const handleAddToCart = () => {
    if (!medicine) {
      return;
    }

    addItem({
      ...medicine,
      id: medicine.id,
      name: medicine.name,
      price: medicine.price,
      quantity: 1,
    });
  };

  if (isLoading) {
    return (
      <PremiumPageShell eyebrow="Medicine" title="Loading product details..." description="Fetching the full medicine information for a richer product page." />
    );
  }

  if (!medicine) {
    return (
      <PremiumPageShell
        eyebrow="Medicine"
        title="Medicine not found."
        description="The product could not be loaded, but you can return to the catalog and continue shopping."
      >
        <div className="premium-empty-state">
          <div className="premium-empty-icon">404</div>
          <h2>Medicine Not Found</h2>
          <p>This medicine could not be located in the catalog.</p>
          <div className="premium-inline-actions" style={{ justifyContent: 'center' }}>
            <button type="button" onClick={() => navigate('/')} className="premium-cta">
              Back to Shop
            </button>
          </div>
        </div>
      </PremiumPageShell>
    );
  }

  const cartItem = items.find((item) => item.id === medicine.id);
  const packLabel = buildPackLabel(medicine);

  return (
    <PremiumPageShell
      eyebrow={medicine.category || 'medicine'}
      title={medicine.name}
      description={medicine.description}
      stats={[
        { value: `Rs.${medicine.price.toFixed(2)}`, label: 'current price' },
        { value: medicine.stock > 0 ? 'In stock' : 'Out of stock', label: 'availability' },
      ]}
      heroBadges={['Detailed product view', 'Pack and stock clarity', 'Cart-ready decision']}
      heroPanels={[
        { label: 'Category', value: medicine.category || 'Medicine' },
        { label: 'Pack', value: packLabel },
        { label: 'Availability', value: medicine.stock > 0 ? 'Ready to order' : 'Unavailable' },
      ]}
      actions={
        <button type="button" className="premium-secondary-btn" onClick={() => navigate(-1)}>
          Back
        </button>
      }
      sideContent={
        <div className="premium-side-card">
          <span>Product summary</span>
          <strong>Pack, strength, and manufacturer details remain visible before users commit to cart.</strong>
          <ul className="premium-helper-list">
            <li>Rich fallback product visuals keep each category recognizable.</li>
            <li>Cart actions use the full medicine object so imagery stays consistent later.</li>
          </ul>
        </div>
      }
    >
      <section className="premium-surface-card">
        <div className="premium-product-hero">
          <div className="premium-product-stage">
            <img src={getMedicineImage(medicine)} alt={medicine.name} />
          </div>

          <div className="premium-form-grid">
            <div className="premium-chip-row">
              <span className="premium-pill">{medicine.category}</span>
              <span className="premium-pill">Pack: {packLabel}</span>
              {medicine.dosage ? <span className="premium-pill">Strength: {medicine.dosage}</span> : null}
            </div>

            <div className="premium-info-strip">
              <div>
                <strong>Manufacturer</strong>
                <div className="premium-muted">{medicine.manufacturer || 'Trusted healthcare brand'}</div>
              </div>
              <span className={`premium-soft-badge ${medicine.stock > 0 ? 'is-success' : 'is-danger'}`}>
                {medicine.stock > 0 ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>

            {medicine.sourceName && medicine.sourceUrl ? (
              <a href={medicine.sourceUrl} target="_blank" rel="noreferrer" className="premium-ghost-btn">
                Source: {medicine.sourceName}
              </a>
            ) : null}

            <div className="premium-price-emphasis">
              <strong>Rs.{medicine.price.toFixed(2)}</strong>
              <span className="premium-tag">{medicine.stock} unit(s) available</span>
            </div>

            <div className="premium-inline-actions">
              {cartItem ? (
                <Link to="/cart" className="premium-cta">
                  View in Cart ({cartItem.quantity})
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={medicine.stock === 0}
                  className="premium-cta"
                >
                  {medicine.stock > 0 ? 'Add to Cart' : 'Currently Unavailable'}
                </button>
              )}
              <Link to="/" className="premium-secondary-btn">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="premium-surface-card">
        <div className="premium-section-header">
          <div>
            <h3>Product Information and Usage</h3>
            <p>Important context remains easy to scan in a cleaner informational surface.</p>
          </div>
        </div>
        <p className="premium-support-copy">
          This medicine ({medicine.name}) is primarily used for {String(medicine.description || '').toLowerCase()}.
          As with all healthcare products, please ensure you follow the prescribed dosage or consult a healthcare
          professional before use. Keep out of reach of children and store in a cool, dry place.
        </p>
      </section>
    </PremiumPageShell>
  );
}

export default MedicineDetails;
