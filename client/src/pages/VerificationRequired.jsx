import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import AuthLayout from '../components/AuthLayout';
import { useAuth } from '../context/AuthContext';
import { getAuthErrorMessage } from '../utils/authErrors';

export default function VerificationRequired() {
  const { user, pendingVerificationEmail, logout, verifyEmailOtp, resendVerificationEmail, loading } = useAuth();
  const navigate = useNavigate();
  const [otp, setOtp] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && !user && !pendingVerificationEmail) {
      navigate('/login', { replace: true });
    } else if (!loading && user && user.emailVerified) {
      navigate('/dashboard', { replace: true });
    }
  }, [loading, navigate, pendingVerificationEmail, user]);

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setTimeout(() => setResendCountdown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  const handleVerifyOtp = async (event) => {
    event.preventDefault();
    if (!otp.trim()) {
      setError('Please enter the verification code.');
      return;
    }

    setVerifying(true);
    setError('');

    try {
      const email = user?.email || pendingVerificationEmail;
      const result = await verifyEmailOtp(email, otp.trim());
      toast.success('Email verified successfully.');
      const verifiedUser = result?.user || user;
      navigate(verifiedUser?.role === 'Administrator' ? '/admin-dashboard' : '/dashboard', { replace: true });
    } catch (err) {
      const message = getAuthErrorMessage(err);
      setError(message);
      toast.error(message);
    } finally {
      setVerifying(false);
    }
  };

  const handleResendVerification = async () => {
    if (resendCountdown > 0 || resending) return;
    setResending(true);

    try {
      await resendVerificationEmail(user?.email || pendingVerificationEmail);
      toast.success('A new verification code has been sent.');
      setResendCountdown(60);
    } catch (err) {
      const message = getAuthErrorMessage(err);
      toast.error('Unable to send verification code.');
      setError(message);
    } finally {
      setResending(false);
    }
  };

  const handleBackToLogin = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <AuthLayout title="Verification required" subtitle="Please verify your email to continue.">
      <form className="auth-form" onSubmit={handleVerifyOtp}>
        {error ? <div className="auth-message auth-message--error">{error}</div> : null}

        <div className="verification-card">
          <div className="verification-icon" aria-hidden="true">✉</div>
          <h2>Your email has not been verified.</h2>
          <p>A verification code has been sent to:</p>
          {(user?.email || pendingVerificationEmail) ? (
            <strong className="verification-email">{user?.email || pendingVerificationEmail}</strong>
          ) : null}
          <p>The code expires in 10 minutes.</p>
        </div>

        <label>
          <span>Verification Code</span>
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
          {verifying ? 'Verifying…' : 'Verify Email'}
        </button>

        <button
          type="button"
          className="btn btn-secondary auth-submit"
          onClick={handleResendVerification}
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

        <button type="button" className="btn btn-secondary auth-submit" onClick={handleBackToLogin}>
          Back to Login
        </button>
      </form>
    </AuthLayout>
  );
}