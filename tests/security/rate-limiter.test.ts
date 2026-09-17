import { describe, it, expect } from 'vitest';
import { checkRateLimit } from '@/lib/security/rate-limiter';

describe('Rate Limiter', () => {
  it('allows requests within the limit', () => {
    const key = 'test-rl-allow-' + Date.now();
    const result = checkRateLimit(key, 5, 60000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it('blocks requests exceeding the limit', () => {
    const key = 'test-rl-block-' + Date.now();
    for (let i = 0; i < 5; i++) {
      checkRateLimit(key, 5, 60000);
    }
    const result = checkRateLimit(key, 5, 60000);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('resets after the window expires', async () => {
    const key = 'test-rl-reset-' + Date.now();
    // Use a 10ms window
    checkRateLimit(key, 1, 10);

    // Wait for window to expire
    await new Promise(resolve => setTimeout(resolve, 15));
    
    const result = checkRateLimit(key, 1, 10);
    // The old window should have expired
    expect(result.allowed).toBe(true);
  });
});
