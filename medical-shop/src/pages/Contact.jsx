import React, { useMemo, useState } from 'react';
import PremiumPageShell from '../components/ui/PremiumPageShell';
import { submitSupportRequest } from '../api/supportApi';

const initialFormState = {
  name: '',
  email: '',
  subject: '',
  message: '',
};

const supportChannels = [
  {
    title: 'Email Support',
    value: 'ashuya38@gmail.com',
    helper: 'Best for prescriptions, order issues, or medicine availability questions.',
  },
  {
    title: 'Call the Store',
    value: '8840896557',
    helper: 'Use this for urgent delivery coordination or quick stock confirmation.',
  },
  {
    title: 'Store Address',
    value: 'Madafarpur, Attrasand, Prayagraj, Uttar Pradesh',
    helper: 'Visit for in-store pickup, pharmacist guidance, and prescription handoff.',
  },
];

function Contact() {
  const [formData, setFormData] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [messageStatus, setMessageStatus] = useState(null);

  const completedFields = useMemo(
    () => Object.values(formData).filter((value) => String(value).trim()).length,
    [formData]
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessageStatus(null);

    try {
      await submitSupportRequest(formData);
      setMessageStatus({
        tone: 'success',
        text: 'Your request has been sent to the support team successfully.',
      });
      setFormData(initialFormState);
    } catch (error) {
      setMessageStatus({
        tone: 'danger',
        text: error.message || 'Failed to submit support request.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PremiumPageShell
      eyebrow="Support"
      title="Talk to a healthcare support team that moves with the same speed as your order."
      description="Questions about medicines, prescriptions, tracking, and payments should feel calm and clear. This contact flow routes messages directly into the backend support channel instead of acting like a static form."
      stats={[
        { value: 'Live', label: 'backend support endpoint' },
        { value: `${completedFields}/4`, label: 'form progress' },
      ]}
      heroBadges={['Human support', 'Backend connected', 'Prescription help']}
      heroPanels={[
        { label: 'Response lane', value: 'Store support team' },
        { label: 'Form progress', value: `${completedFields}/4 fields` },
        { label: 'Best for', value: 'Orders, stock, prescriptions' },
      ]}
      sideContent={
        <div className="premium-side-card">
          <span>Support promise</span>
          <strong>Every support interaction should feel direct, transparent, and easy to complete.</strong>
          <ul className="premium-helper-list">
            <li>Messages now post to the backend contact API instead of a fake frontend-only flow.</li>
            <li>Store contact details stay visible beside the form, so help is never hidden.</li>
            <li>The layout keeps the same premium spacing and glass depth as the rest of the product.</li>
          </ul>
        </div>
      }
    >
      <div className="premium-contact-layout">
        <section className="premium-surface-card">
          <div className="premium-section-header">
            <div>
              <h2>Support Channels</h2>
              <p>Pick the fastest route based on how urgent the issue is.</p>
            </div>
          </div>

          <div className="premium-list-stack">
            {supportChannels.map((channel) => (
              <article key={channel.title} className="premium-support-card">
                <strong>{channel.title}</strong>
                <span>{channel.value}</span>
                <p className="premium-support-copy">{channel.helper}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="premium-form-panel">
          <div className="premium-section-header">
            <div>
              <h2>Send Us a Message</h2>
              <p>Share order details, medicine names, or prescription context and we will route it properly.</p>
            </div>
            <span className="premium-pill">Secure form</span>
          </div>

          {messageStatus ? (
            <div className={`premium-note-banner is-${messageStatus.tone}`}>
              {messageStatus.text}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="premium-form-grid">
            <div className="premium-form-split">
              <div className="premium-field">
                <label htmlFor="support-name">Your Full Name</label>
                <input
                  id="support-name"
                  type="text"
                  name="name"
                  placeholder="Your Full Name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="premium-input"
                />
              </div>

              <div className="premium-field">
                <label htmlFor="support-email">Your Email Address</label>
                <input
                  id="support-email"
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="premium-input"
                />
              </div>
            </div>

            <div className="premium-field">
              <label htmlFor="support-subject">Subject</label>
              <input
                id="support-subject"
                type="text"
                name="subject"
                placeholder="Order reference, prescription, delivery issue"
                value={formData.subject}
                onChange={handleChange}
                required
                className="premium-input"
              />
            </div>

            <div className="premium-field">
              <label htmlFor="support-message">Your Message</label>
              <textarea
                id="support-message"
                name="message"
                placeholder="Tell us what happened, which medicine you need, or what order you are asking about..."
                value={formData.message}
                onChange={handleChange}
                rows="6"
                required
                className="premium-textarea"
              />
            </div>

            <button type="submit" className="premium-cta" disabled={isSubmitting}>
              {isSubmitting ? 'Sending Request...' : 'Submit Support Request'}
            </button>
          </form>
        </section>
      </div>
    </PremiumPageShell>
  );
}

export default Contact;
