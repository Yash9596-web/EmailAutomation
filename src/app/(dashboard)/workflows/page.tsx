'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './workflows.module.css';

export default function WorkflowsDashboard() {
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In production, this fetches paginated workflows for the tenant
    fetch('/api/v1/workflows')
      .then(res => res.json())
      .then(json => {
        setWorkflows(json.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Automation Engine</h1>
          <p className={styles.subtitle}>Manage triggers, business rules, and AI orchestration.</p>
        </div>
        <Link href="/workflows/new" className={styles.createButton}>
          Create Workflow
        </Link>
      </div>

      <div className={styles.statsGrid}>
        <StatCard title="Active Workflows" count={workflows.filter(w => w.status === 'Published').length} />
        <StatCard title="Total Executions (Today)" count={workflows.length * 12} />
        <StatCard title="Failed Executions" count={0} colorClass={styles.colorRed} />
        <StatCard title="Pending Approvals" count={3} colorClass={styles.colorAmber} />
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Workflow Name</th>
              <th className={styles.th}>Status</th>
              <th className={styles.th}>Version</th>
              <th className={styles.th} style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className={styles.emptyState}>Loading workflows...</td></tr>
            ) : workflows.length === 0 ? (
              <tr><td colSpan={4} className={styles.emptyState}>No workflows found. Create one from a template.</td></tr>
            ) : (
              workflows.map(wf => (
                <tr key={wf.id} className={styles.tr}>
                  <td className={styles.td} style={{ fontWeight: 500 }}>{wf.name}</td>
                  <td className={styles.td}>
                    <span className={`${styles.badge} ${wf.status === 'Published' ? styles.badgePublished : styles.badgeDraft}`}>
                      {wf.status}
                    </span>
                  </td>
                  <td className={styles.td} style={{ color: 'var(--color-gray-500)' }}>v{wf.version}</td>
                  <td className={styles.td} style={{ textAlign: 'right' }}>
                    <Link href={`/workflows/${wf.id}`} className={styles.actionLink}>
                      Builder & Monitor
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ title, count, colorClass = styles.colorGray }: { title: string, count: number, colorClass?: string }) {
  return (
    <div className={styles.statCard}>
      <h3 className={styles.statTitle}>{title}</h3>
      <p className={`${styles.statCount} ${colorClass}`}>{count}</p>
    </div>
  );
}
