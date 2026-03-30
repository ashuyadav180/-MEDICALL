const Medicine = require('../models/Medicine');

const MEDICINES_CACHE_TTL_MS = 60 * 1000;
let medicinesListCache = null;
let medicinesListCacheExpiry = 0;

const invalidateMedicineCache = () => {
  medicinesListCache = null;
  medicinesListCacheExpiry = 0;
};

const hasFreshMedicineCache = () => (
  medicinesListCache && medicinesListCacheExpiry > Date.now()
);

// @desc    Fetch all medicines
// @route   GET /api/medicines
// @access  Public
const getMedicines = async (req, res) => {
  try {
    if (hasFreshMedicineCache()) {
      res.set('Cache-Control', 'public, max-age=60');
      return res.json(medicinesListCache);
    }

    const medicines = await Medicine.find({})
      .select('name price description manufacturer sourceName sourceUrl imageUrl dosage packQuantity packUnit category stock createdAt updatedAt')
      .sort({ name: 1 })
      .lean();

    medicinesListCache = medicines;
    medicinesListCacheExpiry = Date.now() + MEDICINES_CACHE_TTL_MS;
    res.set('Cache-Control', 'public, max-age=60');
    res.json(medicines);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Fetch single medicine
// @route   GET /api/medicines/:id
// @access  Public
const getMedicineById = async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id).lean();

    if (medicine) {
      res.set('Cache-Control', 'public, max-age=60');
      res.json(medicine);
    } else {
      res.status(404).json({ message: 'Medicine not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Create a medicine
// @route   POST /api/medicines
// @access  Private/Admin
const createMedicine = async (req, res) => {
  try {
    const {
      name,
      price,
      description,
      manufacturer,
      sourceName,
      sourceUrl,
      imageUrl,
      dosage,
      packQuantity,
      packUnit,
      category,
      stock,
    } = req.body;

    const medicine = new Medicine({
      name,
      price,
      description,
      manufacturer,
      sourceName,
      sourceUrl,
      imageUrl,
      dosage,
      packQuantity,
      packUnit,
      category,
      stock,
    });

    const createdMedicine = await medicine.save();
    invalidateMedicineCache();
    res.status(201).json(createdMedicine);
  } catch (error) {
    res.status(400).json({ message: 'Invalid medicine data' });
  }
};

// @desc    Update a medicine
// @route   PUT /api/medicines/:id
// @access  Private/Admin
const updateMedicine = async (req, res) => {
  try {
    const {
      name,
      price,
      description,
      manufacturer,
      sourceName,
      sourceUrl,
      imageUrl,
      dosage,
      packQuantity,
      packUnit,
      category,
      stock,
    } = req.body;

    const medicine = await Medicine.findById(req.params.id);

    if (medicine) {
      medicine.name = name ?? medicine.name;
      medicine.price = price ?? medicine.price;
      medicine.description = description ?? medicine.description;
      medicine.manufacturer = manufacturer ?? medicine.manufacturer;
      medicine.sourceName = sourceName ?? medicine.sourceName;
      medicine.sourceUrl = sourceUrl ?? medicine.sourceUrl;
      medicine.imageUrl = imageUrl ?? medicine.imageUrl;
      medicine.dosage = dosage ?? medicine.dosage;
      medicine.packQuantity = packQuantity ?? medicine.packQuantity;
      medicine.packUnit = packUnit ?? medicine.packUnit;
      medicine.category = category ?? medicine.category;
      medicine.stock = stock ?? medicine.stock;

      const updatedMedicine = await medicine.save();
      invalidateMedicineCache();
      res.json(updatedMedicine);
    } else {
      res.status(404).json({ message: 'Medicine not found' });
    }
  } catch (error) {
    res.status(400).json({ message: 'Invalid medicine data' });
  }
};

// @desc    Delete a medicine
// @route   DELETE /api/medicines/:id
// @access  Private/Admin
const deleteMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id);

    if (medicine) {
      await medicine.deleteOne();
      invalidateMedicineCache();
      res.json({ message: 'Medicine removed' });
    } else {
      res.status(404).json({ message: 'Medicine not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  getMedicines,
  getMedicineById,
  createMedicine,
  updateMedicine,
  deleteMedicine,
};
