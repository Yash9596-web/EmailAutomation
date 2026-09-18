'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './documents.module.css';

export default function DocumentWorkspacePage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    // In production, this would be a paginated /api/v1/documents call
    fetch('/api/v1/documents')
      .then(res => res.json())
      .then(json => {
        setDocuments(json.data?.data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const filtered = filter === 'ALL' ? documents : documents.filter(d => d.status === filter);

  const stats = {
    total: documents.length,
    review: documents.filter(d => d.status === 'REVIEW_REQUIRED').length,
    processing: documents.filter(d => d.status === 'PROCESSING' || d.status === 'QUEUED').length,
    failed: documents.filter(d => d.status === 'FAILED').length,
    completed: documents.filter(d => d.status === 'COMPLETED').length,
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Document Workspace</h1>
          <p className={styles.subtitle}>Manage incoming business documents and extraction pipelines.</p>
        </div>
        <button className={styles.uploadBtn}>
          Upload Document
        </button>
      </div>

      <div className={styles.statsGrid}>
        <StatCard title="Total" count={stats.total} active={filter === 'ALL'} onClick={() => setFilter('ALL')} />
        <StatCard title="Needs Review" count={stats.review} active={filter === 'REVIEW_REQUIRED'} onClick={() => setFilter('REVIEW_REQUIRED')} color="#d97706" />
        <StatCard title="Processing" count={stats.processing} active={filter === 'PROCESSING'} onClick={() => setFilter('PROCESSING')} color="#2563eb" />
        <StatCard title="Failed" count={stats.failed} active={filter === 'FAILED'} onClick={() => setFilter('FAILED')} color="#dc2626" />
        <StatCard title="Completed" count={stats.completed} active={filter === 'COMPLETED'} onClick={() => setFilter('COMPLETED')} color="#16a34a" />
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Document</th>
              <th className={styles.th}>Type</th>
              <th className={styles.th}>Status</th>
              <th className={styles.th}>Date</th>
              <th className={styles.th} style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className={styles.td} style={{ textAlign: 'center', color: 'var(--color-gray-500)' }}>Loading documents...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className={styles.td} style={{ textAlign: 'center', color: 'var(--color-gray-500)' }}>No documents found matching criteria.</td></tr>
            ) : (
              filtered.map(doc => (
                <tr key={doc.id}>
                  <td className={styles.td}>
                    <div className={styles.docTitle}>{doc.title}</div>
                    <div className={styles.docSource}>{doc.source}</div>
                  </td>
                  <td className={styles.td} style={{ color: 'var(--color-gray-500)' }}>
                    {doc.documentType || 'Unknown'}
                  </td>
                  <td className={styles.td}>
                    <StatusBadge status={doc.status} />
                  </td>
                  <td className={styles.td} style={{ color: 'var(--color-gray-500)' }}>
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </td>
                  <td className={styles.td} style={{ textAlign: 'right' }}>
                    <Link href={`/documents/${doc.id}`} className={styles.actionLink}>
                      {doc.status === 'REVIEW_REQUIRED' ? 'Review' : 'View'}
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

function StatCard({ title, count, active, onClick, color = 'inherit' }: any) {
  return (
    <div 
      onClick={onClick}
      className={`${styles.statCard} ${active ? styles.statCardActive : ''}`}
    >
      <h3 className={styles.statTitle}>{title}</h3>
      <p className={styles.statCount} style={{ color }}>{count}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, any> = {
    'RECEIVED': { bg: '#f3f4f6', text: '#1f2937' },
    'QUEUED': { bg: '#f3f4f6', text: '#1f2937' },
    'PROCESSING': { bg: '#dbeafe', text: '#1e40af' },
    'EXTRACTING': { bg: '#dbeafe', text: '#1e40af' },
    'VALIDATING_DATA': { bg: '#f3e8ff', text: '#6b21a8' },
    'REVIEW_REQUIRED': { bg: '#fef3c7', text: '#92400e' },
    'COMPLETED': { bg: '#dcfce7', text: '#166534' },
    'FAILED': { bg: '#fee2e2', text: '#991b1b' },
  };
  const theme = colors[status] || { bg: '#f3f4f6', text: '#1f2937' };
  
  return (
    <span className={styles.badge} style={{ backgroundColor: theme.bg, color: theme.text }}>
      {status}
    </span>
  );
}
