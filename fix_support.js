const fs = require('fs');

const css = `
.container { padding: var(--space-6); max-width: 900px; margin: 0 auto; min-height: 100vh; }
.title { font-size: var(--font-size-2xl); font-weight: bold; margin-bottom: var(--space-6); color: var(--color-primary); }
.card { background-color: var(--color-surface); border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden; border: 1px solid var(--color-border); }
.cardHeader { padding: var(--space-4); border-bottom: 1px solid var(--color-border); display: flex; justify-content: space-between; align-items: center; background-color: var(--color-surface-hover); }
.cardTitle { font-weight: 600; font-size: var(--font-size-lg); }
.btnNew { background-color: var(--color-primary); color: white; padding: var(--space-2) var(--space-4); border-radius: 4px; border: none; font-weight: 600; cursor: pointer; }
.btnNew:hover { background-color: var(--color-primary-hover); }
.ticketList { display: flex; flex-direction: column; }
.ticketItem { padding: var(--space-4); display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--color-border); }
.ticketItem:last-child { border-bottom: none; }
.ticketItem:hover { background-color: var(--color-surface-hover); }
.ticketSubject { font-weight: 500; color: var(--color-text-base); }
.ticketDesc { font-size: var(--font-size-sm); color: var(--color-text-muted); margin-top: var(--space-1); }
.ticketMeta { display: flex; flex-direction: column; align-items: flex-end; }
.statusBadge { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
.statusOpen { background-color: #dbeafe; color: #1e40af; }
.statusResolved { background-color: #d1fae5; color: #065f46; }
.ticketDate { font-size: 12px; color: var(--color-text-muted); margin-top: var(--space-2); }
.emptyState { padding: var(--space-8); text-align: center; color: var(--color-text-muted); }
`;

const tsx = `import React from 'react';
import styles from './support.module.css';

export default async function SupportPage() {
  const tickets = [
    { id: '1', subject: 'Integration Sync Failing', description: 'ERP connector keeps dropping the payload.', status: 'OPEN', createdAt: new Date() },
    { id: '2', subject: 'Invoice Module Setup', description: 'Need help mapping tax fields.', status: 'RESOLVED', createdAt: new Date(Date.now() - 86400000) }
  ];

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Customer Support (Preview)</h1>
      
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Active Tickets</h2>
          <button className={styles.btnNew}>+ New Ticket</button>
        </div>
        
        {tickets.length === 0 ? (
          <div className={styles.emptyState}>
            No support tickets found. Everything is running smoothly!
          </div>
        ) : (
          <div className={styles.ticketList}>
            {tickets.map(ticket => (
              <div key={ticket.id} className={styles.ticketItem}>
                <div>
                  <div className={styles.ticketSubject}>{ticket.subject}</div>
                  <div className={styles.ticketDesc}>{ticket.description}</div>
                </div>
                <div className={styles.ticketMeta}>
                  <span className={\`\${styles.statusBadge} \${ticket.status === 'OPEN' ? styles.statusOpen : styles.statusResolved}\`}>
                    {ticket.status}
                  </span>
                  <span className={styles.ticketDate}>
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
`;

fs.writeFileSync('src/app/(dashboard)/support/support.module.css', css, 'utf8');
fs.writeFileSync('src/app/(dashboard)/support/page.tsx', tsx, 'utf8');
