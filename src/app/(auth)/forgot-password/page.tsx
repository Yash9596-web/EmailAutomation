export const runtime = 'edge';
import Link from 'next/link';
import styles from '../auth.module.css';

export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className={styles.title}>Reset your password</h1>
      <p className={styles.footerText} style={{ marginBottom: '1rem' }}>
        Enter your email address and we'll send you a link to reset your password.
      </p>
      
      <form className={styles.form}>
        <div className={styles.inputGroup}>
          <label htmlFor="email">Email Address</label>
          <input type="email" id="email" placeholder="name@company.com" required />
        </div>
        
        <button type="button" className={`btn btn-primary ${styles.btnFull}`}>
          Send Reset Link
        </button>
      </form>
      
      <p className={styles.footerText} style={{ marginTop: '1rem' }}>
        <Link href="/login" className={styles.link}>
          Back to login
        </Link>
      </p>
    </>
  );
}
