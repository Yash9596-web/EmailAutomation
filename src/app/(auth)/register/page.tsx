'use client';
export const runtime = 'edge';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from '../auth.module.css';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      router.push('/login');
    }, 800);
  };

  return (
    <>
      <h1 className={styles.title}>Create Enterprise Account</h1>
      
      <form className={styles.form} onSubmit={handleRegister}>
        <div className={styles.inputGroup}>
          <label htmlFor="name">Organization Name</label>
          <input type="text" id="name" placeholder="Acme Corp" required />
        </div>
        
        <div className={styles.inputGroup}>
          <label htmlFor="email">Work Email</label>
          <input type="email" id="email" placeholder="admin@acme.com" required />
        </div>
        
        <div className={styles.inputGroup}>
          <label htmlFor="password">Password</label>
          <input type="password" id="password" placeholder="��������" required />
        </div>
        
        <button type="submit" className={`btn btn-primary ${styles.btnFull}`} disabled={loading} style={{ backgroundColor: '#0f172a', color: 'white', padding: '0.75rem', borderRadius: '4px', border: 'none', fontWeight: 'bold', cursor: 'pointer', marginTop: '1rem' }}>
          {loading ? 'Setting up Workspace...' : 'Create Account'}
        </button>
      </form>
      
      <p className={styles.footerText}>
        Already have an account?{' '}
        <Link href="/login" className={styles.link}>
          Sign in here
        </Link>
      </p>
    </>
  );
}
