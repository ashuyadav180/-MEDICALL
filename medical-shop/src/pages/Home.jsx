import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchMyOrders } from '../api/orderApi';
import Medicines from './Medicines';
import { useAuth } from '../store/AuthContext';
import { useCart } from '../store/CartContext';
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
    <section className="recent-order-section">
      <div className="medicines-container recent-order-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '18px' }}>
          <div>
            <h2 className="section-title" style={{ marginBottom: '8px' }}>Your Latest Order</h2>
            <p style={{ margin: 0, color: 'var(--muted)' }}>
              Track your latest order here and open the full details when you want to see ordered items.
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
          <div className="recent-order-grid">
            <div className="card recent-order-card">
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
              <div style={{ marginTop: '12px', color: 'var(--muted)', fontSize: '0.92rem' }}>
                Ordered items are shown inside the order details page.
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
          </div>
        )}
      </div>
    </section>
  );
}

function Home() {
  return (
    <div className="main-content">
      <RecentOrderPanel />

      <section id="medicines">
        <Medicines />
      </section>

      <section className="why-us">
        <div className="section-heading">
          <h2 className="section-title">Why Bablu Medical Store?</h2>
          <p className="section-description">
            We pair decades of chemist experience with modern fulfillment so every order lands accurately and on time.
          </p>
        </div>
        <div className="usp-grid why-us-grid">
          <article className="usp-card">
            <div className="usp-emoji">🛡️</div>
            <h3>Verified stock</h3>
            <p>We inspect every batch, update inventory continuously, and only dispatch medicines that pass our strict quality checklist.</p>
          </article>
          <article className="usp-card">
            <div className="usp-emoji">🚚</div>
            <h3>Doorstep speed</h3>
            <p>Orders placed before 6PM go out the same day inside Attrasand; regional villages see delivery within 24 hours.</p>
          </article>
          <article className="usp-card">
            <div className="usp-emoji">💰</div>
            <h3>Transparent pricing</h3>
            <p>MRP rates, discounts, and delivery charges are clearly shown before you confirm the order—no surprises.</p>
          </article>
        </div>
      </section>
    </div>
  );
}

export default Home;
