import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import PremiumPageShell from '../components/ui/PremiumPageShell';
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

  useEffect(() => () => socket.off('status_updated'), []);

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
    <PremiumPageShell
      eyebrow="Live tracking"
      title="Track your order with the same clarity as the rest of the product."
      description="Search using the fixed order reference and follow payment, packing, and delivery progress without guesswork."
      stats={[
        { value: order ? getOrderReference(order) : 'Live', label: 'active tracking reference' },
        { value: order ? getStatusMeta(order.status).label : 'Ready', label: 'current order status' },
      ]}
      heroBadges={['Real-time status', 'Fixed order reference', 'Payment visibility']}
      heroPanels={[
        { label: 'Reference', value: order ? getOrderReference(order) : 'Enter order ID' },
        { label: 'Delivery stage', value: order ? getStatusMeta(order.status).label : 'Ready to search' },
        { label: 'Socket updates', value: 'Live when connected' },
      ]}
    >
      <section className="premium-form-panel">
        <div className="premium-section-header">
          <div>
            <h2>Track by Order Reference</h2>
            <p>Use the same reference shown on confirmation, detail view, and profile history.</p>
          </div>
        </div>

        <form onSubmit={handleTrack} className="premium-inline-actions">
          <input
            type="text"
            placeholder="Enter order reference like BMS-260402-ABCD"
            value={orderId}
            onChange={(event) => setOrderId(event.target.value)}
            className="premium-input"
            style={{ flex: 1, minWidth: '280px' }}
          />
          <button type="submit" className="premium-cta" disabled={loading}>
            {loading ? 'Tracking...' : 'Track'}
          </button>
        </form>

        {error ? <div className="premium-note-banner is-danger">{error}</div> : null}
      </section>

      {order ? (
        <div className="premium-page-body" style={{ marginTop: 0 }}>
          <div className="premium-track-layout">
            <section className="premium-surface-card">
              <div className="premium-section-header">
                <div>
                  <h2>{getOrderReference(order)}</h2>
                  <p>{statusMeta?.helper}</p>
                </div>
                <span className="premium-soft-badge is-success">{statusMeta?.label}</span>
              </div>

              {liveMessage ? <div className="premium-note-banner is-success">{liveMessage}</div> : null}

              <div className="premium-track-timeline" style={{ marginTop: '18px' }}>
                {statusSteps.map((step, index) => (
                  <article
                    key={step.id}
                    className={`premium-track-step ${index <= currentStepIndex ? 'is-active' : ''}`}
                  >
                    <strong>{index + 1}</strong>
                    <span>{step.label}</span>
                  </article>
                ))}
              </div>
            </section>

            <section className="premium-surface-card">
              <div className="premium-section-header">
                <div>
                  <h2>Payment and Delivery</h2>
                  <p>Review total, payment method, and verification state.</p>
                </div>
              </div>

              <div className="premium-list-stack">
                <div className="premium-summary-row">
                  <span>Total amount</span>
                  <strong>Rs.{Number(order.totalPrice || 0).toFixed(2)}</strong>
                </div>
                <div className="premium-summary-row">
                  <span>Payment method</span>
                  <strong>{order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'UPI / QR Code'}</strong>
                </div>
                <div className="premium-summary-row">
                  <span>Payment status</span>
                  <strong>{getPaymentStatusMeta(order.paymentStatus).label}</strong>
                </div>
              </div>
            </section>
          </div>

          <section className="premium-surface-card">
            <div className="premium-section-header">
              <div>
                <h3>Ordered Items</h3>
                <p>Each line item remains available from this tracking view.</p>
              </div>
            </div>

            <div className="premium-list-stack">
              {(order.orderItems || []).map((item, index) => (
                <article key={`${item.name}-${index}`} className="premium-track-item">
                  <div className="premium-track-header">
                    <strong>{item.name}</strong>
                    <span className="premium-pill">Rs.{Number((item.price || 0) * (item.quantity || 0)).toFixed(2)}</span>
                  </div>
                  <div className="premium-muted" style={{ marginTop: '6px' }}>
                    Qty {item.quantity} x Rs.{Number(item.price || 0).toFixed(2)}
                  </div>
                </article>
              ))}
            </div>

            <div className="premium-inline-actions" style={{ marginTop: '20px' }}>
              <Link to={`/orders/${encodeURIComponent(order.id)}`} className="premium-cta">
                View Full Order
              </Link>
              <Link to="/profile" className="premium-secondary-btn">
                My Orders
              </Link>
            </div>
          </section>
        </div>
      ) : null}
    </PremiumPageShell>
  );
}

export default TrackOrder;
