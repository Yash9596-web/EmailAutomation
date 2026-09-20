'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './layout.module.css';

const NAV_ITEMS = [
  { name: 'Dashboard', href: '/overview' },
  { name: 'Documents AI', href: '/documents' },
  { name: 'Workflows', href: '/workflows' },
  { name: 'Integrations', href: '/integrations' },
  { name: 'Customers', href: '/customers' },
  { name: 'Support Tickets', href: '/support' },
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
