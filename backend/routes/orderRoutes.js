const express = require('express');
const router = express.Router();
const {
  addOrderItems,
  getOrderById,
  updateOrderStatus,
  getOrders,
  getAnalytics,
  assignOrder,
  getPartnerOrders,
} = require('../controllers/orderController');
const { protect, admin, allowRoles } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinary');

// Protected order placement
router.post('/', protect, upload.single('prescription'), addOrderItems); 

// Delivery / Admin views
router.get('/my/tasks', protect, allowRoles('delivery_person', 'admin'), getPartnerOrders);

// Admin only
router.get('/', protect, admin, getOrders);
router.get('/analytics/stats', protect, admin, getAnalytics);
router.put('/:id/status', protect, allowRoles('admin', 'delivery_person'), updateOrderStatus);
router.put('/:id/assign', protect, admin, assignOrder);

// Public tracking
router.get('/:id', getOrderById); 

module.exports = router;
