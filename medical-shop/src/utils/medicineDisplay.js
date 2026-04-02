import { API_BASE_URL } from '../config';

const CATEGORY_FALLBACKS = {
  tablet: { label: 'TABLET', unit: 'tablets', accent: '#24458c', glow: '#dbe5ff' },
  capsule: { label: 'CAPSULE', unit: 'capsules', accent: '#0f766e', glow: '#d4f6ef' },
  syrup: { label: 'SYRUP', unit: 'ml', accent: '#1d4ed8', glow: '#dbe8ff' },
  cream: { label: 'CREAM', unit: 'g', accent: '#b42318', glow: '#ffe0de' },
  drops: { label: 'DROPS', unit: 'ml', accent: '#7c3aed', glow: '#eadcff' },
  injection: { label: 'INJECTION', unit: 'vial', accent: '#9a3412', glow: '#ffe6d7' },
  default: { label: 'MEDICINE', unit: 'units', accent: '#1a7a4a', glow: '#dff5e7' },
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

const buildFallbackSvg = (medicine) => {
  const theme = getMedicineTheme(medicine.category);
  const title = escapeXml(medicine.name || theme.label);
  const subtitle = escapeXml(buildPackLabel(medicine));
  const accent = theme.accent;
  const glow = theme.glow;
  const categoryLabel = escapeXml(theme.label);

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="480" height="360" viewBox="0 0 480 360">
      <defs>
        <linearGradient id="surface" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${glow}" />
          <stop offset="100%" stop-color="#ffffff" />
        </linearGradient>
      </defs>
      <rect width="480" height="360" rx="32" fill="url(#surface)" />
      <rect x="92" y="58" width="296" height="204" rx="28" fill="#ffffff" stroke="${accent}" stroke-width="6" />
      <rect x="118" y="86" width="244" height="84" rx="24" fill="${accent}" opacity="0.12" />
      <rect x="144" y="112" width="92" height="34" rx="17" fill="${accent}" />
      <rect x="232" y="112" width="92" height="34" rx="17" fill="#ffffff" stroke="${accent}" stroke-width="6" />
      <circle cx="154" cy="214" r="16" fill="${accent}" opacity="0.18" />
      <circle cx="194" cy="214" r="16" fill="${accent}" opacity="0.28" />
      <circle cx="234" cy="214" r="16" fill="${accent}" opacity="0.38" />
      <text x="240" y="292" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="700" fill="${accent}">${categoryLabel}</text>
      <text x="240" y="320" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="700" fill="#163124">${title}</text>
      <text x="240" y="344" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="#4b6356">${subtitle}</text>
    </svg>
  `;
};

export const getMedicineImage = (medicine) => {
  const imageUrl = String(medicine?.imageUrl || '').trim();

  if (imageUrl) {
    if (/^(https?:)?\/\//i.test(imageUrl) || /^(data|blob):/i.test(imageUrl)) {
      return imageUrl;
    }

    if (imageUrl.startsWith('/')) {
      return `${API_BASE_URL}${imageUrl}`;
    }

    return `${API_BASE_URL}/${imageUrl.replace(/^\/+/, '')}`;
  }

  const svg = buildFallbackSvg(medicine || {});
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};
