import React, { useEffect, useState } from 'react';
import { useAuth } from '../store/AuthContext';
import { useNavigate } from 'react-router-dom';
import { fetchMyOrders } from '../api/orderApi';
import { updateProfile } from '../api/authApi';

function Profile() {
  const { user, isLoggedIn, login } = useAuth();
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
      if (!isLoggedIn) return;

      try {
        const data = await fetchMyOrders();
        setOrders(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load order history.');
      } finally {
        setLoadingOrders(false);
      }
    };

    loadOrders();
  }, [isLoggedIn]);

  if (!isLoggedIn) {
    return <div className="text-center p-20">Please log in to view your profile.</div>;
  }

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const { token, user: updatedUser } = await updateProfile(form);
      login(token, updatedUser);
      setForm((prev) => ({ ...prev, password: '' }));
      setMessage('Profile updated successfully.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-page">
      <h1>Welcome Back, {user?.name || 'Customer'}</h1>

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
          <h2>Order History ({orders.length})</h2>

          {loadingOrders ? (
            <div style={{ marginTop: '15px' }}>Loading orders...</div>
          ) : orders.length === 0 ? (
            <div style={{ marginTop: '15px', color: 'var(--muted)' }}>No orders yet.</div>
          ) : (
            <table className="admin-table" style={{ marginTop: '15px' }}>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Date</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.id.slice(-6).toUpperCase()}</td>
                    <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td>Rs.{order.totalPrice.toFixed(2)}</td>
                    <td><span className={`status-${order.status.toLowerCase()}`}>{order.status}</span></td>
                    <td style={{ width: '10%' }}>
                      <button onClick={() => navigate(`/orders/${order.id}`)} className="detail-button">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
