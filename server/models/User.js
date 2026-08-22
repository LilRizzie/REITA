const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    // Secure password hash only — never plaintext.
    passwordHash: {
      type: String,
      default: null,
    },

    // Backward-compatible alias so old code paths using `user.password` still work
    // when reading. Only the controller writes to passwordHash.
    password: {
      type: String,
      default: null,
      select: false,
    },

    fullName: {
      type: String,
      trim: true,
      default: '',
    },

    investorType: {
      type: String,
      enum: ['Investor', 'Property Agent', 'Administrator'],
      default: 'Investor',
    },

    role: {
      type: String,
      enum: ['Investor', 'Property Agent', 'Administrator'],
      default: 'Investor',
    },

    emailVerified: {
      type: Boolean,
      default: false,
    },

    emailVerificationTokenHash: {
      type: String,
      default: null,
      select: false,
    },

    emailVerificationTokenExpires: {
      type: Date,
      default: null,
    },

    // Short-lived, single-use token for password reset.
    passwordSetupToken: {
      type: String,
      default: null,
      select: false,
    },

    passwordSetupTokenExpires: {
      type: Date,
      default: null,
    },

    // Email verification OTP (hashed, never plaintext)
    emailOtpHash: {
      type: String,
      default: null,
      select: false,
    },

    emailOtpExpires: {
      type: Date,
      default: null,
    },

    emailOtpAttempts: {
      type: Number,
      default: 0,
    },

    emailOtpResendAt: {
      type: Date,
      default: null,
    },

    // Password reset OTP (hashed, never plaintext)
    passwordResetOtpHash: {
      type: String,
      default: null,
      select: false,
    },

    passwordResetOtpExpires: {
      type: Date,
      default: null,
    },

    passwordResetOtpAttempts: {
      type: Number,
      default: 0,
    },

    passwordResetOtpResendAt: {
      type: Date,
      default: null,
    },

    lastActive: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', userSchema);