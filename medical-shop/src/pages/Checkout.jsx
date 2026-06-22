import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PremiumPageShell from '../components/ui/PremiumPageShell';
import { placeOrder } from '../api/orderApi';
import { SHOP_UPI_ID, SHOP_UPI_NAME, SHOP_UPI_NOTE, SHOP_UPI_QR_IMAGE } from '../config';
import { buildPackLabel, getMedicineImage } from '../utils/medicineDisplay';
import { useAuth } from '../store/AuthContext';
import { useCart } from '../store/CartContext';
import { getOrderReference } from '../utils/orderDisplay';

const formatCurrency = (value) => `Rs.${Number(value || 0).toFixed(2)}`;

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
    () =>
      `upi://pay?pa=${encodeURIComponent(SHOP_UPI_ID)}&pn=${encodeURIComponent(
        SHOP_UPI_NAME
      )}&am=${encodeURIComponent(total.toFixed(2))}&cu=INR&tn=${encodeURIComponent(SHOP_UPI_NOTE)}`,
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
            imageUrl: item.imageUrl || '',
            manufacturer: item.manufacturer || '',
            dosage: item.dosage || '',
            packQuantity: item.packQuantity ?? null,
            packUnit: item.packUnit || '',
            category: item.category || 'other',
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
    <PremiumPageShell
      eyebrow="Checkout"
      title="Confirm delivery, payment, and prescription details in one premium flow."
      description="This checkout combines address capture, payment proof, and order verification so the final step feels calm, trustworthy, and fast."
      stats={[
        { value: formatCurrency(total), label: 'order total' },
        { value: paymentMethod === 'cod' ? 'COD' : 'UPI', label: 'selected payment mode' },
      ]}
      heroBadges={['Delivery verified', 'Payment proof ready', 'Prescription upload supported']}
      heroPanels={[
        { label: 'Order total', value: formatCurrency(total) },
        { label: 'Payment mode', value: paymentMethod === 'cod' ? 'Cash on Delivery' : 'UPI proof' },
        { label: 'Validation', value: 'Address + files checked' },
      ]}
      actions={
        <button type="button" className="premium-secondary-btn" onClick={() => navigate(-1)}>
          Back to Cart
        </button>
      }
      sideContent={
        <div className="premium-side-card">
          <span>Checkout promise</span>
          <strong>Every order captures only what the store needs to fulfill quickly and correctly.</strong>
          <ul className="premium-helper-list">
            <li>Upload payment proof for UPI and move straight into confirmation.</li>
            <li>Prescription files stay attached to the order record for review.</li>
          </ul>
        </div>
      }
    >
      {validationError ? <div className="premium-note-banner is-danger">{validationError}</div> : null}

      <div className="premium-checkout-layout">
        <form id="checkout-form" onSubmit={handleSubmitOrder} className="premium-page-body" style={{ marginTop: 0 }}>
          <section className="premium-form-panel">
            <div className="premium-section-header">
              <div>
                <h2>Delivery Details</h2>
                <p>Tell us where to deliver and how the rider should find you quickly.</p>
              </div>
            </div>

            <div className="premium-form-grid">
              <div className="premium-field">
                <label>Full Name *</label>
                <input
                  type="text"
                  name="fullName"
                  placeholder="Your name"
                  value={shippingDetails.fullName}
                  onChange={handleInputChange}
                  required
                  className="premium-input"
                />
              </div>
              <div className="premium-field">
                <label>Mobile Number *</label>
                <input
                  type="tel"
                  name="mobile"
                  placeholder="10-digit mobile number"
                  maxLength="10"
                  value={shippingDetails.mobile}
                  onChange={handleInputChange}
                  required
                  className="premium-input"
                />
              </div>
              <div className="premium-field">
                <label>House No / Street / Village *</label>
                <textarea
                  name="addressLine1"
                  placeholder="House no, street, village or mohalla"
                  value={shippingDetails.addressLine1}
                  onChange={handleInputChange}
                  required
                  className="premium-textarea"
                />
              </div>
              <div className="premium-field">
                <label>Area / Locality</label>
                <input
                  type="text"
                  name="area"
                  placeholder="Colony, locality, area"
                  value={shippingDetails.area}
                  onChange={handleInputChange}
                  className="premium-input"
                />
              </div>
              <div className="premium-form-split">
                <div className="premium-field">
                  <label>City / District *</label>
                  <input
                    type="text"
                    name="city"
                    placeholder="City or district"
                    value={shippingDetails.city}
                    onChange={handleInputChange}
                    required
                    className="premium-input"
                  />
                </div>
                <div className="premium-field">
                  <label>State *</label>
                  <input
                    type="text"
                    name="state"
                    placeholder="State"
                    value={shippingDetails.state}
                    onChange={handleInputChange}
                    required
                    className="premium-input"
                  />
                </div>
              </div>
              <div className="premium-form-split">
                <div className="premium-field">
                  <label>Pincode *</label>
                  <input
                    type="text"
                    name="pincode"
                    placeholder="6-digit pincode"
                    maxLength="6"
                    value={shippingDetails.pincode}
                    onChange={(event) =>
                      setShippingDetails((prev) => ({
                        ...prev,
                        pincode: event.target.value.replace(/\D/g, '').slice(0, 6),
                      }))
                    }
                    required
                    className="premium-input"
                  />
                </div>
                <div className="premium-field">
                  <label>Landmark</label>
                  <input
                    type="text"
                    name="landmark"
                    placeholder="School, temple, chowk"
                    value={shippingDetails.landmark}
                    onChange={handleInputChange}
                    className="premium-input"
                  />
                </div>
              </div>
              <div className="premium-field">
                <label>Nearby Place / Extra Direction</label>
                <input
                  type="text"
                  name="nearby"
                  placeholder="Nearby shop, turn, road, extra direction"
                  value={shippingDetails.nearby}
                  onChange={handleInputChange}
                  className="premium-input"
                />
              </div>
            </div>
          </section>

          <section className="premium-form-panel">
            <div className="premium-section-header">
              <div>
                <h3>Payment Method</h3>
                <p>Choose a payment mode and upload proof only when needed.</p>
              </div>
            </div>

            <div className="premium-grid-two">
              <button
                type="button"
                className={`premium-support-card ${paymentMethod === 'cod' ? 'is-selected' : ''}`}
                onClick={() => setPaymentMethod('cod')}
              >
                <strong>Cash on Delivery</strong>
                <span>Pay at doorstep after the order is confirmed and dispatched.</span>
              </button>

              <button
                type="button"
                className={`premium-support-card ${paymentMethod === 'upi' ? 'is-selected' : ''}`}
                onClick={() => setPaymentMethod('upi')}
              >
                <strong>UPI / QR Payment</strong>
                <span>Scan, pay, and upload your screenshot so the store can verify quickly.</span>
              </button>
            </div>

            {paymentMethod === 'upi' ? (
              <div className="premium-grid-two">
                <div className="premium-surface-card">
                  <div className="premium-section-header">
                    <div>
                      <h3>Scan to Pay</h3>
                      <p>Pay the exact amount and upload the proof below.</p>
                    </div>
                  </div>

                  <div style={{ display: 'grid', justifyItems: 'center', gap: '12px' }}>
                    <img
                      src={displayQrCodeUrl}
                      alt="UPI QR"
                      onError={() => setIsCustomQrAvailable(false)}
                      style={{
                        width: '100%',
                        maxWidth: '220px',
                        borderRadius: '18px',
                        border: '1px solid rgba(114, 146, 219, 0.12)',
                        background: '#fff',
                      }}
                    />
                    <strong style={{ fontSize: '1.2rem', color: '#12724c' }}>{formatCurrency(total)}</strong>
                    <div className="premium-muted" style={{ textAlign: 'center' }}>
                      {isCustomQrAvailable
                        ? 'Using your configured shop QR image.'
                        : 'Shop QR image not found, so a generated UPI QR is shown.'}
                    </div>
                  </div>
                </div>

                <div className="premium-form-grid">
                  <div className="premium-info-strip">
                    <div>
                      <strong>UPI ID</strong>
                      <div className="premium-muted">{SHOP_UPI_ID}</div>
                    </div>
                    <span className="premium-pill">Exact amount</span>
                  </div>

                  <div className="premium-field">
                    <label>UPI Transaction Reference</label>
                    <input
                      type="text"
                      placeholder="Optional transaction / UTR number"
                      value={paymentReference}
                      onChange={(event) => setPaymentReference(event.target.value)}
                      className="premium-input"
                    />
                  </div>

                  <div className="premium-upload-panel">
                    <strong>Upload Payment Screenshot *</strong>
                    <span className="premium-muted">This helps the store verify the payment faster.</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) => setPaymentScreenshotFile(event.target.files?.[0] || null)}
                    />
                    {paymentScreenshotFile ? (
                      <div className="premium-file-name">Proof selected: {paymentScreenshotFile.name}</div>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}
          </section>

          <section className="premium-upload-panel">
            <div>
              <strong>Upload Prescription (Optional)</strong>
              <div className="premium-muted">
                Add a doctor&apos;s slip if any medicine in this order requires review.
              </div>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => setPrescriptionFile(event.target.files?.[0] || null)}
            />
            {prescriptionFile ? (
              <div className="premium-file-name">Prescription selected: {prescriptionFile.name}</div>
            ) : null}
          </section>
        </form>

        <aside className="premium-summary-panel">
          <div className="premium-section-header" style={{ marginBottom: 0 }}>
            <div>
              <h3>Order Summary</h3>
              <p>Everything in the cart is ready for final confirmation.</p>
            </div>
          </div>

          <div className="premium-list-stack">
            {items.map((item) => (
              <article key={item.id} className="premium-track-item">
                <div className="premium-track-header">
                  <strong>{item.name}</strong>
                  <span className="premium-pill">{formatCurrency(item.price * item.quantity)}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '56px 1fr', gap: '12px', alignItems: 'center', marginTop: '10px' }}>
                  <div className="premium-cart-media" style={{ width: '56px', height: '56px', borderRadius: '18px' }}>
                    <img src={getMedicineImage(item)} alt={item.name} />
                  </div>
                  <div className="premium-muted">
                    Qty {item.quantity} · {buildPackLabel(item)}
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="premium-summary-row">
            <span>Subtotal</span>
            <strong>{formatCurrency(subtotal)}</strong>
          </div>
          <div className="premium-summary-row">
            <span>Delivery</span>
            <strong>{delivery === 0 ? 'FREE' : formatCurrency(delivery)}</strong>
          </div>
          <div className="premium-summary-total">
            <span>Total</span>
            <strong>{formatCurrency(total)}</strong>
          </div>

          <button type="submit" form="checkout-form" className="premium-cta" disabled={isSubmitting}>
            {isSubmitting ? 'Placing Order...' : paymentMethod === 'upi' ? 'Submit UPI Order' : 'Place Order'}
          </button>
        </aside>
      </div>
    </PremiumPageShell>
  );
}

export default Checkout;
