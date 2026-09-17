import { AiProvider, AiResponse, ModelConfig } from '../types';

export class MockAiProvider implements AiProvider {
  providerId = 'mock-ai';

  async generateStructured<T>(
    promptId: string,
    systemPrompt: string,
    userContent: string,
    schema: any,
    config?: ModelConfig
  ): Promise<AiResponse<T>> {
    // Simulating token math based on length
    const inputTokens = Math.floor((systemPrompt.length + userContent.length) / 4);
    
    // Stub implementation checking for certain keywords
    let data: any = {};
    let confidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'HIGH';

    if (promptId.includes('anomaly')) {
      data = {
        isAnomaly: userContent.includes('anomalous'),
        severity: userContent.includes('critical') ? 'CRITICAL' : 'MEDIUM',
        reason: 'Simulated anomaly detection',
      };
    } else if (promptId.includes('summarize')) {
      data = {
        summary: `Mock summary of: ${userContent.substring(0, 50)}...`,
        keyEntities: ['mock-entity'],
      };
    } else {
       // generic fallback
       data = { mocked: true };
    }

    return {
      data: data as T,
      confidence,
      usage: {
        inputTokens,
        outputTokens: 50,
        latencyMs: 120,
      }
    };
  }

  async classify(
    systemPrompt: string,
    userContent: string,
    labels: string[],
    config?: ModelConfig
  ): Promise<AiResponse<{ label: string }>> {
    const defaultLabel = labels[0] || 'UNKNOWN';
    return {
      data: { label: defaultLabel },
      confidence: 'HIGH',
      usage: { inputTokens: 10, outputTokens: 5, latencyMs: 50 }
    };
  }

  async healthCheck() {
    return true;
  }
}
