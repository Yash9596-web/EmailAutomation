'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './layout.module.css';

const NAV_ITEMS = [
  { name: 'Overview', href: '/' },
  { name: 'Emails', href: '/emails' },
  { name: 'Purchase Orders', href: '/purchase-orders' },
  { name: 'Invoices', href: '/invoices' },
  { name: 'Payments', href: '/payments' },
  { name: 'Documents', href: '/documents' },
  { name: 'Workflows', href: '/workflows' },
  { name: 'Notifications', href: '/notifications' },
  { name: 'Reports', href: '/reports' },
  { name: 'AI Assistant', href: '/ai' },
  { name: 'Approvals', href: '/approvals' },
  { name: 'Settings', href: '/settings' },
  { name: 'Audit Logs', href: '/audit' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <span className={styles.accent}>▲</span> AutoMail
      </div>
      <nav className={styles.nav}>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
