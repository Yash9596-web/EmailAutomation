import { describe, it, expect } from 'vitest';
import { AnomalySchema } from '@/lib/ai/anomaly-detector';
import { SummarySchema } from '@/lib/ai/summarizer';

describe('AI Output Schema Validation', () => {
  describe('AnomalySchema', () => {
    it('accepts valid anomaly output', () => {
      const valid = { isAnomaly: true, severity: 'HIGH', reason: 'Price 20% above baseline' };
      const result = AnomalySchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects invalid severity', () => {
      const invalid = { isAnomaly: true, severity: 'EXTREME', reason: 'test' };
      const result = AnomalySchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('rejects missing fields', () => {
      const incomplete = { isAnomaly: true };
      const result = AnomalySchema.safeParse(incomplete);
      expect(result.success).toBe(false);
    });

    it('rejects wrong types', () => {
      const wrongType = { isAnomaly: 'yes', severity: 'HIGH', reason: 123 };
      const result = AnomalySchema.safeParse(wrongType);
      expect(result.success).toBe(false);
    });
  });

  describe('SummarySchema', () => {
    it('accepts valid summary output', () => {
      const valid = { summary: 'Invoice from Acme Corp for $5,000', keyEntities: ['Acme Corp'] };
      const result = SummarySchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects non-array keyEntities', () => {
      const invalid = { summary: 'test', keyEntities: 'Acme' };
      const result = SummarySchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('accepts empty keyEntities array', () => {
      const valid = { summary: 'No entities found', keyEntities: [] };
      const result = SummarySchema.safeParse(valid);
      expect(result.success).toBe(true);
    });
  });
});
