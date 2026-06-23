const mongoose = require('mongoose');
const Medicine = require('../models/Medicine');
const { getStaticSeedMedicines } = require('../data/fdaMedicines');

const MEDICINES_CACHE_TTL_MS = 60 * 1000;
let medicinesListCache = null;
let medicinesListCacheExpiry = 0;
const fallbackMedicines = getStaticSeedMedicines();

const invalidateMedicineCache = () => {
  medicinesListCache = null;
  medicinesListCacheExpiry = 0;
};

const hasFreshMedicineCache = () => (
  medicinesListCache && medicinesListCacheExpiry > Date.now()
);

// @desc    Fetch and search medicines
// @route   GET /api/medicines
// @access  Public
const getMedicines = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 0; // 0 means all for backward compatibility
    const skip = (page - 1) * limit;

    // Use memory cache only if no pagination/filter parameters are present
    const isBaseRequest = !req.query.page && !req.query.limit && !req.query.q && !req.query.category;

    if (isBaseRequest && hasFreshMedicineCache()) {
      res.set('Cache-Control', 'public, max-age=60');
      return res.json(medicinesListCache);
    }

    const query = {};
    if (req.query.category && req.query.category !== 'all') {
      query.category = req.query.category;
    }

    if (req.query.q) {
      query.name = { $regex: req.query.q, $options: 'i' };
    }

    const total = await Medicine.countDocuments(query);

    let dbQuery = Medicine.find(query)
      .select('name price description manufacturer sourceName sourceUrl imageUrl dosage packQuantity packUnit category stock createdAt updatedAt')
      .sort({ name: 1 })
      .lean();

    if (limit > 0) {
      dbQuery = dbQuery.skip(skip).limit(limit);
    }

    let medicines = await dbQuery;

    if (!medicines.length && isBaseRequest) {
      medicines = fallbackMedicines;
      // Note: total is not strictly accurate here but fine for fallbacks
    }

    const response = limit > 0
      ? { medicines, total, page, pages: Math.ceil(total / limit) }
      : medicines;

    if (isBaseRequest) {
      medicinesListCache = response;
      medicinesListCacheExpiry = Date.now() + MEDICINES_CACHE_TTL_MS;
    }

    res.set('Cache-Control', 'public, max-age=60');
    res.json(response);
  } catch (error) {
    console.error('getMedicines Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Fetch single medicine
// @route   GET /api/medicines/:id
// @access  Public
const getMedicineById = async (req, res) => {
  try {
    const fallbackMedicine = fallbackMedicines.find((medicine) => medicine.id === req.params.id);
    if (fallbackMedicine) {
      res.set('Cache-Control', 'public, max-age=60');
      return res.json(fallbackMedicine);
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Medicine not found' });
    }

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
      dosage,
      packQuantity,
      packUnit,
      category,
      stock,
    } = req.body;

    const imageUrl = req.file ? req.file.path : req.body.imageUrl;

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
      if (req.file) {
        medicine.imageUrl = req.file.path;
      } else if (req.body.imageUrl !== undefined) {
        medicine.imageUrl = req.body.imageUrl;
      }

      medicine.name = name ?? medicine.name;
      medicine.price = price ?? medicine.price;
      medicine.description = description ?? medicine.description;
      medicine.manufacturer = manufacturer ?? medicine.manufacturer;
      medicine.sourceName = sourceName ?? medicine.sourceName;
      medicine.sourceUrl = sourceUrl ?? medicine.sourceUrl;
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
