export const getAuthErrorMessage = (error) => {
  if (!error) return 'Something went wrong. Please try again.';

  const code = error.code || error;

  const messages = {
    // Backend API error codes
    EMAIL_EXISTS: 'An account already exists with this email.',
    INVALID_EMAIL: 'Please enter a valid email address.',
    INVALID_PASSWORD: 'Incorrect password.',
    USER_NOT_FOUND: 'No account was found with this email.',
    USER_DISABLED: 'This account has been disabled. Please contact support.',
    TOO_MANY_ATTEMPTS: 'Too many attempts. Please wait a few minutes.',
    NETWORK_ERROR: 'Network connection lost. Please try again.',
    WEAK_PASSWORD: 'Password should be at least 8 characters.',
    INVALID_CREDENTIALS: 'Incorrect email or password.',
    EMAIL_NOT_VERIFIED: 'Please verify your email before signing in.',
    MISSING_PASSWORD: 'Please enter your password.',
    EXPIRED_TOKEN: 'This link has expired. Please request a new one.',
    INVALID_TOKEN: 'This link is invalid. Please request a new one.',

    // OTP error codes
    INVALID_VERIFICATION_OTP: 'Incorrect verification code. Please try again.',
    INVALID_OTP: 'Incorrect code. Please try again.',
    VERIFICATION_OTP_EXPIRED: 'This verification code has expired. Please request a new one.',
    OTP_EXPIRED: 'This code has expired. Please request a new one.',
    VERIFICATION_OTP_TOO_MANY_ATTEMPTS: 'Too many verification attempts. Please request a new code.',
    NO_VERIFICATION_OTP: 'No verification code has been issued. Please request a new one.',
    INVALID_RESET_OTP: 'Incorrect reset code. Please try again.',
    RESET_OTP_EXPIRED: 'This reset code has expired. Please request a new one.',
    RESET_OTP_TOO_MANY_ATTEMPTS: 'Too many reset attempts. Please request a new code.',
    NO_RESET_OTP: 'No reset code has been issued. Please request a new one.',
    OTP_RESEND_TOO_SOON: 'Please wait before requesting a new code.',
    RESEND_COOLDOWN: 'Please wait before requesting a new code.',
    INVALID_RESET_TOKEN: 'This reset link is invalid or expired. Please request a new one.',
    PASSWORD_RESET_SUCCESS: 'Password reset successfully.',
    EMAIL_PROVIDER_NOT_CONFIGURED: 'Email delivery is not configured. Please contact support.',
    EMAIL_SEND_FAILED: 'Unable to send the email right now. Please try again.',
  };

  return messages[code] || error.message || 'Something went wrong. Please try again.';
};