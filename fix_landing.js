const fs = require('fs');

const css = `
.container { min-height: 100vh; background-color: var(--color-background); display: flex; flex-direction: column; }
.header { border-bottom: 1px solid var(--color-border); padding: var(--space-4) var(--space-8); display: flex; justify-content: space-between; align-items: center; }
.logo { font-size: var(--font-size-xl); font-weight: bold; color: var(--color-primary); }
.nav { display: flex; gap: var(--space-4); align-items: center; }
.link { color: var(--color-text-muted); text-decoration: none; font-weight: 500; }
.link:hover { color: var(--color-text-base); }
.btn { background-color: var(--color-primary); color: white; padding: var(--space-2) var(--space-4); border-radius: 4px; text-decoration: none; font-weight: bold; }
.btn:hover { background-color: var(--color-primary-hover); }
.btnOutline { background-color: white; color: var(--color-primary); border: 1px solid var(--color-primary); padding: var(--space-2) var(--space-4); border-radius: 4px; text-decoration: none; font-weight: bold; }
.btnOutline:hover { background-color: var(--color-surface-hover); }
.main { flex-grow: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: var(--space-8); }
.title { font-size: 3rem; font-weight: 900; margin-bottom: var(--space-6); color: var(--color-primary); }
.subtitle { font-size: var(--font-size-xl); color: var(--color-text-muted); max-width: 600px; margin-bottom: var(--space-8); line-height: 1.6; }
.actions { display: flex; gap: var(--space-4); }
.btnLarge { background-color: var(--color-primary); color: white; padding: var(--space-4) var(--space-8); border-radius: 6px; text-decoration: none; font-size: var(--font-size-lg); font-weight: bold; }
.btnLarge:hover { background-color: var(--color-primary-hover); }
.btnOutlineLarge { background-color: white; color: var(--color-primary); border: 2px solid var(--color-primary); padding: var(--space-4) var(--space-8); border-radius: 6px; text-decoration: none; font-size: var(--font-size-lg); font-weight: bold; }
.btnOutlineLarge:hover { background-color: var(--color-surface-hover); }
.footer { padding: var(--space-6); text-align: center; color: var(--color-text-muted); border-top: 1px solid var(--color-border); }
`;

const tsx = `import React from 'react';
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
        <p>© 2026 Vorynex Technologies. Stage 42 Certified Release.</p>
      </footer>
    </div>
  );
}
`;

fs.writeFileSync('src/app/page.module.css', css, 'utf8');
fs.writeFileSync('src/app/page.tsx', tsx, 'utf8');
