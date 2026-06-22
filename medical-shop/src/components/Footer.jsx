import React from 'react';
import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-shell">
        <div className="footer-topbar">
          <div className="footer-brand">
            <h3>Bablu Medical Store</h3>
            <p>
              A faster local healthcare storefront for medicines, support, order tracking, and repeat purchases with a
              much more polished digital experience.
            </p>
          </div>

          <div className="footer-actions">
            <Link to="/track" className="premium-cta">
              Track an Order
            </Link>
            <Link to="/contact" className="premium-secondary-btn">
              Talk to Support
            </Link>
          </div>
        </div>

        <div className="footer-content">
          <div className="footer-section">
            <h4>Store Details</h4>
            <p>Serving Attrasand and nearby areas with doorstep delivery and pharmacist-backed support.</p>
            <div className="footer-contact-chip">Open for medicine orders and delivery follow-ups</div>
          </div>

          <div className="footer-section">
            <h4>Support</h4>
            <p><Link to="/contact">Contact Us</Link></p>
            <p><Link to="/faq">FAQ</Link></p>
            <p><Link to="/profile">My Account</Link></p>
          </div>

          <div className="footer-section">
            <h4>Information</h4>
            <p><Link to="/about">About Us</Link></p>
            <p><Link to="/terms">Terms & Conditions</Link></p>
            <p><Link to="/track">Order Tracking</Link></p>
          </div>

          <div className="footer-section">
            <h4>Reach Us</h4>
            <p><a href="tel:8840896557">8840896557</a></p>
            <p><a href="mailto:ashuya38@gmail.com">ashuya38@gmail.com</a></p>
            <p>Madafarpur, Attrasand, Prayagraj, Uttar Pradesh</p>
          </div>
        </div>

        <p className="copyright">&copy; {new Date().getFullYear()} Bablu Medical Store. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;
