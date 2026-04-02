import React, { useState } from 'react';

function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [messageStatus, setMessageStatus] = useState(null);

  const handleChange = (event) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessageStatus(null);

    setTimeout(() => {
      console.log('Submitting support request:', formData);
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
      <p style={{ marginBottom: '30px' }}>
        We are here to help with questions about medicines, orders, or prescriptions.
      </p>

      <div className="contact-grid">
        <div className="quick-help-section">
          <h2>Quick Help Information</h2>

          <ContactDetail
            icon="Mail"
            label="Email Support"
            value="ashuya38@gmail.com"
          />
          <ContactDetail
            icon="Call"
            label="Call Us"
            value="8840896557"
          />
          <ContactDetail
            icon="Map"
            label="Store Address"
            value="Madafarpur, Attrasand, Prayagraj, Uttar Pradesh"
          />
        </div>

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
    </div>
  );
}

export default Contact;
