'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from '../auth.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      router.push('/support');
    }, 800);
  };

  return (
    <>
      <h1 className={styles.title}>Sign in to your account</h1>
      
      <form className={styles.form} onSubmit={handleLogin}>
        <div className={styles.inputGroup}>
          <label htmlFor="email">Email Address</label>
          <input type="email" id="email" placeholder="name@company.com" required />
        </div>
        
        <div className={styles.inputGroup}>
          <label htmlFor="password">Password</label>
          <input type="password" id="password" placeholder="��������" required />
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
