const nodemailer = require('nodemailer');
const { Resend } = require('resend');

// ------------------------------------------------------------
// EMAIL PROVIDERS
// ------------------------------------------------------------
// Resend is the primary provider (works seamlessly with Vercel).
// SMTP is the fallback if RESEND_API_KEY is not set.

const resendApiKey = process.env.RESEND_API_KEY;
const hasResend = Boolean(resendApiKey && resendApiKey.trim());
const resend = hasResend ? new Resend(resendApiKey.trim()) : null;

let transporter = null;
const hasSmtp = Boolean(
  process.env.SMTP_HOST &&
  process.env.SMTP_PORT &&
  process.env.SMTP_USER &&
  process.env.SMTP_PASS
);

if (!resend && hasSmtp) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

const FROM_ADDRESS = process.env.EMAIL_FROM?.trim()
  || process.env.SMTP_FROM?.trim()
  || '';

const createEmailError = (code, message) => {
  const error = new Error(message);
  error.code = code;
  return error;
};

const getProviderStatus = () => ({
  resendConfigured: hasResend,
  smtpConfigured: hasSmtp,
  senderConfigured: Boolean(FROM_ADDRESS),
  provider: resend ? 'resend' : transporter ? 'smtp' : null,
});

/**
 * Send an email. Returns true only if the provider confirms delivery.
 * Throws an error if no provider is configured or the send fails —
 * so the caller can surface a real failure to the user instead of
 * pretending an email was sent.
 */
const sendEmail = async ({ to, subject, text, html }) => {
  if (!FROM_ADDRESS || (!resend && !transporter)) {
    console.error(
      `[email-service] Provider unavailable: senderConfigured=${Boolean(FROM_ADDRESS)}, resendConfigured=${hasResend}, smtpConfigured=${hasSmtp}`
    );
    throw createEmailError(
      'EMAIL_PROVIDER_NOT_CONFIGURED',
      'No usable email provider is configured.'
    );
  }

  // 1. Prefer Resend.
  if (resend) {
    try {
      const { error } = await resend.emails.send({
        from: FROM_ADDRESS,
        to,
        subject,
        text,
        html,
      });

      if (error) {
        console.error(
          `[email-service] Resend rejected email: status=${error.statusCode || error.status || 'unknown'}, type=${error.name || 'unknown'}`
        );
        const sendError = createEmailError(
          'EMAIL_SEND_FAILED',
          'Email provider rejected the request. Check the configured sender and recipient restrictions.'
        );
        sendError.providerStatus = error.statusCode || error.status || null;
        sendError.providerType = error.name || null;
        throw sendError;
      }

      console.log(`[email-service] Email sent via Resend to ${to}: ${subject}`);
      return true;
    } catch (err) {
      if (err.code !== 'EMAIL_SEND_FAILED') {
        console.error('[email-service] Resend request failed:', err.message);
      }
      throw err.code === 'EMAIL_SEND_FAILED'
        ? err
        : createEmailError(
          'EMAIL_SEND_FAILED',
          'Email provider rejected the request. Check the configured sender and recipient restrictions.'
        );
    }
  }

  // 2. Fall back to SMTP.
  if (transporter) {
    try {
      await transporter.sendMail({
        from: FROM_ADDRESS,
        to,
        subject,
        text,
        html,
      });
      console.log(`[email-service] Email sent via SMTP to ${to}: ${subject}`);
      return true;
    } catch (error) {
      console.error('[email-service] SMTP send failed:', error.message);
      throw createEmailError(
        'EMAIL_SEND_FAILED',
        'Email provider rejected the request. Check the configured sender and recipient restrictions.'
      );
    }
  }

  throw createEmailError('EMAIL_PROVIDER_NOT_CONFIGURED', 'No usable email provider is configured.');
};

/**
 * Send a REITA verification OTP email.
 */
const sendVerificationOtpEmail = async (to, otp, expiresInMinutes) => {
  const subject = 'Your REITA verification code';
  const text = `Your REITA verification code is: ${otp}\n\nThis code expires in ${expiresInMinutes} minutes.\n\nIf you did not request this code, you can safely ignore this email.`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #0a0a0a; color: #f6efe1; border-radius: 12px;">
      <h2 style="color: #d4af37; margin: 0 0 16px;">REITA</h2>
      <p>Your REITA verification code is:</p>
      <p style="font-size: 28px; font-weight: 700; letter-spacing: 4px; color: #f6e6b1; margin: 12px 0;">${otp}</p>
      <p>This code expires in ${expiresInMinutes} minutes.</p>
      <p style="color: #8f8568; font-size: 13px; margin-top: 24px;">If you did not request this code, you can safely ignore this email.</p>
    </div>
  `;
  return sendEmail({ to, subject, text, html });
};

const sendEmailVerificationLinkEmail = async (to, verificationUrl) => {
  const subject = 'Confirm your REITA email address';
  const text = `Confirm your REITA email address by opening this link:\n\n${verificationUrl}\n\nThis link expires in 24 hours.`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #0a0a0a; color: #f6efe1; border-radius: 12px;">
      <h2 style="color: #d4af37; margin: 0 0 16px;">REITA</h2>
      <p>Confirm your email address to finish creating your REITA account.</p>
      <p><a href="${verificationUrl}" style="display: inline-block; padding: 12px 18px; color: #0a0a0a; background: #d4af37; text-decoration: none; border-radius: 6px;">Confirm email</a></p>
      <p style="color: #8f8568; font-size: 13px; margin-top: 24px;">This link expires in 24 hours. If you did not create this account, you can safely ignore this email.</p>
    </div>
  `;
  return sendEmail({ to, subject, text, html });
};

/**
 * Send a REITA password reset OTP email.
 */
const sendPasswordResetOtpEmail = async (to, otp, expiresInMinutes) => {
  const subject = 'Your REITA password reset code';
  const text = `Your REITA password reset code is: ${otp}\n\nThis code expires in ${expiresInMinutes} minutes.\n\nIf you did not request this code, you can safely ignore this email.`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #0a0a0a; color: #f6efe1; border-radius: 12px;">
      <h2 style="color: #d4af37; margin: 0 0 16px;">REITA</h2>
      <p>Your REITA password reset code is:</p>
      <p style="font-size: 28px; font-weight: 700; letter-spacing: 4px; color: #f6e6b1; margin: 12px 0;">${otp}</p>
      <p>This code expires in ${expiresInMinutes} minutes.</p>
      <p style="color: #8f8568; font-size: 13px; margin-top: 24px;">If you did not request this code, you can safely ignore this email.</p>
    </div>
  `;
  return sendEmail({ to, subject, text, html });
};

module.exports = {
  sendVerificationOtpEmail,
  sendEmailVerificationLinkEmail,
  sendPasswordResetOtpEmail,
  getProviderStatus,
};