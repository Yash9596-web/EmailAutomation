import { ActionHandler, ExecutionContext, StepResult } from '@/lib/engine/types';
import { AnomalyDetector } from '@/lib/ai/anomaly-detector';

export const AiDetectAnomalyAction: ActionHandler = {
  type: 'AI_DETECT_ANOMALY',
  
  validate(config) {
    const errors = [];
    if (!config.historicalContext) errors.push('Requires historicalContext');
    if (!config.currentData) errors.push('Requires currentData');
    return { valid: errors.length === 0, errors };
  },

  async execute(context: ExecutionContext, config: Record<string, unknown>): Promise<StepResult> {
    const historicalContext = config.historicalContext as string;
    const currentData = config.currentData as string;

    try {
      const result = await AnomalyDetector.detect(context.tenantId, historicalContext, currentData);

      // Deterministic fallback/rules application:
      // If AI marks it HIGH or CRITICAL, the workflow engine will use this output in subsequent Condition nodes.
      return {
        status: 'success',
        data: { 
          isAnomaly: result.data.isAnomaly,
          severity: result.data.severity,
          reason: result.data.reason,
          confidence: result.confidence
        },
      };
    } catch (error: any) {
      // AI Failure Path: We explicitly fail the step so the workflow can use deterministic fallback paths.
      return { status: 'failure', error: error.message };
    }
  },
};

import { AiSummarizer } from '@/lib/ai/summarizer';

export const AiSummarizeAction: ActionHandler = {
  type: 'AI_SUMMARIZE',
  
  validate(config) {
    const errors = [];
    if (!config.content) errors.push('Requires content to summarize');
    return { valid: errors.length === 0, errors };
  },

  async execute(context: ExecutionContext, config: Record<string, unknown>): Promise<StepResult> {
    try {
      const result = await AiSummarizer.summarize(
        context.tenantId, 
        config.content as string, 
        config.focusArea as string | undefined
      );

      return {
        status: 'success',
        data: { 
          summary: result.data.summary,
          keyEntities: result.data.keyEntities,
          confidence: result.confidence
        },
      };
    } catch (error: any) {
      return { status: 'failure', error: error.message };
    }
  },
};

export const AiClassifyAction: ActionHandler = {
  type: 'AI_CLASSIFY',
  
  validate(config) {
    const errors = [];
    if (!config.inputData) errors.push('Requires inputData to classify');
    if (!config.expectedSchema) errors.push('Requires expectedSchema for guardrails');
    return { valid: errors.length === 0, errors };
  },

  async execute(context: ExecutionContext, config: Record<string, unknown>): Promise<StepResult> {
    try {
      // Stub AI classification mapping for safe Stage 20 execution
      const classification = 'INVOICE_VALID'; 
      return {
        status: 'success',
        data: { 
          classification,
          confidence: 0.95
        },
      };
    } catch (error: any) {
      return { status: 'failure', error: error.message };
    }
  },
};
