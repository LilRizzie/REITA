import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import AuthLayout from '../components/AuthLayout';
import { useAuth } from '../context/AuthContext';
import { getAuthErrorMessage } from '../utils/authErrors';

export default function Login() {
  const { user, login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      const isAdmin = user.role === 'Administrator';
      navigate(isAdmin ? '/admin-dashboard' : '/dashboard', { replace: true });
    }
  }, [loading, navigate, user]);

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const result = await login(form.email.trim(), form.password);

      toast.success('Welcome back. Your workspace is ready.');
      const isAdmin = result.user?.role === 'Administrator';
      const from = location.state?.from?.pathname;
      const target = isAdmin ? '/admin-dashboard' : (from || '/dashboard');
      navigate(target, { replace: true });
    } catch (err) {
      const message = getAuthErrorMessage(err);
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
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

      <div className="auth-footer-links">
        <Link to="/forgot-password">Forgot password?</Link>
        <Link to="/signup">Create account</Link>
      </div>
    </AuthLayout>
  );
}