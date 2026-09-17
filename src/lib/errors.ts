export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, code: string = 'INTERNAL_ERROR', statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) { super(message, 'VALIDATION_ERROR', 400); }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') { super(message, 'AUTHENTICATION_ERROR', 401); }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Permission denied') { super(message, 'AUTHORIZATION_ERROR', 403); }
}

// Backward compatibility alias
export const ForbiddenError = AuthorizationError;

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') { super(message, 'NOT_FOUND', 404); }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') { super(message, 'CONFLICT', 409); }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') { super(message, 'RATE_LIMITED', 429); }
}

export class TimeoutError extends AppError {
  constructor(message: string = 'Request timeout') { super(message, 'TIMEOUT', 504); }
}

export class DependencyFailureError extends AppError {
  constructor(message: string = 'External dependency failed') { super(message, 'DEPENDENCY_FAILURE', 502); }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed') { super(message, 'DATABASE_ERROR', 500); }
}
