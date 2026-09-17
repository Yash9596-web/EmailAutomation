import { describe, it, expect } from 'vitest';
import {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  TimeoutError,
  DependencyFailureError,
  DatabaseError,
} from '@/lib/errors';

describe('Error Taxonomy', () => {
  it('ValidationError has correct code and status', () => {
    const err = new ValidationError('bad input');
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.statusCode).toBe(400);
    expect(err.isOperational).toBe(true);
    expect(err).toBeInstanceOf(AppError);
    expect(err).toBeInstanceOf(Error);
  });

  it('AuthenticationError defaults correctly', () => {
    const err = new AuthenticationError();
    expect(err.code).toBe('AUTHENTICATION_ERROR');
    expect(err.statusCode).toBe(401);
  });

  it('AuthorizationError defaults correctly', () => {
    const err = new AuthorizationError();
    expect(err.code).toBe('AUTHORIZATION_ERROR');
    expect(err.statusCode).toBe(403);
  });

  it('ForbiddenError is an alias for AuthorizationError', () => {
    const err = new ForbiddenError();
    expect(err).toBeInstanceOf(AuthorizationError);
    expect(err.statusCode).toBe(403);
  });

  it('NotFoundError has correct code and status', () => {
    const err = new NotFoundError('invoice');
    expect(err.code).toBe('NOT_FOUND');
    expect(err.statusCode).toBe(404);
  });

  it('ConflictError has correct code and status', () => {
    const err = new ConflictError();
    expect(err.code).toBe('CONFLICT');
    expect(err.statusCode).toBe(409);
  });

  it('RateLimitError has correct code and status', () => {
    const err = new RateLimitError();
    expect(err.code).toBe('RATE_LIMITED');
    expect(err.statusCode).toBe(429);
  });

  it('TimeoutError has correct code and status', () => {
    const err = new TimeoutError();
    expect(err.code).toBe('TIMEOUT');
    expect(err.statusCode).toBe(504);
  });

  it('DependencyFailureError has correct code and status', () => {
    const err = new DependencyFailureError();
    expect(err.code).toBe('DEPENDENCY_FAILURE');
    expect(err.statusCode).toBe(502);
  });

  it('DatabaseError has correct code and status', () => {
    const err = new DatabaseError();
    expect(err.code).toBe('DATABASE_ERROR');
    expect(err.statusCode).toBe(500);
  });

  it('All errors capture stack traces', () => {
    const err = new ValidationError('test');
    expect(err.stack).toBeDefined();
    expect(err.stack).toContain('errors.test.ts');
  });
});
