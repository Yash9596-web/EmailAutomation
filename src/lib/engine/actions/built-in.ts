// ============================================================================
// Built-in Actions — LOG, HTTP_REQUEST, TRANSFORM_DATA, DELAY
// ============================================================================

import { ActionHandler, ExecutionContext, StepResult } from '../types';
import { logger } from '@/lib/logger';

// --- LOG Action: Writes a message to structured logs ---
export const LogAction: ActionHandler = {
  type: 'LOG',
  capabilities: [],
  validate(config) {
    if (!config.message || typeof config.message !== 'string') {
      return { valid: false, errors: ['LOG action requires a "message" string'] };
    }
    return { valid: true };
  },
  async execute(context, config): Promise<StepResult> {
    logger.info({
      message: `[Workflow Log] ${config.message}`,
      module: 'engine',
      executionId: context.executionId,
      tenantId: context.tenantId,
    });
    return { status: 'success', data: { logged: true } };
  },
};

// --- HTTP_REQUEST Action: Makes a controlled external HTTP call ---
export const HttpRequestAction: ActionHandler = {
  type: 'HTTP_REQUEST',
  capabilities: ['network'],
  validate(config) {
    const errors: string[] = [];
    if (!config.url || typeof config.url !== 'string') errors.push('HTTP_REQUEST requires a "url" string');
    if (config.method && !['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(config.method as string)) {
      errors.push('Invalid HTTP method');
    }
    // SSRF prevention: block private/internal URLs
    if (typeof config.url === 'string') {
      const lower = config.url.toLowerCase();
      if (lower.startsWith('http://localhost') || lower.startsWith('http://127.') ||
          lower.startsWith('http://10.') || lower.startsWith('http://192.168.') ||
          lower.includes('169.254.')) {
        errors.push('Internal/private network URLs are not allowed');
      }
    }
    return { valid: errors.length === 0, errors };
  },
  async execute(context, config): Promise<StepResult> {
    const url = config.url as string;
    const method = (config.method as string) || 'GET';
    const headers = (config.headers as Record<string, string>) || {};
    const body = config.body as string | undefined;
    const timeoutMs = Math.min((config.timeoutMs as number) || 10000, 30000); // Max 30s

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...headers },
        body: method !== 'GET' ? body : undefined,
        signal: controller.signal,
      });

      const responseText = await response.text();
      // Limit response size
      const truncated = responseText.length > 65536 ? responseText.slice(0, 65536) : responseText;

      return {
        status: response.ok ? 'success' : 'failure',
        data: { statusCode: response.status, body: truncated },
        error: response.ok ? undefined : `HTTP ${response.status}`,
        errorCategory: response.ok ? undefined : 'EXTERNAL_SERVICE_ERROR',
      };
    } catch (error: any) {
      const isTimeout = error.name === 'AbortError';
      return {
        status: 'failure',
        error: isTimeout ? 'Request timed out' : error.message,
        errorCategory: isTimeout ? 'TIMEOUT' : 'EXTERNAL_SERVICE_ERROR',
      };
    } finally {
      clearTimeout(timeout);
    }
  },
};

// --- TRANSFORM_DATA Action: Safe field mapping/extraction ---
export const TransformDataAction: ActionHandler = {
  type: 'TRANSFORM_DATA',
  capabilities: [],
  validate(config) {
    if (!config.mappings || typeof config.mappings !== 'object') {
      return { valid: false, errors: ['TRANSFORM_DATA requires a "mappings" object'] };
    }
    return { valid: true };
  },
  async execute(context, config): Promise<StepResult> {
    const mappings = config.mappings as Record<string, string>;
    const result: Record<string, unknown> = {};

    for (const [outputKey, inputPath] of Object.entries(mappings)) {
      // Resolve from execution variables
      const parts = inputPath.split('.');
      let value: unknown = context.variables;
      for (const part of parts) {
        if (value === null || value === undefined || typeof value !== 'object') { value = undefined; break; }
        value = (value as Record<string, unknown>)[part];
      }
      result[outputKey] = value;
    }

    return { status: 'success', data: result };
  },
};

// --- SEND_NOTIFICATION Action: Placeholder for future notification dispatch ---
export const SendNotificationAction: ActionHandler = {
  type: 'SEND_NOTIFICATION',
  capabilities: ['notification'],
  validate(config) {
    const errors: string[] = [];
    if (!config.channel || typeof config.channel !== 'string') errors.push('Requires "channel" string');
    if (!config.message || typeof config.message !== 'string') errors.push('Requires "message" string');
    return { valid: errors.length === 0, errors };
  },
  async execute(context, config): Promise<StepResult> {
    // In a real system this would dispatch to email/slack/webhook
    logger.info({
      message: `[Notification] channel=${config.channel} message=${config.message}`,
      module: 'engine',
      executionId: context.executionId,
    });
    return { status: 'success', data: { sent: true, channel: config.channel } };
  },
};
