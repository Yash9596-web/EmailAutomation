import React from 'react';
import styles from './auth.module.css';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.authLayout}>
      <div className={`glass-panel hover-lift ${styles.authCard}`}>
        <div className={styles.logo}>
          <span className={styles.accent}>▲</span> AutoMail
        </div>
        {children}
      </div>
    </div>
  );
}
