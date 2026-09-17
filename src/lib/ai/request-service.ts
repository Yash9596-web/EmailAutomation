import db from '@/lib/db';
import { AiProviderRegistry, PromptRegistry } from './registry';
import { ModelConfig, AiResponse } from './types';
import { logger } from '@/lib/logger';

export class AiRequestService {
  /**
   * Centralized execution layer ensuring tracking, retry, and versioned prompts.
   */
  static async executeStructured<T>(
    tenantId: string,
    promptId: string,
    promptVersion: string,
    userContent: string,
    schema: any,
    providerId?: string,
    config?: ModelConfig
  ): Promise<AiResponse<T>> {
    const template = PromptRegistry.get(promptId, promptVersion);
    const provider = AiProviderRegistry.get(providerId);

    const startTime = Date.now();
    let attempt = 0;
    const maxRetries = 2;

    while (attempt <= maxRetries) {
      try {
        const response = await provider.generateStructured<T>(
          `${promptId}_${promptVersion}`,
          template.system,
          userContent,
          schema,
          config
        );

        // Usage Tracking
        await db.aIUsageRecord.create({
          data: {
            tenantId,
            provider: provider.providerId,
            model: 'dynamic', // Or fetch from provider
            inputTokens: response.usage.inputTokens,
            outputTokens: response.usage.outputTokens,
            latencyMs: response.usage.latencyMs,
            status: 'Success',
            costEstimate: (response.usage.inputTokens + response.usage.outputTokens) * 0.0001, // Mock logic
          }
        });

        return response;

      } catch (error: any) {
        attempt++;
        logger.warn({ message: 'AI request failed', attempt, error: error.message });

        if (attempt > maxRetries) {
          // Track failure
          await db.aIUsageRecord.create({
            data: {
              tenantId,
              provider: provider.providerId,
              model: 'dynamic',
              latencyMs: Date.now() - startTime,
              status: 'Error',
            }
          });
          throw new Error(`AI request failed after ${maxRetries} retries: ${error.message}`);
        }
      }
    }
    
    throw new Error('Unreachable code in AI Request Service');
  }
}
