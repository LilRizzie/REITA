import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import AuthLayout from '../components/AuthLayout';
import GoogleButton from '../components/GoogleButton';
import { useAuth } from '../context/AuthContext';
import { getFirebaseErrorMessage } from '../utils/firebaseErrors';

const investorTypes = ['Investor', 'Property Agent'];
const ADMIN_EMAIL = 'britneyjacksonel@gmail.com';

export default function Signup() {
  const { user, profile, signup, loginWithGoogle, resendVerificationEmail, logout, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    investorType: investorTypes[0],
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
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

  const validate = () => {
    const nextErrors = {};

    if (!form.fullName.trim()) nextErrors.fullName = 'Full name is required.';
    if (!form.email.trim()) nextErrors.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) nextErrors.email = 'Please enter a valid email address.';
    if (!form.password) nextErrors.password = 'Password is required.';
    else if (form.password.length < 8) nextErrors.password = 'Password must be at least 8 characters.';
    if (!form.confirmPassword) nextErrors.confirmPassword = 'Please confirm your password.';
    else if (form.password !== form.confirmPassword) nextErrors.confirmPassword = 'Passwords do not match.';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    setSubmitting(true);

    try {
      const result = await signup(form.fullName.trim(), form.email.trim(), form.password, form.investorType);
      setVerificationEmail(result.email);
      toast.success('Account created. Please check your inbox to verify your email.');
    } catch (err) {
      const message = getFirebaseErrorMessage(err);
      setErrors((current) => ({ ...current, form: message }));
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    setErrors({});

    try {
      const credential = await loginWithGoogle();
      toast.success('Google sign-in complete.');
      const isAdmin = credential.user.email?.toLowerCase() === ADMIN_EMAIL;
      navigate(isAdmin ? '/admin-dashboard' : '/dashboard', { replace: true });
    } catch (err) {
      const message = getFirebaseErrorMessage(err);
      setErrors((current) => ({ ...current, form: message }));
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
      setErrors((current) => ({ ...current, form: message }));
    } finally {
      setResending(false);
    }
  };

  const handleGoToLogin = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  if (verificationEmail) {
    return (
      <AuthLayout title="Verify your email" subtitle="One more step to access your workspace.">
        <div className="verification-card">
          <div className="verification-icon" aria-hidden="true">✉</div>
          <h2>Account created successfully.</h2>
          <p>
            A verification email has been sent to:
          </p>
          <strong className="verification-email">{verificationEmail}</strong>
          <p>Please verify your email before logging in.</p>
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
            <button type="button" className="btn btn-secondary auth-submit" onClick={handleGoToLogin}>
              Go to Login
            </button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Create account" subtitle="Join REITA with a refined, secure sign-up experience.">
      <form className="auth-form" onSubmit={handleSubmit}>
        {errors.form ? <div className="auth-message auth-message--error">{errors.form}</div> : null}

        <label>
          <span>Full Name</span>
          <input type="text" name="fullName" value={form.fullName} onChange={handleChange} />
          {errors.fullName ? <small>{errors.fullName}</small> : null}
        </label>

        <label>
          <span>Email</span>
          <input type="email" name="email" value={form.email} onChange={handleChange} />
          {errors.email ? <small>{errors.email}</small> : null}
        </label>

        <label>
          <span>Password</span>
          <div className="password-input-wrap">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={form.password}
              onChange={handleChange}
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
          {errors.password ? <small>{errors.password}</small> : null}
        </label>

        <label>
          <span>Confirm Password</span>
          <div className="password-input-wrap">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowConfirmPassword((value) => !value)}
              aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
            >
              {showConfirmPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          {errors.confirmPassword ? <small>{errors.confirmPassword}</small> : null}
        </label>

        <label>
          <span>Account Type</span>
          <select name="investorType" value={form.investorType} onChange={handleChange}>
            {investorTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>

        <button type="submit" className="btn btn-primary auth-submit" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <div className="auth-divider">
        <span>or</span>
      </div>

      <GoogleButton onClick={handleGoogle} loading={googleLoading} />

      <div className="auth-footer-links">
        <Link to="/login">Already have an account?</Link>
      </div>
    </AuthLayout>
  );
}