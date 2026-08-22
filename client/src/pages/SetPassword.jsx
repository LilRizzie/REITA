import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import AuthLayout from '../components/AuthLayout';
import { useAuth } from '../context/AuthContext';
import { getAuthErrorMessage } from '../utils/authErrors';

export default function SetPassword() {
  const { setPassword } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPasswordState] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!token) {
      setError('This link is invalid. Please request a new password reset code.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);

    try {
      await setPassword(token, password);
      toast.success('Password set successfully. You can now log in with your new password.');
      navigate('/login', { replace: true });
    } catch (err) {
      const message = getAuthErrorMessage(err);
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Set your password" subtitle="Create a REITA password to enable email login.">
      <form className="auth-form" onSubmit={handleSubmit}>
        {error ? <div className="auth-message auth-message--error">{error}</div> : null}

        <label>
          <span>New Password</span>
          <div className="password-input-wrap">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPasswordState(event.target.value)}
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

        <label>
          <span>Confirm Password</span>
          <div className="password-input-wrap">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
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
        </label>

        <button type="submit" className="btn btn-primary auth-submit" disabled={submitting}>
          {submitting ? 'Setting password…' : 'Set Password'}
        </button>
      </form>

      <div className="auth-footer-links">
        <Link to="/login">Back to login</Link>
      </div>
    </AuthLayout>
  );
}