import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import AuthLayout from '../components/AuthLayout';
import { useAuth } from '../context/AuthContext';
import { getAuthErrorMessage } from '../utils/authErrors';

export default function ForgotPassword() {
  const { resetPassword, verifyPasswordResetOtp, resendPasswordResetOtp } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [step, setStep] = useState('email'); // 'email' | 'otp'
  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      const data = await resetPassword(email.trim());
      setSuccessMessage(data.message || 'Reset code sent successfully.');
      setStep('otp');
      setResendCountdown(60);
      toast.success(data.message || 'Reset code sent successfully.');
    } catch (err) {
      const message = getAuthErrorMessage(err);
      setError(message);
      toast.error('Unable to send reset code.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async (event) => {
    event.preventDefault();
    if (!otp.trim()) {
      setError('Please enter the reset code.');
      return;
    }

    setVerifying(true);
    setError('');

    try {
      const data = await verifyPasswordResetOtp(email.trim(), otp.trim());
      setVerificationToken(data.verificationToken || '');
      toast.success('Reset code verified. You can now set a new password.');
      navigate(`/set-password?token=${encodeURIComponent(data.verificationToken)}`);
    } catch (err) {
      const message = getAuthErrorMessage(err);
      setError(message);
      toast.error(message);
    } finally {
      setVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCountdown > 0 || resending) return;
    setResending(true);

    try {
      const data = await resendPasswordResetOtp(email.trim());
      toast.success('A new reset code has been sent.');
      setResendCountdown(60);
    } catch (err) {
      const message = getAuthErrorMessage(err);
      toast.error('Unable to resend reset code.');
      setError(message);
    } finally {
      setResending(false);
    }
  };

  const handleBackToEmail = () => {
    setStep('email');
    setOtp('');
    setError('');
  };

  return (
    <AuthLayout title="Reset password" subtitle="We will send you a secure password reset code.">
      {step === 'email' ? (
        <form className="auth-form" onSubmit={handleSubmit}>
          {error ? <div className="auth-message auth-message--error">{error}</div> : null}
          {successMessage ? <div className="auth-message">{successMessage}</div> : null}

          <label>
            <span>Email</span>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>

          <button type="submit" className="btn btn-primary auth-submit" disabled={submitting}>
            {submitting ? 'Sending…' : 'Send reset code'}
          </button>
        </form>
      ) : (
        <form className="auth-form" onSubmit={handleVerifyOtp}>
          {error ? <div className="auth-message auth-message--error">{error}</div> : null}

          <div className="verification-card">
            <div className="verification-icon" aria-hidden="true">✉</div>
            <h2>Enter your reset code</h2>
            <p>A reset code has been sent to:</p>
            <strong className="verification-email">{email}</strong>
            <p>The code expires in 10 minutes.</p>

          </div>

          <label>
            <span>Reset Code</span>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={otp}
              onChange={(event) => setOtp(event.target.value.replace(/[^0-9]/g, ''))}
              placeholder="Enter 6-digit code"
              required
            />
          </label>

          <button type="submit" className="btn btn-primary auth-submit" disabled={verifying}>
            {verifying ? 'Verifying…' : 'Verify Code'}
          </button>

          <button
            type="button"
            className="btn btn-secondary auth-submit"
            onClick={handleResendOtp}
            disabled={resending || resendCountdown > 0}
          >
            {resending ? (
              <span className="btn-spinner" aria-hidden="true" />
            ) : resendCountdown > 0 ? (
              `Resend Code (${resendCountdown})`
            ) : (
              'Resend Code'
            )}
          </button>

          <button type="button" className="btn btn-secondary auth-submit" onClick={handleBackToEmail}>
            Back to Email
          </button>
        </form>
      )}

      <div className="auth-footer-links">
        <Link to="/login">Back to login</Link>
      </div>
    </AuthLayout>
  );
}