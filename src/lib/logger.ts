import { getCorrelationId, executionContext } from './observability/context';

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

interface LogPayload {
  message: string;
  module?: string;
  [key: string]: any;
}

const REDACTED_KEYS = new Set([
  'password', 'apikey', 'api_key', 'token', 'authorization', 'secret', 'accesstoken', 'refreshtoken', 'credential'
]);

function redactData(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(redactData);
  }

  const redacted: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (REDACTED_KEYS.has(key.toLowerCase())) {
      redacted[key] = '[REDACTED]';
    } else {
      redacted[key] = redactData(value);
    }
  }
  return redacted;
}

class Logger {
  private log(level: LogLevel, payload: string | LogPayload, error?: Error) {
    const timestamp = new Date().toISOString();
    const context = executionContext.getStore();
    const correlationId = context?.correlationId;
    const tenantId = context?.tenantId;

    let logEntry: Record<string, any> = {
      timestamp,
      level,
      correlationId,
      tenantId,
    };

    if (typeof payload === 'string') {
      logEntry.message = payload;
    } else {
      Object.assign(logEntry, redactData(payload));
    }

    if (error) {
      logEntry.error = {
        message: error.message,
        name: error.name,
        // Only include stack in development, or rely on external APM internally
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      };
    }

    // Always use structured JSON logs
    const formattedMessage = JSON.stringify(logEntry);

    switch (level) {
      case 'debug':
        if (process.env.NODE_ENV !== 'production') console.debug(formattedMessage);
        break;
      case 'info':
        console.info(formattedMessage);
        break;
      case 'warn':
        console.warn(formattedMessage);
        break;
      case 'error':
      case 'fatal':
        console.error(formattedMessage);
        break;
    }
  }

  debug(payload: string | LogPayload) { this.log('debug', payload); }
  info(payload: string | LogPayload) { this.log('info', payload); }
  warn(payload: string | LogPayload) { this.log('warn', payload); }
  error(payload: string | LogPayload, error?: Error) { this.log('error', payload, error); }
  fatal(payload: string | LogPayload, error?: Error) { this.log('fatal', payload, error); }
}

export const logger = new Logger();
