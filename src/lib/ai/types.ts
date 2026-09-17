export type ConfidenceScore = 'HIGH' | 'MEDIUM' | 'LOW';

export interface ModelConfig {
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
}

export interface AiResponse<T = any> {
  data: T;
  confidence: ConfidenceScore;
  evidence?: string[];
  usage: {
    inputTokens: number;
    outputTokens: number;
    latencyMs: number;
  };
}

export interface AiProvider {
  providerId: string;
  generateStructured<T>(
    promptId: string, 
    systemPrompt: string, 
    userContent: string, 
    schema: any, 
    config?: ModelConfig
  ): Promise<AiResponse<T>>;
  
  classify(
    systemPrompt: string, 
    userContent: string, 
    labels: string[], 
    config?: ModelConfig
  ): Promise<AiResponse<{ label: string }>>;
  
  healthCheck(): Promise<boolean>;
}
