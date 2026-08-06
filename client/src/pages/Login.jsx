import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import AuthLayout from '../components/AuthLayout';
import GoogleButton from '../components/GoogleButton';
import { useAuth } from '../context/AuthContext';
import { getFirebaseErrorMessage } from '../utils/firebaseErrors';

const ADMIN_EMAIL = 'britneyjacksonel@gmail.com';

export default function Login() {
  const { user, profile, login, loginWithGoogle, resendVerificationEmail, logout, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  useEffect(() => {
    if (!loading && user && user.emailVerified) {
      const isAdmin = user.email?.toLowerCase() === ADMIN_EMAIL || profile?.investorType === 'Administrator';
      navigate(isAdmin ? '/admin-dashboard' : '/dashboard', { replace: true });
    }
  }, [loading, navigate, user, profile]);

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setTimeout(() => setResendCountdown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await login(form.email, form.password);
      toast.success('Welcome back. Your workspace is ready.');
      const isAdmin = form.email?.toLowerCase() === ADMIN_EMAIL;
      const from = location.state?.from?.pathname;
      const target = isAdmin ? '/admin-dashboard' : (from || '/dashboard');
      navigate(target, { replace: true });
    } catch (err) {
      const message = getFirebaseErrorMessage(err);
      if (message.includes('not been verified')) {
        setUnverifiedEmail(form.email);
      } else {
        setError(message);
        toast.error(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    setError('');

    try {
      const credential = await loginWithGoogle();
      toast.success('Google sign-in complete.');
      const isAdmin = credential.user.email?.toLowerCase() === ADMIN_EMAIL;
      navigate(isAdmin ? '/admin-dashboard' : '/dashboard', { replace: true });
    } catch (err) {
      const message = getFirebaseErrorMessage(err);
      setError(message);
      toast.error(message);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (resendCountdown > 0 || resending) return;
    setResending(true);

    try {
      await resendVerificationEmail();
      toast.success('Verification email sent.');
      setResendCountdown(60);
    } catch (err) {
      const message = getFirebaseErrorMessage(err);
      toast.error('Unable to send verification email.');
      setError(message);
    } finally {
      setResending(false);
    }
  };

  const handleBackToLogin = async () => {
    await logout();
    setUnverifiedEmail('');
    navigate('/login', { replace: true });
  };

  if (unverifiedEmail) {
    return (
      <AuthLayout title="Verification required" subtitle="Please verify your email to continue.">
        <div className="verification-card">
          <div className="verification-icon" aria-hidden="true">✉</div>
          <h2>Your email has not been verified.</h2>
          <p>Please check your inbox.</p>
          <strong className="verification-email">{unverifiedEmail}</strong>
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

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to continue your investment workflow.">
      <form className="auth-form" onSubmit={handleSubmit}>
        {error ? <div className="auth-message auth-message--error">{error}</div> : null}

        <label>
          <span>Email</span>
          <input type="email" name="email" value={form.email} onChange={handleChange} required />
        </label>

        <label>
          <span>Password</span>
          <div className="password-input-wrap">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={form.password}
              onChange={handleChange}
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </label>

        <button type="submit" className="btn btn-primary auth-submit" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Log in'}
        </button>
      </form>

      <div className="auth-divider">
        <span>or</span>
      </div>

      <GoogleButton onClick={handleGoogle} loading={googleLoading} />

      <div className="auth-footer-links">
        <Link to="/forgot-password">Forgot password?</Link>
        <Link to="/signup">Create account</Link>
      </div>
    </AuthLayout>
  );
}