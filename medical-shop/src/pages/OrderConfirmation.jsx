import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function OrderConfirmation() {
  const location = useLocation();
  const order = location.state?.order;
  const whatsappMsg = location.state?.whatsappMsg;

  const OWNER_WHATSAPP = '919876543210';

  const sendWhatsApp = () => {
    if (whatsappMsg) {
      const msg = encodeURIComponent(whatsappMsg);
      window.open(`https://wa.me/${OWNER_WHATSAPP}?text=${msg}`, '_blank');
    }
  };

  return (
    <div className="main-content">
      <div className="confirm-box" style={{ textAlign: 'center', padding: '40px 20px' }}>
        <div style={{ width: '100px', height: '100px', background: 'var(--green-pale)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', margin: '0 auto 20px' }}>
          ✅
        </div>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--green)', marginBottom: '10px' }}>Order Placed!</h2>
        <p style={{ color: 'var(--muted)', fontSize: '1rem', marginBottom: '25px' }}>
          Thank you! We received your order.<br />
          Our delivery person will bring it to your home soon.
        </p>
        
        <div className="order-id-box" style={{ background: 'var(--green-pale)', border: '1.5px solid var(--border)', borderRadius: '15px', padding: '20px', margin: '0 auto 30px', maxWidth: '350px' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '5px' }}>Your Order ID</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--green)', letterSpacing: '1px' }}>
            {order?.id || 'BMS-0000'}
          </div>
        </div>

        <div className="delivery-note" style={{ background: '#fff8e1', border: '1.5px solid #ffe082', borderRadius: '15px', padding: '20px', fontSize: '0.9rem', color: '#7a5500', textAlign: 'left', margin: '0 auto 30px', maxWidth: '500px' }}>
          <strong style={{ display: 'block', marginBottom: '8px', fontSize: '1rem' }}>📦 What happens next?</strong>
          1. Our shop will pack your medicines carefully<br />
          2. A delivery person will come directly to your home<br />
          3. Pay when you receive your order (if Cash on Delivery)
        </div>

        <div style={{ background: '#e7fbe9', border: '1.5px solid #a5d6a7', borderRadius: '15px', padding: '20px', marginBottom: '30px', fontSize: '0.9rem', color: '#1b5e20', margin: '0 auto 30px', maxWidth: '500px' }}>
          <strong style={{ display: 'block', marginBottom: '8px' }}>📲 Send order to shop on WhatsApp?</strong>
          This will open WhatsApp and send your order details to Bablu Medical Store so they can prepare it faster.
          <br /><br />
          <button 
            onClick={sendWhatsApp} 
            style={{ background: '#25d366', color: '#fff', border: 'none', padding: '12px 30px', borderRadius: '12px', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            💬 Send on WhatsApp
          </button>
        </div>

        <Link to="/" className="back-home-btn" style={{ textDecoration: 'none', display: 'inline-block', padding: '14px 40px' }}>
          🏠 Back to Home
        </Link>
      </div>
    </div>
  );
}

export default OrderConfirmation;