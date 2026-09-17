import { logger } from '@/lib/logger';
import { eventBus } from '@/lib/events/event-bus';

export type AlertSeverity = 'INFO' | 'WARNING' | 'HIGH' | 'CRITICAL';

export interface Alert {
  id: string;
  severity: AlertSeverity;
  service: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}

const recentAlerts: Alert[] = [];
const MAX_ALERT_HISTORY = 200;
const deduplicationWindow = new Map<string, number>(); // key -> last fired timestamp

export class AlertService {
  /**
   * Fire an alert with deduplication to prevent alert storms.
   * Duplicate alerts with the same key are suppressed for 5 minutes.
   */
  static async fire(severity: AlertSeverity, service: string, message: string, details?: Record<string, any>) {
    const dedupeKey = `${severity}:${service}:${message}`;
    const now = Date.now();
    const lastFired = deduplicationWindow.get(dedupeKey);

    // 5-minute deduplication window
    if (lastFired && now - lastFired < 5 * 60 * 1000) {
      return; // Suppress duplicate
    }

    deduplicationWindow.set(dedupeKey, now);

    const alert: Alert = {
      id: crypto.randomUUID(),
      severity,
      service,
      message,
      details,
      timestamp: new Date().toISOString(),
    };

    recentAlerts.unshift(alert);
    if (recentAlerts.length > MAX_ALERT_HISTORY) recentAlerts.pop();

    logger.warn({ message: `ALERT [${severity}] ${service}: ${message}`, module: 'alerting', alertId: alert.id });

    // Publish as domain event for workflow-driven notification
    await eventBus.publish({
      eventId: alert.id,
      eventType: 'AlertFired',
      aggregateType: 'Alert',
      aggregateId: alert.id,
      tenantId: 'system',
      version: 1,
      timestamp: alert.timestamp,
      payload: { severity, service, message },
    });
  }

  static getRecent(limit = 50): Alert[] {
    return recentAlerts.slice(0, limit);
  }
}
