const CATEGORY_FALLBACKS = {
  tablet: { label: 'TABLET', unit: 'tablets', emoji: '💊', accent: '#24458c', glow: '#dbe5ff' },
  capsule: { label: 'CAPSULE', unit: 'capsules', emoji: '🟡', accent: '#0f766e', glow: '#d4f6ef' },
  syrup: { label: 'SYRUP', unit: 'ml', emoji: '🧴', accent: '#1d4ed8', glow: '#dbe8ff' },
  cream: { label: 'CREAM', unit: 'g', emoji: '🧴', accent: '#b42318', glow: '#ffe0de' },
  drops: { label: 'DROPS', unit: 'ml', emoji: '💧', accent: '#7c3aed', glow: '#eadcff' },
  injection: { label: 'INJECTION', unit: 'vial', emoji: '💉', accent: '#9a3412', glow: '#ffe6d7' },
  default: { label: 'MEDICINE', unit: 'units', emoji: '🏥', accent: '#1a7a4a', glow: '#dff5e7' },
};

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

export const getMedicineImage = (medicine) => {
  if (medicine.imageUrl) {
    return medicine.imageUrl;
  }

  const theme = getMedicineTheme(medicine.category);
  const title = encodeURIComponent(medicine.name || theme.label);
  const subtitle = encodeURIComponent(buildPackLabel(medicine));
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="480" height="360" viewBox="0 0 480 360">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${theme.glow}"/>
          <stop offset="100%" stop-color="#ffffff"/>
        </linearGradient>
      </defs>
      <rect width="480" height="360" rx="32" fill="url(#g)"/>
      <rect x="122" y="74" width="236" height="184" rx="24" fill="${theme.accent}" opacity="0.95"/>
      <rect x="138" y="92" width="204" height="148" rx="18" fill="white" opacity="0.16"/>
      <text x="240" y="122" text-anchor="middle" font-size="56">${theme.emoji}</text>
      <text x="240" y="176" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="700" fill="#ffffff">${theme.label}</text>
      <text x="240" y="294" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="700" fill="#163124">${title}</text>
      <text x="240" y="324" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="#4b6356">${subtitle}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${svg.replace(/\n\s*/g, '').replace(/#/g, '%23')}`;
};
