import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart } from '../store/CartContext';
import { useAuth } from '../store/AuthContext';

function Navbar() {
  const { items } = useCart();
  const { isLoggedIn, user, logout } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="navbar-container">
      <div className="delivery-banner">
        <span>{t('header.delivery_banner')}</span>
      </div>

      <nav className="header-inner">
        <Link to="/" className="logo-container" style={{ textDecoration: 'none' }}>
          <div className="logo-circle">+</div>
          <div className="logo-text">
            <span className="logo-name">{t('header.title')}</span>
            <span className="logo-tag">Attrasand</span>
          </div>
        </Link>

        <div className="lang-switcher" style={{ display: 'flex', gap: '5px', marginLeft: 'auto', marginRight: '20px' }}>
          <button onClick={() => i18n.changeLanguage('en')} style={{ background: i18n.language === 'en' ? 'var(--green)' : 'var(--green-light)', color: i18n.language === 'en' ? '#fff' : 'var(--green)', border: 'none', padding: '4px 8px', borderRadius: '5px', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer' }}>ENG</button>
          <button onClick={() => i18n.changeLanguage('hi')} style={{ background: i18n.language === 'hi' ? 'var(--green)' : 'var(--green-light)', color: i18n.language === 'hi' ? '#fff' : 'var(--green)', border: 'none', padding: '4px 8px', borderRadius: '5px', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer' }}>HIN</button>
          <button onClick={() => i18n.changeLanguage('mr')} style={{ background: i18n.language === 'mr' ? 'var(--green)' : 'var(--green-light)', color: i18n.language === 'mr' ? '#fff' : 'var(--green)', border: 'none', padding: '4px 8px', borderRadius: '5px', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer' }}>MAR</button>
        </div>

        <ul className="nav-links">
          <li><Link to="/">{t('header.home')}</Link></li>
          {isLoggedIn && user?.role === 'customer' && (
            <li><Link to="/profile">My Orders</Link></li>
          )}

          <li className="cart-link">
            <Link to="/cart">
              {t('header.cart')}
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </Link>
          </li>

          {isLoggedIn ? (
            <div className="user-nav-box">
              {user?.role === 'admin' && (
                <li><Link to="/admin" className="admin-btn">{t('header.dashboard')}</Link></li>
              )}
              {user?.role === 'admin' && (
                <li><Link to="/analytics" className="admin-btn">Stats</Link></li>
              )}
              {user?.role === 'delivery_person' && (
                <li><Link to="/delivery-dash" className="admin-btn" style={{ background: 'var(--orange)' }}>Delivery</Link></li>
              )}
              <button onClick={handleLogout} className="logout-btn">Logout</button>
            </div>
          ) : (
            <li><Link to="/login" className="login-link">Login</Link></li>
          )}
        </ul>
      </nav>
    </header>
  );
}

export default Navbar;
