import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart } from '../store/CartContext';
import { useAuth } from '../store/AuthContext';

function Navbar() {
  const { items } = useCart();
  const { isLoggedIn, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const [menuOpen, setMenuOpen] = useState(false);
  const toggleMenu = () => setMenuOpen((prev) => !prev);
  const closeMenu = () => setMenuOpen(false);

  const handleLogout = async () => {
    closeMenu();
    await logout();
    navigate('/login');
  };

  useEffect(() => {
    closeMenu();
  }, [location]);

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

        <button
          type="button"
          className={`mobile-nav-toggle ${menuOpen ? 'is-open' : ''}`}
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={menuOpen}
          onClick={toggleMenu}
        >
          <span className="hamburger-line" aria-hidden="true"></span>
          <span className="hamburger-line" aria-hidden="true"></span>
          <span className="hamburger-line" aria-hidden="true"></span>
          <span className="sr-only">{menuOpen ? 'Close navigation menu' : 'Open navigation menu'}</span>
        </button>

        <ul className={`nav-links ${menuOpen ? 'open' : ''}`}>
          <li>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={closeMenu}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
              <span className="nav-label">{t('header.home')}</span>
            </Link>
          </li>
          
          {isLoggedIn && user?.role === 'customer' && (
            <li>
              <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={closeMenu}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                <span className="nav-label">Profile</span>
              </Link>
            </li>
          )}

          <li className="cart-link">
            <Link to="/cart" style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={closeMenu}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
              </div>
              <span className="nav-label">{t('header.cart')}</span>
            </Link>
          </li>

          {isLoggedIn ? (
            <li className="user-nav-box">
              <button onClick={handleLogout} className="logout-btn" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                <span className="nav-label">Exit</span>
              </button>
            </li>
          ) : (
            <li>
              <Link to="/login" className="login-link" style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={closeMenu}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>
                <span className="nav-label">Login</span>
              </Link>
            </li>
          )}
        </ul>
      </nav>
    </header>
  );
}

export default Navbar;
