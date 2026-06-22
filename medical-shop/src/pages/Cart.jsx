import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import PremiumPageShell from '../components/ui/PremiumPageShell';
import { buildPackLabel, getMedicineImage } from '../utils/medicineDisplay';
import { useCart } from '../store/CartContext';
import { useAuth } from '../store/AuthContext';

const formatCurrency = (value) => `Rs.${Number(value || 0).toFixed(2)}`;

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

  const subtotal = totalAmount;
  const delivery = subtotal >= 200 ? 0 : 20;
  const total = subtotal + delivery;
  const totalUnits = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    [items]
  );

  const handleCheckoutClick = (event) => {
    if (!isLoggedIn) {
      event.preventDefault();
      navigate('/login', { state: { from: '/checkout' } });
    }
  };

  if (items.length === 0) {
    return (
      <PremiumPageShell
        eyebrow="Smart cart"
        title="Your healthcare basket is ready when you are."
        description="Build a faster order lane by adding medicines, diagnostics, or repeat essentials. The cart will keep the fulfillment details organized for checkout."
        stats={[
          { value: '0', label: 'items in cart' },
          { value: '24/7', label: 'support for order help' },
        ]}
      >
        <div className="premium-empty-state">
          <div className="premium-empty-icon">+</div>
          <h2>Your cart is empty.</h2>
          <p>Browse the live catalog and start building a premium healthcare order experience.</p>
          <div className="premium-inline-actions" style={{ justifyContent: 'center', marginTop: '8px' }}>
            <Link to="/" className="premium-cta">
              Browse Medicines
            </Link>
            <Link to="/contact" className="premium-secondary-btn">
              Talk to Support
            </Link>
          </div>
        </div>
      </PremiumPageShell>
    );
  }

  return (
    <PremiumPageShell
      eyebrow="Cart review"
      title="Review your order before the intelligent delivery flow takes over."
      description="Every item is grouped with pricing, stock context, and quick quantity controls so checkout feels immediate and trustworthy."
      stats={[
        { value: String(items.length), label: 'unique products' },
        { value: String(totalUnits), label: 'units selected' },
        { value: delivery === 0 ? 'Free' : formatCurrency(delivery), label: 'delivery charge' },
      ]}
      heroBadges={['Live pricing', 'Fast quantity controls', 'Checkout-ready basket']}
      heroPanels={[
        { label: 'Basket size', value: `${totalUnits} units` },
        { label: 'Delivery', value: delivery === 0 ? 'Free unlocked' : 'Threshold active' },
        { label: 'Next step', value: 'Address + payment' },
      ]}
      actions={
        <>
          <button type="button" className="premium-secondary-btn" onClick={() => navigate(-1)}>
            Back
          </button>
          <Link to="/" className="premium-ghost-btn">
            Continue Shopping
          </Link>
        </>
      }
      sideContent={
        <div className="premium-side-card">
          <span>Fulfillment notes</span>
          <strong>Checkout keeps delivery, payment, and prescription proof in one flow.</strong>
          <ul className="premium-helper-list">
            <li>Same-day orders unlock faster routing when stock is nearby.</li>
            <li>Prescription-sensitive items can still move through the premium checkout lane.</li>
          </ul>
        </div>
      }
    >
      {cartMessage ? <div className="premium-note-banner is-success">{cartMessage}</div> : null}

      <div className="premium-cart-layout">
        <section className="premium-surface-card">
          <div className="premium-section-header">
            <div>
              <h2>Your Cart</h2>
              <p>{totalUnits} total unit(s) are currently staged for checkout.</p>
            </div>
            <button
              type="button"
              onClick={clearCart}
              className="premium-ghost-btn"
              style={{ color: '#b42318', borderColor: '#fecdd3', background: '#fff1f2' }}
            >
              Clear Cart
            </button>
          </div>

          <div className="premium-list-stack">
            {items.map((item) => (
              <article key={item.id} className="premium-cart-item">
                <div className="premium-cart-media">
                  <img src={getMedicineImage(item)} alt={item.name} />
                </div>

                <div className="premium-cart-copy">
                  <div className="premium-cart-title-row">
                    <strong>{item.name}</strong>
                    {item.category ? <span className="premium-pill">{item.category}</span> : null}
                  </div>
                  <div className="premium-muted">{item.description || buildPackLabel(item)}</div>
                  <div className="premium-price-pair">
                    <span className="premium-tag">{formatCurrency(item.price)} each</span>
                    <span className="premium-muted">{formatCurrency(item.price * item.quantity)} total</span>
                  </div>
                </div>

                <div className="premium-qty-control">
                  <button type="button" onClick={() => removeItem(item.id)} aria-label={`Reduce ${item.name}`}>
                    -
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => addItem({ ...item, quantity: 1 })}
                    aria-label={`Increase ${item.name}`}
                  >
                    +
                  </button>
                </div>

                <strong style={{ fontSize: '1.1rem', color: '#12724c' }}>
                  {formatCurrency(item.price * item.quantity)}
                </strong>
              </article>
            ))}
          </div>
        </section>

        <aside className="premium-summary-panel">
          <div className="premium-section-header" style={{ marginBottom: 0 }}>
            <div>
              <h3>Order Summary</h3>
              <p>Clear totals before you move into payment and delivery confirmation.</p>
            </div>
          </div>

          <div className="premium-summary-row">
            <span>Subtotal</span>
            <strong>{formatCurrency(subtotal)}</strong>
          </div>
          <div className="premium-summary-row">
            <span>Delivery charges</span>
            <strong>{delivery === 0 ? 'FREE' : formatCurrency(delivery)}</strong>
          </div>

          {delivery > 0 ? (
            <div className="premium-note-banner is-warning">
              Add {formatCurrency(200 - subtotal)} more for free delivery.
            </div>
          ) : (
            <div className="premium-note-banner is-success">
              Free delivery unlocked on this order.
            </div>
          )}

          <div className="premium-summary-total">
            <span>Total</span>
            <strong>{formatCurrency(total)}</strong>
          </div>

          {subtotal < 100 ? (
            <div className="premium-note-banner is-danger">
              Minimum order is Rs.100. Add {formatCurrency(100 - subtotal)} more to continue.
            </div>
          ) : null}

          {subtotal >= 100 ? (
            <Link
              to="/checkout"
              onClick={handleCheckoutClick}
              className="premium-cta"
              style={{ width: '100%' }}
            >
              Proceed to Order
            </Link>
          ) : (
            <button
              type="button"
              className="premium-secondary-btn"
              disabled
              style={{ width: '100%', cursor: 'not-allowed', opacity: 0.6 }}
            >
              Add {formatCurrency(100 - subtotal)} more to checkout
            </button>
          )}
        </aside>
      </div>
    </PremiumPageShell>
  );
}

export default Cart;
