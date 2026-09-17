import { AiProviderRegistry } from './registry';
import { MockAiProvider } from './providers/mock-provider';
import { logger } from '@/lib/logger';

export function bootstrapAi() {
  const mockAi = new MockAiProvider();
  AiProviderRegistry.register(mockAi, true); // Set as default

  logger.info({ message: 'AI Subsystem bootstrapped: Registered mock-ai as default provider' });
}
