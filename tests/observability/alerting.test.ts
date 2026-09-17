import { describe, it, expect } from 'vitest';
import { AlertService } from '@/lib/observability/alerting';

describe('AlertService', () => {
  it('fires and stores alerts', async () => {
    await AlertService.fire('WARNING', 'test-service', 'Test alert message');
    const recent = AlertService.getRecent(10);
    expect(recent.length).toBeGreaterThanOrEqual(1);
    expect(recent[0].severity).toBe('WARNING');
    expect(recent[0].service).toBe('test-service');
    expect(recent[0].message).toBe('Test alert message');
    expect(recent[0].id).toBeDefined();
    expect(recent[0].timestamp).toBeDefined();
  });

  it('deduplicates identical alerts within window', async () => {
    const before = AlertService.getRecent(200).length;
    await AlertService.fire('HIGH', 'dedup-svc', 'Same alert');
    await AlertService.fire('HIGH', 'dedup-svc', 'Same alert');
    await AlertService.fire('HIGH', 'dedup-svc', 'Same alert');
    const after = AlertService.getRecent(200).length;
    // Only 1 new alert should have been added despite 3 calls
    expect(after - before).toBe(1);
  });

  it('allows different alerts from same service', async () => {
    const before = AlertService.getRecent(200).length;
    await AlertService.fire('INFO', 'multi-alert', 'Alert A - ' + Date.now());
    await AlertService.fire('INFO', 'multi-alert', 'Alert B - ' + Date.now());
    const after = AlertService.getRecent(200).length;
    expect(after - before).toBe(2);
  });

  it('respects limit parameter', () => {
    const limited = AlertService.getRecent(1);
    expect(limited.length).toBeLessThanOrEqual(1);
  });
});
