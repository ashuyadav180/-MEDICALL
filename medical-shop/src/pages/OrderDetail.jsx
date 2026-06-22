import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import PremiumPageShell from '../components/ui/PremiumPageShell';
import { fetchOrderById } from '../api/orderApi';
import { useCart } from '../store/CartContext';
import { buildPackLabel, getMedicineImage } from '../utils/medicineDisplay';
import {
  getOrderReference,
  getPaymentStatusMeta,
  getShortOrderReference,
  getStatusMeta,
  reorderOrderItems,
} from '../utils/orderDisplay';

function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { addItem } = useCart();

  useEffect(() => {
    const loadOrder = async () => {
      setIsLoading(true);
      setError('');

      try {
        const data = await fetchOrderById(id);
        setOrder(data);
      } catch (loadError) {
        setOrder(null);
        setError(loadError.response?.data?.message || 'Order not found.');
      } finally {
        setIsLoading(false);
      }
    };

    loadOrder();
  }, [id]);

  const handleReorder = () => {
    if (!order) {
      return;
    }

    const reorderedQuantity = reorderOrderItems(order, addItem);
    navigate('/cart', {
      state: {
        message: `${reorderedQuantity} item(s) from ${getShortOrderReference(order)} were added to your cart.`,
      },
    });
  };

  if (isLoading) {
    return (
      <PremiumPageShell eyebrow="Order detail" title="Loading order details..." description="Pulling the full order summary, payment information, and item list." />
    );
  }

  if (!order) {
    return (
      <PremiumPageShell eyebrow="Order detail" title="Order not found." description={error || 'This order could not be located.'}>
        <div className="premium-empty-state">
          <div className="premium-empty-icon">404</div>
          <h2>Order not found.</h2>
          <p>{error || 'This order could not be located.'}</p>
        </div>
      </PremiumPageShell>
    );
  }

  const statusMeta = getStatusMeta(order.status);
  const paymentMeta = getPaymentStatusMeta(order.paymentStatus);

  return (
    <PremiumPageShell
      eyebrow="Order detail"
      title={getOrderReference(order)}
      description="A full breakdown of delivery information, payment verification, and ordered items for this purchase."
      stats={[
        { value: statusMeta.label, label: 'current status' },
        { value: paymentMeta.label, label: 'payment state' },
      ]}
      heroBadges={['Full order breakdown', 'Delivery details', 'Reorder in one tap']}
      heroPanels={[
        { label: 'Status', value: statusMeta.label },
        { label: 'Payment', value: paymentMeta.label },
        { label: 'Order total', value: `Rs.${Number(order.totalPrice || 0).toFixed(2)}` },
      ]}
      actions={
        <button type="button" className="premium-secondary-btn" onClick={() => navigate('/profile')}>
          Back to Order History
        </button>
      }
    >
      <div className="premium-grid-two">
        <section className="premium-surface-card">
          <div className="premium-section-header">
            <div>
              <h2>Order Summary</h2>
              <p>The key order signals remain visible without opening another panel.</p>
            </div>
          </div>

          <div className="premium-list-stack">
            <div className="premium-summary-row">
              <span>Status</span>
              <strong>{statusMeta.label}</strong>
            </div>
            <div className="premium-summary-row">
              <span>Order date</span>
              <strong>{new Date(order.createdAt).toLocaleString()}</strong>
            </div>
            <div className="premium-summary-row">
              <span>Total paid</span>
              <strong>Rs.{Number(order.totalPrice || 0).toFixed(2)}</strong>
            </div>
            <div className="premium-summary-row">
              <span>Payment status</span>
              <strong>{paymentMeta.label}</strong>
            </div>
          </div>

          <div className="premium-note-banner is-success">{statusMeta.helper}</div>
        </section>

        <section className="premium-surface-card">
          <div className="premium-section-header">
            <div>
              <h2>Delivery Details</h2>
              <p>Address, payment mode, and order-level delivery information.</p>
            </div>
          </div>

          <div className="premium-list-stack">
            <div className="premium-support-card">
              <strong>Address</strong>
              <span>{order.customerAddress}</span>
            </div>
            <div className="premium-support-card">
              <strong>Customer</strong>
              <span>{order.customerName}</span>
            </div>
            <div className="premium-support-card">
              <strong>Phone</strong>
              <span>{order.customerPhone}</span>
            </div>
            <div className="premium-support-card">
              <strong>Payment</strong>
              <span>{order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'UPI / QR Code'}</span>
            </div>
            {order.paymentReference ? (
              <div className="premium-support-card">
                <strong>Payment Reference</strong>
                <span>{order.paymentReference}</span>
              </div>
            ) : null}
            {order.paymentScreenshot ? (
              <a href={order.paymentScreenshot} target="_blank" rel="noreferrer" className="premium-ghost-btn">
                View Payment Screenshot
              </a>
            ) : null}
          </div>
        </section>
      </div>

      <section className="premium-surface-card">
        <div className="premium-section-header">
          <div>
            <h2>Items Ordered</h2>
            <p>Each line item now uses stronger imagery and clearer meta information.</p>
          </div>
        </div>

        <div className="premium-list-stack">
          {order.orderItems.map((item, index) => (
            <article key={`${item.name}-${index}`} className="premium-cart-item">
              <div className="premium-cart-media">
                <img
                  src={getMedicineImage(item)}
                  alt={item.name}
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = getMedicineImage({ ...item, imageUrl: '' });
                  }}
                />
              </div>
              <div className="premium-cart-copy">
                <div className="premium-cart-title-row">
                  <strong>{item.name}</strong>
                  {item.category ? <span className="premium-pill">{item.category}</span> : null}
                </div>
                <div className="premium-muted">
                  {buildPackLabel(item)}
                  {item.manufacturer ? ` | ${item.manufacturer}` : ''}
                </div>
                <div className="premium-muted">
                  Qty {item.quantity} x Rs.{Number(item.price || 0).toFixed(2)}
                </div>
              </div>
              <div />
              <strong style={{ fontSize: '1.05rem', color: '#12724c' }}>
                Rs.{Number((item.price || 0) * (item.quantity || 0)).toFixed(2)}
              </strong>
            </article>
          ))}
        </div>
      </section>

      <div className="premium-inline-actions">
        <button type="button" onClick={handleReorder} className="premium-cta">
          Reorder Items
        </button>
        <Link to={`/track?ref=${encodeURIComponent(getOrderReference(order))}`} className="premium-secondary-btn">
          Track This Order
        </Link>
        <button type="button" onClick={() => window.print()} className="premium-ghost-btn">
          Print Invoice
        </button>
      </div>
    </PremiumPageShell>
  );
}

export default OrderDetail;
