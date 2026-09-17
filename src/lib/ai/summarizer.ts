import { AiRequestService } from './request-service';
import { PromptRegistry } from './registry';
import { z } from 'zod';

export const SummarySchema = z.object({
  summary: z.string(),
  keyEntities: z.array(z.string()),
});

export class AiSummarizer {
  static async summarize(tenantId: string, content: string, focusArea?: string) {
    try {
      PromptRegistry.get('summarizer', 'v1');
    } catch {
      PromptRegistry.register({
        id: 'summarizer',
        version: 'v1',
        system: 'You are an enterprise AI summarization engine. Summarize the content concisely and extract key entities. Output ONLY JSON.',
      });
    }

    const context = focusArea ? `Focus on: ${focusArea}\n\nContent: ${content}` : content;

    const response = await AiRequestService.executeStructured<z.infer<typeof SummarySchema>>(
      tenantId,
      'summarizer',
      'v1',
      context,
      SummarySchema
    );

    return response;
  }
}
