import { describe, it, expect } from 'vitest';
import { AiProviderRegistry, PromptRegistry } from '@/lib/ai/registry';
import { MockAiProvider } from '@/lib/ai/providers/mock-provider';

describe('AI Provider Registry', () => {
  it('registers and retrieves a provider', () => {
    const provider = new MockAiProvider();
    AiProviderRegistry.register(provider, true);
    const retrieved = AiProviderRegistry.get('mock-ai');
    expect(retrieved.providerId).toBe('mock-ai');
  });

  it('returns default provider when no id specified', () => {
    const provider = new MockAiProvider();
    AiProviderRegistry.register(provider, true);
    const retrieved = AiProviderRegistry.get();
    expect(retrieved.providerId).toBe('mock-ai');
  });

  it('throws for unknown provider', () => {
    expect(() => AiProviderRegistry.get('nonexistent-provider')).toThrow();
  });
});

describe('Prompt Registry', () => {
  it('registers and retrieves versioned prompts', () => {
    PromptRegistry.register({ id: 'test_prompt', version: 'v1', system: 'You are a test.' });
    const prompt = PromptRegistry.get('test_prompt', 'v1');
    expect(prompt.system).toBe('You are a test.');
  });

  it('throws for missing prompt version', () => {
    expect(() => PromptRegistry.get('test_prompt', 'v99')).toThrow();
  });

  it('supports multiple versions of the same prompt', () => {
    PromptRegistry.register({ id: 'multi', version: 'v1', system: 'Version 1' });
    PromptRegistry.register({ id: 'multi', version: 'v2', system: 'Version 2' });
    expect(PromptRegistry.get('multi', 'v1').system).toBe('Version 1');
    expect(PromptRegistry.get('multi', 'v2').system).toBe('Version 2');
  });
});

describe('Mock AI Provider', () => {
  const provider = new MockAiProvider();

  it('generates structured output', async () => {
    const result = await provider.generateStructured(
      'test',
      'system prompt',
      'user content',
      {}
    );
    expect(result.confidence).toBeDefined();
    expect(result.usage.inputTokens).toBeGreaterThan(0);
    expect(result.usage.latencyMs).toBeGreaterThan(0);
  });

  it('classifies with first label as default', async () => {
    const result = await provider.classify('system', 'content', ['INVOICE', 'PO', 'OTHER']);
    expect(result.data.label).toBe('INVOICE');
    expect(result.confidence).toBe('HIGH');
  });

  it('health check returns true', async () => {
    expect(await provider.healthCheck()).toBe(true);
  });
});
