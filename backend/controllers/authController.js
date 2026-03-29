const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { firebaseAuth, isFirebaseAdminConfigured } = require('../config/firebaseAdmin');

const generateAccessToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '15m' });
const generateRefreshToken = (id) =>
  jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret', { expiresIn: '7d' });

const setRefreshCookie = (res, refreshToken) => {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

const buildAuthResponse = (res, user, statusCode = 200) => {
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);
  setRefreshCookie(res, refreshToken);

  return res.status(statusCode).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    token: accessToken,
  });
};

const normalizePhone = (phone) => phone?.replace(/^\+91/, '') || phone;

const registerUser = async (req, res) => {
  const { name, email, password, role, mobile } = req.body;

  let user = await User.findOne({ $or: [{ email }, { phone: mobile }] });

  if (user && user.name !== 'Pending User') {
    return res.status(400).json({ message: 'User already exists' });
  }

  if (user && user.name === 'Pending User') {
    user.name = name;
    user.email = email;
    user.password = password;
    user.role = role || 'customer';
    await user.save();
  } else {
    user = await User.create({
      name,
      email,
      password,
      phone: mobile,
      role: role || 'customer',
    });
  }

  return buildAuthResponse(res, user, 201);
};

const authUser = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  return buildAuthResponse(res, user);
};

const refreshAccessToken = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ message: 'Not authorized, no refresh token' });
  }

  try {
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret'
    );
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    const newAccessToken = generateAccessToken(user._id);
    return res.json({ token: newAccessToken });
  } catch (error) {
    return res.status(401).json({ message: 'Refresh token expired or invalid' });
  }
};

const logoutUser = (req, res) => {
  res.clearCookie('refreshToken');
  res.json({ message: 'Logged out successfully' });
};

const getUserProfile = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

const requestOTP = async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ message: 'Phone number is required' });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = new Date(Date.now() + 5 * 60 * 1000);

  try {
    let user = await User.findOne({ phone });

    if (!user) {
      user = new User({
        name: 'Pending User',
        email: `${phone}@pending.com`,
        password: 'placeholder_password',
        phone,
      });
    }

    user.otpCode = otp;
    user.otpExpires = expires;
    await user.save();

    console.log(`SMS to ${phone}: Your Bablu Medical OTP is ${otp}`);
    res.json({ message: 'OTP sent to mobile' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

const verifyOTP = async (req, res) => {
  const { phone, otp } = req.body;

  try {
    const user = await User.findOne({ phone });

    if (!user || user.otpCode !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    user.otpCode = undefined;
    user.otpExpires = undefined;
    await user.save();

    return buildAuthResponse(res, user);
  } catch (error) {
    return res.status(500).json({ message: 'Server Error' });
  }
};

const firebasePhoneAuth = async (req, res) => {
  if (!isFirebaseAdminConfigured || !firebaseAuth) {
    return res.status(501).json({ message: 'Firebase Admin is not configured on the backend.' });
  }

  const { idToken, profile } = req.body;

  if (!idToken) {
    return res.status(400).json({ message: 'Firebase ID token is required.' });
  }

  try {
    const decoded = await firebaseAuth.verifyIdToken(idToken);
    const phone = normalizePhone(decoded.phone_number);

    if (!phone) {
      return res.status(400).json({ message: 'Verified Firebase user has no phone number.' });
    }

    let user = await User.findOne({ phone });
    const requestedEmail = profile?.email || `${phone}@firebase.local`;

    if (!user) {
      user = await User.create({
        name: profile?.name || decoded.name || 'Customer',
        email: requestedEmail,
        password: profile?.password || `firebase_${phone}`,
        phone,
        role: 'customer',
      });
    } else if (profile?.mode === 'register') {
      user.name = profile?.name || user.name;
      user.email = requestedEmail;
      if (profile?.password) {
        user.password = profile.password;
      }
      await user.save();
    }

    return buildAuthResponse(res, user);
  } catch (error) {
    return res.status(401).json({ message: 'Firebase token verification failed.' });
  }
};

const getDeliveryPartners = async (_req, res) => {
  try {
    const partners = await User.find({ role: 'delivery_person' }).select('-password');
    res.json(partners);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  registerUser,
  authUser,
  getUserProfile,
  refreshAccessToken,
  logoutUser,
  getDeliveryPartners,
  requestOTP,
  verifyOTP,
  firebasePhoneAuth,
};
