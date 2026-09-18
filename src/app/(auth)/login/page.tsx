'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from '../auth.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to login');
      }

      router.push('/support'); // Redirect to dashboard on success
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <>
      <h1 className={styles.title}>Sign in to your account</h1>
      
      {error && <div style={{ color: 'red', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}

      <form className={styles.form} onSubmit={handleLogin}>
        <div className={styles.inputGroup}>
          <label htmlFor="email">Email Address</label>
          <input type="email" id="email" name="email" placeholder="name@company.com" required />
        </div>
        
        <div className={styles.inputGroup}>
          <label htmlFor="password">Password</label>
          <input type="password" id="password" name="password" placeholder="••••••••" required />
        </div>
        
        <Link href="/forgot-password" className={styles.link}>
          Forgot password?
        </Link>
        
        <button type="submit" className={`btn btn-primary ${styles.btnFull}`} disabled={loading} style={{ backgroundColor: '#0f172a', color: 'white', padding: '0.75rem', borderRadius: '4px', border: 'none', fontWeight: 'bold', cursor: 'pointer', marginTop: '1rem' }}>
          {loading ? 'Authenticating...' : 'Sign In'}
        </button>
      </form>
      
      <p className={styles.footerText}>
        Don't have an account?{' '}
        <Link href="/register" className={styles.link}>
          Request Access
        </Link>
      </p>
    </>
  );
}
