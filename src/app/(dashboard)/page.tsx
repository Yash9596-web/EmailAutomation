import styles from './page.module.css';

const MOCK_METRICS = [
  { title: "Today's Orders", value: '142', trend: '+12%', trendType: 'up' },
  { title: 'Pending Orders', value: '38', trend: '-2', trendType: 'down' },
  { title: 'Invoices', value: '1,204', trend: '+4.3%', trendType: 'up' },
  { title: 'Outstanding Payments', value: '$42,500', trend: '+$4k', trendType: 'down' },
  { title: 'Unread Emails', value: '89', trend: 'Requires action', trendType: 'neutral' },
  { title: 'Automation Runs', value: '12,450', trend: '+920 today', trendType: 'up' },
  { title: 'Pending Approvals', value: '14', trend: '3 high priority', trendType: 'neutral' },
  { title: 'Automation Errors', value: '2', trend: '-8 from yesterday', trendType: 'up' },
];

export default function DashboardOverview() {
  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <h1>Dashboard Overview</h1>
        <p>Welcome back! Here's what's happening today.</p>
      </div>

      <div className={styles.grid}>
        {MOCK_METRICS.map((metric, index) => (
          <div key={index} className={`glass-panel hover-lift ${styles.card}`}>
            <div className={styles.cardHeader}>
              <span>{metric.title}</span>
              {/* Placeholder for icon */}
              <span style={{ opacity: 0.5 }}>●</span>
            </div>
            <div className={styles.cardValue}>{metric.value}</div>
            <div className={`${styles.cardTrend} ${
              metric.trendType === 'up' ? styles.trendUp : 
              metric.trendType === 'down' ? styles.trendDown : styles.trendNeutral
            }`}>
              {metric.trendType === 'up' ? '↑' : metric.trendType === 'down' ? '↓' : '•'} {metric.trend}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
