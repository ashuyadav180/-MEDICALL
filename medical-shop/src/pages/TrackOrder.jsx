import React, { useEffect, useState } from 'react';
import axios from 'axios';
import socket from '../socket';
import { API_BASE_URL } from '../config';

function TrackOrder() {
  const [orderId, setOrderId] = useState('');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [liveMessage, setLiveMessage] = useState('');

  useEffect(() => {
    return () => {
      socket.off('status_updated');
    };
  }, []);

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!orderId) return;

    setLoading(true);
    setError('');
    setLiveMessage('');

    try {
      const response = await axios.get(`${API_BASE_URL}/api/orders/${orderId}`);
      setOrder(response.data);

      socket.connect();
      socket.emit('join_order_room', response.data._id);
      socket.off('status_updated');
      socket.on('status_updated', ({ status }) => {
        setOrder((prev) => (prev ? { ...prev, status } : prev));
        setLiveMessage(`Live update: your order is now "${status}".`);
      });
    } catch (err) {
      setError('Order not found. Please check the ID.');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const statusSteps = [
    { id: 'pending', label: 'Order Placed', icon: '📝' },
    { id: 'packing', label: 'Packing', icon: '📦' },
    { id: 'out', label: 'Out for Delivery', icon: '🛵' },
    { id: 'delivered', label: 'Delivered', icon: '🎁' },
  ];

  const currentStepIndex = order ? statusSteps.findIndex((s) => s.id === order.status) : -1;

  return (
    <div className="main-content">
      <h2 className="section-title">Track Your Order 🚚</h2>
      <div className="form-card" style={{ maxWidth: '500px', margin: '0 auto 40px' }}>
        <form onSubmit={handleTrack} style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            placeholder="Enter Order ID (e.g. 64b1f...)"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1.5px solid var(--border)' }}
          />
          <button type="submit" className="add-btn" style={{ padding: '12px 25px' }} disabled={loading}>
            {loading ? '...' : 'Track'}
          </button>
        </form>
        {error && <p style={{ color: 'var(--red)', marginTop: '10px', fontSize: '0.85rem' }}>{error}</p>}
      </div>

      {order && (
        <div className="order-tracking-card" style={{ background: 'var(--card)', borderRadius: '20px', padding: '30px', border: '1.5px solid var(--border)', maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Order Status for</div>
            <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--green)' }}>{order._id}</div>
          </div>

          {liveMessage && (
            <div style={{ marginBottom: '20px', padding: '12px 14px', borderRadius: '12px', background: 'var(--green-soft)', color: 'var(--green-dark)', fontWeight: 700 }}>
              {liveMessage}
            </div>
          )}

          <div className="tracking-timeline" style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', marginBottom: '40px' }}>
            <div style={{ position: 'absolute', top: '25px', left: '10%', right: '10%', height: '3px', background: '#eee', zIndex: 0 }} />
            <div style={{ position: 'absolute', top: '25px', left: '10%', width: `${(currentStepIndex / (statusSteps.length - 1)) * 80}%`, height: '3px', background: 'var(--green)', zIndex: 1, transition: 'width 0.5s ease' }} />

            {statusSteps.map((step, index) => (
              <div key={step.id} style={{ position: 'relative', zIndex: 2, textAlign: 'center', flex: 1 }}>
                <div
                  style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    background: index <= currentStepIndex ? 'var(--green)' : '#fff',
                    border: `3px solid ${index <= currentStepIndex ? 'var(--green)' : '#eee'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    margin: '0 auto 10px',
                    transition: 'all 0.3s',
                  }}
                >
                  {step.icon}
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: index <= currentStepIndex ? 'var(--green)' : 'var(--muted)' }}>{step.label}</div>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1.5px solid var(--border)', paddingTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ color: 'var(--muted)' }}>Total Amount</span>
              <span style={{ fontWeight: 800 }}>₹{order.totalPrice.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--muted)' }}>Payment</span>
              <span style={{ fontWeight: 700 }}>{order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'UPI'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TrackOrder;
