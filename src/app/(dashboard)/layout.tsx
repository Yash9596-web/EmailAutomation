import React from 'react';
import Sidebar from './Sidebar';
import styles from './layout.module.css';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.layout}>
      <Sidebar />
      <div className={styles.main}>
        <header className={styles.header}>
          <div className={styles.userProfile}>
            <span>John Doe</span>
            <div className={styles.avatar}>JD</div>
          </div>
        </header>
        <main style={{ padding: '2rem' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
