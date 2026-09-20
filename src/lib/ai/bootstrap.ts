import { AiProviderRegistry } from './registry';
import { MockAiProvider } from './providers/mock-provider';
import { GeminiProvider } from './providers/gemini';
import { logger } from '@/lib/logger';

export function bootstrapAi() {
  try {
    const gemini = new GeminiProvider();
    AiProviderRegistry.register(gemini, true); // Set as default
    logger.info({ message: 'AI Subsystem bootstrapped: Registered Gemini as default provider' });
  } catch (e) {
    logger.warn({ message: 'Failed to bootstrap Gemini, falling back to mock provider', error: (e as any).message });
    const mockAi = new MockAiProvider();
    AiProviderRegistry.register(mockAi, true);
  }
}
