import { API_BASE_URL } from '../config';

const CATEGORY_FALLBACKS = {
  tablet: { label: 'TABLET', unit: 'tablets', accent: '#24458c', secondary: '#6ea5ff', glow: '#dbe5ff' },
  capsule: { label: 'CAPSULE', unit: 'capsules', accent: '#0f766e', secondary: '#5dd9ca', glow: '#d4f6ef' },
  syrup: { label: 'SYRUP', unit: 'ml', accent: '#1d4ed8', secondary: '#5ec9ff', glow: '#dbe8ff' },
  cream: { label: 'CREAM', unit: 'g', accent: '#b42318', secondary: '#ff8e7f', glow: '#ffe0de' },
  drops: { label: 'DROPS', unit: 'ml', accent: '#7c3aed', secondary: '#b99bff', glow: '#eadcff' },
  injection: { label: 'INJECTION', unit: 'vial', accent: '#9a3412', secondary: '#ffb782', glow: '#ffe6d7' },
  default: { label: 'MEDICINE', unit: 'units', accent: '#1a7a4a', secondary: '#5ed59a', glow: '#dff5e7' },
};

const escapeXml = (value) =>
  String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

export const getMedicineTheme = (category) => {
  const key = String(category || '').toLowerCase();
  return CATEGORY_FALLBACKS[key] || CATEGORY_FALLBACKS.default;
};

export const buildPackLabel = (medicine) => {
  const explicitPack = medicine.packSize || medicine.pack;
  if (explicitPack) {
    return explicitPack;
  }

  const quantity = Number(medicine.packQuantity);
  const theme = getMedicineTheme(medicine.category);
  const unit = medicine.packUnit || theme.unit;

  if (Number.isFinite(quantity) && quantity > 0) {
    return `${quantity} ${unit}`;
  }

  if (medicine.dosage) {
    return medicine.dosage;
  }

  return medicine.description || 'Standard pack';
};

export const buildMedicineCatalogMeta = (medicine) => {
  const price = Number(medicine?.price || 0);
  const stock = Number(medicine?.stock || 0);
  const theme = getMedicineTheme(medicine?.category);
  const discountPercent = stock > 20 ? 18 : stock > 10 ? 14 : stock > 0 ? 9 : 0;
  const mrp = discountPercent > 0 ? price / (1 - discountPercent / 100) : price;
  const rating = (4.1 + ((medicine?.name?.length || 0) % 8) * 0.1).toFixed(1);
  const reviewCount = 120 + ((medicine?.name?.length || 1) * 37) % 2300;
  const packLabel = buildPackLabel(medicine || {});
  const manufacturer = medicine?.manufacturer || 'Trusted healthcare brand';
  const stockText = stock > 0 ? (stock < 8 ? `Only ${stock} left in stock` : `${stock} units in stock`) : 'Out of stock';
  const deliveryText = stock > 0 ? (stock > 15 ? 'Delivery in 24 hrs' : 'Delivery in 1-2 days') : 'Currently unavailable';
  const trustNote = stock > 0 ? (stock > 15 ? 'High availability' : 'Fast moving item') : 'Restocking soon';

  return {
    theme,
    rating,
    reviewCount,
    discountPercent,
    mrp,
    packLabel,
    manufacturer,
    stockText,
    deliveryText,
    trustNote,
  };
};

const optimizeRemoteImageUrl = (imageUrl) => {
  try {
    const parsedUrl = new URL(imageUrl);

    if (parsedUrl.hostname.includes('images.unsplash.com')) {
      parsedUrl.searchParams.set('auto', 'format');
      parsedUrl.searchParams.set('fit', 'crop');
      parsedUrl.searchParams.set('w', '640');
      parsedUrl.searchParams.set('q', '70');
    }

    return parsedUrl.toString();
  } catch {
    return imageUrl;
  }
};

/* ── Clean product-box SVG illustration ── */
const buildProductBoxSvg = (medicine) => {
  const theme = getMedicineTheme(medicine.category);
  const accent = theme.accent;
  const secondary = theme.secondary;
  const glow = theme.glow;
  const catLabel = escapeXml(theme.label);
  const medName = escapeXml((medicine.name || catLabel).slice(0, 22));
  const dosage = escapeXml(medicine.dosage || buildPackLabel(medicine));
  const cat = String(medicine.category || '').toLowerCase();

  /* pick box shape by category */
  let shape = '';
  if (cat === 'syrup') {
    /* bottle */
    shape = `
      <rect x="170" y="55" width="140" height="28" rx="10" fill="${accent}" opacity="0.85"/>
      <rect x="150" y="80" width="180" height="185" rx="34" fill="#fff" stroke="${accent}" stroke-width="5"/>
      <rect x="166" y="100" width="148" height="52" rx="8" fill="${glow}"/>
      <rect x="172" y="168" width="136" height="70" rx="12" fill="${secondary}" opacity="0.22"/>
      <text x="240" y="134" text-anchor="middle" font-family="Arial,sans-serif" font-size="11" font-weight="800" fill="${accent}" letter-spacing="1">${catLabel}</text>
      <text x="240" y="152" text-anchor="middle" font-family="Arial,sans-serif" font-size="9" fill="#555">${dosage}</text>
    `;
  } else if (cat === 'cream') {
    /* tube */
    shape = `
      <rect x="145" y="90" width="190" height="160" rx="22" fill="#fff" stroke="${accent}" stroke-width="5"/>
      <rect x="145" y="90" width="190" height="54" rx="22" fill="${accent}" opacity="0.9"/>
      <rect x="155" y="170" width="170" height="55" rx="10" fill="${glow}"/>
      <rect x="195" y="255" width="90" height="28" rx="14" fill="${accent}" opacity="0.18"/>
      <text x="240" y="124" text-anchor="middle" font-family="Arial,sans-serif" font-size="11" font-weight="800" fill="#fff" letter-spacing="1">${catLabel}</text>
      <text x="240" y="204" text-anchor="middle" font-family="Arial,sans-serif" font-size="9" fill="#555">${dosage}</text>
    `;
  } else if (cat === 'drops') {
    /* dropper bottle */
    shape = `
      <rect x="195" y="55" width="90" height="30" rx="10" fill="${accent}" opacity="0.85"/>
      <rect x="175" y="82" width="130" height="175" rx="28" fill="#fff" stroke="${accent}" stroke-width="5"/>
      <rect x="185" y="100" width="110" height="42" rx="8" fill="${glow}"/>
      <rect x="188" y="162" width="104" height="60" rx="10" fill="${secondary}" opacity="0.22"/>
      <circle cx="240" cy="238" r="18" fill="${accent}" opacity="0.12"/>
      <text x="240" y="124" text-anchor="middle" font-family="Arial,sans-serif" font-size="10" font-weight="800" fill="${accent}" letter-spacing="1">${catLabel}</text>
      <text x="240" y="144" text-anchor="middle" font-family="Arial,sans-serif" font-size="9" fill="#555">${dosage}</text>
    `;
  } else if (cat === 'injection') {
    /* vial + syringe */
    shape = `
      <rect x="195" y="65" width="90" height="175" rx="22" fill="#fff" stroke="${accent}" stroke-width="5"/>
      <rect x="195" y="65" width="90" height="52" rx="22" fill="${accent}" opacity="0.85"/>
      <line x1="310" y1="130" x2="380" y2="200" stroke="${accent}" stroke-width="9" stroke-linecap="round"/>
      <circle cx="308" cy="127" r="14" fill="${accent}" opacity="0.3"/>
      <rect x="205" y="135" width="70" height="72" rx="10" fill="${glow}"/>
      <text x="240" y="90" text-anchor="middle" font-family="Arial,sans-serif" font-size="10" font-weight="800" fill="#fff" letter-spacing="1">${catLabel}</text>
      <text x="240" y="180" text-anchor="middle" font-family="Arial,sans-serif" font-size="9" fill="#555">${dosage}</text>
    `;
  } else {
    /* default box (tablet / capsule / other) */
    shape = `
      <rect x="130" y="80" width="220" height="185" rx="22" fill="#fff" stroke="${accent}" stroke-width="5"/>
      <rect x="130" y="80" width="220" height="58" rx="22" fill="${accent}" opacity="0.88"/>
      <rect x="130" y="114" width="220" height="24" fill="${accent}" opacity="0.88"/>
      <rect x="146" y="160" width="188" height="72" rx="12" fill="${glow}"/>
      <g fill="#fff" stroke="${accent}" stroke-width="4">
        <rect x="158" y="175" width="46" height="28" rx="14"/>
        <rect x="217" y="175" width="46" height="28" rx="14"/>
        <rect x="276" y="175" width="46" height="28" rx="14"/>
      </g>
      <text x="240" y="108" text-anchor="middle" font-family="Arial,sans-serif" font-size="11" font-weight="800" fill="#fff" letter-spacing="1">${catLabel}</text>
    `;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 480 360">
  <defs>
    <linearGradient id="bg${cat}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="${glow}"/>
    </linearGradient>
  </defs>
  <rect width="480" height="360" fill="url(#bg${cat})"/>
  <circle cx="400" cy="60" r="80" fill="${secondary}" opacity="0.14"/>
  <circle cx="80" cy="310" r="90" fill="${accent}" opacity="0.07"/>
  ${shape}
  <text x="240" y="290" text-anchor="middle" font-family="Arial,sans-serif" font-size="17" font-weight="700" fill="#1a2e22">${medName}</text>
  <text x="240" y="312" text-anchor="middle" font-family="Arial,sans-serif" font-size="12" fill="#6b7a72">${dosage}</text>
</svg>`;
};

export const getMedicineImage = (medicine) => {
  const imageUrl = String(medicine?.imageUrl || '').trim();

  if (imageUrl) {
    if (/^(data|blob):/i.test(imageUrl)) return imageUrl;
    if (imageUrl.startsWith('/')) return `${API_BASE_URL}${imageUrl}`;
    if (/^https?:\/\//i.test(imageUrl)) return optimizeRemoteImageUrl(imageUrl);
    return `${API_BASE_URL}/${imageUrl.replace(/^\/+/, '')}`;
  }

  /* Always fall back to clean SVG illustration */
  const svg = buildProductBoxSvg(medicine || {});
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};
