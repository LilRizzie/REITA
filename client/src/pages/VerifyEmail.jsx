import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';

const API_URL = (import.meta.env.VITE_API_URL || 'https://reita-backend-deployment.onrender.com').replace(/\/+$/, '');

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Verifying email...');

  useEffect(() => {
    const token = searchParams.get('token');
    const result = searchParams.get('status');
    if (result === 'success') {
      setStatus('success');
      setMessage('Email verified successfully.');
      return undefined;
    }
    if (result === 'expired') {
      setStatus('error');
      setMessage('This verification link has expired. Please request a new one.');
      return undefined;
    }
    if (result === 'invalid') {
      setStatus('error');
      setMessage('This verification link is invalid or has already been used.');
      return undefined;
    }
    if (!token) {
      setStatus('error');
      setMessage('This verification link is invalid or has expired.');
      return undefined;
    }

    window.location.replace(`${API_URL}/api/auth/verify-email?token=${encodeURIComponent(token)}`);
    return undefined;
  }, [searchParams]);

  return (
    <AuthLayout title="Email confirmation" subtitle="Confirm your REITA account email address.">
      <div className="auth-form">
        {status === 'loading' ? <div className="loading-pill">{message}</div> : null}
        {status === 'success' ? <div className="auth-message auth-message--success">{message}</div> : null}
        {status === 'error' ? <div className="auth-message auth-message--error">{message}</div> : null}
        {status !== 'loading' ? <Link className="btn btn-primary auth-submit" to="/login">Go to Login</Link> : null}
      </div>
    </AuthLayout>
  );
}
