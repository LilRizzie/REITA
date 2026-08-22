const express = require('express');
const {
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
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/verify-email', verifyEmail);
router.post('/verify-email-otp', verifyEmailOtp);
router.post('/resend-email-otp', resendEmailOtp);
router.post('/forgot-password', forgotPassword);
router.post('/verify-password-reset-otp', verifyPasswordResetOtp);
router.post('/resend-password-reset-otp', resendPasswordResetOtp);
router.post('/set-password', setPassword);
router.get('/me', protect, me);

module.exports = router;