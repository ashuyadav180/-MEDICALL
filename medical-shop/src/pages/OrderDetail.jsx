import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchOrderById } from '../api/orderApi';
import { useCart } from '../store/CartContext';

function OrderDetail() {
    const { id } = useParams();
    const [order, setOrder] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const { addItem } = useCart();

    useEffect(() => {
        setIsLoading(true);
        fetchOrderById(id)
            .then(setOrder)
            .finally(() => setIsLoading(false));
    }, [id]);

    const handleReorder = () => {
        if (!order) return;
        order.orderItems.forEach((item) => {
            addItem({
                id: item.medicine,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
            });
        });
    };

    if (isLoading) return <div className="text-center p-20">Loading Order Details...</div>;
    if (!order) return <div className="text-center p-20">Order not found.</div>;

    return (
        <div className="order-detail-page">
            <h1>Order Summary</h1>

            <div className="order-summary-header">
                <p><strong>Status:</strong> <span className={`status-${order.status.toLowerCase()}`}>{order.status}</span></p>
                <p><strong>Order Date:</strong> {new Date(order.createdAt).toLocaleString()}</p>
                <p><strong>Total Paid:</strong> <span style={{fontWeight: 'bold'}}>Rs.{order.totalPrice.toFixed(2)}</span></p>
            </div>

            <div className="detail-sections-grid">
                <div className="shipping-info card">
                    <h2>Shipping Address</h2>
                    <p>{order.customerAddress}</p>
                    <p><strong>Customer:</strong> {order.customerName}</p>
                    <p><strong>Phone:</strong> {order.customerPhone}</p>
                    <p><strong>Payment:</strong> {order.paymentMethod.toUpperCase()}</p>
                </div>

                <div className="items-list-box card">
                    <h2>Items Ordered</h2>
                    <ul className="order-items-list-full">
                        {order.orderItems.map((item, index) => (
                            <li key={index}>
                                {item.name} <span style={{float: 'right', fontWeight: 'bold'}}>Rs.{(item.price * item.quantity).toFixed(2)}</span>
                                <span style={{display: 'block', fontSize: '0.9em', color: 'var(--color-text-subtle)'}}>Qty: {item.quantity} @ Rs.{item.price.toFixed(2)} each</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '30px' }}>
                <button onClick={handleReorder} className="cta-button">
                    Reorder Items
                </button>
                <button onClick={() => window.print()} className="cta-button" style={{ backgroundColor: '#0056b3' }}>
                    Download / Print Invoice
                </button>
                <Link to="/profile" className="cta-button" style={{ backgroundColor: '#4a4a4a' }}>
                    Back to Order History
                </Link>
            </div>
        </div>
    );
}

export default OrderDetail;
