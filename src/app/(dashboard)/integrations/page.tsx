'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './integrations.module.css';

export default function IntegrationHubPage() {
  const [data, setData] = useState<any>({ providers: [], connected: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/integrations')
      .then(res => res.json())
      .then(json => {
        setData(json.data || { providers: [], connected: [] });
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className={styles.container}>Loading Integration Hub...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Integration Hub</h1>
          <p className={styles.subtitle}>Connect external systems to your automation platform.</p>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Active Connections</h2>
        {data.connected.length === 0 ? (
          <div className={styles.emptyState}>
            No active integrations. Choose a provider from the catalog below to get started.
          </div>
        ) : (
          <div className={styles.grid}>
            {data.connected.map((integration: any) => (
              <div key={integration.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>{integration.name}</h3>
                  <span className={`${styles.badge} ${integration.status === 'CONNECTED' ? styles.badgeConnected : styles.badgeDisconnected}`}>
                    {integration.status}
                  </span>
                </div>
                <p className={styles.cardDesc}>Type: {integration.type}</p>
                <div className={styles.cardFooter}>
                  <span className={styles.footerText}>
                    {integration.lastConnectedAt ? `Last active: ${new Date(integration.lastConnectedAt).toLocaleDateString()}` : 'Never connected'}
                  </span>
                  <Link href={`/integrations/${integration.id}`} className={styles.link}>
                    Manage &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className={styles.sectionTitle}>Integration Catalog</h2>
        <div className={styles.grid}>
          {data.providers.map((provider: any) => (
            <div key={provider.id} className={styles.card}>
              <div className={styles.iconWrapper}>
                🔌
              </div>
              <h3 className={styles.cardTitle}>{provider.displayName}</h3>
              <p className={styles.cardDesc}>{provider.category} integration via {provider.authMethod}</p>
              
              <div className={styles.capabilities}>
                {provider.capabilities.slice(0,3).map((cap: string) => (
                  <span key={cap} className={styles.capBadge}>
                    {cap}
                  </span>
                ))}
                {provider.capabilities.length > 3 && (
                  <span className={styles.capBadge}>+{provider.capabilities.length - 3}</span>
                )}
              </div>

              <button 
                className={styles.button}
                onClick={() => {
                  if (provider.authMethod === 'OAUTH2') {
                    window.location.href = `/api/v1/integrations/oauth/start?provider=${provider.id}&redirectUri=${encodeURIComponent(window.location.origin + '/api/v1/integrations/oauth/callback')}`;
                  } else {
                    alert('Manual configuration wizard coming soon for API key integrations.');
                  }
                }}
              >
                Connect
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
