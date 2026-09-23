const bcrypt = require('bcryptjs');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_REGEX = /^[6-9]\d{9}$/; // 10-digit mobile number starting 6-9

const sanitizeUser = (user) => ({
  id: user._id,
  fullName: user.fullName,
  email: user.email,
  mobile: user.mobile,
});

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.registerUser = async (req, res) => {
  try {
    const { fullName, email, mobile, password } = req.body;
    const errors = {};

    if (!fullName || !fullName.trim()) {
      errors.fullName = 'Full name is required';
    }

    if (!email || !email.trim()) {
      errors.email = 'Email is required';
    } else if (!EMAIL_REGEX.test(email.trim())) {
      errors.email = 'Enter a valid email address';
    }

    if (!mobile || !mobile.trim()) {
      errors.mobile = 'Mobile number is required';
    } else if (!MOBILE_REGEX.test(mobile.trim())) {
      errors.mobile = 'Enter a valid 10-digit mobile number';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedMobile = mobile.trim();

    const [existingEmail, existingMobile] = await Promise.all([
      User.findOne({ email: normalizedEmail }),
      User.findOne({ mobile: normalizedMobile }),
    ]);

    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: 'Validation failed',
        errors: { email: 'Email is already registered' },
      });
    }

    if (existingMobile) {
      return res.status(409).json({
        success: false,
        message: 'Validation failed',
        errors: { mobile: 'Mobile number is already registered' },
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      fullName: fullName.trim(),
      email: normalizedEmail,
      mobile: normalizedMobile,
      password: hashedPassword,
    });

    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: { user: sanitizeUser(user), token },
    });
  } catch (error) {
    // Handles rare race-condition duplicate key errors from unique indexes
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || 'field';
      return res.status(409).json({
        success: false,
        message: 'Validation failed',
        errors: { [field]: `This ${field} is already registered` },
      });
    }
    console.error('Register error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error during registration' });
  }
};

// @desc    Login user with email or mobile + password
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = async (req, res) => {
  try {
    const { identifier, password } = req.body;
    const errors = {};

    if (!identifier || !identifier.trim()) {
      errors.identifier = 'Email or mobile number is required';
    }
    if (!password) {
      errors.password = 'Password is required';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }

    const trimmedIdentifier = identifier.trim();
    const isEmail = EMAIL_REGEX.test(trimmedIdentifier);
    const query = isEmail
      ? { email: trimmedIdentifier.toLowerCase() }
      : { mobile: trimmedIdentifier };

    const user = await User.findOne(query);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email/mobile or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email/mobile or password' });
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: { user: sanitizeUser(user), token },
    });
  } catch (error) {
    console.error('Login error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

// @desc    Get currently logged-in user (used to verify token on frontend refresh)
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  return res.status(200).json({ success: true, data: { user: sanitizeUser(req.user) } });
};