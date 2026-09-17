import React from 'react';
import Link from 'next/link';
import styles from './page.module.css';

export default function HomePage() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.logo}>Vorynex Automation</div>
        <div className={styles.nav}>
          <Link href="/login" className={styles.link}>Sign In</Link>
          <Link href="/register" className={styles.btn}>Get Started</Link>
        </div>
      </header>
      <main className={styles.main}>
        <h1 className={styles.title}>Intelligent Manufacturing Copilot</h1>
        <p className={styles.subtitle}>
          Streamline your supply chain, automate invoice approvals, and manage your inventory with our enterprise-grade AI Operations platform.
        </p>
        <div className={styles.actions}>
          <Link href="/register" className={styles.btnLarge}>Start Free Trial</Link>
          <Link href="/login" className={styles.btnOutlineLarge}>Enter Workspace</Link>
        </div>
      </main>
      <footer className={styles.footer}>
        <p>� 2026 Vorynex Technologies. Stage 42 Certified Release.</p>
      </footer>
    </div>
  );
}
