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

const handleOrderUploads = (req, res, next) => {
  upload.fields([
    { name: 'prescription', maxCount: 1 },
    { name: 'paymentScreenshot', maxCount: 1 },
  ])(req, res, (error) => {
    if (!error) {
      return next();
    }

    const uploadMessageMap = {
      LIMIT_FILE_SIZE: 'Uploaded file is too large. Please upload an image smaller than 8MB.',
      LIMIT_UNEXPECTED_FILE: 'Only image files are allowed for prescription and payment proof uploads.',
    };

    const message =
      uploadMessageMap[error.code] ||
      error.message ||
      'File upload failed. Please try again with a valid image.';

    return res.status(400).json({ message });
  });
};

// Protected order placement
router.post(
  '/',
  protect,
  handleOrderUploads,
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
