import React, { useState } from 'react';

function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [messageStatus, setMessageStatus] = useState(null); 

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessageStatus(null);
    
    // --- MOCK API CALL SIMULATION ---
    setTimeout(() => {
        console.log("Submitting support request:", formData);
        setIsSubmitting(false);
        setMessageStatus('success');
        setFormData({ name: '', email: '', subject: '', message: '' }); 
    }, 1500);
    
    
  };

  const ContactDetail = ({ icon, label, value }) => (
    <div className="contact-detail-item">
        <span className="contact-icon">{icon}</span>
        <div className="detail-text">
            <p className="label-text">{label}</p>
            <p className="value-text">{value}</p>
        </div>
    </div>
  );

  return (
    <div className="contact-page">
      <h1>Contact Our Support Team</h1>
      <p style={{marginBottom: '30px'}}>
        We are here to help with questions about medicines, orders, or prescriptions.
      </p>

      {/* --- Two-Column Layout --- */}
      <div className="contact-grid">
        
        {/* 1. Quick Help / Contact Info */}
        <div className="quick-help-section">
            <h2>Quick Help Information</h2>
            
            <ContactDetail 
                icon="📧" 
                label="Email Support" 
                value="support@medicalshop.com" 
            />
            <ContactDetail 
                icon="📞" 
                label="Call Us" 
                value="1-800-PHARMACY (M-F, 9am-5pm)" 
            />
            <ContactDetail 
                icon="📍" 
                label="Corporate Address" 
                value="123 Health Blvd, Wellness City" 
            />
        </div>

        {/* 2. Message Form */}
        <div className="message-form-section">
            <h2>Send Us a Message</h2>

            {messageStatus === 'success' && (
                <div className="success-message">Thank you! Your request has been sent successfully.</div>
            )}
            
            <form onSubmit={handleSubmit} className="support-form">
                <input type="text" name="name" placeholder="Your Full Name" value={formData.name} onChange={handleChange} required />
                <input type="email" name="email" placeholder="Your Email Address" value={formData.email} onChange={handleChange} required />
                <input type="text" name="subject" placeholder="Subject (e.g., Order #O123, Prescription)" value={formData.subject} onChange={handleChange} required />
                
                <textarea name="message" placeholder="Your detailed message..." value={formData.message} onChange={handleChange} rows="6" required />
                
                <button type="submit" className="cta-button" disabled={isSubmitting}>
                    {isSubmitting ? 'Sending...' : 'Submit Request'}
                </button>
            </form>
        </div>
      </div>
      {/* End Two-Column Layout */}
    </div>
  );
}

export default Contact;


