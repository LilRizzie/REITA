const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const {
  sendVerificationOtpEmail,
  sendEmailVerificationLinkEmail,
  sendPasswordResetOtpEmail,
} = require('../services/emailService');

const BCRYPT_COST = 12;
const PASSWORD_SETUP_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const OTP_RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds
const OTP_MAX_ATTEMPTS = 5;
const OTP_LENGTH = 6;
const MIN_PASSWORD_LENGTH = 8;
const EMAIL_VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const FRONTEND_URL = (
  process.env.FRONTEND_URL
  || process.env.VITE_FRONTEND_URL
  || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5173')
).replace(/\/+$/, '');

const createToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

const normalizeEmail = (email) => email.trim().toLowerCase();

const normalizeUser = (user) => ({
  id: user._id,
  email: user.email,
  fullName: user.fullName,
  investorType: user.investorType,
  role: user.role,
  emailVerified: Boolean(user.emailVerified),
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

// ------------------------------------------------------------
// OTP HELPERS
// ------------------------------------------------------------

/**
 * Generate a secure random numeric OTP.
 */
const generateOtp = () => {
  // Use crypto.randomInt for cryptographically secure random numbers.
  const min = 10 ** (OTP_LENGTH - 1);
  const max = 10 ** OTP_LENGTH;
  return String(crypto.randomInt(min, max));
};

/**
 * Hash an OTP before storing. Never store plaintext OTPs.
 */
const hashOtp = (otp) => bcrypt.hash(otp, BCRYPT_COST);

/**
 * Compare a submitted OTP against the stored hash.
 */
const verifyOtpHash = (otp, hash) => bcrypt.compare(otp, hash);

/**
 * Check whether a resend cooldown is active.
 */
const isResendCooldownActive = (resendAt) => {
  if (!resendAt) return false;
  return Date.now() < new Date(resendAt).getTime();
};

/**
 * Generate, store (hashed), and send a verification OTP for a user.
 * The OTP is never returned. The email service verifies delivery and throws on failure.
 */
const issueEmailVerificationOtp = async (user) => {
  const otp = generateOtp();
  const otpHash = await hashOtp(otp);
  const previousOtpState = {
    emailOtpHash: user.emailOtpHash,
    emailOtpExpires: user.emailOtpExpires,
    emailOtpAttempts: user.emailOtpAttempts,
    emailOtpResendAt: user.emailOtpResendAt,
  };

  user.emailOtpHash = otpHash;
  user.emailOtpExpires = new Date(Date.now() + OTP_TTL_MS);
  user.emailOtpAttempts = 0;
  user.emailOtpResendAt = new Date(Date.now() + OTP_RESEND_COOLDOWN_MS);
  await user.save();

  try {
    await sendVerificationOtpEmail(user.email, otp, OTP_TTL_MS / 60000);
    return null; // Email sent successfully
  } catch (error) {
    Object.assign(user, previousOtpState);
    await user.save();

    const emailError = new Error(
      error.code === 'EMAIL_PROVIDER_NOT_CONFIGURED'
        ? 'Email provider is not configured.'
        : error.message || 'Email provider rejected the verification email.'
    );
    emailError.code = error.code || 'EMAIL_SEND_FAILED';
    throw emailError;
  }
};

/**
 * Generate, store (hashed), and send a password-reset OTP for a user.
 * Returns the plaintext OTP ONLY in development mode when no email
 * provider is configured. In production, throws on email failure.
 */
const issuePasswordResetOtp = async (user) => {
  const otp = generateOtp();
  const otpHash = await hashOtp(otp);

  user.passwordResetOtpHash = otpHash;
  user.passwordResetOtpExpires = new Date(Date.now() + OTP_TTL_MS);
  user.passwordResetOtpAttempts = 0;
  user.passwordResetOtpResendAt = new Date(Date.now() + OTP_RESEND_COOLDOWN_MS);
  await user.save();

  try {
    await sendPasswordResetOtpEmail(user.email, otp, OTP_TTL_MS / 60000);
    return null;
  } catch (error) {
    const emailError = new Error(
      error.code === 'EMAIL_PROVIDER_NOT_CONFIGURED'
        ? 'Email provider is not configured.'
        : 'Failed to send reset code. Please try again.'
    );
    emailError.code = error.code || 'EMAIL_SEND_FAILED';
    throw emailError;
  }
};

// ------------------------------------------------------------
// EMAIL/PASSWORD SIGNUP
// ------------------------------------------------------------
const signup = async (req, res) => {
  try {
    const { email, password, fullName, investorType, role } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({
        success: false,
        message: 'Full name, email and password are required.',
      });
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
        code: 'WEAK_PASSWORD',
      });
    }

    if (role === 'Administrator' || investorType === 'Administrator') {
      return res.status(403).json({
        success: false,
        message: 'Administrator accounts cannot be created through public signup.',
        code: 'ADMIN_SIGNUP_FORBIDDEN',
      });
    }

    const normalizedEmail = normalizeEmail(email);

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      if (existingUser.role === 'Administrator' || existingUser.investorType === 'Administrator') {
        return res.status(403).json({
          success: false,
          message: 'Administrator accounts cannot be created or configured through public signup.',
          code: 'ADMIN_SIGNUP_FORBIDDEN',
        });
      }

      if (existingUser.passwordHash || existingUser.password) {
        return res.status(409).json({
          success: false,
          message: 'An account with this email already exists.',
        });
      }

      const hashedPassword = await bcrypt.hash(password, BCRYPT_COST);
      existingUser.passwordHash = hashedPassword;
      existingUser.password = hashedPassword;
      if (!existingUser.fullName && fullName) existingUser.fullName = fullName.trim();
      if (!existingUser.investorType || existingUser.investorType === 'Investor') {
        const allowedTypes = ['Investor', 'Property Agent'];
        const selectedType = allowedTypes.includes(investorType) ? investorType : 'Investor';
        existingUser.investorType = selectedType;
        existingUser.role = selectedType;
      }
      existingUser.lastActive = new Date();
      existingUser.emailVerified = false;
      await existingUser.save();
      await issueEmailVerificationLink(existingUser);

      return res.status(200).json({
        success: true,
        user: normalizeUser(existingUser),
        requiresEmailVerification: true,
      });
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_COST);

    const allowedTypes = ['Investor', 'Property Agent'];
    const selectedType = allowedTypes.includes(investorType) ? investorType : 'Investor';

    const user = await User.create({
      email: normalizedEmail,
      passwordHash: hashedPassword,
      password: hashedPassword,
      fullName: fullName.trim(),
      investorType: selectedType,
      role: selectedType,
      emailVerified: false,
      lastActive: new Date(),
    });
    await issueEmailVerificationLink(user);

    return res.status(201).json({
      success: true,
      user: normalizeUser(user),
      requiresEmailVerification: true,
    });
  } catch (error) {
    console.error('Signup error:', error.message);
    // If the error is about email delivery failure, surface that message.
    if (
      error.code === 'EMAIL_PROVIDER_NOT_CONFIGURED'
      || error.code === 'EMAIL_SEND_FAILED'
      || error.code === 'EMAIL_VERIFICATION_URL_NOT_CONFIGURED'
    ) {
      return res.status(500).json({
        success: false,
        message: error.code === 'EMAIL_PROVIDER_NOT_CONFIGURED'
          ? 'Email provider is not configured.'
          : error.code === 'EMAIL_VERIFICATION_URL_NOT_CONFIGURED'
            ? 'Frontend URL is not configured for email verification links.'
          : error.message || 'Email provider rejected the verification email.',
        code: error.code,
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Server error during signup.',
    });
  }
};

// ------------------------------------------------------------
// EMAIL/PASSWORD LOGIN
// ------------------------------------------------------------
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    const normalizedEmail = normalizeEmail(email);

    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.passwordHash || user.password
    );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
        code: 'INVALID_CREDENTIALS',
      });
    }

    user.lastActive = new Date();
    await user.save();

    const token = createToken(user);

    return res.status(200).json({
      success: true,
      token,
      user: normalizeUser(user),
    });
  } catch (error) {
    console.error('Login error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error during login.',
    });
  }
};

// ------------------------------------------------------------
// EMAIL VERIFICATION OTP
// ------------------------------------------------------------

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Email verification token is required.',
        code: 'EMAIL_VERIFICATION_TOKEN_REQUIRED',
      });
    }

    const tokenHash = hashEmailVerificationToken(token);
    const user = await User.findOne({ emailVerificationTokenHash: tokenHash });

    if (!user || !user.emailVerificationTokenExpires) {
      return res.status(400).json({
        success: false,
        message: 'This verification link is invalid or has expired.',
        code: 'EMAIL_VERIFICATION_TOKEN_INVALID',
      });
    }

    if (new Date(user.emailVerificationTokenExpires).getTime() < Date.now()) {
      return res.status(400).json({
        success: false,
        message: 'This verification link is invalid or has expired.',
        code: 'EMAIL_VERIFICATION_TOKEN_EXPIRED',
      });
    }

    user.emailVerified = true;
    user.emailVerificationTokenHash = null;
    user.emailVerificationTokenExpires = null;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully.',
    });
  } catch (error) {
    console.error('Verify email link error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error during email verification.',
    });
  }
};

const verifyEmailOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and verification code are required.',
      });
    }

    const normalizedEmail = normalizeEmail(email);
    const user = await User.findOne({ email: normalizedEmail }).select('+emailOtpHash');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email.',
      });
    }

    if (user.emailVerified) {
      return res.status(200).json({
        success: true,
        message: 'Email is already verified.',
        user: normalizeUser(user),
      });
    }

    if (!user.emailOtpHash || !user.emailOtpExpires) {
      return res.status(400).json({
        success: false,
        message: 'No verification code has been issued. Please request a new one.',
        code: 'NO_VERIFICATION_OTP',
      });
    }

    if (new Date(user.emailOtpExpires).getTime() < Date.now()) {
      return res.status(400).json({
        success: false,
        message: 'This verification code has expired. Please request a new one.',
        code: 'VERIFICATION_OTP_EXPIRED',
      });
    }

    if (user.emailOtpAttempts >= OTP_MAX_ATTEMPTS) {
      return res.status(429).json({
        success: false,
        message: 'Too many incorrect attempts. Please request a new code.',
        code: 'VERIFICATION_OTP_TOO_MANY_ATTEMPTS',
      });
    }

    const isValid = await verifyOtpHash(otp, user.emailOtpHash);

    if (!isValid) {
      user.emailOtpAttempts = (user.emailOtpAttempts || 0) + 1;
      await user.save();
      return res.status(400).json({
        success: false,
        message: 'Incorrect verification code. Please try again.',
        code: 'INVALID_VERIFICATION_OTP',
      });
    }

    user.emailVerified = true;
    user.emailOtpHash = null;
    user.emailOtpExpires = null;
    user.emailOtpAttempts = 0;
    user.emailOtpResendAt = null;
    await user.save();

    const token = createToken(user);

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully.',
      token,
      user: normalizeUser(user),
    });
  } catch (error) {
    console.error('Verify email OTP error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error during email verification.',
    });
  }
};

const resendEmailOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required.',
      });
    }

    const normalizedEmail = normalizeEmail(email);
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email.',
      });
    }

    if (user.emailVerified) {
      return res.status(200).json({
        success: true,
        message: 'Email is already verified.',
      });
    }

    if (isResendCooldownActive(user.emailOtpResendAt)) {
      const waitSeconds = Math.ceil(
        (new Date(user.emailOtpResendAt).getTime() - Date.now()) / 1000
      );
      return res.status(429).json({
        success: false,
        message: `Please wait ${waitSeconds} seconds before requesting a new code.`,
        code: 'OTP_RESEND_TOO_SOON',
        waitSeconds,
      });
    }

    await issueEmailVerificationOtp(user);

    return res.status(200).json({
      success: true,
      message: 'A new verification code has been sent to your email.',
    });
  } catch (error) {
    console.error('Resend email OTP error:', error.message);
    if (error.code === 'EMAIL_PROVIDER_NOT_CONFIGURED' || error.code === 'EMAIL_SEND_FAILED') {
      return res.status(500).json({
        success: false,
        message: error.code === 'EMAIL_PROVIDER_NOT_CONFIGURED'
          ? 'Email provider is not configured.'
          : 'Unable to send the verification code. Please try again.',
        code: error.code,
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Server error while resending verification code.',
    });
  }
};

// ------------------------------------------------------------
// PASSWORD RESET OTP
// ------------------------------------------------------------

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required.',
      });
    }

    const normalizedEmail = normalizeEmail(email);
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If that email exists, a password reset code has been sent.',
      });
    }

    if (isResendCooldownActive(user.passwordResetOtpResendAt)) {
      const waitSeconds = Math.ceil(
        (new Date(user.passwordResetOtpResendAt).getTime() - Date.now()) / 1000
      );
      return res.status(429).json({
        success: false,
        message: `Please wait ${waitSeconds} seconds before requesting a new code.`,
        code: 'OTP_RESEND_TOO_SOON',
        waitSeconds,
      });
    }

    await issuePasswordResetOtp(user);

    const hasPassword = Boolean(user.passwordHash || user.password);
    const action = hasPassword ? 'reset' : 'setup';

    return res.status(200).json({
      success: true,
      message: hasPassword
        ? 'A password reset code has been sent to your email.'
        : 'A password setup code has been sent to your email.',
      action,
    });
  } catch (error) {
    console.error('Forgot password error:', error.message);
    if (error.code === 'EMAIL_PROVIDER_NOT_CONFIGURED' || error.code === 'EMAIL_SEND_FAILED') {
      return res.status(500).json({
        success: false,
        message: error.code === 'EMAIL_PROVIDER_NOT_CONFIGURED'
          ? 'Email provider is not configured.'
          : 'Unable to send the reset code. Please try again.',
        code: error.code,
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Server error during password reset request.',
    });
  }
};

const verifyPasswordResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and reset code are required.',
      });
    }

    const normalizedEmail = normalizeEmail(email);
    const user = await User.findOne({ email: normalizedEmail }).select('+passwordResetOtpHash');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email.',
      });
    }

    if (!user.passwordResetOtpHash || !user.passwordResetOtpExpires) {
      return res.status(400).json({
        success: false,
        message: 'No reset code has been issued. Please request a new one.',
        code: 'NO_RESET_OTP',
      });
    }

    if (new Date(user.passwordResetOtpExpires).getTime() < Date.now()) {
      return res.status(400).json({
        success: false,
        message: 'This reset code has expired. Please request a new one.',
        code: 'RESET_OTP_EXPIRED',
      });
    }

    if (user.passwordResetOtpAttempts >= OTP_MAX_ATTEMPTS) {
      return res.status(429).json({
        success: false,
        message: 'Too many incorrect attempts. Please request a new code.',
        code: 'RESET_OTP_TOO_MANY_ATTEMPTS',
      });
    }

    const isValid = await verifyOtpHash(otp, user.passwordResetOtpHash);

    if (!isValid) {
      user.passwordResetOtpAttempts = (user.passwordResetOtpAttempts || 0) + 1;
      await user.save();
      return res.status(400).json({
        success: false,
        message: 'Incorrect reset code. Please try again.',
        code: 'INVALID_RESET_OTP',
      });
    }

    user.passwordResetOtpHash = null;
    user.passwordResetOtpExpires = null;
    user.passwordResetOtpAttempts = 0;
    user.passwordResetOtpResendAt = null;
    user.passwordSetupToken = crypto.randomBytes(32).toString('hex');
    user.passwordSetupTokenExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Reset code verified. You can now set a new password.',
      verificationToken: user.passwordSetupToken,
    });
  } catch (error) {
    console.error('Verify password reset OTP error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error during reset code verification.',
    });
  }
};

const resendPasswordResetOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required.',
      });
    }

    const normalizedEmail = normalizeEmail(email);
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If that email exists, a new reset code has been sent.',
      });
    }

    if (isResendCooldownActive(user.passwordResetOtpResendAt)) {
      const waitSeconds = Math.ceil(
        (new Date(user.passwordResetOtpResendAt).getTime() - Date.now()) / 1000
      );
      return res.status(429).json({
        success: false,
        message: `Please wait ${waitSeconds} seconds before requesting a new code.`,
        code: 'OTP_RESEND_TOO_SOON',
        waitSeconds,
      });
    }

    await issuePasswordResetOtp(user);

    return res.status(200).json({
      success: true,
      message: 'A new reset code has been sent to your email.',
    });
  } catch (error) {
    console.error('Resend password reset OTP error:', error.message);
    if (error.code === 'EMAIL_PROVIDER_NOT_CONFIGURED' || error.code === 'EMAIL_SEND_FAILED') {
      return res.status(500).json({
        success: false,
        message: error.code === 'EMAIL_PROVIDER_NOT_CONFIGURED'
          ? 'Email provider is not configured.'
          : 'Unable to send the reset code. Please try again.',
        code: error.code,
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Server error while resending reset code.',
    });
  }
};

// ------------------------------------------------------------
// SET / RESET PASSWORD using the short-lived verification token
// ------------------------------------------------------------
const setPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required.',
      });
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
        code: 'WEAK_PASSWORD',
      });
    }

    const user = await User.findOne({
      passwordSetupToken: token,
      passwordSetupTokenExpires: { $gt: new Date() },
    }).select('+password');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'This verification link is invalid or has expired. Please request a new one.',
        code: 'INVALID_RESET_TOKEN',
      });
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_COST);
    user.passwordHash = hashedPassword;
    user.password = hashedPassword;

    user.passwordSetupToken = null;
    user.passwordSetupTokenExpires = null;
    user.emailVerified = true;
    user.lastActive = new Date();

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password has been reset successfully.',
      code: 'PASSWORD_RESET_SUCCESS',
    });
  } catch (error) {
    console.error('Set password error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error during password setup.',
    });
  }
};

// ------------------------------------------------------------
// GET AUTHENTICATED USER (session restoration)
// ------------------------------------------------------------
const me = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }
    return res.status(200).json({
      success: true,
      user: normalizeUser(user),
    });
  } catch (error) {
    console.error('Me error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error.',
    });
  }
};

module.exports = {
  signup,
  login,
  verifyEmail,
  verifyEmailOtp,
  resendEmailOtp,
  forgotPassword,
  verifyPasswordResetOtp,
  resendPasswordResetOtp,
  setPassword,
  me,
};

const hashEmailVerificationToken = (token) => crypto
  .createHash('sha256')
  .update(token)
  .digest('hex');

const issueEmailVerificationLink = async (user) => {
  if (!FRONTEND_URL) {
    const error = new Error('Frontend URL is not configured for email verification links.');
    error.code = 'EMAIL_VERIFICATION_URL_NOT_CONFIGURED';
    throw error;
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  user.emailVerificationTokenHash = hashEmailVerificationToken(rawToken);
  user.emailVerificationTokenExpires = new Date(Date.now() + EMAIL_VERIFICATION_TOKEN_TTL_MS);
  await user.save();

  const verificationUrl = `${FRONTEND_URL}/verify-email?token=${encodeURIComponent(rawToken)}`;

  try {
    await sendEmailVerificationLinkEmail(user.email, verificationUrl);
  } catch (error) {
    user.emailVerificationTokenHash = null;
    user.emailVerificationTokenExpires = null;
    await user.save();

    const emailError = new Error(
      error.code === 'EMAIL_PROVIDER_NOT_CONFIGURED'
        ? 'Email provider is not configured.'
        : error.message || 'Email provider rejected the verification email.'
    );
    emailError.code = error.code || 'EMAIL_SEND_FAILED';
    throw emailError;
  }
};