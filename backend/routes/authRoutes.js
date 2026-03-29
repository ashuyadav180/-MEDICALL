const express = require('express');
const router = express.Router();
const {
  registerUser,
  authUser,
  getUserProfile,
  refreshAccessToken,
  logoutUser,
  getDeliveryPartners,
  requestOTP,
  verifyOTP,
  firebasePhoneAuth,
} = require('../controllers/authController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', authUser);
router.post('/send-otp', requestOTP);
router.post('/verify-otp', verifyOTP);
router.post('/firebase-phone', firebasePhoneAuth);
router.post('/refresh', refreshAccessToken);
router.post('/logout', logoutUser);

router.get('/profile', protect, getUserProfile);
router.get('/partners', protect, admin, getDeliveryPartners);

module.exports = router;
