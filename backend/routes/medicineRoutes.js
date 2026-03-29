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

router.get('/', getMedicines);
router.get('/:id', getMedicineById);
router.post('/', protect, admin, createMedicine);
router.put('/:id', protect, admin, updateMedicine);
router.delete('/:id', protect, admin, deleteMedicine);

module.exports = router;
