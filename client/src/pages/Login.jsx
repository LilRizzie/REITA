import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import AuthLayout from '../components/AuthLayout';
import GoogleButton from '../components/GoogleButton';
import { useAuth } from '../context/AuthContext';

const ADMIN_EMAIL = 'britneyjacksonel@gmail.com';

export default function Login() {
  const { user, profile, login, loginWithGoogle, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      const isAdmin = user.email?.toLowerCase() === ADMIN_EMAIL || profile?.investorType === 'Administrator';
      navigate(isAdmin ? '/admin-dashboard' : '/dashboard', { replace: true });
    }
  }, [loading, navigate, user, profile]);

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
      setError(err.message || 'Unable to sign in. Please try again.');
      toast.error(err.message || 'Unable to sign in.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    setError('');

    try {
      await loginWithGoogle();
      toast.success('Google sign-in complete.');
      const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL || profile?.investorType === 'Administrator';
      navigate(isAdmin ? '/admin-dashboard' : '/dashboard', { replace: true });
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user') {
        setError('The Google sign-in popup was closed. Please try again.');
        toast.info('Google sign-in canceled.');
      } else {
        setError(err.message || 'Google sign-in failed.');
        toast.error(err.message || 'Google sign-in failed.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

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
