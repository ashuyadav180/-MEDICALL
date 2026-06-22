import React from 'react';
import PremiumPageShell from '../components/ui/PremiumPageShell';

const pagePresets = {
  'About Bablu Medical Store': {
    eyebrow: 'About us',
    stats: [
      { value: 'Local', label: 'community-first healthcare' },
      { value: 'Fast', label: 'order and delivery support' },
    ],
    badges: ['Neighborhood trust', 'Digital convenience', 'Support-first service'],
    panels: [
      { label: 'Focus', value: 'Medicines + support' },
      { label: 'Service style', value: 'Trusted local care' },
      { label: 'Experience', value: 'Online to doorstep' },
    ],
  },
  'Frequently Asked Questions': {
    eyebrow: 'Help center',
    stats: [
      { value: 'FAQ', label: 'core customer questions' },
      { value: 'Clear', label: 'purchase and tracking info' },
    ],
    badges: ['Order help', 'Payment clarity', 'Delivery answers'],
    panels: [
      { label: 'Topics', value: 'Orders and delivery' },
      { label: 'Best for', value: 'Quick self-service answers' },
      { label: 'Fallback', value: 'Contact support anytime' },
    ],
  },
  'Terms & Conditions': {
    eyebrow: 'Terms',
    stats: [
      { value: 'Policy', label: 'ordering and delivery rules' },
      { value: 'Secure', label: 'store verification process' },
    ],
    badges: ['Transparent rules', 'Order verification', 'Customer clarity'],
    panels: [
      { label: 'Coverage', value: 'Orders, stock, delivery' },
      { label: 'Verification', value: 'Prescription-aware review' },
      { label: 'Goal', value: 'Safe and clear purchasing' },
    ],
  },
};

function StaticInfoPage({ title, body }) {
  const preset = pagePresets[title] || {
    eyebrow: 'Information',
    stats: [
      { value: 'Guide', label: 'important store information' },
      { value: 'Simple', label: 'easy-to-read details' },
    ],
    badges: ['Clear details', 'Consistent experience', 'Easy to review'],
    panels: [
      { label: 'Page type', value: 'Information' },
      { label: 'Tone', value: 'Clear and direct' },
      { label: 'Purpose', value: 'Store guidance' },
    ],
  };

  return (
    <PremiumPageShell
      eyebrow={preset.eyebrow}
      title={title}
      description="Clear, premium information pages keep the product experience consistent even outside core shopping flows."
      stats={preset.stats}
      heroBadges={preset.badges}
      heroPanels={preset.panels}
    >
      <div className="premium-grid-two">
        <section className="premium-surface-card">
          <div className="premium-section-header">
            <div>
              <h2>Overview</h2>
              <p>The key information is presented in a cleaner, easier-to-scan layout.</p>
            </div>
          </div>
          <p style={{ margin: 0 }} className="premium-support-copy">
            {body}
          </p>
        </section>

        <section className="premium-highlight-panel">
          <h3>Quick Read</h3>
          <ul className="premium-bullet-list">
            <li>This page keeps important store information in one clear place.</li>
            <li>The guidance matches the same premium design language as the rest of the site.</li>
            <li>For anything order-specific, customers can still move directly into support or tracking.</li>
          </ul>
        </section>
      </div>
    </PremiumPageShell>
  );
}

export default StaticInfoPage;
