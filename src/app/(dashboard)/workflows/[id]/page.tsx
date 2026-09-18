'use client';
// Removed export const runtime = 'edge' since this is a client component anyway, and we removed edge runtimes.

import React, { useEffect, useState, use } from 'react';
import styles from './builder.module.css';

export default function WorkflowBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [workflow, setWorkflow] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'BUILDER' | 'MONITOR'>('BUILDER');

  useEffect(() => {
    fetch(`/api/v1/workflows/${resolvedParams.id}`)
      .then(res => res.json())
      .then(json => {
        setWorkflow(json.data);
        setLoading(false);
      });
  }, [resolvedParams.id]);

  if (loading) return <div style={{ padding: '2rem' }}>Loading Builder...</div>;
  if (!workflow) return <div style={{ padding: '2rem' }}>Workflow not found</div>;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{workflow.name} <span className={styles.versionBadge}>v{workflow.version}</span></h1>
          <div className={styles.tabs}>
            <button 
              className={`${styles.tab} ${activeTab === 'BUILDER' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('BUILDER')}
            >
              Visual Builder
            </button>
            <button 
              className={`${styles.tab} ${activeTab === 'MONITOR' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('MONITOR')}
            >
              Execution Monitor
            </button>
          </div>
        </div>
        <div className={styles.actions}>
          <button className={styles.btnSecondary}>Save Draft</button>
          <button className={styles.btnPrimary}>Publish Version</button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className={styles.mainArea}>
        
        {/* Left Palette */}
        {activeTab === 'BUILDER' && (
          <div className={styles.sidebarLeft}>
            <h3 className={styles.sectionTitle}>Triggers</h3>
            <NodeDraggable label="Event Trigger" icon="⚡" />
            <NodeDraggable label="Schedule" icon="⏱️" />
            
            <h3 className={styles.sectionTitle}>Actions</h3>
            <NodeDraggable label="Create Transaction" icon="💸" />
            <NodeDraggable label="Send Email" icon="📧" />
            <NodeDraggable label="AI Extraction" icon="🧠" />
            
            <h3 className={styles.sectionTitle}>Logic</h3>
            <NodeDraggable label="Condition Branch" icon="🔀" />
            <NodeDraggable label="Wait / Delay" icon="⏳" />
            <NodeDraggable label="Human Approval" icon="👤" />
          </div>
        )}

        {/* Center Canvas Workspace */}
        <div className={styles.workspace}>
          {activeTab === 'BUILDER' ? (
            <div className={styles.placeholder}>
              <div className={styles.placeholderIcon}>🛠️</div>
              <h2 className={styles.placeholderTitle}>Visual Node Canvas</h2>
              <p className={styles.placeholderDesc}>Drag and drop nodes here to construct the workflow.</p>
            </div>
          ) : (
            <div className={styles.monitorContainer}>
              <h2 className={styles.monitorTitle}>Execution History</h2>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>Run ID</th>
                    <th className={styles.th}>Started</th>
                    <th className={styles.th}>Status</th>
                    <th className={styles.th} style={{ textAlign: 'right' }}>Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Mock execution logs */}
                  {workflow.runs?.map((run: any) => (
                    <tr key={run.id}>
                      <td className={styles.td} style={{ fontFamily: 'monospace', color: '#2563eb' }}>{run.id}</td>
                      <td className={styles.td}>{new Date(run.createdAt).toLocaleString()}</td>
                      <td className={styles.td}>
                        <span className={run.status === 'Succeeded' ? styles.badgeSucceeded : run.status === 'Failed' ? styles.badgeFailed : styles.badgePending}>
                          {run.status}
                        </span>
                      </td>
                      <td className={styles.td} style={{ textAlign: 'right' }}>1.2s</td>
                    </tr>
                  ))}
                  {(!workflow.runs || workflow.runs.length === 0) && (
                    <tr>
                      <td colSpan={4} className={styles.td} style={{ textAlign: 'center', color: 'var(--color-gray-500)' }}>
                        No executions yet. Publish your workflow to start running.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Configuration Panel */}
        {activeTab === 'BUILDER' && (
          <div className={styles.sidebarRight}>
            <h3 className={styles.sectionTitle}>Node Configuration</h3>
            <div className={styles.configPlaceholder}>
              Select a node on the canvas to configure variables, AI prompts, or business logic.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function NodeDraggable({ label, icon }: { label: string, icon: string }) {
  return (
    <div className={styles.nodeDraggable}>
      <span className={styles.nodeIcon}>{icon}</span>
      <span className={styles.nodeLabel}>{label}</span>
    </div>
  );
}
