import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { updateProfile } from '../api/authApi';
import { fetchMyOrders } from '../api/orderApi';
import { useAuth } from '../store/AuthContext';
import { useCart } from '../store/CartContext';
import { getPaymentStatusMeta, getShortOrderReference, getStatusMeta, reorderOrderItems } from '../utils/orderDisplay';

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
    return <div className="text-center p-20">Please log in to view your profile.</div>;
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
    <div className="profile-page">
      <div className="profile-hero">
        <div>
          <p className="profile-eyebrow">My Account</p>
          <h1>Welcome Back, {user?.name || 'Customer'}</h1>
          <p className="profile-subtitle">
            Manage your details and keep track of every medicine order in one place.
          </p>
        </div>

        <div className="profile-stats">
          <div className="profile-stat-card">
            <span className="profile-stat-label">Total orders</span>
            <strong>{orders.length}</strong>
          </div>
          <div className="profile-stat-card">
            <span className="profile-stat-label">Latest order</span>
            <strong>{latestOrder ? getShortOrderReference(latestOrder) : 'None yet'}</strong>
          </div>
        </div>
      </div>

      <div className="profile-grid">
        <div className="profile-details card">
          <h2>Account Details</h2>
          {error && <p style={{ color: 'var(--red)', fontWeight: 700 }}>{error}</p>}
          {message && <p style={{ color: 'var(--green)', fontWeight: 700 }}>{message}</p>}

          <form onSubmit={handleUpdate} style={{ display: 'grid', gap: '12px', marginTop: '15px' }}>
            <input name="name" value={form.name} onChange={handleChange} placeholder="Full Name" style={{ padding: '12px', borderRadius: '10px', border: '1.5px solid var(--border)' }} />
            <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="Email" style={{ padding: '12px', borderRadius: '10px', border: '1.5px solid var(--border)' }} />
            <input name="phone" value={form.phone} onChange={handleChange} placeholder="10-digit mobile number" maxLength="10" style={{ padding: '12px', borderRadius: '10px', border: '1.5px solid var(--border)' }} />
            <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="New password (optional)" style={{ padding: '12px', borderRadius: '10px', border: '1.5px solid var(--border)' }} />
            <button type="submit" className="cta-button" style={{ width: '100%' }} disabled={saving}>
              {saving ? 'Saving...' : 'Update Details'}
            </button>
          </form>
        </div>

        <div className="order-history card">
          <div className="profile-section-head">
            <div>
              <h2>Order History ({orders.length})</h2>
              <p className="profile-section-copy">
                Open any order, check payment progress, or reorder the same medicines quickly.
              </p>
            </div>
          </div>

          {loadingOrders ? (
            <div style={{ marginTop: '15px' }}>Loading orders...</div>
          ) : orders.length === 0 ? (
            <div style={{ marginTop: '15px', color: 'var(--muted)' }}>No orders yet.</div>
          ) : (
            <>
              <div className="order-history-table-wrap">
                <table className="admin-table" style={{ marginTop: '15px' }}>
                  <thead>
                    <tr>
                      <th>Order Ref</th>
                      <th>Date</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Payment</th>
                      <th>Details</th>
                      <th>Reorder</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id}>
                        <td>{getShortOrderReference(order)}</td>
                        <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                        <td>Rs.{Number(order.totalPrice || 0).toFixed(2)}</td>
                        <td><span className={`status-${order.status.toLowerCase()}`}>{getStatusMeta(order.status).label}</span></td>
                        <td style={{ color: order.paymentStatus === 'received' ? 'var(--green)' : '#8a5a00', fontWeight: 700 }}>
                          {getPaymentStatusMeta(order.paymentStatus).label}
                        </td>
                        <td style={{ width: '10%' }}>
                          <button onClick={() => navigate(`/orders/${encodeURIComponent(order.id)}`)} className="detail-button">View</button>
                        </td>
                        <td style={{ width: '12%' }}>
                          <button onClick={() => handleReorder(order)} className="detail-button" style={{ backgroundColor: '#0f766e', color: '#fff' }}>Reorder</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="profile-order-cards">
                {orders.map((order) => (
                  <article key={order.id} className="profile-order-card">
                    <div className="profile-order-card-top">
                      <div>
                        <div className="profile-order-label">Order reference</div>
                        <div className="profile-order-ref">{getShortOrderReference(order)}</div>
                      </div>
                      <div className="profile-order-date">{new Date(order.createdAt).toLocaleDateString()}</div>
                    </div>

                    <div className="profile-order-meta-grid">
                      <div className="profile-order-meta">
                        <span className="profile-order-label">Total</span>
                        <strong>Rs.{Number(order.totalPrice || 0).toFixed(2)}</strong>
                      </div>
                      <div className="profile-order-meta">
                        <span className="profile-order-label">Status</span>
                        <span className={`status-${order.status.toLowerCase()}`}>{getStatusMeta(order.status).label}</span>
                      </div>
                      <div className="profile-order-meta profile-order-meta-full">
                        <span className="profile-order-label">Payment</span>
                        <strong style={{ color: order.paymentStatus === 'received' ? 'var(--green)' : '#8a5a00' }}>
                          {getPaymentStatusMeta(order.paymentStatus).label}
                        </strong>
                      </div>
                    </div>

                    <div className="profile-order-actions">
                      <button onClick={() => navigate(`/orders/${encodeURIComponent(order.id)}`)} className="detail-button">
                        View Details
                      </button>
                      <button onClick={() => handleReorder(order)} className="detail-button profile-reorder-btn">
                        Reorder
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}

          <button
            onClick={() => navigate('/')}
            className="cta-button"
            style={{ width: '100%', marginTop: '20px', backgroundColor: '#0056b3' }}
          >
            Start New Order
          </button>
        </div>
      </div>
    </div>
  );
}

export default Profile;
