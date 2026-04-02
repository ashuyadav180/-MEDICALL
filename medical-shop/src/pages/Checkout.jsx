import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { placeOrder } from '../api/orderApi';
import { SHOP_UPI_ID, SHOP_UPI_NAME, SHOP_UPI_NOTE, SHOP_UPI_QR_IMAGE } from '../config';
import { useAuth } from '../store/AuthContext';
import { useCart } from '../store/CartContext';
import { getOrderReference } from '../utils/orderDisplay';

function Checkout() {
  const { items, totalAmount, clearCart } = useCart();
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const [shippingDetails, setShippingDetails] = useState({
    fullName: user?.name || '',
    mobile: '',
    addressLine1: '',
    area: '',
    city: '',
    state: '',
    pincode: '',
    landmark: '',
    nearby: '',
  });
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [prescriptionFile, setPrescriptionFile] = useState(null);
  const [paymentScreenshotFile, setPaymentScreenshotFile] = useState(null);
  const [paymentReference, setPaymentReference] = useState('');
  const [validationError, setValidationError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCustomQrAvailable, setIsCustomQrAvailable] = useState(true);

  const subtotal = totalAmount;
  const delivery = subtotal >= 200 ? 0 : 20;
  const total = subtotal + delivery;

  const upiUri = useMemo(
    () => `upi://pay?pa=${encodeURIComponent(SHOP_UPI_ID)}&pn=${encodeURIComponent(SHOP_UPI_NAME)}&am=${encodeURIComponent(total.toFixed(2))}&cu=INR&tn=${encodeURIComponent(SHOP_UPI_NOTE)}`,
    [total]
  );
  const qrCodeUrl = useMemo(
    () => `https://quickchart.io/qr?size=240&text=${encodeURIComponent(upiUri)}`,
    [upiUri]
  );
  const displayQrCodeUrl = isCustomQrAvailable ? SHOP_UPI_QR_IMAGE : qrCodeUrl;

  const handleInputChange = (event) => {
    setShippingDetails((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const buildFullAddress = (details) => {
    const parts = [
      details.addressLine1,
      details.area,
      details.city,
      details.state && details.pincode ? `${details.state} - ${details.pincode}` : details.state || details.pincode,
      details.landmark ? `Landmark: ${details.landmark}` : '',
      details.nearby ? `Nearby: ${details.nearby}` : '',
    ];

    return parts.filter(Boolean).join(', ');
  };

  const buildWhatsAppMsg = (orderData) => {
    const itemLines = (orderData.orderItems || [])
      .map((item) => `  - ${item.name} x${item.quantity} = Rs.${(item.price * item.quantity).toFixed(2)}`)
      .join('\n');

    return `New order - Bablu Medical Store\n\n`
      + `Order ID: ${getOrderReference(orderData)}\n`
      + `Date: ${new Date().toLocaleDateString()}\n\n`
      + `Customer Details\n`
      + `Name: ${orderData.customerName}\n`
      + `Phone: ${orderData.customerPhone}\n`
      + `Address: ${orderData.customerAddress}\n\n`
      + `Items Ordered\n${itemLines}\n\n`
      + `Subtotal: Rs.${Number(orderData.itemsPrice || 0).toFixed(2)}\n`
      + `Delivery: ${Number(orderData.shippingPrice || 0) === 0 ? 'FREE' : `Rs.${Number(orderData.shippingPrice || 0).toFixed(2)}`}\n`
      + `Total: Rs.${Number(orderData.totalPrice || 0).toFixed(2)}\n`
      + `Payment: ${orderData.paymentMethod === 'cod' ? 'Cash on Delivery' : 'UPI - Screenshot Uploaded'}\n`
      + `${orderData.paymentReference ? `UPI Ref: ${orderData.paymentReference}\n` : ''}\n`
      + `Please pack and send for delivery soon.`;
  };

  const handleSubmitOrder = async (event) => {
    event.preventDefault();

    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    if (
      !shippingDetails.fullName ||
      !shippingDetails.mobile ||
      !shippingDetails.addressLine1 ||
      !shippingDetails.city ||
      !shippingDetails.state ||
      !shippingDetails.pincode
    ) {
      setValidationError('Please fill in all required fields.');
      return;
    }

    if (subtotal < 100) {
      setValidationError('Minimum order amount (items) is Rs.100. Please add more items to your cart.');
      return;
    }

    if (paymentMethod === 'upi' && !paymentScreenshotFile) {
      setValidationError('Please upload your payment screenshot for UPI orders.');
      return;
    }

    setIsSubmitting(true);
    setValidationError('');

    try {
      const formData = new FormData();
      formData.append('customerName', shippingDetails.fullName);
      formData.append('customerPhone', shippingDetails.mobile);
      formData.append('customerAddress', buildFullAddress(shippingDetails));
      formData.append(
        'customerAddressDetails',
        JSON.stringify({
          addressLine1: shippingDetails.addressLine1,
          area: shippingDetails.area,
          city: shippingDetails.city,
          state: shippingDetails.state,
          pincode: shippingDetails.pincode,
          landmark: shippingDetails.landmark,
          nearby: shippingDetails.nearby,
        })
      );
      formData.append('paymentMethod', paymentMethod);
      formData.append('paymentReference', paymentReference.trim());
      formData.append('itemsPrice', subtotal.toString());
      formData.append('shippingPrice', delivery.toString());
      formData.append('totalPrice', total.toString());
      formData.append(
        'orderItems',
        JSON.stringify(
          items.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            medicine: item.id,
          }))
        )
      );

      if (prescriptionFile) {
        formData.append('prescription', prescriptionFile);
      }

      if (paymentScreenshotFile) {
        formData.append('paymentScreenshot', paymentScreenshotFile);
      }

      const order = await placeOrder(formData);
      const whatsappMsg = buildWhatsAppMsg(order);

      clearCart();
      navigate('/order-confirmation', { state: { order, whatsappMsg } });
    } catch (error) {
      setValidationError(`Failed to place order. ${error.response?.data?.message || 'Please try again.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="main-content">
      <button className="back-btn" onClick={() => window.history.back()}>Back to Cart</button>
      <h2 className="section-title">Place Your Order</h2>

      <form onSubmit={handleSubmitOrder}>
        <div className="form-card">
          <h3 style={{ color: 'var(--green)', marginBottom: '15px' }}>Your Details</h3>
          {validationError && <p style={{ color: 'var(--red)', marginBottom: '15px', fontWeight: 600 }}>{validationError}</p>}

          <div className="form-group">
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--green)' }}>Full Name *</label>
            <input type="text" name="fullName" placeholder="Your name" value={shippingDetails.fullName} onChange={handleInputChange} required style={{ padding: '12px', border: '1.5px solid var(--border)', borderRadius: '10px', width: '100%' }} />
          </div>
          <div className="form-group" style={{ marginTop: '15px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--green)' }}>Mobile Number *</label>
            <input type="tel" name="mobile" placeholder="10-digit mobile number" maxLength="10" value={shippingDetails.mobile} onChange={handleInputChange} required style={{ padding: '12px', border: '1.5px solid var(--border)', borderRadius: '10px', width: '100%' }} />
          </div>
          <div className="form-group" style={{ marginTop: '15px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--green)' }}>House No / Street / Village *</label>
            <textarea name="addressLine1" placeholder="House no, street, village or mohalla" value={shippingDetails.addressLine1} onChange={handleInputChange} required style={{ padding: '12px', border: '1.5px solid var(--border)', borderRadius: '10px', width: '100%', minHeight: '80px' }} />
          </div>
          <div className="form-group" style={{ marginTop: '15px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--green)' }}>Area / Locality</label>
            <input type="text" name="area" placeholder="Colony, locality, area" value={shippingDetails.area} onChange={handleInputChange} style={{ padding: '12px', border: '1.5px solid var(--border)', borderRadius: '10px', width: '100%' }} />
          </div>
          <div className="form-group" style={{ marginTop: '15px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--green)' }}>City / District *</label>
              <input type="text" name="city" placeholder="City or district" value={shippingDetails.city} onChange={handleInputChange} required style={{ padding: '12px', border: '1.5px solid var(--border)', borderRadius: '10px', width: '100%' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--green)' }}>State *</label>
              <input type="text" name="state" placeholder="State" value={shippingDetails.state} onChange={handleInputChange} required style={{ padding: '12px', border: '1.5px solid var(--border)', borderRadius: '10px', width: '100%' }} />
            </div>
          </div>
          <div className="form-group" style={{ marginTop: '15px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--green)' }}>Pincode *</label>
              <input type="text" name="pincode" placeholder="6-digit pincode" maxLength="6" value={shippingDetails.pincode} onChange={(event) => setShippingDetails((prev) => ({ ...prev, pincode: event.target.value.replace(/\D/g, '').slice(0, 6) }))} required style={{ padding: '12px', border: '1.5px solid var(--border)', borderRadius: '10px', width: '100%' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--green)' }}>Landmark</label>
              <input type="text" name="landmark" placeholder="School, temple, chowk" value={shippingDetails.landmark} onChange={handleInputChange} style={{ padding: '12px', border: '1.5px solid var(--border)', borderRadius: '10px', width: '100%' }} />
            </div>
          </div>
          <div className="form-group" style={{ marginTop: '15px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--green)' }}>Nearby Place / Extra Direction</label>
            <input type="text" name="nearby" placeholder="Nearby shop, turn, road, extra direction" value={shippingDetails.nearby} onChange={handleInputChange} style={{ padding: '12px', border: '1.5px solid var(--border)', borderRadius: '10px', width: '100%' }} />
          </div>
        </div>

        <div className="form-card" style={{ marginTop: '20px' }}>
          <h3 style={{ color: 'var(--green)', marginBottom: '15px' }}>Payment Method</h3>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <div className={`pay-opt ${paymentMethod === 'cod' ? 'selected' : ''}`} onClick={() => setPaymentMethod('cod')} style={{ flex: 1, minWidth: '220px', padding: '15px', border: '2px solid var(--border)', borderRadius: '12px', textAlign: 'center', cursor: 'pointer' }}>
              <div style={{ fontSize: '1.5rem' }}>Cash</div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Cash on Delivery</div>
            </div>
            <div className={`pay-opt ${paymentMethod === 'upi' ? 'selected' : ''}`} onClick={() => setPaymentMethod('upi')} style={{ flex: 1, minWidth: '220px', padding: '15px', border: '2px solid var(--border)', borderRadius: '12px', textAlign: 'center', cursor: 'pointer' }}>
              <div style={{ fontSize: '1.5rem' }}>UPI</div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Pay via UPI / QR</div>
            </div>
          </div>

          {paymentMethod === 'upi' && (
            <div style={{ marginTop: '18px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px', alignItems: 'start' }}>
              <div style={{ background: '#f9fffb', border: '1px solid var(--border)', borderRadius: '18px', padding: '18px', textAlign: 'center' }}>
                <img
                  src={displayQrCodeUrl}
                  alt="UPI QR"
                  onError={() => setIsCustomQrAvailable(false)}
                  style={{ width: '100%', maxWidth: '220px', borderRadius: '16px', border: '1px solid var(--border)', background: '#fff' }}
                />
                <div style={{ marginTop: '12px', fontSize: '0.85rem', color: 'var(--muted)' }}>Scan to pay exact amount</div>
                <div style={{ marginTop: '6px', fontWeight: 800, color: 'var(--green)' }}>Rs.{total.toFixed(2)}</div>
                <div style={{ marginTop: '8px', fontSize: '0.78rem', color: 'var(--muted)' }}>
                  {isCustomQrAvailable ? 'Showing your shop QR image.' : 'Shop QR image not found, so generated UPI QR is shown.'}
                </div>
              </div>

              <div style={{ display: 'grid', gap: '12px' }}>
                <div style={{ padding: '14px', background: 'var(--green-soft)', borderRadius: '14px' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginBottom: '4px' }}>UPI ID</div>
                  <div style={{ fontWeight: 800, color: 'var(--green-dark)' }}>{SHOP_UPI_ID}</div>
                  <div style={{ marginTop: '6px', fontSize: '0.82rem', color: 'var(--muted)' }}>
                    Replace `VITE_SHOP_UPI_ID` with your real UPI ID before taking live payments.
                  </div>
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--green)' }}>UPI Transaction Reference</label>
                  <input type="text" placeholder="Optional transaction / UTR number" value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} style={{ padding: '12px', border: '1.5px solid var(--border)', borderRadius: '10px', width: '100%' }} />
                </div>

                <div style={{ border: '2px dashed var(--border)', background: '#fffaf1', borderRadius: '16px', padding: '16px' }}>
                  <div style={{ fontWeight: 800, color: '#8a5a00', marginBottom: '8px' }}>Upload Payment Screenshot *</div>
                  <input type="file" accept="image/*" onChange={(event) => setPaymentScreenshotFile(event.target.files?.[0] || null)} style={{ fontSize: '0.9rem' }} />
                  {paymentScreenshotFile && (
                    <div style={{ marginTop: '10px', fontSize: '0.82rem', color: 'var(--green-dark)', fontWeight: 700 }}>
                      Proof selected: {paymentScreenshotFile.name}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="form-card" style={{ marginTop: '20px', border: '2px dashed var(--border)', background: 'var(--green-pale)' }}>
          <h3 style={{ color: 'var(--green)', marginBottom: '10px' }}>Upload Prescription (Optional)</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '15px' }}>If you have a doctor&apos;s slip, upload a photo here.</p>
          <input type="file" accept="image/*" onChange={(event) => setPrescriptionFile(event.target.files?.[0] || null)} style={{ fontSize: '0.9rem' }} />
          {prescriptionFile && (
            <p style={{ marginTop: '10px', fontSize: '0.8rem', color: 'var(--green)', fontWeight: 700 }}>
              File selected: {prescriptionFile.name}
            </p>
          )}
        </div>

        <button type="submit" className="place-btn" disabled={isSubmitting}>
          {isSubmitting ? 'Placing Order...' : paymentMethod === 'upi' ? 'Submit UPI Order' : 'Place Order'}
        </button>
      </form>
    </div>
  );
}

export default Checkout;
