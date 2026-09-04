const express = require('express');
const {
  signup,
  login,
  verifyEmail,
  resendEmailVerification,
  forgotPassword,
  verifyPasswordResetOtp,
  resendPasswordResetOtp,
  setPassword,
  me,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/verify-email', verifyEmail);
router.post('/resend-verification-email', resendEmailVerification);
router.post('/forgot-password', forgotPassword);
router.post('/verify-password-reset-otp', verifyPasswordResetOtp);
router.post('/resend-password-reset-otp', resendPasswordResetOtp);
router.post('/set-password', setPassword);
router.get('/me', protect, me);

module.exports = router;