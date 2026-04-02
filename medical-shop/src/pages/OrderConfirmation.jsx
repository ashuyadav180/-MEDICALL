import React from 'react';
import { Link, useLocation } from 'react-router-dom';
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
      <div className="main-content" style={{ textAlign: 'center', padding: '48px 20px' }}>
        <h2 style={{ color: 'var(--green)', marginBottom: '12px' }}>Order details unavailable</h2>
        <p style={{ color: 'var(--muted)', marginBottom: '20px' }}>
          The confirmation page needs a recent order session. You can still track your order from the tracking page.
        </p>
        <Link to="/track" className="back-home-btn" style={{ textDecoration: 'none', display: 'inline-block', padding: '12px 28px' }}>
          Go to Tracking
        </Link>
      </div>
    );
  }

  const reference = getOrderReference(order);
  const statusMeta = getStatusMeta(order.status);
  const paymentMeta = getPaymentStatusMeta(order.paymentStatus);

  return (
    <div className="main-content">
      <div className="confirm-box" style={{ maxWidth: '880px', margin: '0 auto', padding: '24px 20px 48px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ width: '92px', height: '92px', background: 'var(--green-pale)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.2rem', margin: '0 auto 18px', color: 'var(--green)' }}>
            OK
          </div>
          <h2 style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--green)', marginBottom: '8px' }}>Order placed successfully</h2>
          <p style={{ color: 'var(--muted)', fontSize: '1rem', margin: 0 }}>
            Your order has been received. We&apos;ll keep this reference fixed across order history, detail view, and tracking.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '18px', alignItems: 'stretch' }}>
          <div style={{ background: 'var(--card)', border: '1.5px solid var(--border)', borderRadius: '18px', padding: '22px' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '6px' }}>Order reference</div>
            <div style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--green)', letterSpacing: '0.04em', marginBottom: '14px' }}>
              {reference}
            </div>
            <div style={{ display: 'grid', gap: '10px', color: 'var(--text)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                <span style={{ color: 'var(--muted)' }}>Status</span>
                <span style={{ fontWeight: 700 }}>{statusMeta.label}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                <span style={{ color: 'var(--muted)' }}>Payment</span>
                <span style={{ fontWeight: 700 }}>{order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'UPI / QR Code'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                <span style={{ color: 'var(--muted)' }}>Total</span>
                <span style={{ fontWeight: 800 }}>Rs.{Number(order.totalPrice || 0).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                <span style={{ color: 'var(--muted)' }}>Payment status</span>
                <span style={{ fontWeight: 700, color: order.paymentStatus === 'received' ? 'var(--green)' : '#8a5a00' }}>{paymentMeta.label}</span>
              </div>
            </div>
          </div>

          <div style={{ background: '#fff8e1', border: '1.5px solid #ffe082', borderRadius: '18px', padding: '22px', color: '#7a5500' }}>
            <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '10px' }}>What happens next</div>
            <div style={{ display: 'grid', gap: '10px', fontSize: '0.92rem', lineHeight: 1.5 }}>
              <div>1. The store verifies your order and payment proof.</div>
              <div>2. Order status moves from placed to packing to out for delivery.</div>
              <div>3. You can track the same order using the reference above.</div>
            </div>
          </div>
        </div>

        <div style={{ background: 'var(--card)', border: '1.5px solid var(--border)', borderRadius: '18px', padding: '22px', marginTop: '18px' }}>
          <div style={{ fontWeight: 800, marginBottom: '14px', color: 'var(--green-dark)' }}>Items in this order</div>
          <div style={{ display: 'grid', gap: '12px' }}>
            {(order.orderItems || []).map((item, index) => (
              <div key={`${item.name}-${index}`} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', paddingBottom: '12px', borderBottom: index === order.orderItems.length - 1 ? 'none' : '1px solid var(--border)' }}>
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

        <div style={{ background: '#e7fbe9', border: '1.5px solid #a5d6a7', borderRadius: '18px', padding: '20px', marginTop: '18px', fontSize: '0.92rem', color: '#1b5e20' }}>
          <strong style={{ display: 'block', marginBottom: '8px' }}>Send order to shop on WhatsApp</strong>
          This opens WhatsApp with the exact order summary so the store can prepare it faster.
          <div style={{ marginTop: '14px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button onClick={sendWhatsApp} style={{ background: '#25d366', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: 800, cursor: 'pointer' }}>
              Send on WhatsApp
            </button>
            <Link to={`/track?ref=${encodeURIComponent(reference)}`} className="back-home-btn" style={{ textDecoration: 'none', display: 'inline-block', padding: '12px 24px' }}>
              Track this Order
            </Link>
            <Link to="/profile" className="back-home-btn" style={{ textDecoration: 'none', display: 'inline-block', padding: '12px 24px', background: '#425466' }}>
              View Order History
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderConfirmation;
