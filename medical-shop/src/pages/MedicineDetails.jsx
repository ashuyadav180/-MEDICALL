import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
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
    if (!medicine) return;
    addItem({
      id: medicine.id,
      name: medicine.name,
      price: medicine.price,
      quantity: 1,
    });
  };

  if (isLoading) return <div className="text-center p-20"><h2>Loading...</h2></div>;
  if (!medicine) {
    return (
      <div className="main-content text-center p-20">
        <h1 style={{ fontSize: '4rem', color: 'var(--green)' }}>404</h1>
        <h2 style={{ marginBottom: '20px' }}>Medicine Not Found</h2>
        <button onClick={() => navigate('/')} className="add-btn" style={{ padding: '12px 30px' }}>
          Back to Shop
        </button>
      </div>
    );
  }

  const cartItem = items.find((i) => i.id === medicine.id);
  const getBadgeClass = (category) => `med-badge badge-${category || 'other'}`;
  const packLabel = buildPackLabel(medicine);

  return (
    <div className="main-content">
      <button className="back-btn" onClick={() => navigate(-1)}>Back</button>

      <div className="med-detail-card" style={{ background: 'var(--card)', border: '1.5px solid var(--border)', borderRadius: '20px', padding: '30px', display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '40px', marginTop: '20px', boxShadow: 'var(--shadow)' }}>
        <div style={{ background: 'var(--bg)', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <img
            src={getMedicineImage(medicine)}
            alt={medicine.name}
            style={{ width: '100%', maxWidth: '320px', maxHeight: '280px', objectFit: 'contain' }}
          />
        </div>

        <div>
          <span className={getBadgeClass(medicine.category)} style={{ fontSize: '0.8rem' }}>
            {medicine.category}
          </span>
          <h1 style={{ color: 'var(--green)', fontSize: '2rem', fontWeight: 800, margin: '10px 0' }}>{medicine.name}</h1>
          <p style={{ color: 'var(--muted)', fontSize: '1.1rem', marginBottom: '20px' }}>{medicine.description}</p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
            <span style={{ background: '#eef6ff', color: '#175ea8', padding: '6px 12px', borderRadius: '999px', fontWeight: 700, fontSize: '0.85rem' }}>
              Pack: {packLabel}
            </span>
            {medicine.dosage && (
              <span style={{ background: '#f5f3ff', color: '#5b21b6', padding: '6px 12px', borderRadius: '999px', fontWeight: 700, fontSize: '0.85rem' }}>
                Strength: {medicine.dosage}
              </span>
            )}
          </div>

          {(medicine.manufacturer || medicine.sourceName) && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
              {medicine.manufacturer && (
                <span style={{ background: '#eef6ff', color: '#175ea8', padding: '6px 12px', borderRadius: '999px', fontWeight: 700, fontSize: '0.85rem' }}>
                  Maker: {medicine.manufacturer}
                </span>
              )}
              {medicine.sourceName && medicine.sourceUrl && (
                <a
                  href={medicine.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ background: '#f4f8ef', color: 'var(--green)', padding: '6px 12px', borderRadius: '999px', fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none' }}
                >
                  Source: {medicine.sourceName}
                </a>
              )}
            </div>
          )}

          <div className="medicine-price-row" style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px', padding: '20px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text)' }}>Rs.{medicine.price.toFixed(2)}</span>
            <span style={{ background: 'var(--green-pale)', color: 'var(--green)', padding: '5px 15px', borderRadius: '20px', fontWeight: 700, fontSize: '0.9rem' }}>
              {medicine.stock > 0 ? 'In Stock' : 'Out of Stock'}
            </span>
          </div>

          <div className="responsive-action-row" style={{ display: 'flex', gap: '15px' }}>
            {cartItem ? (
              <Link to="/cart" className="checkout-btn" style={{ textDecoration: 'none', textAlign: 'center', flex: 1, margin: 0 }}>
                View in Cart ({cartItem.quantity})
              </Link>
            ) : (
              <button
                onClick={handleAddToCart}
                disabled={medicine.stock === 0}
                className="checkout-btn"
                style={{ flex: 1, margin: 0 }}
              >
                {medicine.stock > 0 ? 'Add to Cart' : 'Currently Unavailable'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div style={{ marginTop: '40px', padding: '30px', background: 'var(--card)', border: '1.5px solid var(--border)', borderRadius: '20px' }}>
        <h3 className="section-title" style={{ border: 'none', padding: 0 }}>Product Information & Usage</h3>
        <p style={{ color: 'var(--muted)', lineHeight: '1.8' }}>
          This medicine ({medicine.name}) is primarily used for {medicine.description.toLowerCase()}.
          As with all healthcare products, please ensure you follow the prescribed dosage or consult with a healthcare professional before use.
          Keep out of reach of children and store in a cool, dry place.
        </p>
      </div>
    </div>
  );
}

export default MedicineDetails;
