import db from '@/lib/db';
import { CopilotToolsRegistry } from './tools';
import { logger } from '@/lib/logger';
import { AuthorizationService } from '@/lib/auth/authorization';

export interface CopilotMessageInput {
  tenantId: string;
  userId: string;
  conversationId?: string;
  content: string;
  contextType?: string;
  contextId?: string;
}

export class CopilotEngine {
  /**
   * Processes a user message, invokes tools based on intent, and saves the conversation.
   * Note: In a true production environment, the intent routing connects to a provider 
   * (e.g. OpenAI structured outputs). For Stage 22 reliability, we use keyword heuristics 
   * to map to tools, demonstrating the secure Tool execution boundaries.
   */
  static async processMessage(input: CopilotMessageInput) {
    await AuthorizationService.authorize('copilot', 'execute');

    return await db.$transaction(async (tx) => {
      // 1. Resolve or Create Conversation
      let conversationId = input.conversationId;
      if (!conversationId) {
        const conv = await tx.conversation.create({
          data: {
            tenantId: input.tenantId,
            userId: input.userId,
            title: input.content.substring(0, 30) + '...',
            contextType: input.contextType,
            contextId: input.contextId
          }
        });
        conversationId = conv.id;
      } else {
        await tx.conversation.update({
          where: { id: conversationId, tenantId: input.tenantId },
          data: { lastMessageAt: new Date() }
        });
      }

      // 2. Save User Message
      await tx.message.create({
        data: {
          conversationId,
          tenantId: input.tenantId,
          role: 'USER',
          content: input.content
        }
      });

      // 3. Simple Intent Parsing (Mocking the LLM Query Planner)
      const contentLower = input.content.toLowerCase();
      let toolToCall = null;
      let toolArgs = {};
      let aiResponseText = '';
      let structuredData: any = null;

      try {
        if (contentLower.includes('health') || contentLower.includes('overview') || contentLower.includes('summary')) {
          toolToCall = CopilotToolsRegistry['get_health_summary'];
        } else if (contentLower.includes('top exceptions') || contentLower.includes('most frequent errors')) {
          toolToCall = CopilotToolsRegistry['get_top_exceptions'];
        } else if (contentLower.includes('supplier performance') || contentLower.includes('supplier mismatch')) {
          toolToCall = CopilotToolsRegistry['get_supplier_performance'];
          // Mock extracting supplier ID
          toolArgs = { supplierId: input.contextId || 'supp_123' };
        } else if (contentLower.includes('exc-')) {
          const match = contentLower.match(/(exc-\d+)/);
          if (match) {
            toolToCall = CopilotToolsRegistry['get_exception_details'];
            toolArgs = { exceptionNumber: match[1].toUpperCase() };
          }
        }

        // 4. Safe Tool Execution
        if (toolToCall) {
          logger.info({ message: `Copilot executing tool: ${toolToCall.name}`, tenantId: input.tenantId });
          const toolResult = await toolToCall.execute(input.tenantId, toolArgs);
          
          aiResponseText = `I have analyzed the data using the **${toolToCall.name}** operational tool. Please see the structured findings attached below.`;
          structuredData = { tool: toolToCall.name, result: toolResult };
        } else {
          aiResponseText = `I am your Manufacturing Copilot. I can analyze operational health, supplier performance, and investigate exception cases (e.g., 'What is the status of EXC-1024?'). I do not have enough specific context to answer your current query using my authorized tools.`;
        }
      } catch (error: any) {
        aiResponseText = `I encountered an error trying to process your request securely: ${error.message}`;
      }

      // 5. Save Assistant Message
      const assistantMessage = await tx.message.create({
        data: {
          conversationId,
          tenantId: input.tenantId,
          role: 'ASSISTANT',
          content: aiResponseText,
          structuredData,
          confidence: toolToCall ? 0.95 : 0.5,
          citations: toolToCall ? [{ source: 'OperationsAnalyticsService', type: 'Database' }] : []
        }
      });

      return {
        conversationId,
        message: assistantMessage
      };
    });
  }

  static async getConversation(tenantId: string, conversationId: string) {
    await AuthorizationService.authorize('copilot', 'read');
    return await db.conversation.findUnique({
      where: { id: conversationId, tenantId },
      include: { messages: { orderBy: { createdAt: 'asc' } } }
    });
  }
}
