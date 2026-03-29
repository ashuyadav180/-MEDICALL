// src/components/Footer.jsx (Complete & Correct Code Structure)

import React from 'react';
import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        {/* Check 1: Ensure all <Link> tags are properly closed */}
        <div className="footer-section">
            <h4>Support</h4>
            <p><Link to="/contact">Contact Us</Link></p> 
            <p><Link to="/faq">FAQ</Link></p> 
        </div>
        <div className="footer-section">
            <h4>Information</h4>
            <p><Link to="/about">About Us</Link></p>
            <p><Link to="/terms">Terms & Conditions</Link></p>
        </div>
      </div>
      <p className="copyright">&copy; {new Date().getFullYear()} Medical Shop. All rights reserved.</p>
    </footer>
  );
}

export default Footer;