const MEDICINE_QUERIES = [
  { searchTerm: 'acetaminophen', displayName: 'Paracetamol / Acetaminophen 500mg', category: 'tablet', price: 25, stock: 100, dosage: '500 mg', packQuantity: 10, packUnit: 'tablets' },
  { searchTerm: 'ibuprofen', displayName: 'Ibuprofen 400mg', category: 'tablet', price: 32, stock: 75, dosage: '400 mg', packQuantity: 10, packUnit: 'tablets' },
  { searchTerm: 'cetirizine', displayName: 'Cetirizine 10mg', category: 'tablet', price: 22, stock: 120, dosage: '10 mg', packQuantity: 10, packUnit: 'tablets' },
  { searchTerm: 'omeprazole', displayName: 'Omeprazole 20mg', category: 'capsule', price: 48, stock: 60, dosage: '20 mg', packQuantity: 15, packUnit: 'capsules' },
  { searchTerm: 'amoxicillin', displayName: 'Amoxicillin 500mg', category: 'capsule', price: 65, stock: 45, dosage: '500 mg', packQuantity: 15, packUnit: 'capsules' },
  { searchTerm: 'metformin', displayName: 'Metformin 500mg', category: 'tablet', price: 30, stock: 90, dosage: '500 mg', packQuantity: 15, packUnit: 'tablets' },
  { searchTerm: 'amlodipine', displayName: 'Amlodipine 5mg', category: 'tablet', price: 40, stock: 90, dosage: '5 mg', packQuantity: 10, packUnit: 'tablets' },
  { searchTerm: 'clotrimazole', displayName: 'Clotrimazole Cream', category: 'cream', price: 68, stock: 40, dosage: '1% w/w', packQuantity: 30, packUnit: 'g' },
  { searchTerm: 'dextromethorphan', displayName: 'Cough Relief Syrup', category: 'syrup', price: 95, stock: 35, dosage: '100 ml', packQuantity: 100, packUnit: 'ml' },
  { searchTerm: 'insulin', displayName: 'Insulin Injection', category: 'injection', price: 250, stock: 18, dosage: '10 ml vial', packQuantity: 1, packUnit: 'vial' },
];

const DAILYMED_DRUGNAME_BASE_URL = 'https://dailymed.nlm.nih.gov/dailymed/services/v1/drugname';
const DAILYMED_SPL_BASE_URL = 'https://dailymed.nlm.nih.gov/dailymed/services/v2/spls';

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

const buildDailyMedLabelUrl = (setId) =>
  `https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=${encodeURIComponent(setId)}`;

const mapFdaRecordToMedicine = (query, record) => ({
  name: query.displayName,
  price: query.price,
  description: buildDescription(record, query.displayName),
  manufacturer: normalizeText(record.openfda?.manufacturer_name?.[0]),
  sourceName: 'openFDA + DailyMed',
  sourceUrl: buildSourceUrl(query.searchTerm),
  imageUrl: '',
  dosage: query.dosage || '',
  packQuantity: query.packQuantity ?? null,
  packUnit: query.packUnit || '',
  category: query.category,
  stock: query.stock,
});

const buildFallbackMedicine = (query) => ({
  name: query.displayName,
  price: query.price,
  description: `Commonly used for ${query.searchTerm.replace(/_/g, ' ')} care. Consult a doctor or pharmacist before use.`,
  manufacturer: '',
  sourceName: 'openFDA + DailyMed (fallback)',
  sourceUrl: buildSourceUrl(query.searchTerm),
  imageUrl: '',
  dosage: query.dosage || '',
  packQuantity: query.packQuantity ?? null,
  packUnit: query.packUnit || '',
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

const fetchDailyMedSpls = async (drugName) => {
  const response = await fetch(
    `${DAILYMED_DRUGNAME_BASE_URL}/${encodeURIComponent(drugName)}/human/spls.json`
  );

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  return Array.isArray(data.DATA)
    ? data.DATA.map((item) => ({
        setid: item[0],
        title: item[1],
        splVersion: item[2],
        publishedDate: item[3],
      }))
    : [];
};

const fetchDailyMedMedia = async (setId) => {
  const response = await fetch(`${DAILYMED_SPL_BASE_URL}/${encodeURIComponent(setId)}/media.json`);
  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  return Array.isArray(data.data?.media) ? data.data.media : [];
};

const fetchDailyMedImage = async (query) => {
  const candidates = await fetchDailyMedSpls(query.searchTerm);

  for (const candidate of candidates.slice(0, 5)) {
    const media = await fetchDailyMedMedia(candidate.setid);
    const imageFile = media.find((file) => String(file.mime_type).startsWith('image/'));

    if (imageFile?.url) {
      return {
        imageUrl: imageFile.url,
        sourceUrl: buildDailyMedLabelUrl(candidate.setid),
        sourceName: 'DailyMed',
      };
    }
  }

  return null;
};

const getSeedMedicines = async () => {
  const medicines = await Promise.all(
    MEDICINE_QUERIES.map(async (query) => {
      const [dailyMedImageResult, fdaRecordResult] = await Promise.allSettled([
        fetchDailyMedImage(query),
        fetchFdaRecord(query),
      ]);

      const dailyMedImage =
        dailyMedImageResult.status === 'fulfilled' ? dailyMedImageResult.value : null;

      try {
        if (fdaRecordResult.status !== 'fulfilled') {
          throw fdaRecordResult.reason;
        }

        const medicine = mapFdaRecordToMedicine(query, fdaRecordResult.value);
        if (dailyMedImage?.imageUrl) {
          medicine.imageUrl = dailyMedImage.imageUrl;
          medicine.sourceUrl = dailyMedImage.sourceUrl;
        }
        return medicine;
      } catch (error) {
        console.warn(`Using fallback data for ${query.displayName}: ${error.message}`);
        const medicine = buildFallbackMedicine(query);
        if (dailyMedImage?.imageUrl) {
          medicine.imageUrl = dailyMedImage.imageUrl;
          medicine.sourceUrl = dailyMedImage.sourceUrl;
          medicine.sourceName = 'DailyMed (image) + local fallback';
        }
        return medicine;
      }
    })
  );

  return medicines;
};

module.exports = {
  getSeedMedicines,
};
