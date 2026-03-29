import React from 'react';
import { useCart } from '../store/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';

function Cart() {
  const { items, totalAmount, addItem, removeItem } = useCart();
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const handleCheckoutClick = (e) => {
    if (!isLoggedIn) {
        e.preventDefault();
        navigate('/login', { state: { from: '/checkout' } });
    }
  };
  
  if (items.length === 0) {
    return (
      <div className="main-content">
        <div className="cart-empty" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🛒</div>
          <h2 style={{ marginBottom: '10px' }}>Your cart is empty.</h2>
          <p style={{ color: 'var(--muted)', marginBottom: '30px' }}>Go add some medicines to your cart!</p>
          <Link to="/" className="checkout-btn" style={{ maxWidth: '240px', margin: 'auto', display: 'block', textDecoration: 'none' }}>
            Browse Medicines
          </Link>
        </div>
      </div>
    );
  }

  const subtotal = totalAmount;
  const delivery = subtotal >= 200 ? 0 : 20;
  const total = subtotal + delivery;

  return (
    <div className="main-content">
      <button className="back-btn" onClick={() => window.history.back()}>← Back</button>
      <h2 className="section-title" style={{ border: 'none', padding: 0 }}>Your Cart 🛒</h2>
      
      <div className="cart-list">
        {items.map((item) => (
          <div key={item.id} className="cart-item">
            <div className="cart-item-info">
              <div className="cart-item-name">{item.name}</div>
              <div className="cart-item-price">₹{item.price.toFixed(2)} × {item.quantity}</div>
            </div>
            <div className="qty-ctrl">
              <button onClick={() => removeItem(item.id)}>−</button>
              <span>{item.quantity}</span>
              <button onClick={() => addItem({ ...item, quantity: 1 })}>+</button>
            </div>
            <div className="cart-item-total" style={{ fontWeight: 800, color: 'var(--green)', minWidth: '80px', textAlign: 'right' }}>
              ₹{(item.price * item.quantity).toFixed(2)}
            </div>
          </div>
        ))}
      </div>

      <div className="cart-summary">
        <div className="summary-row">
          <span>Subtotal</span>
          <span>₹{subtotal.toFixed(2)}</span>
        </div>
        <div className="summary-row">
          <span>Delivery charges</span>
          <span>{delivery === 0 ? <span style={{ color: 'var(--green)', fontWeight: 700 }}>FREE</span> : `₹${delivery.toFixed(2)}`}</span>
        </div>
        {delivery > 0 && (
          <div style={{ fontSize: '0.8rem', color: 'var(--muted)', padding: '5px 0' }}>
            Add ₹{(200 - subtotal).toFixed(2)} more for free delivery
          </div>
        )}
        <div className="summary-row total">
          <span>Total</span>
          <span>₹{total.toFixed(2)}</span>
        </div>
      </div>

      {subtotal < 100 && (
        <div style={{ background: '#fff9e6', color: '#856404', padding: '15px', borderRadius: '12px', border: '1px solid #ffeeba', marginBottom: '15px', fontSize: '0.9rem', textAlign: 'center' }}>
          ⚠️ <strong>Minimum order is ₹100.</strong> Please add ₹{(100 - subtotal).toFixed(2)} more items.
        </div>
      )}

      {subtotal >= 100 ? (
        <Link to="/checkout" onClick={handleCheckoutClick} className="checkout-btn" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
           Proceed to Order →
        </Link>
      ) : (
        <button disabled className="checkout-btn disabled" style={{ background: '#ccc', width: '100%', cursor: 'not-allowed' }}>
          🛒 Add ₹{(100 - subtotal).toFixed(2)} more to Checkout
        </button>
      )}
    </div>
  );
}

export default Cart;