const express = require('express');
const router = express.Router();
const {
  registerUser,
  authUser,
  getUserProfile,
  updateUserProfile,
  refreshAccessToken,
  logoutUser,
  getDeliveryPartners,
  requestOTP,
  verifyOTP,
  forgotPassword,
  resetPassword,
} = require('../controllers/authController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', authUser);
router.post('/send-otp', requestOTP);
router.post('/verify-otp', verifyOTP);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/refresh', refreshAccessToken);
router.post('/logout', logoutUser);

router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.get('/partners', protect, admin, getDeliveryPartners);

module.exports = router;
