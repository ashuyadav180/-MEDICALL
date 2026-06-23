import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { fetchMedicines, getCachedMedicines, primeMedicineCache } from '../../api/medicineApi';
import { getMedicineImage, getMedicineTheme, getMedicineSvgFallback } from '../../utils/medicineDisplay';
import { useCart } from '../../store/CartContext';
import { useAuth } from '../../store/AuthContext';
import { placeOrder } from '../../api/orderApi';
import '../../styles/pharma-premium.css';

/* ── helpers ── */
const fmtPrice = (v) => `₹${Number(v || 0).toFixed(0)}`;
const getDisc = (stock) => stock > 20 ? 18 : stock > 10 ? 14 : stock > 0 ? 9 : 0;
const getMrp = (price, stock) => {
  const d = getDisc(stock);
  return d > 0 ? Math.round(price / (1 - d / 100)) : price;
};

/* ── Category tabs config ── */
const TABS = [
  { id: 'all', label: 'Medicine', emoji: '💊' },
  { id: 'healthcare', label: 'Healthcare', emoji: '🏥' },
  { id: 'tablet', label: 'Tablets', emoji: '🔵' },
  { id: 'capsule', label: 'Capsules', emoji: '🟡' },
  { id: 'syrup', label: 'Syrups', emoji: '🧴' },
  { id: 'cream', label: 'Skin Care', emoji: '🫙' },
  { id: 'drops', label: 'Drops', emoji: '💧' },
  { id: 'injection', label: 'Injections', emoji: '💉' },
];

/* ── Promo cards config ── */
const PROMOS = [
  { emoji: '💊', label: 'Vitamins & Supplements', tag: 'Up to 40% OFF', bg: '#ECFDF3', border: '#A7F3D0' },
  { emoji: '🧴', label: 'Personal Care', tag: 'Starting ₹99', bg: '#EFF6FF', border: '#BFDBFE' },
  { emoji: '🩺', label: 'Diabetes Care', tag: 'Best Sellers', bg: '#FFF7ED', border: '#FED7AA' },
  { emoji: '👁️', label: 'Eye Drops & Ear', tag: 'Fast Delivery', bg: '#FDF2F8', border: '#F9A8D4' },
];

/* ── Health Tips ── */
const TIPS = [
  { emoji: '💧', title: 'Stay Hydrated', body: 'Drink 8-10 glasses of water daily. Proper hydration supports kidney function and boosts your energy levels.' },
  { emoji: '🥗', title: 'Balanced Diet', body: 'Include fruits, vegetables, whole grains and lean protein in every meal for optimal health.' },
  { emoji: '🚶', title: 'Exercise Daily', body: '30 minutes of moderate exercise daily reduces your risk of heart disease, diabetes and obesity by up to 50%.' },
];

/* ── Product Card ── */
function PharmaProductCard({ medicine, onAdd, isAdded, isDark }) {
  const [wished, setWished] = useState(false);
  const disc = getDisc(medicine.stock);
  const mrp = getMrp(medicine.price, medicine.stock);
  const save = mrp - medicine.price;
  const theme = getMedicineTheme(medicine.category);
  const inStock = medicine.stock > 0;

  return (
    <div className="ph-prod-card ph-fadein">
      {disc > 0 && <span className="ph-prod-badge">{disc}% OFF</span>}

      <button
        className={`ph-prod-wish ${wished ? 'wished' : ''}`}
        onClick={() => setWished(v => !v)}
        aria-label="Wishlist"
      >
        {wished ? '❤️' : '🤍'}
      </button>

      <Link
        to={`/medicine/${medicine.id}`}
        state={{ medicine }}
        className="ph-prod-img-wrap"
        style={{ display: 'flex', textDecoration: 'none' }}
        onMouseEnter={() => primeMedicineCache(medicine)}
      >
        <img
          src={getMedicineImage(medicine)}
          alt={medicine.name}
          className="ph-prod-img"
          loading="lazy"
          onError={e => { e.target.onerror = null; e.target.src = getMedicineSvgFallback(medicine); }}
        />
      </Link>

      <p className="ph-prod-name">{medicine.name}</p>
      {medicine.dosage && <p className="ph-prod-dose">{medicine.dosage}</p>}

      {disc > 0
        ? <p className="ph-prod-mrp">MRP <s>{fmtPrice(mrp)}</s></p>
        : <p className="ph-prod-mrp">&nbsp;</p>
      }

      <div className="ph-prod-price-row">
        <span className="ph-prod-price">{fmtPrice(medicine.price)}</span>
        {save > 0 && <span className="ph-prod-save">Save {fmtPrice(save)}</span>}
      </div>

      {!inStock ? (
        <div className="ph-prod-oos">Out of Stock</div>
      ) : (
        <div className="ph-prod-btns">
          <button
            className={`ph-prod-btn-cart ${isAdded ? 'added' : ''}`}
            onClick={() => onAdd(medicine)}
          >
            {isAdded ? '✓ Added' : 'Add to Cart'}
          </button>
          <Link
            to={`/medicine/${medicine.id}`}
            state={{ medicine }}
            className="ph-prod-btn-buy"
          >
            Buy Now
          </Link>
        </div>
      )}
    </div>
  );
}

/* ── Skeleton Card ── */
function SkeletonCard() {
  return (
    <div className="ph-prod-card ph-skel-card" style={{ gap: 10 }}>
      <div className="ph-skeleton" style={{ width: '100%', height: 155, borderRadius: 14 }} />
      <div className="ph-skeleton" style={{ width: '85%', height: 13, marginTop: 4 }} />
      <div className="ph-skeleton" style={{ width: '55%', height: 11 }} />
      <div className="ph-skeleton" style={{ width: '40%', height: 13 }} />
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <div className="ph-skeleton" style={{ flex: 1, height: 34, borderRadius: 999 }} />
        <div className="ph-skeleton" style={{ flex: 1, height: 34, borderRadius: 999 }} />
      </div>
    </div>
  );
}

/* ── Horizontal Row Section ── */
function ProductRow({ title, subtitle, medicines, onAdd, addedIds, isDark }) {
  const rowRef = useRef(null);
  const scroll = (dir) => rowRef.current?.scrollBy({ left: dir * 260, behavior: 'smooth' });

  if (!medicines.length) return null;

  return (
    <div className="ph-section ph-fadein">
      <div className="ph-section-head">
        <div>
          <h2 className="ph-section-title">{title}</h2>
          {subtitle && <p className="ph-section-sub">{subtitle}</p>}
        </div>
        <Link to="/medicines" className="ph-view-all">View All →</Link>
      </div>
      <div className="ph-scroll-row-wrap">
        <button className="ph-row-arrow left" onClick={() => scroll(-1)} aria-label="Left">‹</button>
        <div className="ph-scroll-row" ref={rowRef}>
          {medicines.map(med => (
            <PharmaProductCard
              key={med.id}
              medicine={med}
              onAdd={onAdd}
              isAdded={addedIds.has(med.id)}
              isDark={isDark}
            />
          ))}
        </div>
        <button className="ph-row-arrow right" onClick={() => scroll(1)} aria-label="Right">›</button>
      </div>
    </div>
  );
}

/* ── Main Landing ── */
function PremiumLanding() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addItem } = useCart();
  const [medicines, setMedicines] = useState(() => getCachedMedicines());
  const [loading, setLoading] = useState(() => getCachedMedicines().length === 0);
  const [searchVal, setSearchVal] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [addedIds, setAddedIds] = useState(new Set());
  const [dark, setDark] = useState(false);

  const { user, isLoggedIn } = useAuth();
  const [isRxModalOpen, setIsRxModalOpen] = useState(false);
  const [prescriptionFile, setPrescriptionFile] = useState(null);
  const [shippingDetails, setShippingDetails] = useState({
    fullName: '',
    mobile: '',
    addressLine1: '',
    city: '',
    pincode: '',
    state: '',
  });
  const [validationError, setValidationError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync user details on user change
  useEffect(() => {
    if (user) {
      setShippingDetails(prev => ({
        ...prev,
        fullName: user.name || '',
        mobile: user.phone || '',
      }));
    }
  }, [user]);

  // Auto reopen prescription modal after login
  useEffect(() => {
    if (location.state?.openPrescription && isLoggedIn) {
      window.history.replaceState({}, document.title);
      setValidationError('');
      setPrescriptionFile(null);
      setIsRxModalOpen(true);
    }
  }, [location, isLoggedIn]);

  const openRxModal = () => {
    if (!isLoggedIn) {
      navigate('/login', { state: { from: '/', openPrescription: true } });
      return;
    }
    setValidationError('');
    setPrescriptionFile(null);
    setIsRxModalOpen(true);
  };

  const handleInputChange = (event) => {
    setShippingDetails(prev => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handlePrescriptionSubmit = async (e) => {
    e.preventDefault();
    if (!prescriptionFile) {
      setValidationError('Please select a prescription file to upload.');
      return;
    }
    if (
      !shippingDetails.fullName ||
      !shippingDetails.mobile ||
      !shippingDetails.addressLine1 ||
      !shippingDetails.city ||
      !shippingDetails.state ||
      !shippingDetails.pincode
    ) {
      setValidationError('Please fill in all required fields.');
      return;
    }

    if (!/^\d{10}$/.test(shippingDetails.mobile.trim())) {
      setValidationError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setIsSubmitting(true);
    setValidationError('');

    try {
      const formData = new FormData();
      formData.append('customerName', shippingDetails.fullName);
      formData.append('customerPhone', shippingDetails.mobile);

      const fullAddress = `${shippingDetails.addressLine1}, ${shippingDetails.city}, ${shippingDetails.state} - ${shippingDetails.pincode}`;
      formData.append('customerAddress', fullAddress);
      formData.append(
        'customerAddressDetails',
        JSON.stringify({
          addressLine1: shippingDetails.addressLine1,
          city: shippingDetails.city,
          state: shippingDetails.state,
          pincode: shippingDetails.pincode,
        })
      );
      formData.append('paymentMethod', 'cod');
      formData.append('itemsPrice', '0');
      formData.append('shippingPrice', '0');
      formData.append('totalPrice', '0');
      formData.append('orderItems', JSON.stringify([]));
      formData.append('prescription', prescriptionFile);

      const order = await placeOrder(formData);

      const whatsappMsg = `New Prescription Order - Bablu Medical Store\n\n`
        + `Order ID: ${order.orderNumber || order.id}\n`
        + `Date: ${new Date().toLocaleDateString()}\n\n`
        + `Customer Details\n`
        + `Name: ${order.customerName}\n`
        + `Phone: ${order.customerPhone}\n`
        + `Address: ${order.customerAddress}\n\n`
        + `This is a Prescription Upload order. The pharmacist will verify the uploaded prescription and call you back to confirm the medicines and final price.`;

      setIsRxModalOpen(false);
      navigate('/order-confirmation', { state: { order, whatsappMsg } });
    } catch (err) {
      setValidationError(`Failed to submit prescription. ${err.response?.data?.message || 'Please try again.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      const cached = getCachedMedicines();
      if (cached.length) { setMedicines(cached); setLoading(false); }
      try {
        const data = await fetchMedicines({ forceRefresh: cached.length > 0 });
        setMedicines(data);
      } catch { /* keep cached */ }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const handleAdd = (med) => {
    addItem({ ...med, quantity: 1 });
    setAddedIds(prev => { const s = new Set(prev); s.add(med.id); return s; });
    setTimeout(() => setAddedIds(prev => { const s = new Set(prev); s.delete(med.id); return s; }), 2000);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchVal.trim()) navigate(`/medicines?q=${encodeURIComponent(searchVal.trim())}`);
  };

  const filtered = useMemo(() =>
    activeTab === 'all' || activeTab === 'healthcare'
      ? medicines
      : medicines.filter(m => (m.category || '').toLowerCase() === activeTab),
    [medicines, activeTab]);

  const trending = useMemo(() => [...filtered].sort((a, b) => b.stock - a.stock).slice(0, 18), [filtered]);
  const topDeals = useMemo(() => [...medicines].filter(m => m.stock > 20).sort((a, b) => b.stock - a.stock).slice(0, 18), [medicines]);
  const tablets = useMemo(() => medicines.filter(m => m.category === 'tablet').slice(0, 16), [medicines]);
  const syrups = useMemo(() => medicines.filter(m => m.category === 'syrup').slice(0, 16), [medicines]);
  const capsules = useMemo(() => medicines.filter(m => m.category === 'capsule').slice(0, 16), [medicines]);

  const QUICK_SEARCHES = ['Paracetamol', 'Vitamin D3', 'Cough Syrup', 'Antacid', 'Pain Relief'];

  return (
    <div className={`pharma-page ${dark ? 'dark' : ''}`} style={{ paddingBottom: 80 }}>

      {/* ── Hero Search ── */}
      <div className="ph-hero ph-fadein">
        <div className="ph-hero-inner">
          <div className="ph-hero-eyebrow">🏆 India's Trusted Local Pharmacy</div>
          <h1 className="ph-hero-title">Your Health, Our Priority</h1>
          <p className="ph-hero-sub">Order medicines, healthcare products & more with fast doorstep delivery</p>

          <form className="ph-search-box" onSubmit={handleSearch}>
            <div className="ph-search-icon-wrap">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <input
              id="ph-hero-search"
              type="text"
              className="ph-search-field"
              placeholder="Search medicines, brands, health products..."
              value={searchVal}
              onChange={e => setSearchVal(e.target.value)}
            />
            <button type="submit" className="ph-search-submit">Search</button>
          </form>

          <div className="ph-quick-links">
            {QUICK_SEARCHES.map(q => (
              <button key={q} className="ph-quick-link" onClick={() => { setSearchVal(q); navigate(`/medicines?q=${encodeURIComponent(q)}`); }}>
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Category Tabs ── */}
      <div className="ph-tabs-section">
        <div className="ph-tabs-inner ph-filters-container">
          <div className="ph-tabs">
            {TABS.map(tab => (
              <button
                key={tab.id}
                className={`ph-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
                id={`ph-tab-${tab.id}`}
              >
                <span className="ph-tab-emoji">{tab.emoji}</span>
                {tab.label}
              </button>
            ))}
          </div>
          {/* Dark Mode Toggle */}
          <div className="ph-dark-toggle-wrap">
            <span style={{ fontSize: '0.76rem', color: 'var(--p-muted)', fontWeight: 600 }}>{dark ? '🌙' : '☀️'}</span>
            <button
              className={`ph-dark-toggle ${dark ? 'on' : ''}`}
              onClick={() => setDark(d => !d)}
              aria-label="Toggle dark mode"
            />
          </div>
        </div>
      </div>

      {/* ── Promo Cards ── */}
      <div className="ph-promo-section ph-fadein ph-fadein-1">
        <div className="ph-promo-grid">
          {PROMOS.map((p, i) => (
            <div
              key={p.label}
              className="ph-promo-card"
              style={{ background: p.bg, border: `1px solid ${p.border}` }}
            >
              <div className="ph-promo-emoji">{p.emoji}</div>
              <div className="ph-promo-title">{p.label}</div>
              <div className="ph-promo-tag">{p.tag}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Prescription Upload Banner ── */}
      <div className="ph-rx-banner ph-fadein ph-fadein-2">
        <div className="ph-rx-card">
          <div className="ph-rx-left">
            <div className="ph-rx-icon">📋</div>
            <div className="ph-rx-title">Upload Prescription & Order</div>
            <div className="ph-rx-sub">Get medicines delivered as per your doctor's prescription. Fast, safe & verified.</div>
          </div>
          <button className="ph-rx-btn" onClick={openRxModal}>
            📤 Upload Prescription
          </button>
        </div>
      </div>

      {/* ── Product Rows ── */}
      {loading && medicines.length === 0 ? (
        <div className="ph-section">
          <div className="ph-scroll-row">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </div>
      ) : (
        <>
          <ProductRow
            title="🔥 Trending Near You"
            subtitle="Popular in your area"
            medicines={trending}
            onAdd={handleAdd}
            addedIds={addedIds}
            isDark={dark}
          />
          <ProductRow
            title="💰 Best Deals Today"
            subtitle="Maximum savings on top brands"
            medicines={topDeals}
            onAdd={handleAdd}
            addedIds={addedIds}
            isDark={dark}
          />
          <ProductRow
            title="💊 Tablets"
            medicines={tablets}
            onAdd={handleAdd}
            addedIds={addedIds}
            isDark={dark}
          />
          <ProductRow
            title="🟡 Capsules & Vitamins"
            medicines={capsules}
            onAdd={handleAdd}
            addedIds={addedIds}
            isDark={dark}
          />
          <ProductRow
            title="🧴 Syrups & Liquids"
            medicines={syrups}
            onAdd={handleAdd}
            addedIds={addedIds}
            isDark={dark}
          />
        </>
      )}

      {/* ── View All ── */}
      <div className="ph-load-more-wrap">
        <Link to="/medicines" className="ph-load-more-btn">
          View All Medicines →
        </Link>
      </div>

      {/* ── Health Tips ── */}
      <div className="ph-tips-section ph-fadein ph-fadein-3">
        <div className="ph-section-head">
          <div>
            <h2 className="ph-section-title">🌿 Health Tips</h2>
            <p className="ph-section-sub">Expert advice for a healthier you</p>
          </div>
        </div>
        <div className="ph-tips-grid">
          {TIPS.map(tip => (
            <div key={tip.title} className="ph-tip-card">
              <div className="ph-tip-emoji">{tip.emoji}</div>
              <div className="ph-tip-title">{tip.title}</div>
              <div className="ph-tip-body">{tip.body}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Floating Action Buttons ── */}
      <div className="ph-float-group">
        <div className="ph-float-btn-wrap">
          <span className="ph-float-tooltip">Emergency Order</span>
          <button className="ph-float-btn ph-float-emergency" title="Emergency">🆘</button>
        </div>
        <div className="ph-float-btn-wrap">
          <span className="ph-float-tooltip">Upload Prescription</span>
          <button className="ph-float-btn ph-float-rx" title="Prescription" onClick={openRxModal}>Rx</button>
        </div>
        <div className="ph-float-btn-wrap">
          <span className="ph-float-tooltip">WhatsApp Support</span>
          <a
            href="https://wa.me/918840896557"
            target="_blank"
            rel="noopener noreferrer"
            className="ph-float-btn ph-float-wa"
            title="WhatsApp"
          >
            💬
          </a>
        </div>
      </div>

      {/* ── Prescription Modal ── */}
      {isRxModalOpen && (
        <div className="modal-backdrop" style={{ backdropFilter: 'blur(8px)', zIndex: 1000 }} onClick={() => setIsRxModalOpen(false)}>
          <div
            className="premium-form-panel ph-fadein"
            style={{
              width: 'min(580px, calc(100% - 24px))',
              maxHeight: '90vh',
              overflowY: 'auto',
              borderRadius: '24px',
              padding: '28px',
              background: 'var(--p-card)',
              border: '1.5px solid var(--p-border)',
              boxShadow: 'var(--p-shadow-lg)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="premium-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--p-text)', margin: 0, fontFamily: 'Poppins, sans-serif' }}>📋 Upload Prescription</h2>
                <p className="premium-muted" style={{ fontSize: '0.82rem', margin: '4px 0 0' }}>Submit your doctor's slip. The pharmacist will call you back to confirm items.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsRxModalOpen(false)}
                style={{
                  background: 'var(--p-light)',
                  color: 'var(--p-primary)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'grid',
                  placeItems: 'center',
                  fontWeight: 800,
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                }}
              >
                ✕
              </button>
            </div>

            {validationError && (
              <div className="premium-note-banner is-danger" style={{ marginBottom: '18px', padding: '10px 14px', borderRadius: '10px', fontSize: '0.84rem' }}>
                {validationError}
              </div>
            )}

            <form onSubmit={handlePrescriptionSubmit} className="premium-form-grid" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="premium-field" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--p-text)' }}>Prescription File (Image/PDF) *</label>
                <div style={{
                  border: '2px dashed var(--p-primary)',
                  borderRadius: '12px',
                  padding: '20px',
                  textAlign: 'center',
                  background: 'var(--p-lighter)',
                  position: 'relative',
                  cursor: 'pointer'
                }}>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={e => setPrescriptionFile(e.target.files?.[0] || null)}
                    required
                    style={{
                      position: 'absolute',
                      inset: 0,
                      opacity: 0,
                      cursor: 'pointer',
                      width: '100%'
                    }}
                  />
                  <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>📤</div>
                  <strong style={{ display: 'block', fontSize: '0.84rem', color: 'var(--p-primary)' }}>
                    {prescriptionFile ? 'Selected File' : 'Click to Upload Doctor Slip'}
                  </strong>
                  {prescriptionFile && (
                    <span style={{ fontSize: '0.78rem', color: 'var(--p-muted)', wordBreak: 'break-all', marginTop: '4px', display: 'inline-block' }}>
                      {prescriptionFile.name}
                    </span>
                  )}
                </div>
              </div>

              <div className="premium-form-split" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                <div className="premium-field" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--p-text)' }}>Full Name *</label>
                  <input
                    type="text"
                    name="fullName"
                    placeholder="Your Full Name"
                    value={shippingDetails.fullName}
                    onChange={handleInputChange}
                    required
                    className="premium-input"
                    style={{ padding: '10px 14px', borderRadius: '10px', border: '1.5px solid var(--p-border)', background: 'var(--p-card)', color: 'var(--p-text)', fontSize: '0.88rem' }}
                  />
                </div>

                <div className="premium-field" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--p-text)' }}>Mobile Number *</label>
                  <input
                    type="tel"
                    name="mobile"
                    maxLength="10"
                    placeholder="10-digit Mobile"
                    value={shippingDetails.mobile}
                    onChange={handleInputChange}
                    required
                    className="premium-input"
                    style={{ padding: '10px 14px', borderRadius: '10px', border: '1.5px solid var(--p-border)', background: 'var(--p-card)', color: 'var(--p-text)', fontSize: '0.88rem' }}
                  />
                </div>
              </div>

              <div className="premium-field" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--p-text)' }}>Delivery Address (Village/House/Street) *</label>
                <textarea
                  name="addressLine1"
                  placeholder="Complete Delivery Address"
                  value={shippingDetails.addressLine1}
                  onChange={handleInputChange}
                  required
                  rows="3"
                  className="premium-textarea"
                  style={{ padding: '10px 14px', borderRadius: '10px', border: '1.5px solid var(--p-border)', background: 'var(--p-card)', color: 'var(--p-text)', fontSize: '0.88rem', resize: 'vertical' }}
                />
              </div>

              <div className="premium-form-split" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                <div className="premium-field" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--p-text)' }}>City / District *</label>
                  <input
                    type="text"
                    name="city"
                    placeholder="City / District"
                    value={shippingDetails.city}
                    onChange={handleInputChange}
                    required
                    className="premium-input"
                    style={{ padding: '10px 14px', borderRadius: '10px', border: '1.5px solid var(--p-border)', background: 'var(--p-card)', color: 'var(--p-text)', fontSize: '0.88rem' }}
                  />
                </div>

                <div className="premium-field" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--p-text)' }}>Pincode *</label>
                  <input
                    type="text"
                    name="pincode"
                    maxLength="6"
                    placeholder="6-digit Pincode"
                    value={shippingDetails.pincode}
                    onChange={e => setShippingDetails(prev => ({ ...prev, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                    required
                    className="premium-input"
                    style={{ padding: '10px 14px', borderRadius: '10px', border: '1.5px solid var(--p-border)', background: 'var(--p-card)', color: 'var(--p-text)', fontSize: '0.88rem' }}
                  />
                </div>
              </div>

              <div className="premium-field" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--p-text)' }}>State *</label>
                <input
                  type="text"
                  name="state"
                  placeholder="State"
                  value={shippingDetails.state}
                  onChange={handleInputChange}
                  required
                  className="premium-input"
                  style={{ padding: '10px 14px', borderRadius: '10px', border: '1.5px solid var(--p-border)', background: 'var(--p-card)', color: 'var(--p-text)', fontSize: '0.88rem' }}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="premium-cta"
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  borderRadius: '999px',
                  marginTop: '10px'
                }}
              >
                {isSubmitting ? 'Uploading Order...' : 'Submit Prescription Order'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default PremiumLanding;
