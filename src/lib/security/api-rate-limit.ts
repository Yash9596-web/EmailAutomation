import { NextResponse } from 'next/server';
import { checkRateLimit } from './rate-limiter';

/**
 * Apply rate limiting to an API route handler.
 * Returns a 429 response if limit exceeded, null if allowed.
 */
export function applyRateLimit(
  request: Request,
  endpoint: string,
  maxRequests = 60,
  windowMs = 60_000
): NextResponse | null {
  // Use forwarded IP or fallback
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const key = `${ip}:${endpoint}`;

  const result = checkRateLimit(key, maxRequests, windowMs);

  if (!result.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'RATE_LIMITED', message: 'Too many requests. Please try again later.' },
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)),
          'X-RateLimit-Limit': String(maxRequests),
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }

  return null; // Allowed
}
