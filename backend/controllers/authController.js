const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendOtpEmail } = require('../services/emailService');

const generateAccessToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '15m' });
const generateRefreshToken = (id) =>
  jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret', { expiresIn: '7d' });

const isProduction = process.env.NODE_ENV === 'production';
const refreshCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const isEmail = (value) => /\S+@\S+\.\S+/.test(String(value || '').trim());

const normalizePhone = (phone) => {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';
  return digits.startsWith('91') && digits.length === 12 ? digits.slice(2) : digits.slice(-10);
};

const isPhone = (value) => /^\d{10}$/.test(normalizePhone(value));

const getSafeErrorMessage = (error, fallbackMessage = 'Server Error') => {
  if (!error?.message) {
    return fallbackMessage;
  }

  if (
    error.message.includes('Brevo API error') ||
    error.message.includes('A valid email is required') ||
    error.message.includes('missing API key')
  ) {
    return error.message;
  }

  return fallbackMessage;
};

const setRefreshCookie = (res, refreshToken) => {
  res.cookie('refreshToken', refreshToken, refreshCookieOptions);
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

const findUserByIdentifier = async (identifier) => {
  const normalizedIdentifier = String(identifier || '').trim();
  if (!normalizedIdentifier) return null;

  if (isEmail(normalizedIdentifier)) {
    return User.findOne({ email: normalizedIdentifier.toLowerCase() });
  }

  return User.findOne({ phone: normalizePhone(normalizedIdentifier) });
};

const ensureUniqueContact = async ({ email, phone, currentUserId = null }) => {
  const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
  if (!existingUser) return null;
  if (currentUserId && String(existingUser._id) === String(currentUserId)) return null;
  return existingUser;
};

const registerUser = async (req, res) => {
  const { name, email, password, role, mobile } = req.body;
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedPhone = normalizePhone(mobile);

  if (!isEmail(normalizedEmail) || !isPhone(normalizedPhone)) {
    return res.status(400).json({ message: 'Valid email and 10-digit mobile number are required' });
  }

  let user = await User.findOne({ $or: [{ email: normalizedEmail }, { phone: normalizedPhone }] });

  if (user && user.name !== 'Pending User') {
    return res.status(400).json({ message: 'User already exists' });
  }

  if (user && user.name === 'Pending User') {
    user.name = name;
    user.email = normalizedEmail;
    user.phone = normalizedPhone;
    user.password = password;
    user.role = role || 'customer';
    await user.save();
  } else {
    user = await User.create({
      name,
      email: normalizedEmail,
      password,
      phone: normalizedPhone,
      role: role || 'customer',
    });
  }

  return buildAuthResponse(res, user, 201);
};

const authUser = async (req, res) => {
  const { identifier, email, phone, password } = req.body;
  const loginIdentifier = identifier || email || phone;

  const user = await findUserByIdentifier(loginIdentifier);

  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ message: 'Invalid email/phone or password' });
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
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
  });
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
      phone: user.phone,
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const nextName = req.body.name?.trim() || user.name;
    const nextEmail = req.body.email ? String(req.body.email).trim().toLowerCase() : user.email;
    const nextPhone = req.body.phone ? normalizePhone(req.body.phone) : user.phone;

    if (!isEmail(nextEmail) || !isPhone(nextPhone)) {
      return res.status(400).json({ message: 'Valid email and 10-digit mobile number are required' });
    }

    const duplicateUser = await ensureUniqueContact({
      email: nextEmail,
      phone: nextPhone,
      currentUserId: user._id,
    });

    if (duplicateUser) {
      return res.status(400).json({ message: 'Email or phone is already used by another account' });
    }

    user.name = nextName;
    user.email = nextEmail;
    user.phone = nextPhone;
    if (req.body.password) {
      user.password = req.body.password;
    }

    await user.save();
    return buildAuthResponse(res, user);
  } catch (error) {
    return res.status(500).json({ message: 'Server Error' });
  }
};

const requestOTP = async (req, res) => {
  const { identifier, phone, email } = req.body;
  const target = String(identifier || email || phone || '').trim();

  if (!target) {
    return res.status(400).json({ message: 'Email or phone number is required' });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = new Date(Date.now() + 5 * 60 * 1000);

  try {
    let user = await findUserByIdentifier(target);

    if (isEmail(target)) {
      const normalizedEmail = target.toLowerCase();

      if (!user) {
        user = new User({
          name: 'Pending User',
          email: normalizedEmail,
          password: 'placeholder_password',
        });
      }

      user.email = normalizedEmail;
      user.otpCode = otp;
      user.otpExpires = expires;
      await user.save();

      await sendOtpEmail({ email: normalizedEmail, name: user.name, otp });
      return res.json({ message: 'OTP sent to email', channel: 'email' });
    }

    if (!isPhone(target)) {
      return res.status(400).json({ message: 'Please enter a valid email or 10-digit mobile number' });
    }

    const normalizedPhone = normalizePhone(target);

    if (!user) {
      user = new User({
        name: 'Pending User',
        email: `${normalizedPhone}@pending.com`,
        password: 'placeholder_password',
        phone: normalizedPhone,
      });
    }

    user.phone = normalizedPhone;
    user.otpCode = otp;
    user.otpExpires = expires;
    await user.save();

    console.log(`OTP for ${normalizedPhone}: Your Bablu Medical OTP is ${otp}`);
    return res.json({ message: 'OTP generated for mobile login', channel: 'phone' });
  } catch (error) {
    return res.status(500).json({ message: getSafeErrorMessage(error) });
  }
};

const verifyOTP = async (req, res) => {
  const { identifier, phone, email, otp, profile } = req.body;
  const target = String(identifier || email || phone || '').trim();

  try {
    const user = await findUserByIdentifier(target);

    if (!user || user.otpCode !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    if (profile?.mode === 'register') {
      const normalizedEmail = String(profile.email || '').trim().toLowerCase();
      const normalizedPhone = normalizePhone(profile.mobile);

      if (!isEmail(normalizedEmail) || !isPhone(normalizedPhone)) {
        return res.status(400).json({ message: 'Valid email and mobile number are required' });
      }

      const duplicateUser = await ensureUniqueContact({
        email: normalizedEmail,
        phone: normalizedPhone,
        currentUserId: user._id,
      });

      if (duplicateUser && duplicateUser.name !== 'Pending User') {
        return res.status(400).json({ message: 'User already exists' });
      }

      user.name = profile.name || user.name;
      user.email = normalizedEmail;
      user.phone = normalizedPhone;
      user.password = profile.password || user.password;
      user.role = profile.role || user.role || 'customer';
    }

    user.otpCode = undefined;
    user.otpExpires = undefined;
    await user.save();

    return buildAuthResponse(res, user);
  } catch (error) {
    return res.status(500).json({ message: 'Server Error' });
  }
};

const forgotPassword = async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();

  if (!isEmail(email)) {
    return res.status(400).json({ message: 'Valid email is required' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otpCode = otp;
    user.otpExpires = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();

    await sendOtpEmail({ email, name: user.name, otp });
    return res.json({ message: 'Password reset OTP sent to email' });
  } catch (error) {
    return res.status(500).json({ message: getSafeErrorMessage(error) });
  }
};

const resetPassword = async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const otp = String(req.body.otp || '').trim();
  const newPassword = req.body.password || '';

  if (!isEmail(email) || otp.length !== 6 || newPassword.length < 6) {
    return res.status(400).json({ message: 'Valid email, OTP, and new password are required' });
  }

  try {
    const user = await User.findOne({ email });

    if (!user || user.otpCode !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    user.password = newPassword;
    user.otpCode = undefined;
    user.otpExpires = undefined;
    await user.save();

    return res.json({ message: 'Password reset successful' });
  } catch (error) {
    return res.status(500).json({ message: 'Server Error' });
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

const setupDeliveryUser = async (req, res) => {
  const setupSecret = process.env.SETUP_SECRET;
  const providedSecret =
    req.headers['x-setup-secret'] || req.body?.setupSecret || req.query?.setupSecret;

  if (!setupSecret || providedSecret !== setupSecret) {
    return res.status(403).json({ message: 'Invalid setup secret' });
  }

  try {
    const email = 'delivery@bablu.com';
    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name: 'Delivery Partner',
        email,
        password: 'AMIT@937149',
        role: 'delivery_person',
        phone: '9876543210',
      });
    } else {
      user.name = 'Delivery Partner';
      user.password = 'AMIT@937149';
      user.role = 'delivery_person';
      user.phone = user.phone || '9876543210';
      await user.save();
    }

    return res.json({
      message: 'Delivery user created or updated successfully',
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to setup delivery user' });
  }
};

module.exports = {
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
  setupDeliveryUser,
};
