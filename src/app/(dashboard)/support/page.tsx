export const runtime = 'edge';
import React from 'react';
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
                  <span className={`${styles.statusBadge} ${ticket.status === 'OPEN' ? styles.statusOpen : styles.statusResolved}`}>
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
