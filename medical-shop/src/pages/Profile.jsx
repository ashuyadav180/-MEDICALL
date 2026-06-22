import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PremiumPageShell from '../components/ui/PremiumPageShell';
import { updateProfile } from '../api/authApi';
import { fetchMyOrders } from '../api/orderApi';
import { useAuth } from '../store/AuthContext';
import { useCart } from '../store/CartContext';
import {
  getPaymentStatusMeta,
  getShortOrderReference,
  getStatusMeta,
  reorderOrderItems,
} from '../utils/orderDisplay';

function Profile() {
  const { user, isLoggedIn, login } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    password: '',
  });

  useEffect(() => {
    setForm({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      password: '',
    });
  }, [user]);

  useEffect(() => {
    const loadOrders = async () => {
      if (!isLoggedIn) {
        return;
      }

      try {
        const data = await fetchMyOrders();
        setOrders(data);
      } catch (loadError) {
        setError(loadError.response?.data?.message || 'Failed to load order history.');
      } finally {
        setLoadingOrders(false);
      }
    };

    loadOrders();
  }, [isLoggedIn]);

  if (!isLoggedIn) {
    return (
      <PremiumPageShell
        eyebrow="My account"
        title="Log in to view your healthcare profile."
        description="Your account keeps delivery details, order history, and repeat purchases in one place."
      >
        <div className="premium-empty-state">
          <div className="premium-empty-icon">ID</div>
          <h2>Please log in to view your profile.</h2>
          <p>Once you sign in, your account page will show order history and saved details.</p>
          <div className="premium-inline-actions" style={{ justifyContent: 'center' }}>
            <button type="button" className="premium-cta" onClick={() => navigate('/login')}>
              Go to Login
            </button>
          </div>
        </div>
      </PremiumPageShell>
    );
  }

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const { token, user: updatedUser } = await updateProfile(form);
      login(token, updatedUser);
      setForm((prev) => ({ ...prev, password: '' }));
      setMessage('Profile updated successfully.');
    } catch (updateError) {
      setError(updateError.message);
    } finally {
      setSaving(false);
    }
  };

  const handleReorder = (order) => {
    const reorderedQuantity = reorderOrderItems(order, addItem);
    navigate('/cart', {
      state: {
        message: `${reorderedQuantity} item(s) from ${getShortOrderReference(order)} were added to your cart.`,
      },
    });
  };

  const latestOrder = orders[0] || null;

  return (
    <PremiumPageShell
      eyebrow="My account"
      title={`Welcome back, ${user?.name || 'Customer'}.`}
      description="Manage your account details, inspect payment and delivery progress, and reorder medicines without starting from scratch."
      stats={[
        { value: String(orders.length), label: 'orders placed' },
        { value: latestOrder ? getShortOrderReference(latestOrder) : 'None yet', label: 'latest order' },
      ]}
      heroBadges={['Account command center', 'One-tap reorder', 'Live order memory']}
      heroPanels={[
        { label: 'Orders placed', value: String(orders.length) },
        { label: 'Latest ref', value: latestOrder ? getShortOrderReference(latestOrder) : 'No orders yet' },
        { label: 'Actions', value: 'Update, view, reorder' },
      ]}
      actions={
        <button type="button" className="premium-secondary-btn" onClick={() => navigate('/')}>
          Start New Order
        </button>
      }
      sideContent={
        <div className="premium-side-card">
          <span>Account system</span>
          <strong>Your account now acts like a command center for orders, profile updates, and reorders.</strong>
          <ul className="premium-helper-list">
            <li>See payment status and fulfillment stage in one place.</li>
            <li>Update profile details without leaving the account hub.</li>
          </ul>
        </div>
      }
    >
      {error ? <div className="premium-note-banner is-danger">{error}</div> : null}
      {message ? <div className="premium-note-banner is-success">{message}</div> : null}

      <div className="premium-grid-two">
        <section className="premium-form-panel">
          <div className="premium-section-header">
            <div>
              <h2>Account Details</h2>
              <p>Keep your core profile data current for smoother ordering and delivery.</p>
            </div>
          </div>

          <form onSubmit={handleUpdate} className="premium-form-grid">
            <div className="premium-field">
              <label>Full Name</label>
              <input name="name" value={form.name} onChange={handleChange} placeholder="Full Name" className="premium-input" />
            </div>
            <div className="premium-field">
              <label>Email</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="Email" className="premium-input" />
            </div>
            <div className="premium-field">
              <label>Phone</label>
              <input name="phone" value={form.phone} onChange={handleChange} placeholder="10-digit mobile number" maxLength="10" className="premium-input" />
            </div>
            <div className="premium-field">
              <label>New Password</label>
              <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Optional password change" className="premium-input" />
            </div>
            <button type="submit" className="premium-cta" disabled={saving}>
              {saving ? 'Saving...' : 'Update Details'}
            </button>
          </form>
        </section>

        <section className="premium-surface-card">
          <div className="premium-section-header">
            <div>
              <h2>Order History ({orders.length})</h2>
              <p>Review past orders, monitor status, or move the same medicines back into the cart.</p>
            </div>
          </div>

          {loadingOrders ? (
            <div className="premium-muted">Loading orders...</div>
          ) : orders.length === 0 ? (
            <div className="premium-empty-state" style={{ padding: '24px' }}>
              <div className="premium-empty-icon" style={{ width: '72px', height: '72px', fontSize: '1.8rem' }}>
                Rx
              </div>
              <h2>No orders yet.</h2>
              <p>Once you place your first order, it will appear here with delivery and payment status.</p>
            </div>
          ) : (
            <div className="premium-list-stack">
              {orders.map((order) => (
                <article key={order.id} className="premium-order-mini-card">
                  <div className="premium-track-header">
                    <strong>{getShortOrderReference(order)}</strong>
                    <span className="premium-pill">{new Date(order.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="premium-grid-two" style={{ marginTop: '14px', gap: '12px' }}>
                    <div className="premium-support-card">
                      <strong>Total</strong>
                      <span>Rs.{Number(order.totalPrice || 0).toFixed(2)}</span>
                    </div>
                    <div className="premium-support-card">
                      <strong>Status</strong>
                      <span>{getStatusMeta(order.status).label}</span>
                    </div>
                  </div>
                  <div className="premium-between-row" style={{ marginTop: '14px' }}>
                    <span className="premium-soft-badge">
                      Payment: {getPaymentStatusMeta(order.paymentStatus).label}
                    </span>
                    <div className="premium-inline-actions">
                      <button
                        type="button"
                        onClick={() => navigate(`/orders/${encodeURIComponent(order.id)}`)}
                        className="premium-secondary-btn"
                      >
                        View
                      </button>
                      <button type="button" onClick={() => handleReorder(order)} className="premium-cta">
                        Reorder
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </PremiumPageShell>
  );
}

export default Profile;
