/**
 * gen_fallback_from_db.js
 * Reads the live MongoDB medicines collection and writes the frontend
 * fallback file with the real DailyMed image URLs.
 */
const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Medicine = require('./models/Medicine');

const OUT_FILE = path.resolve(
  __dirname,
  '../medical-shop/src/data/fallbackMedicines.js'
);

async function generate() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB connected');

  const medicines = await Medicine.find({}).sort({ category: 1, name: 1 }).lean();
  console.log(`Found ${medicines.length} medicines`);

  const esc = (s) =>
    String(s || '')
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/\n/g, ' ')
      .trim();

  const entries = medicines.map((m) => {
    const id =
      m._id?.toString() ||
      `fallback-${m.category}-${String(m.name).toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    return `  {
    id: '${esc(id)}',
    name: '${esc(m.name)}',
    price: ${Number(m.price) || 0},
    description: '${esc(m.description)}',
    manufacturer: '${esc(m.manufacturer)}',
    sourceName: '${esc(m.sourceName)}',
    sourceUrl: '${esc(m.sourceUrl)}',
    imageUrl: '${esc(m.imageUrl)}',
    dosage: '${esc(m.dosage)}',
    packQuantity: ${m.packQuantity === null || m.packQuantity === undefined ? 'null' : Number(m.packQuantity)},
    packUnit: '${esc(m.packUnit)}',
    category: '${esc(m.category)}',
    stock: ${Number(m.stock) || 0},
  }`;
  });

  const content =
    '// Auto-generated from MongoDB — DO NOT EDIT MANUALLY\n' +
    '// Run: node backend/gen_fallback_from_db.js\n' +
    'export const FALLBACK_MEDICINES = [\n' +
    entries.join(',\n') +
    '\n];\n';

  fs.writeFileSync(OUT_FILE, content, 'utf8');

  // Stats
  const withDailyMed = medicines.filter((m) =>
    m.imageUrl?.includes('dailymed')
  ).length;
  const withUnsplash = medicines.filter((m) =>
    m.imageUrl?.includes('unsplash')
  ).length;
  const noImage = medicines.filter((m) => !m.imageUrl).length;

  console.log(`\n✅  Written to: ${OUT_FILE}`);
  console.log(`📸  DailyMed images : ${withDailyMed}`);
  console.log(`📷  Unsplash images : ${withUnsplash}`);
  console.log(`❌  No image        : ${noImage}`);
  console.log(`\nSample: ${medicines[0]?.name} → ${medicines[0]?.imageUrl}\n`);

  process.exit(0);
}

generate().catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});
