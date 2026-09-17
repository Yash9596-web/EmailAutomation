import { AiProvider } from './types';
import { logger } from '@/lib/logger';

class ProviderRegistryClass {
  private providers = new Map<string, AiProvider>();
  private defaultProviderId: string | null = null;

  register(provider: AiProvider, isDefault = false) {
    this.providers.set(provider.providerId, provider);
    if (isDefault) this.defaultProviderId = provider.providerId;
  }

  get(id?: string): AiProvider {
    const targetId = id || this.defaultProviderId;
    if (!targetId) throw new Error('No AI provider specified or defaulted.');
    const provider = this.providers.get(targetId);
    if (!provider) throw new Error(`AI Provider ${targetId} not found`);
    return provider;
  }
}

export const AiProviderRegistry = new ProviderRegistryClass();

export interface PromptTemplate {
  id: string;
  version: string;
  system: string;
}

class PromptRegistryClass {
  private prompts = new Map<string, PromptTemplate>();

  register(prompt: PromptTemplate) {
    // Combine ID and version for strict versioning
    const key = `${prompt.id}_${prompt.version}`;
    this.prompts.set(key, prompt);
  }

  get(id: string, version: string): PromptTemplate {
    const key = `${id}_${version}`;
    const prompt = this.prompts.get(key);
    if (!prompt) {
      logger.error({ message: 'Prompt version not found', id, version });
      throw new Error(`Prompt ${id} version ${version} not found in registry. Avoid implicit upgrades.`);
    }
    return prompt;
  }
}

export const PromptRegistry = new PromptRegistryClass();
