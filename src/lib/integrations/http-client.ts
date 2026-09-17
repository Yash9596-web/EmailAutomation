import { logger } from '@/lib/logger';

export interface HttpClientOptions extends RequestInit {
  timeoutMs?: number;
  maxRetries?: number;
  idempotencyKey?: string;
}

export class ProviderHttpClient {
  /**
   * Safe fetch wrapper with timeout, retries, and error normalization.
   */
  static async request(url: string, options: HttpClientOptions = {}): Promise<Response> {
    const { timeoutMs = 15000, maxRetries = 2, ...fetchOptions } = options;
    
    let attempt = 0;
    while (attempt <= maxRetries) {
      attempt++;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const res = await fetch(url, {
          ...fetchOptions,
          signal: controller.signal,
          headers: {
            ...fetchOptions.headers,
            ...(options.idempotencyKey ? { 'Idempotency-Key': options.idempotencyKey } : {}),
          },
        });
        
        clearTimeout(timeoutId);

        if (res.ok) return res;

        // Handle retryable statuses
        if ([408, 429, 500, 502, 503, 504].includes(res.status) && attempt <= maxRetries) {
          const retryAfter = res.headers.get('Retry-After');
          const delay = retryAfter ? parseInt(retryAfter, 10) * 1000 : attempt * 2000;
          await new Promise(r => setTimeout(r, Math.min(delay, 10000)));
          continue;
        }

        // Permanent failure
        throw await this.normalizeError(res);

      } catch (error: any) {
        clearTimeout(timeoutId);
        
        const isNetworkOrTimeout = error.name === 'AbortError' || error.code === 'ECONNREFUSED';
        if (isNetworkOrTimeout && attempt <= maxRetries) {
          await new Promise(r => setTimeout(r, attempt * 2000));
          continue;
        }
        
        throw this.normalizeLocalError(error);
      }
    }

    throw new Error('Unreachable code in HttpClient');
  }

  private static async normalizeError(res: Response) {
    let bodyText = '';
    try { bodyText = await res.text(); } catch (e) {}

    const errorDetails = bodyText.slice(0, 1024); // Cap length for safety

    switch (res.status) {
      case 401: return new Error(`AUTHENTICATION_FAILED: Provider rejected credentials`);
      case 403: return new Error(`AUTHORIZATION_FAILED: Provider rejected capability access`);
      case 404: return new Error(`NOT_FOUND: External resource not found`);
      case 429: return new Error(`RATE_LIMITED: Provider rate limit exceeded`);
      default: return new Error(`PROVIDER_ERROR: Provider returned HTTP ${res.status} - ${errorDetails}`);
    }
  }

  private static normalizeLocalError(error: any) {
    if (error.name === 'AbortError') return new Error('TIMEOUT: Provider request timed out');
    return new Error(`NETWORK_ERROR: Failed to reach provider (${error.message})`);
  }
}
