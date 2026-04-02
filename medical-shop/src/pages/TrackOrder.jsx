import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { fetchTrackOrder } from '../api/orderApi';
import socket from '../socket';
import { getOrderReference, getPaymentStatusMeta, getStatusMeta } from '../utils/orderDisplay';

const statusSteps = [
  { id: 'pending', label: 'Order Placed' },
  { id: 'packing', label: 'Packing' },
  { id: 'out', label: 'Out for Delivery' },
  { id: 'delivered', label: 'Delivered' },
];

function TrackOrder() {
  const [searchParams] = useSearchParams();
  const initialRef = searchParams.get('ref') || '';
  const [orderId, setOrderId] = useState(initialRef);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [liveMessage, setLiveMessage] = useState('');

  useEffect(() => {
    return () => {
      socket.off('status_updated');
    };
  }, []);

  const currentStepIndex = useMemo(
    () => (order ? statusSteps.findIndex((step) => step.id === order.status) : -1),
    [order]
  );

  const trackOrder = async (reference) => {
    if (!reference.trim()) {
      return;
    }

    setLoading(true);
    setError('');
    setLiveMessage('');

    try {
      const data = await fetchTrackOrder(reference.trim());
      setOrder(data);

      socket.connect();
      socket.emit('join_order_room', data.id);
      socket.off('status_updated');
      socket.on('status_updated', ({ status }) => {
        setOrder((prev) => (prev ? { ...prev, status } : prev));
        setLiveMessage(`Live update: your order is now "${getStatusMeta(status).label}".`);
      });
    } catch {
      setError('Order not found. Please check the order reference.');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialRef) {
      trackOrder(initialRef);
    }
  }, [initialRef]);

  const handleTrack = async (event) => {
    event.preventDefault();
    await trackOrder(orderId);
  };

  const statusMeta = order ? getStatusMeta(order.status) : null;

  return (
    <div className="main-content">
      <h2 className="section-title">Track Your Order</h2>
      <div className="form-card" style={{ maxWidth: '640px', margin: '0 auto 28px' }}>
        <form onSubmit={handleTrack} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Enter order reference like BMS-260402-ABCD"
            value={orderId}
            onChange={(event) => setOrderId(event.target.value)}
            style={{ flex: 1, minWidth: '260px', padding: '12px', borderRadius: '10px', border: '1.5px solid var(--border)' }}
          />
          <button type="submit" className="add-btn" style={{ padding: '12px 25px' }} disabled={loading}>
            {loading ? 'Tracking...' : 'Track'}
          </button>
        </form>
        <div style={{ marginTop: '10px', fontSize: '0.84rem', color: 'var(--muted)' }}>
          Use the same reference shown on the confirmation page and in order history.
        </div>
        {error && <p style={{ color: 'var(--red)', marginTop: '10px', fontSize: '0.85rem' }}>{error}</p>}
      </div>

      {order && (
        <div className="order-tracking-card" style={{ background: 'var(--card)', borderRadius: '20px', padding: '30px', border: '1.5px solid var(--border)', maxWidth: '860px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '18px', marginBottom: '24px' }}>
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Tracking order</div>
              <div style={{ fontWeight: 800, fontSize: '1.4rem', color: 'var(--green)', marginBottom: '8px' }}>
                {getOrderReference(order)}
              </div>
              <div style={{ fontSize: '0.92rem', color: 'var(--text)' }}>
                {statusMeta?.helper}
              </div>
            </div>
            <div style={{ background: 'var(--green-pale)', borderRadius: '16px', padding: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ color: 'var(--muted)' }}>Current status</span>
                <span style={{ fontWeight: 800 }}>{statusMeta?.label}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ color: 'var(--muted)' }}>Total amount</span>
                <span style={{ fontWeight: 800 }}>Rs.{Number(order.totalPrice || 0).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted)' }}>Payment</span>
                <span style={{ fontWeight: 700 }}>{order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'UPI / QR Code'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                <span style={{ color: 'var(--muted)' }}>Payment status</span>
                <span style={{ fontWeight: 700, color: order.paymentStatus === 'received' ? 'var(--green)' : '#8a5a00' }}>{getPaymentStatusMeta(order.paymentStatus).label}</span>
              </div>
            </div>
          </div>

          {liveMessage && (
            <div style={{ marginBottom: '20px', padding: '12px 14px', borderRadius: '12px', background: 'var(--green-soft)', color: 'var(--green-dark)', fontWeight: 700 }}>
              {liveMessage}
            </div>
          )}

          <div className="tracking-timeline" style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', gap: '8px', marginBottom: '28px' }}>
            <div style={{ position: 'absolute', top: '24px', left: '10%', right: '10%', height: '4px', background: '#e8ecef', zIndex: 0 }} />
            <div style={{ position: 'absolute', top: '24px', left: '10%', width: `${Math.max(currentStepIndex, 0) / (statusSteps.length - 1) * 80}%`, height: '4px', background: 'var(--green)', zIndex: 1, transition: 'width 0.5s ease' }} />

            {statusSteps.map((step, index) => {
              const isActive = index <= currentStepIndex;
              return (
                <div key={step.id} style={{ position: 'relative', zIndex: 2, textAlign: 'center', flex: 1 }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: isActive ? 'var(--green)' : '#fff',
                      border: `3px solid ${isActive ? 'var(--green)' : '#d8dee3'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isActive ? '#fff' : '#7b8794',
                      fontWeight: 800,
                      margin: '0 auto 10px',
                    }}
                  >
                    {index + 1}
                  </div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: isActive ? 'var(--green)' : 'var(--muted)' }}>{step.label}</div>
                </div>
              );
            })}
          </div>

          <div style={{ borderTop: '1.5px solid var(--border)', paddingTop: '18px' }}>
            <div style={{ fontWeight: 800, marginBottom: '12px' }}>Ordered items</div>
            <div style={{ display: 'grid', gap: '10px' }}>
              {(order.orderItems || []).map((item, index) => (
                <div key={`${item.name}-${index}`} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', paddingBottom: '10px', borderBottom: index === order.orderItems.length - 1 ? 'none' : '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{item.name}</div>
                    <div style={{ fontSize: '0.86rem', color: 'var(--muted)' }}>
                      Qty {item.quantity} x Rs.{Number(item.price || 0).toFixed(2)}
                    </div>
                  </div>
                  <div style={{ fontWeight: 800 }}>Rs.{Number((item.price || 0) * (item.quantity || 0)).toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Link to={`/orders/${encodeURIComponent(order.id)}`} className="cta-button" style={{ textDecoration: 'none' }}>
              View Full Order
            </Link>
            <Link to="/profile" className="cta-button" style={{ textDecoration: 'none', backgroundColor: '#425466' }}>
              My Orders
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default TrackOrder;
