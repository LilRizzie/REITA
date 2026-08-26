import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import AuthLayout from '../components/AuthLayout';
import { useAuth } from '../context/AuthContext';
import { getAuthErrorMessage } from '../utils/authErrors';

const investorTypes = ['Investor', 'Property Agent'];
export default function Signup() {
  const { user, signup, resendVerificationEmail, loading } = useAuth();
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  useEffect(() => {
    if (!loading && user) {
      const isAdmin = user.role === 'Administrator';
      navigate(isAdmin ? '/admin-dashboard' : '/dashboard', { replace: true });
    }
  }, [loading, navigate, user]);

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
      await signup(form.fullName.trim(), form.email.trim(), form.password, form.investorType);
      setVerificationEmail(form.email.trim().toLowerCase());
      toast.success('Account created. Check your email for a verification link.');
    } catch (err) {
      const message = getAuthErrorMessage(err);
      setErrors((current) => ({ ...current, form: message }));
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout title={verificationEmail ? 'Check your email' : 'Create account'} subtitle="Join REITA with a refined, secure sign-up experience.">
      {verificationEmail ? (
        <div className="auth-form">
          <div className="auth-message auth-message--success">Account created successfully.</div>
          <div className="verification-card">
            <h2>Verify your email to continue.</h2>
            <p>We've sent a verification link to:</p>
            <strong className="verification-email">{verificationEmail}</strong>
            <p>Please check your inbox and click the link to activate your REITA account. The link expires in 24 hours.</p>
          </div>
          {resendMessage ? <div className="auth-message auth-message--success">{resendMessage}</div> : null}
          <button
            type="button"
            className="btn btn-secondary auth-submit"
            disabled={resending}
            onClick={async () => {
              setResending(true);
              setResendMessage('');
              try {
                await resendVerificationEmail(verificationEmail);
                setResendMessage('A new verification link has been sent.');
              } catch (err) {
                setResendMessage(getAuthErrorMessage(err));
              } finally {
                setResending(false);
              }
            }}
          >
            {resending ? 'Sending…' : 'Resend verification email'}
          </button>
          <Link className="btn btn-primary auth-submit" to="/login">Continue to login</Link>
        </div>
      ) : null}
      {!verificationEmail ? (
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
      ) : null}

      <div className="auth-footer-links">
        <Link to="/login">Already have an account?</Link>
      </div>
    </AuthLayout>
  );
}