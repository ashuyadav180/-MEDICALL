const MEDICINE_QUERIES = [
  { searchTerm: 'acetaminophen', displayName: 'Paracetamol / Acetaminophen 500mg', category: 'tablet', price: 25, stock: 100 },
  { searchTerm: 'ibuprofen', displayName: 'Ibuprofen 400mg', category: 'tablet', price: 32, stock: 75 },
  { searchTerm: 'cetirizine', displayName: 'Cetirizine 10mg', category: 'tablet', price: 22, stock: 120 },
  { searchTerm: 'omeprazole', displayName: 'Omeprazole 20mg', category: 'capsule', price: 48, stock: 60 },
  { searchTerm: 'amoxicillin', displayName: 'Amoxicillin 500mg', category: 'capsule', price: 65, stock: 45 },
  { searchTerm: 'metformin', displayName: 'Metformin 500mg', category: 'tablet', price: 30, stock: 90 },
  { searchTerm: 'amlodipine', displayName: 'Amlodipine 5mg', category: 'tablet', price: 40, stock: 90 },
  { searchTerm: 'clotrimazole', displayName: 'Clotrimazole Cream', category: 'cream', price: 68, stock: 40 },
  { searchTerm: 'dextromethorphan', displayName: 'Cough Relief Syrup', category: 'syrup', price: 95, stock: 35 },
  { searchTerm: 'insulin', displayName: 'Insulin Injection', category: 'injection', price: 250, stock: 18 },
];

const normalizeText = (value) => String(value || '').replace(/\s+/g, ' ').trim();

const truncateText = (value, maxLength = 180) => {
  const cleanValue = normalizeText(value);
  if (cleanValue.length <= maxLength) {
    return cleanValue;
  }

  return `${cleanValue.slice(0, maxLength - 3).trim()}...`;
};

const buildDescription = (record, fallbackName) => {
  const descriptionSource =
    record.indications_and_usage?.[0] ||
    record.purpose?.[0] ||
    record.active_ingredient?.[0] ||
    `General use information for ${fallbackName}`;

  return truncateText(descriptionSource);
};

const buildSourceUrl = (searchTerm) =>
  `https://api.fda.gov/drug/label.json?search=openfda.generic_name:%22${encodeURIComponent(searchTerm)}%22&limit=1`;

const mapFdaRecordToMedicine = (query, record) => ({
  name: query.displayName,
  price: query.price,
  description: buildDescription(record, query.displayName),
  manufacturer: normalizeText(record.openfda?.manufacturer_name?.[0]),
  sourceName: 'openFDA',
  sourceUrl: buildSourceUrl(query.searchTerm),
  category: query.category,
  stock: query.stock,
});

const buildFallbackMedicine = (query) => ({
  name: query.displayName,
  price: query.price,
  description: `Commonly used for ${query.searchTerm.replace(/_/g, ' ')} care. Consult a doctor or pharmacist before use.`,
  manufacturer: '',
  sourceName: 'openFDA (fallback)',
  sourceUrl: buildSourceUrl(query.searchTerm),
  category: query.category,
  stock: query.stock,
});

const fetchFdaRecord = async (query) => {
  const response = await fetch(buildSourceUrl(query.searchTerm));
  const data = await response.json();

  if (!response.ok || !data.results?.length) {
    throw new Error(data.error?.message || `No data found for ${query.searchTerm}`);
  }

  return data.results[0];
};

const getSeedMedicines = async () => {
  const medicines = await Promise.all(
    MEDICINE_QUERIES.map(async (query) => {
      try {
        const record = await fetchFdaRecord(query);
        return mapFdaRecordToMedicine(query, record);
      } catch (error) {
        console.warn(`Using fallback data for ${query.displayName}: ${error.message}`);
        return buildFallbackMedicine(query);
      }
    })
  );

  return medicines;
};

module.exports = {
  getSeedMedicines,
};
