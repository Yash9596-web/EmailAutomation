import { GoogleGenerativeAI } from '@google/generative-ai';
import { AiProvider, AiResponse, ModelConfig } from '../types';

export class GeminiProvider implements AiProvider {
  providerId = 'gemini';
  private genAI: GoogleGenerativeAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not defined in environment variables.');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async generateStructured<T>(
    promptId: string, 
    systemPrompt: string, 
    userContent: string, 
    schema: any, 
    config?: ModelConfig
  ): Promise<AiResponse<T>> {
    const start = Date.now();
    const model = this.genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: config?.temperature || 0,
      }
    });

    const instruction = `${systemPrompt}

You MUST return ONLY valid JSON that matches the following schema. Do NOT wrap the output in markdown code blocks like \`\`\`json. Return raw JSON.

Schema:
${JSON.stringify(schema, null, 2)}

User Content:
${userContent}`;

    const result = await model.generateContent(instruction);
    const text = result.response.text();
    
    let cleanJson = text.trim();
    if (cleanJson.startsWith('```json')) cleanJson = cleanJson.substring(7);
    if (cleanJson.startsWith('```')) cleanJson = cleanJson.substring(3);
    if (cleanJson.endsWith('```')) cleanJson = cleanJson.substring(0, cleanJson.length - 3);

    const parsed = JSON.parse(cleanJson) as T;

    return {
      data: parsed,
      confidence: 'HIGH',
      usage: {
        inputTokens: 0, // Gemini SDK doesn't easily expose this in standard generateContent without countTokens
        outputTokens: 0,
        latencyMs: Date.now() - start
      }
    };
  }

  async classify(
    systemPrompt: string, 
    userContent: string, 
    labels: string[], 
    config?: ModelConfig
  ): Promise<AiResponse<{ label: string }>> {
    const schema = {
      type: "object",
      properties: {
        label: { type: "string", enum: labels }
      },
      required: ["label"]
    };
    return this.generateStructured<{label: string}>('classify', systemPrompt, userContent, schema, config);
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }).generateContent("ping");
      return true;
    } catch {
      return false;
    }
  }
}

