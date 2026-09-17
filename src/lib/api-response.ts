import { NextResponse } from 'next/server';
import { getRequestId } from './request-context';
import { AppError } from './errors';
import { logger } from './logger';

export function successResponse<T>(data: T, status: number = 200) {
  return NextResponse.json({
    success: true,
    data,
    meta: {
      requestId: getRequestId(),
      timestamp: new Date().toISOString()
    }
  }, { status });
}

export function errorResponse(error: unknown) {
  let statusCode = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'An unexpected error occurred';

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    code = error.code;
    message = error.message;
    
    if (statusCode >= 500) {
      logger.error({ message: 'API Error', code }, error);
    } else {
      logger.info({ message: 'API Client Error', code, detail: message });
    }
  } else if (error instanceof Error) {
    logger.error({ message: 'Unhandled API Error' }, error);
  }

  return NextResponse.json({
    success: false,
    error: {
      code,
      message,
    },
    meta: {
      requestId: getRequestId(),
      timestamp: new Date().toISOString()
    }
  }, { status: statusCode });
}
