import React from 'react';
import { useTranslation } from 'react-i18next';
import Medicines from './Medicines';

function Home() {
  const { t } = useTranslation();

  return (
    <div className="main-content">
      {/* --- HERO SECTION --- */}
      <div className="hero-section">
        <div className="hero-content">
          <h1>{t('hero.title')}</h1>
          <p>{t('hero.subtitle')}</p>
          <a href="#medicines" className="cta-btn">{t('hero.cta')}</a>
        </div>
        <div className="hero-image">
          {/* Placeholder for a professional medical image */}
          <div className="med-icon-big">💊</div>
        </div>
      </div>

      {/* --- MEDICINES SECTION --- */}
      <section id="medicines">
        <Medicines />
      </section>

      {/* --- WHY US SECTION (Optional) --- */}
      <section className="why-us" style={{ marginTop: '60px', padding: '40px 0' }}>
        <h2 className="section-title" style={{ textAlign: 'center' }}>Why Bablu Medical Store?</h2>
        <div className="usp-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginTop: '30px' }}>
          <div className="usp-card" style={{ background: '#fff', padding: '20px', borderRadius: '15px', textAlign: 'center', border: '1.5px solid var(--border)' }}>
             <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🏢</div>
             <h3 style={{ fontSize: '1.1rem', marginBottom: '10px' }}>Original Medicine</h3>
             <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>We only sell original and bill-checked medicines.</p>
          </div>
          <div className="usp-card" style={{ background: '#fff', padding: '20px', borderRadius: '15px', textAlign: 'center', border: '1.5px solid var(--border)' }}>
             <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📦</div>
             <h3 style={{ fontSize: '1.1rem', marginBottom: '10px' }}>Doorstep Delivery</h3>
             <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Delivery available in Attrasand and nearby villages.</p>
          </div>
          <div className="usp-card" style={{ background: '#fff', padding: '20px', borderRadius: '15px', textAlign: 'center', border: '1.5px solid var(--border)' }}>
             <div style={{ fontSize: '2rem', marginBottom: '10px' }}>💰</div>
             <h3 style={{ fontSize: '1.1rem', marginBottom: '10px' }}>Best Prices</h3>
             <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Get medicines at discounted MRP rates local to you.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
