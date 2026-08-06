import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import AuthLayout from '../components/AuthLayout';
import { useAuth } from '../context/AuthContext';

export default function VerificationRequired() {
  const { user, logout, resendVerificationEmail, loading } = useAuth();
  const navigate = useNavigate();
  const [resending, setResending] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login', { replace: true });
    } else if (!loading && user && user.emailVerified) {
      navigate('/dashboard', { replace: true });
    }
  }, [loading, navigate, user]);

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setTimeout(() => setResendCountdown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  const handleResendVerification = async () => {
    if (resendCountdown > 0 || resending) return;
    setResending(true);

    try {
      await resendVerificationEmail();
      toast.success('Verification email sent.');
      setResendCountdown(60);
    } catch (err) {
      toast.error('Unable to send verification email.');
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
      <div className="verification-card">
        <div className="verification-icon" aria-hidden="true">✉</div>
        <h2>Your email has not been verified.</h2>
        <p>Please check your inbox.</p>
        {user?.email ? <strong className="verification-email">{user.email}</strong> : null}
        <div className="verification-actions">
          <button
            type="button"
            className="btn btn-primary auth-submit"
            onClick={handleResendVerification}
            disabled={resending || resendCountdown > 0}
          >
            {resending ? (
              <span className="btn-spinner" aria-hidden="true" />
            ) : resendCountdown > 0 ? (
              `Resend Email (${resendCountdown})`
            ) : (
              'Resend Verification Email'
            )}
          </button>
          <button type="button" className="btn btn-secondary auth-submit" onClick={handleBackToLogin}>
            Back to Login
          </button>
        </div>
      </div>
    </AuthLayout>
  );
}