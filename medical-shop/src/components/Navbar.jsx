import React, { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart } from '../store/CartContext';
import { useAuth } from '../store/AuthContext';
import '../styles/pharma-premium.css';

function Navbar() {
  const { items } = useCart();
  const { isLoggedIn, logout, user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const cartCount = items.reduce((s, i) => s + i.quantity, 0);
  const userInitial = (user?.name || 'U').trim().charAt(0).toUpperCase();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    setIsMenuOpen(false);
    navigate('/login');
  };

  const close = () => setIsMenuOpen(false);

  return (
    <>
      {/* ── 40px Top Bar ── */}
      <div className="ph-topbar">
        <div className="ph-topbar-left">
          🚚 <strong>Fast Village Delivery!</strong>&nbsp; Order above ₹200 for FREE Delivery
        </div>
        <div className="ph-topbar-right">
          <span>📞 8840896557</span>
          <span className="ph-topbar-pill">ashuya38@gmail.com</span>
        </div>
      </div>

      {/* ── 70px Main Navbar ── */}
      <nav className={`ph-navbar ${scrolled ? 'scrolled' : ''}`}>

        {/* Logo */}
        <Link to="/" className="ph-logo" onClick={close}>
          <div className="ph-logo-icon">+</div>
          <div>
            <div className="ph-logo-name">Bablu Medical Store</div>
            <div className="ph-logo-sub">Attrasand</div>
          </div>
        </Link>

        {/* Center Nav */}
        <ul className="ph-nav-links">
          <li>
            <NavLink to="/" className={({ isActive }) => `ph-nav-link ${isActive ? 'active' : ''}`} end onClick={close}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
              Home
            </NavLink>
          </li>
          <li>
            <NavLink to="/medicines" className={({ isActive }) => `ph-nav-link ${isActive ? 'active' : ''}`} onClick={close}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" /><rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" /></svg>
              Medicines
            </NavLink>
          </li>
          <li>
            <NavLink to="/track" className={({ isActive }) => `ph-nav-link ${isActive ? 'active' : ''}`} onClick={close}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              Track Order
            </NavLink>
          </li>
          <li>
            <NavLink to="/contact" className={({ isActive }) => `ph-nav-link ${isActive ? 'active' : ''}`} onClick={close}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
              Support
            </NavLink>
          </li>
        </ul>

        {/* Right Actions */}
        <div className="ph-nav-actions">
          {/* Cart */}
          <Link to="/cart" className="ph-nav-btn" onClick={close} style={{ position: 'relative' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>
            <span className="ph-nav-btn-text">Cart</span>
            {cartCount > 0 && <span className="ph-cart-badge">{cartCount}</span>}
          </Link>

          {isLoggedIn ? (
            <>
              {/* Profile */}
              <Link to="/profile" className="ph-nav-btn" onClick={close}>
                <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'linear-gradient(135deg,#0F9D58,#087443)', display: 'inline-grid', placeItems: 'center', color: '#fff', fontSize: '0.72rem', fontWeight: 800, flexShrink: 0 }}>{userInitial}</span>
                <span className="ph-nav-btn-text">Profile</span>
              </Link>

              {/* Admin */}
              {user?.role === 'admin' && (
                <Link to="/admin" className="ph-nav-btn" onClick={close}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" /><rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" /></svg>
                  <span className="ph-nav-btn-text">Admin</span>
                </Link>
              )}

              {/* Logout */}
              <button className="ph-nav-btn" onClick={handleLogout}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                <span className="ph-nav-btn-text">Logout</span>
              </button>
            </>
          ) : (
            <Link to="/login" className="ph-nav-btn primary" onClick={close}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" /></svg>
              <span className="ph-nav-btn-text">Login</span>
            </Link>
          )}
        </div>

        {/* Hamburger */}
        <button className="ph-hamburger" onClick={() => setIsMenuOpen(v => !v)} aria-label="Menu">
          <span /><span /><span />
        </button>
      </nav>

      {/* ── Mobile Drawer ── */}
      {isMenuOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 300,
          background: 'rgba(0,0,0,0.5)',
        }} onClick={close}>
          <div style={{
            position: 'absolute', right: 0, top: 0, bottom: 0,
            width: 280, background: '#fff',
            padding: '24px 20px',
            display: 'flex', flexDirection: 'column', gap: 12,
            boxShadow: '-8px 0 32px rgba(0,0,0,0.15)',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ fontFamily: 'Poppins,sans-serif', fontWeight: 700, fontSize: '1rem', color: '#0F9D58', marginBottom: 8 }}>
              Bablu Medical Store
            </div>
            {[
              { to: '/', label: 'Home' },
              { to: '/medicines', label: 'Medicines' },
              { to: '/track', label: 'Track Order' },
              { to: '/contact', label: 'Support' },
              { to: '/cart', label: `Cart${cartCount > 0 ? ` (${cartCount})` : ''}` },
            ].map(link => (
              <Link key={link.to} to={link.to} onClick={close}
                style={{ padding: '10px 14px', borderRadius: 12, fontWeight: 600, color: '#1f2937', textDecoration: 'none', background: '#f7f9fc' }}>
                {link.label}
              </Link>
            ))}
            {isLoggedIn
              ? <button onClick={handleLogout} style={{ padding: '10px 14px', borderRadius: 12, fontWeight: 600, color: '#ef4444', textAlign: 'left', background: '#fef2f2', border: 'none', cursor: 'pointer' }}>Logout</button>
              : <Link to="/login" onClick={close} style={{ padding: '10px 14px', borderRadius: 12, fontWeight: 700, color: '#fff', background: 'linear-gradient(135deg,#0F9D58,#087443)', textDecoration: 'none', textAlign: 'center' }}>Login / Register</Link>
            }
          </div>
        </div>
      )}
    </>
  );
}

export default Navbar;
