import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import PremiumPageShell from '../components/ui/PremiumPageShell';
import { getOrderReference, getPaymentStatusMeta, getStatusMeta } from '../utils/orderDisplay';

function OrderConfirmation() {
  const location = useLocation();
  const order = location.state?.order;
  const whatsappMsg = location.state?.whatsappMsg;
  const OWNER_WHATSAPP = '919371493956';

  const sendWhatsApp = () => {
    if (!whatsappMsg) {
      return;
    }

    window.open(`https://wa.me/${OWNER_WHATSAPP}?text=${encodeURIComponent(whatsappMsg)}`, '_blank');
  };

  if (!order) {
    return (
      <PremiumPageShell
        eyebrow="Confirmation"
        title="Order details are unavailable in this session."
        description="You can still track the order manually using your reference from the tracking page."
      >
        <div className="premium-empty-state">
          <div className="premium-empty-icon">OK</div>
          <h2>Order details unavailable</h2>
          <p>The confirmation page needs a recent order session. You can still track your order from the tracking page.</p>
          <div className="premium-inline-actions" style={{ justifyContent: 'center' }}>
            <Link to="/track" className="premium-cta">
              Go to Tracking
            </Link>
          </div>
        </div>
      </PremiumPageShell>
    );
  }

  const reference = getOrderReference(order);
  const statusMeta = getStatusMeta(order.status);
  const paymentMeta = getPaymentStatusMeta(order.paymentStatus);

  return (
    <PremiumPageShell
      eyebrow="Order confirmed"
      title="Your order has been placed successfully."
      description="The order is now recorded with a fixed reference across confirmation, tracking, profile history, and detailed order views."
      stats={[
        { value: reference, label: 'order reference' },
        { value: statusMeta.label, label: 'current status' },
      ]}
      heroBadges={['Confirmed order', 'Trackable instantly', 'WhatsApp handoff ready']}
      heroPanels={[
        { label: 'Reference', value: reference },
        { label: 'Status', value: statusMeta.label },
        { label: 'Payment', value: paymentMeta.label },
      ]}
    >
      <section className="premium-status-banner">
        <div style={{ display: 'flex', gap: '18px', alignItems: 'center' }}>
          <div className="premium-confirm-icon">OK</div>
          <div>
            <h2 style={{ margin: 0 }}>Everything is locked in.</h2>
            <p className="premium-muted" style={{ margin: '8px 0 0' }}>
              We will keep this order reference fixed across every post-purchase touchpoint.
            </p>
          </div>
        </div>
        <span className="premium-soft-badge is-success">{paymentMeta.label}</span>
      </section>

      <div className="premium-grid-two">
        <section className="premium-surface-card">
          <div className="premium-section-header">
            <div>
              <h2>Order Summary</h2>
              <p>Core order information stays visible at a glance.</p>
            </div>
          </div>

          <div className="premium-list-stack">
            <div className="premium-summary-row">
              <span>Status</span>
              <strong>{statusMeta.label}</strong>
            </div>
            <div className="premium-summary-row">
              <span>Payment method</span>
              <strong>{order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'UPI / QR Code'}</strong>
            </div>
            <div className="premium-summary-row">
              <span>Total</span>
              <strong>Rs.{Number(order.totalPrice || 0).toFixed(2)}</strong>
            </div>
            <div className="premium-summary-row">
              <span>Payment status</span>
              <strong>{paymentMeta.label}</strong>
            </div>
          </div>
        </section>

        <section className="premium-highlight-panel">
          <h3>What happens next</h3>
          <ul className="premium-bullet-list">
            <li>The store verifies your order and payment proof.</li>
            <li>Status moves from placed to packing to out for delivery.</li>
            <li>You can track the same order using the reference above.</li>
          </ul>
        </section>
      </div>

      <section className="premium-surface-card">
        <div className="premium-section-header">
          <div>
            <h3>Items in this order</h3>
            <p>Every item from checkout is captured in the final order record.</p>
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
      </section>

      <section className="premium-info-strip">
        <div>
          <strong>Send order details to the shop on WhatsApp</strong>
          <div className="premium-muted">
            This opens WhatsApp with the exact order summary so the store can prepare it faster.
          </div>
        </div>
        <div className="premium-inline-actions">
          <button type="button" onClick={sendWhatsApp} className="premium-cta">
            Send on WhatsApp
          </button>
          <Link to={`/track?ref=${encodeURIComponent(reference)}`} className="premium-secondary-btn">
            Track this Order
          </Link>
          <Link to="/profile" className="premium-ghost-btn">
            View Order History
          </Link>
        </div>
      </section>
    </PremiumPageShell>
  );
}

export default OrderConfirmation;
