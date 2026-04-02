const express = require('express');
const router = express.Router();
const {
  addOrderItems,
  getOrderById,
  getTrackOrder,
  updateOrderStatus,
  updateOrderPaymentStatus,
  getOrders,
  getMyOrders,
  getAnalytics,
  assignOrder,
  getPartnerOrders,
} = require('../controllers/orderController');
const { protect, admin, allowRoles } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinary');

// Protected order placement
router.post(
  '/',
  protect,
  upload.fields([
    { name: 'prescription', maxCount: 1 },
    { name: 'paymentScreenshot', maxCount: 1 },
  ]),
  addOrderItems
); 

// Customer / Delivery / Admin views
router.get('/track/:reference', getTrackOrder);
router.get('/my', protect, getMyOrders);
router.get('/my/tasks', protect, allowRoles('delivery_person', 'admin'), getPartnerOrders);

// Admin only
router.get('/', protect, admin, getOrders);
router.get('/analytics/stats', protect, admin, getAnalytics);
router.put('/:id/status', protect, allowRoles('admin', 'delivery_person'), updateOrderStatus);
router.put('/:id/payment-status', protect, admin, updateOrderPaymentStatus);
router.put('/:id/assign', protect, admin, assignOrder);

// Protected full order details
router.get('/:id', protect, getOrderById); 

module.exports = router;
