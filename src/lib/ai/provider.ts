export interface AIProvider {
  id: string;
  name: string;
  
  generateText(prompt: string, options?: any): Promise<string>;
  extractStructuredData<T>(prompt: string, schema: any): Promise<T>;
  embedText(text: string): Promise<number[]>;
}

// Stage 1 configuration boundary
export class AIProviderConfig {
  static getProvider(id: string): AIProvider {
    throw new Error(`AI Provider ${id} is configured but not yet implemented (Stage 6 functionality).`);
  }
}
