import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { fetchMyOrders } from '../api/orderApi';
import Medicines from './Medicines';
import { useAuth } from '../store/AuthContext';
import { useCart } from '../store/CartContext';
import { getMedicineImage } from '../utils/medicineDisplay';
import { getOrderReference, getPaymentStatusMeta, getShortOrderReference, getStatusMeta, reorderOrderItems } from '../utils/orderDisplay';

function RecentOrderPanel() {
  const { isLoggedIn, user } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadOrders = async () => {
      if (!isLoggedIn || user?.role !== 'customer') {
        setLoading(false);
        return;
      }

      try {
        const data = await fetchMyOrders();
        setOrders(data);
      } catch (loadError) {
        setError(loadError.response?.data?.message || 'Failed to load recent order.');
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [isLoggedIn, user?.role]);

  const latestOrder = useMemo(() => orders[0] || null, [orders]);

  const handleReorder = () => {
    if (!latestOrder) {
      return;
    }

    const reorderedQuantity = reorderOrderItems(latestOrder, addItem);
    navigate('/cart', {
      state: {
        message: `${reorderedQuantity} item(s) from ${getShortOrderReference(latestOrder)} were added to your cart.`,
      },
    });
  };

  if (!isLoggedIn || user?.role !== 'customer') {
    return null;
  }

  return (
    <section style={{ marginTop: '24px' }}>
      <div className="medicines-container" style={{ padding: '26px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '18px' }}>
          <div>
            <h2 className="section-title" style={{ marginBottom: '8px' }}>Your Latest Order</h2>
            <p style={{ margin: 0, color: 'var(--muted)' }}>
              See what you ordered, where your order is, and open the full details quickly.
            </p>
          </div>
          <Link to="/profile" className="med-link-btn" style={{ textDecoration: 'none' }}>
            View All Orders
          </Link>
        </div>

        {loading ? (
          <div style={{ color: 'var(--muted)' }}>Loading your order details...</div>
        ) : error ? (
          <div style={{ color: 'var(--red)', fontWeight: 700 }}>{error}</div>
        ) : !latestOrder ? (
          <div style={{ display: 'grid', gap: '10px' }}>
            <div style={{ color: 'var(--muted)' }}>You have not placed an order yet.</div>
            <a href="#medicines" className="cta-btn" style={{ width: 'fit-content', marginTop: 0 }}>
              Order Medicines
            </a>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px' }}>
            <div className="card" style={{ padding: '22px' }}>
              <div style={{ fontSize: '0.82rem', color: 'var(--muted)', marginBottom: '6px' }}>Order reference</div>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--green)', marginBottom: '14px' }}>
                {getOrderReference(latestOrder)}
              </div>
              <div style={{ display: 'grid', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                  <span style={{ color: 'var(--muted)' }}>Status</span>
                  <span className={`status-${latestOrder.status.toLowerCase()}`}>{getStatusMeta(latestOrder.status).label}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                  <span style={{ color: 'var(--muted)' }}>Ordered on</span>
                  <span>{new Date(latestOrder.createdAt).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                  <span style={{ color: 'var(--muted)' }}>Total</span>
                  <span style={{ fontWeight: 800 }}>Rs.{Number(latestOrder.totalPrice || 0).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                  <span style={{ color: 'var(--muted)' }}>Payment</span>
                  <span style={{ fontWeight: 700, color: latestOrder.paymentStatus === 'received' ? 'var(--green)' : '#8a5a00' }}>{getPaymentStatusMeta(latestOrder.paymentStatus).label}</span>
                </div>
              </div>
              <div style={{ marginTop: '14px', padding: '12px 14px', background: 'var(--green-soft)', borderRadius: '12px', color: 'var(--green-dark)', fontSize: '0.9rem' }}>
                {getStatusMeta(latestOrder.status).helper}
              </div>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '18px' }}>
                <Link to={`/orders/${encodeURIComponent(latestOrder.id)}`} className="cta-button" style={{ textDecoration: 'none', marginTop: 0 }}>
                  Open Order
                </Link>
                <button type="button" onClick={handleReorder} className="med-link-btn">
                  Reorder
                </button>
                <Link to={`/track?ref=${encodeURIComponent(getOrderReference(latestOrder))}`} className="med-link-btn" style={{ textDecoration: 'none' }}>
                  Track Status
                </Link>
              </div>
            </div>

            <div className="card" style={{ padding: '22px' }}>
              <h3 style={{ marginTop: 0, marginBottom: '14px', color: 'var(--green-dark)' }}>What You Ordered</h3>
              <div style={{ display: 'grid', gap: '12px' }}>
                {latestOrder.orderItems.slice(0, 4).map((item, index) => (
                  <div key={`${item.name}-${index}`} style={{ display: 'grid', gridTemplateColumns: '56px 1fr auto', gap: '12px', alignItems: 'center', paddingBottom: '12px', borderBottom: index === Math.min(latestOrder.orderItems.length, 4) - 1 ? 'none' : '1px solid var(--border)' }}>
                    <img
                      src={getMedicineImage(item)}
                      alt={item.name}
                      style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '12px', border: '1px solid var(--border)', background: '#f7fbf8' }}
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = getMedicineImage({ ...item, imageUrl: '' });
                      }}
                    />
                    <div>
                      <div style={{ fontWeight: 700 }}>{item.name}</div>
                      <div style={{ color: 'var(--muted)', fontSize: '0.86rem' }}>Qty {item.quantity}</div>
                    </div>
                    <div style={{ fontWeight: 800 }}>Rs.{Number((item.price || 0) * (item.quantity || 0)).toFixed(2)}</div>
                  </div>
                ))}
              </div>
              {latestOrder.orderItems.length > 4 && (
                <div style={{ marginTop: '10px', color: 'var(--muted)', fontSize: '0.88rem' }}>
                  +{latestOrder.orderItems.length - 4} more item(s)
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function Home() {
  const { t } = useTranslation();

  return (
    <div className="main-content">
      <div className="hero-section">
        <div className="hero-content">
          <div className="hero-kicker">Bablu Medical Store • Attrasand</div>
          <h1>{t('hero.title')}</h1>
          <p>{t('hero.subtitle')}</p>
          <div className="hero-highlight-row">
            <span className="hero-highlight-chip">Original medicines</span>
            <span className="hero-highlight-chip">UPI or COD</span>
            <span className="hero-highlight-chip">Live order updates</span>
          </div>
          <div className="hero-action-row">
            <a href="#medicines" className="cta-btn">{t('hero.cta')}</a>
            <Link to="/contact" className="hero-secondary-btn">Talk to Store</Link>
          </div>
        </div>
        <div className="hero-image">
          <div className="hero-visual-shell">
            <div className="hero-floating-pill hero-floating-pill-top">Prescription support</div>
            <div className="hero-floating-pill hero-floating-pill-bottom">Village delivery</div>
            <div className="hero-visual-card">
              <div className="hero-visual-icon">+</div>
              <div className="hero-visual-copy">
                <div className="hero-visual-title">Trusted medicine delivery</div>
                <p>
                  Upload a prescription, confirm payment by UPI or cash on delivery,
                  and track the full order from packing to doorstep.
                </p>
              </div>
              <div className="hero-visual-metrics">
                <div className="hero-metric-card">
                  <span className="hero-metric-value">Fast</span>
                  <span className="hero-metric-label">packing updates</span>
                </div>
                <div className="hero-metric-card">
                  <span className="hero-metric-value">Simple</span>
                  <span className="hero-metric-label">reorder flow</span>
                </div>
                <div className="hero-metric-card">
                  <span className="hero-metric-value">Safe</span>
                  <span className="hero-metric-label">verified payment proof</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <RecentOrderPanel />

      <section id="medicines">
        <Medicines />
      </section>

      <section className="why-us" style={{ marginTop: '60px', padding: '40px 0' }}>
        <h2 className="section-title" style={{ textAlign: 'center' }}>Why Bablu Medical Store?</h2>
        <div className="usp-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginTop: '30px' }}>
          <div className="usp-card" style={{ background: '#fff', padding: '20px', borderRadius: '15px', textAlign: 'center', border: '1.5px solid var(--border)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>Safe</div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '10px' }}>Original Medicine</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>We only sell original and bill-checked medicines.</p>
          </div>
          <div className="usp-card" style={{ background: '#fff', padding: '20px', borderRadius: '15px', textAlign: 'center', border: '1.5px solid var(--border)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>Fast</div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '10px' }}>Doorstep Delivery</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Delivery available in Attrasand and nearby villages.</p>
          </div>
          <div className="usp-card" style={{ background: '#fff', padding: '20px', borderRadius: '15px', textAlign: 'center', border: '1.5px solid var(--border)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>Save</div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '10px' }}>Best Prices</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Get medicines at discounted MRP rates local to you.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
