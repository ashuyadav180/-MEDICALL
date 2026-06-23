const { getStaticSeedMedicines } = require('./data/fdaMedicines');
const fs = require('fs');

const medicines = getStaticSeedMedicines();

const entries = medicines.map(m => {
    const esc = (s) => String(s || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, ' ');
    return `  {
    id: '${esc(m.id)}',
    name: '${esc(m.name)}',
    price: ${Number(m.price) || 0},
    description: '${esc(m.description)}',
    manufacturer: '${esc(m.manufacturer)}',
    sourceName: '${esc(m.sourceName)}',
    sourceUrl: '${esc(m.sourceUrl)}',
    imageUrl: '${esc(m.imageUrl)}',
    dosage: '${esc(m.dosage)}',
    packQuantity: ${m.packQuantity === null ? 'null' : Number(m.packQuantity)},
    packUnit: '${esc(m.packUnit)}',
    category: '${esc(m.category)}',
    stock: ${Number(m.stock) || 0},
  }`;
});

const content = 'export const FALLBACK_MEDICINES = [\n' + entries.join(',\n') + '\n];\n';
fs.writeFileSync('fallback_out.js', content);
console.log('Generated', medicines.length, 'medicines with images');
console.log('Sample imageUrl:', medicines[0].imageUrl);
