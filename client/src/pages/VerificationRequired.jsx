import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import AuthLayout from '../components/AuthLayout';
import { useAuth } from '../context/AuthContext';
import { getAuthErrorMessage } from '../utils/authErrors';

export default function VerificationRequired() {
  const { user, pendingVerificationEmail, logout, resendVerificationEmail, loading } = useAuth();
  const navigate = useNavigate();
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

  const handleResendVerification = async () => {
    if (resendCountdown > 0 || resending) return;
    setResending(true);

    try {
      await resendVerificationEmail(user?.email || pendingVerificationEmail);
      toast.success('A new verification link has been sent.');
      setResendCountdown(60);
    } catch (err) {
      const message = getAuthErrorMessage(err);
      toast.error('Unable to send verification email.');
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
      <div className="auth-form">
        {error ? <div className="auth-message auth-message--error">{error}</div> : null}

        <div className="verification-card">
          <div className="verification-icon" aria-hidden="true">✉</div>
          <h2>Your email has not been verified.</h2>
          <p>A verification link has been sent to:</p>
          {(user?.email || pendingVerificationEmail) ? (
            <strong className="verification-email">{user?.email || pendingVerificationEmail}</strong>
          ) : null}
          <p>The link expires in 24 hours.</p>
        </div>

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
      </div>
    </AuthLayout>
  );
}