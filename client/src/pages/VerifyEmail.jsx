import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';

const API_URL = (import.meta.env.VITE_API_URL || 'https://reita-backend-deployment.onrender.com').replace(/\/+$/, '');

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Confirming your email address...');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('This verification link is invalid or has expired.');
      return undefined;
    }

    let active = true;
    fetch(`${API_URL}/api/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.success) {
          throw new Error(data.message || 'This verification link is invalid or has expired.');
        }
        if (active) {
          setStatus('success');
          setMessage('Email verified successfully!');
        }
      })
      .catch((error) => {
        if (active) {
          setStatus('error');
          setMessage(error.message || 'This verification link is invalid or has expired.');
        }
      });

    return () => { active = false; };
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
