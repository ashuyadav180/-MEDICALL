import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../store/CartContext';
import { useAuth } from '../store/AuthContext';

function Cart() {
  const { items, totalAmount, addItem, removeItem, clearCart } = useCart();
  const { isLoggedIn } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [cartMessage, setCartMessage] = useState('');

  useEffect(() => {
    if (!location.state?.message) {
      return;
    }

    setCartMessage(location.state.message);
    navigate(location.pathname, { replace: true });
  }, [location.pathname, location.state, navigate]);

  const handleCheckoutClick = (event) => {
    if (!isLoggedIn) {
      event.preventDefault();
      navigate('/login', { state: { from: '/checkout' } });
    }
  };

  if (items.length === 0) {
    return (
      <div className="main-content">
        <div className="cart-empty" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '4rem', marginBottom: '20px' }}>Cart</div>
          <h2 style={{ marginBottom: '10px' }}>Your cart is empty.</h2>
          <p style={{ color: 'var(--muted)', marginBottom: '30px' }}>Go add some medicines to your cart.</p>
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
      <button className="back-btn" onClick={() => window.history.back()}>Back</button>
      <h2 className="section-title" style={{ border: 'none', padding: 0 }}>Your Cart</h2>

      {cartMessage && (
        <div style={{ marginBottom: '18px', padding: '14px 16px', borderRadius: '14px', background: '#edf9f0', border: '1px solid #b7e3c0', color: '#166534', fontWeight: 700 }}>
          {cartMessage}
        </div>
      )}

      <div className="cart-list">
        {items.map((item) => (
          <div key={item.id} className="cart-item">
            <div className="cart-item-info">
              <div className="cart-item-name">{item.name}</div>
              <div className="cart-item-price">Rs.{item.price.toFixed(2)} x {item.quantity}</div>
            </div>
            <div className="qty-ctrl">
              <button onClick={() => removeItem(item.id)}>-</button>
              <span>{item.quantity}</span>
              <button onClick={() => addItem({ ...item, quantity: 1 })}>+</button>
            </div>
            <div className="cart-item-total" style={{ fontWeight: 800, color: 'var(--green)', minWidth: '80px', textAlign: 'right' }}>
              Rs.{(item.price * item.quantity).toFixed(2)}
            </div>
          </div>
        ))}
      </div>

      <div className="cart-summary">
        <div className="summary-row">
          <span>Subtotal</span>
          <span>Rs.{subtotal.toFixed(2)}</span>
        </div>
        <div className="summary-row">
          <span>Delivery charges</span>
          <span>{delivery === 0 ? <span style={{ color: 'var(--green)', fontWeight: 700 }}>FREE</span> : `Rs.${delivery.toFixed(2)}`}</span>
        </div>
        {delivery > 0 && (
          <div style={{ fontSize: '0.8rem', color: 'var(--muted)', padding: '5px 0' }}>
            Add Rs.{(200 - subtotal).toFixed(2)} more for free delivery
          </div>
        )}
        <div className="summary-row total">
          <span>Total</span>
          <span>Rs.{total.toFixed(2)}</span>
        </div>
      </div>

      {subtotal < 100 && (
        <div style={{ background: '#fff9e6', color: '#856404', padding: '15px', borderRadius: '12px', border: '1px solid #ffeeba', marginBottom: '15px', fontSize: '0.9rem', textAlign: 'center' }}>
          <strong>Minimum order is Rs.100.</strong> Please add Rs.{(100 - subtotal).toFixed(2)} more items.
        </div>
      )}

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '15px' }}>
        <Link to="/" className="med-link-btn" style={{ textDecoration: 'none' }}>
          Continue Shopping
        </Link>
        <button
          type="button"
          onClick={clearCart}
          className="med-link-btn"
          style={{ background: '#fff1f2', color: '#b42318', borderColor: '#fecdd3' }}
        >
          Clear Cart
        </button>
      </div>

      {subtotal >= 100 ? (
        <Link to="/checkout" onClick={handleCheckoutClick} className="checkout-btn" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
          Proceed to Order
        </Link>
      ) : (
        <button disabled className="checkout-btn disabled" style={{ background: '#ccc', width: '100%', cursor: 'not-allowed' }}>
          Add Rs.{(100 - subtotal).toFixed(2)} more to Checkout
        </button>
      )}
    </div>
  );
}

export default Cart;
