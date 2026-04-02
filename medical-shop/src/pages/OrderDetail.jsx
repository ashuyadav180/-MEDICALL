import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { fetchOrderById } from '../api/orderApi';
import { useCart } from '../store/CartContext';
import { buildPackLabel, getMedicineImage } from '../utils/medicineDisplay';
import { getOrderReference, getPaymentStatusMeta, getShortOrderReference, getStatusMeta, reorderOrderItems } from '../utils/orderDisplay';

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
    return <div className="text-center p-20">Loading order details...</div>;
  }

  if (!order) {
    return <div className="text-center p-20">{error || 'Order not found.'}</div>;
  }

  const statusMeta = getStatusMeta(order.status);
  const paymentMeta = getPaymentStatusMeta(order.paymentStatus);

  return (
    <div className="main-content">
      <div className="order-detail-page" style={{ maxWidth: '980px', margin: '0 auto' }}>
        <h1 style={{ marginBottom: '16px' }}>Order Summary</h1>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '18px', marginBottom: '20px' }}>
          <div className="card" style={{ padding: '22px' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '6px' }}>Order reference</div>
            <div style={{ fontWeight: 800, fontSize: '1.6rem', color: 'var(--green)', marginBottom: '14px' }}>
              {getOrderReference(order)}
            </div>
            <div style={{ display: 'grid', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                <span style={{ color: 'var(--muted)' }}>Status</span>
                <span className={`status-${order.status.toLowerCase()}`} style={{ fontWeight: 700 }}>{statusMeta.label}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                <span style={{ color: 'var(--muted)' }}>Order date</span>
                <span>{new Date(order.createdAt).toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                <span style={{ color: 'var(--muted)' }}>Total paid</span>
                <span style={{ fontWeight: 800 }}>Rs.{Number(order.totalPrice || 0).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                <span style={{ color: 'var(--muted)' }}>Payment status</span>
                <span style={{ fontWeight: 700, color: order.paymentStatus === 'received' ? 'var(--green)' : '#8a5a00' }}>{paymentMeta.label}</span>
              </div>
            </div>
            <div style={{ marginTop: '14px', padding: '12px 14px', borderRadius: '12px', background: 'var(--green-soft)', color: 'var(--green-dark)', fontSize: '0.9rem' }}>
              {statusMeta.helper}
            </div>
          </div>

          <div className="card" style={{ padding: '22px' }}>
            <h2 style={{ marginTop: 0 }}>Delivery Details</h2>
            <p style={{ marginBottom: '8px' }}>{order.customerAddress}</p>
            <p style={{ marginBottom: '6px' }}><strong>Customer:</strong> {order.customerName}</p>
            <p style={{ marginBottom: '6px' }}><strong>Phone:</strong> {order.customerPhone}</p>
            <p style={{ marginBottom: 0 }}><strong>Payment:</strong> {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'UPI / QR Code'}</p>
            {order.paymentReference && <p style={{ marginBottom: 0, marginTop: '6px' }}><strong>Payment Ref:</strong> {order.paymentReference}</p>}
            {order.paymentScreenshot && (
              <a href={order.paymentScreenshot} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: '10px', color: '#8a5a00', fontWeight: 700, textDecoration: 'none' }}>
                View Payment Screenshot
              </a>
            )}
          </div>
        </div>

        <div className="card" style={{ padding: '22px' }}>
          <h2 style={{ marginTop: 0, marginBottom: '16px' }}>Items Ordered</h2>
          <div style={{ display: 'grid', gap: '14px' }}>
            {order.orderItems.map((item, index) => (
              <div key={`${item.name}-${index}`} style={{ display: 'grid', gridTemplateColumns: '88px 1fr auto', gap: '14px', alignItems: 'center', paddingBottom: '14px', borderBottom: index === order.orderItems.length - 1 ? 'none' : '1px solid var(--border)' }}>
                <img
                  src={getMedicineImage(item)}
                  alt={item.name}
                  style={{ width: '88px', height: '88px', objectFit: 'cover', borderRadius: '14px', background: '#f7fbf8', border: '1px solid var(--border)' }}
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = getMedicineImage({ ...item, imageUrl: '' });
                  }}
                />
                <div>
                  <div style={{ fontWeight: 800 }}>{item.name}</div>
                  <div style={{ fontSize: '0.88rem', color: 'var(--muted)', marginTop: '4px' }}>
                    {buildPackLabel(item)}
                    {item.manufacturer ? ` • ${item.manufacturer}` : ''}
                  </div>
                  <div style={{ fontSize: '0.88rem', color: 'var(--muted)', marginTop: '4px' }}>
                    Qty {item.quantity} x Rs.{Number(item.price || 0).toFixed(2)}
                  </div>
                </div>
                <div style={{ fontWeight: 800 }}>Rs.{Number((item.price || 0) * (item.quantity || 0)).toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '22px' }}>
          <button onClick={handleReorder} className="cta-button">Reorder Items</button>
          <Link to={`/track?ref=${encodeURIComponent(getOrderReference(order))}`} className="cta-button" style={{ textDecoration: 'none', backgroundColor: '#0f766e' }}>
            Track This Order
          </Link>
          <button onClick={() => window.print()} className="cta-button" style={{ backgroundColor: '#0056b3' }}>
            Print Invoice
          </button>
          <Link to="/profile" className="cta-button" style={{ backgroundColor: '#4a4a4a', textDecoration: 'none' }}>
            Back to Order History
          </Link>
        </div>
      </div>
    </div>
  );
}

export default OrderDetail;
