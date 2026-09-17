import { AiRequestService } from './request-service';
import { PromptRegistry } from './registry';
import { z } from 'zod';

export const AnomalySchema = z.object({
  isAnomaly: z.boolean(),
  severity: z.enum(['INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  reason: z.string(),
});

export class AnomalyDetector {
  static async detect(tenantId: string, historicalContext: string, currentData: string) {
    // Ensure prompt is registered (could be done in bootstrap, but we do it safely here for the pattern)
    try {
      PromptRegistry.get('anomaly_detector', 'v1');
    } catch {
      PromptRegistry.register({
        id: 'anomaly_detector',
        version: 'v1',
        system: 'You are a financial anomaly detector. Compare the current transaction against the historical context. Output ONLY JSON.',
      });
    }

    const response = await AiRequestService.executeStructured<z.infer<typeof AnomalySchema>>(
      tenantId,
      'anomaly_detector',
      'v1',
      `History: ${historicalContext}\nCurrent: ${currentData}`,
      AnomalySchema
    );

    return response;
  }
}
