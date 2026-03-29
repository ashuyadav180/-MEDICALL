import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../store/CartContext';
import { useAuth } from '../store/AuthContext';
import { useTranslation } from 'react-i18next';

function Navbar() {
  const { items } = useCart();
  const { isLoggedIn, user, logout } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="navbar-container">
      <div className="delivery-banner">
        <span>{t('header.delivery_banner')}</span>
      </div>

      <nav className="header-inner">
        <Link to="/" className="logo-container" style={{ textDecoration: 'none' }}>
          <div className="logo-circle">💊</div>
          <div className="logo-text">
            <span className="logo-name">{t('header.title')}</span>
            <span className="logo-tag">Aman Vihar Colony</span>
          </div>
        </Link>

        {/* Language Switcher */}
        <div className="lang-switcher" style={{ display: 'flex', gap: '5px', marginLeft: 'auto', marginRight: '20px' }}>
          <button onClick={() => changeLanguage('en')} style={{ background: i18n.language === 'en' ? 'var(--green)' : 'var(--green-light)', color: i18n.language === 'en' ? '#fff' : 'var(--green)', border: 'none', padding: '4px 8px', borderRadius: '5px', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer' }}>ENG</button>
          <button onClick={() => changeLanguage('hi')} style={{ background: i18n.language === 'hi' ? 'var(--green)' : 'var(--green-light)', color: i18n.language === 'hi' ? '#fff' : 'var(--green)', border: 'none', padding: '4px 8px', borderRadius: '5px', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer' }}>हिन्</button>
          <button onClick={() => changeLanguage('mr')} style={{ background: i18n.language === 'mr' ? 'var(--green)' : 'var(--green-light)', color: i18n.language === 'mr' ? '#fff' : 'var(--green)', border: 'none', padding: '4px 8px', borderRadius: '5px', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer' }}>मरा</button>
        </div>

        <ul className="nav-links">
          <li><Link to="/">{t('header.home')}</Link></li>
          <li><Link to="/track">Track</Link></li> {/* Not in translation file yet, but will be added */}
          
          <li className="cart-link">
            <Link to="/cart">
              <span className="cart-icon-nav">🛒</span>
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
              <button onClick={handleLogout} className="logout-btn">✕</button>
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
