import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

// NOTE: This mock function simulates fetching the order details based on the ID.
const fetchOrderDetail = (id) => {
    // This array holds the complete mock data defined in Profile.jsx
    const MOCK_ORDER_HISTORY = [
        { id: 'O1', date: '2025-10-25', total: 45.99, status: 'Delivered', shipping: '45, Main Street, Hyderabad, 500032', items: [{name: 'Paracetamol 500mg', qty: 2, price: 7.00}, {name: 'Vitamin C Complex', qty: 1, price: 31.99}] },
        { id: 'O2', date: '2025-09-10', total: 12.00, status: 'Shipped', shipping: 'B-12, Old Quarters, Bangalore, 560001', items: [{name: 'First Aid Bandages', qty: 4, price: 3.00}] },
        { id: 'O3', date: '2025-08-01', total: 8.99, status: 'Cancelled', shipping: 'C-301, New Heights Apt, Mumbai, 400001', items: [{name: 'Cough Suppressant', qty: 1, price: 8.99}] },
    ];
    
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(MOCK_ORDER_HISTORY.find(order => order.id === id));
        }, 300);
    });
};

function OrderDetail() {
    const { id } = useParams(); // Get the order ID from the URL
    const [order, setOrder] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        fetchOrderDetail(id)
            .then(data => setOrder(data))
            .finally(() => setIsLoading(false));
    }, [id]);

    if (isLoading) return <div className="text-center p-20">Loading Order Details...</div>;
    if (!order) return <div className="text-center p-20">Order #{id} Not Found.</div>;

    return (
        <div className="order-detail-page">
            <h1>Order #{order.id} Summary</h1>
            
            <div className="order-summary-header">
                <p><strong>Status:</strong> <span className={`status-${order.status.toLowerCase()}`}>{order.status}</span></p>
                <p><strong>Order Date:</strong> {order.date}</p>
                <p><strong>Total Paid:</strong> <span style={{fontWeight: 'bold'}}>${order.total.toFixed(2)}</span></p>
            </div>

            <div className="detail-sections-grid">
                <div className="shipping-info card">
                    <h2>Shipping Address</h2>
                    <p>{order.shipping}</p>
                </div>

                <div className="items-list-box card">
                    <h2>Items Ordered</h2>
                    <ul className="order-items-list-full">
                        {order.items.map((item, index) => (
                            <li key={index}>
                                {item.name} <span style={{float: 'right', fontWeight: 'bold'}}>${(item.price * item.qty).toFixed(2)}</span>
                                <span style={{display: 'block', fontSize: '0.9em', color: 'var(--color-text-subtle)'}}>Qty: {item.qty} @ ${item.price.toFixed(2)} each</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
            
            <Link to="/profile" className="cta-button" style={{marginTop: '30px'}}>
                &larr; Back to Order History
            </Link>
        </div>
    );
}

export default OrderDetail;
