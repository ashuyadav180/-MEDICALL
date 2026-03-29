import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../store/CartContext'; 
import { useAuth } from '../store/AuthContext'; 
import axios from 'axios';
import { API_BASE_URL } from '../config';

function Checkout() {
  const { items, totalAmount, clearCart } = useCart();
  const { user, isLoggedIn } = useAuth(); 
  const navigate = useNavigate();

  const [shippingDetails, setShippingDetails] = useState({ 
    fullName: user?.name || '', 
    mobile: '',
    address: '',
  });

  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [prescriptionFile, setPrescriptionFile] = useState(null);
  const [validationError, setValidationError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    setShippingDetails({ ...shippingDetails, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setPrescriptionFile(e.target.files[0]);
  };

  const subtotal = totalAmount;
  const delivery = subtotal >= 200 ? 0 : 20;
  const total = subtotal + delivery;

  const buildWhatsAppMsg = (orderData) => {
    const itemLines = orderData.orderItems.map(i => `  • ${i.name} x${i.quantity} = ₹${(i.price * i.quantity).toFixed(2)}`).join('\n');
    return `🔔 *NEW ORDER — Bablu Medical Store*\n\n`
      + `📋 Order ID: *${orderData.id || orderData._id}*\n`
      + `📅 Date: ${new Date().toLocaleDateString()}\n\n`
      + `👤 *Customer Details*\n`
      + `Name: ${orderData.customerName}\n`
      + `Phone: ${orderData.customerPhone}\n`
      + `Address: ${orderData.customerAddress}\n\n`
      + `💊 *Items Ordered*\n${itemLines}\n\n`
      + `💰 Subtotal: ₹${orderData.itemsPrice.toFixed(2)}\n`
      + `🚚 Delivery: ${orderData.shippingPrice === 0 ? 'FREE' : '₹' + orderData.shippingPrice.toFixed(2)}\n`
      + `✅ *Total: ₹${orderData.totalPrice.toFixed(2)}*\n\n`
      + `💳 Payment: ${orderData.paymentMethod === 'cod' ? 'Cash on Delivery' : 'UPI / QR Code'}\n\n`
      + `_Please pack and send for delivery soon!_`;
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();

    if (!isLoggedIn) {
        navigate('/login');
        return;
    }

    if (!shippingDetails.fullName || !shippingDetails.mobile || !shippingDetails.address) {
      setValidationError('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (subtotal < 100) {
        setValidationError('Minimum order amount (items) is ₹100. Please add more items to your cart.');
        return;
      }

      // 1. Prepare FormData for multi-part (File + Data)
      const formData = new FormData();
      formData.append('customerName', shippingDetails.fullName);
      formData.append('customerPhone', shippingDetails.mobile);
      formData.append('customerAddress', shippingDetails.address);
      formData.append('paymentMethod', paymentMethod);
      formData.append('itemsPrice', subtotal.toString());
      formData.append('shippingPrice', delivery.toString());
      formData.append('totalPrice', total.toString());
      formData.append('orderItems', JSON.stringify(items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          medicine: item.id
      }))));

      if (prescriptionFile) {
        formData.append('prescription', prescriptionFile);
      }

      // 2. Call Backend API
      const response = await axios.post(`${API_BASE_URL}/api/orders`, formData, {
          headers: {
              'Content-Type': 'multipart/form-data',
              'Authorization': `Bearer ${localStorage.getItem('token')}` // Use JWT token
          }
      });
      
      // 3. Success
      const resData = response.data;
      const msg = buildWhatsAppMsg(resData);
      clearCart();
      navigate('/order-confirmation', { state: { order: resData, whatsappMsg: msg } });
      
    } catch (err) {
      setValidationError("Failed to place order. " + (err.response?.data?.message || "Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="main-content">
      <button className="back-btn" onClick={() => window.history.back()}>← Back to Cart</button>
      <h2 className="section-title">Place Your Order 📦</h2>

      <form onSubmit={handleSubmitOrder}>
        <div className="form-card">
          <h3 style={{ color: 'var(--green)', marginBottom: '15px' }}>👤 Your Details</h3>
          {validationError && <p style={{ color: 'var(--red)', marginBottom: '15px', fontWeight: 600 }}>{validationError}</p>}
          
          {/* Form fields logic is largely identical, but using FormData now */}
          <div className="form-group">
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--green)' }}>Full Name *</label>
            <input type="text" name="fullName" placeholder="Your name" value={shippingDetails.fullName} onChange={handleInputChange} required style={{ padding: '12px', border: '1.5px solid var(--border)', borderRadius: '10px', width: '100%' }} />
          </div>
          <div className="form-group" style={{ marginTop: '15px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--green)' }}>Mobile Number *</label>
            <input type="tel" name="mobile" placeholder="10-digit mobile number" maxLength="10" value={shippingDetails.mobile} onChange={handleInputChange} required style={{ padding: '12px', border: '1.5px solid var(--border)', borderRadius: '10px', width: '100%' }} />
          </div>
          <div className="form-group" style={{ marginTop: '15px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--green)' }}>Village / Address *</label>
            <textarea name="address" placeholder="Your village name" value={shippingDetails.address} onChange={handleInputChange} required style={{ padding: '12px', border: '1.5px solid var(--border)', borderRadius: '10px', width: '100%', minHeight: '80px' }} />
          </div>
        </div>

        {/* Prescription Upload Card */}
        <div className="form-card" style={{ marginTop: '20px', border: '2px dashed var(--border)', background: 'var(--green-pale)' }}>
            <h3 style={{ color: 'var(--green)', marginBottom: '10px' }}>📄 Upload Prescription (Optional)</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '15px' }}>If you have a doctor's slip, please upload a photo here.</p>
            <input type="file" accept="image/*" onChange={handleFileChange} style={{ fontSize: '0.9rem' }} />
            {prescriptionFile && <p style={{ marginTop: '10px', fontSize: '0.8rem', color: 'var(--green)', fontWeight: 700 }}>✅ File selected: {prescriptionFile.name}</p>}
        </div>

        <div className="form-card" style={{ marginTop: '20px' }}>
            <h3 style={{ color: 'var(--green)', marginBottom: '15px' }}>💳 Payment Method</h3>
            <div style={{ display: 'flex', gap: '10px' }}>
                <div className={`pay-opt ${paymentMethod === 'cod' ? 'selected' : ''}`} onClick={() => setPaymentMethod('cod')} style={{ flex: 1, padding: '15px', border: '2px solid var(--border)', borderRadius: '12px', textAlign: 'center', cursor: 'pointer' }}>
                    <div style={{ fontSize: '1.5rem' }}>💵</div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Cash on Delivery</div>
                </div>
                <div className={`pay-opt ${paymentMethod === 'upi' ? 'selected' : ''}`} onClick={() => setPaymentMethod('upi')} style={{ flex: 1, padding: '15px', border: '2px solid var(--border)', borderRadius: '12px', textAlign: 'center', cursor: 'pointer' }}>
                    <div style={{ fontSize: '1.5rem' }}>📱</div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>UPI / QR Code</div>
                </div>
            </div>
        </div>

        <button type="submit" className="place-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Placing Order...' : '✅ Place Order'}
        </button>
      </form>
    </div>
  );
}

export default Checkout;
