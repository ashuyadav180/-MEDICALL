const express = require('express');
const router = express.Router();
const {
  getMedicines,
  getMedicineById,
  createMedicine,
  updateMedicine,
  deleteMedicine,
} = require('../controllers/medicineController');
const { protect, admin } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinary');

router.get('/', getMedicines);
router.get('/:id', getMedicineById);
router.post('/', protect, admin, upload.single('image'), createMedicine);
router.put('/:id', protect, admin, upload.single('image'), updateMedicine);
router.delete('/:id', protect, admin, deleteMedicine);

module.exports = router;
