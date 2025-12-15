import { Request, Response, NextFunction } from 'express';

/**
 * Custom Error Classes
 * Aligned with existing error handling patterns in Supabase Edge Functions
 */
export class APIError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export class ValidationError extends APIError {
  constructor(message: string, details?: unknown) {
    super(400, 'VALIDATION_ERROR', message, details);
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends APIError {
  constructor(message = 'Unauthorized') {
    super(401, 'UNAUTHORIZED', message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends APIError {
  constructor(message = 'Forbidden') {
    super(403, 'FORBIDDEN', message);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends APIError {
  constructor(message = 'Resource not found') {
    super(404, 'NOT_FOUND', message);
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends APIError {
  constructor(message = 'Rate limit exceeded') {
    super(429, 'RATE_LIMIT_EXCEEDED', message);
    this.name = 'RateLimitError';
  }
}

export class AnalysisTimeoutError extends APIError {
  constructor(message = 'Analysis timeout - please try again') {
    super(504, 'ANALYSIS_TIMEOUT', message);
    this.name = 'AnalysisTimeoutError';
  }
}

/**
 * Global Error Handler Middleware
 *
 * Catches all errors and formats them consistently.
 * Logs errors for debugging but doesn't expose internal details to clients.
 *
 * Error response format aligned with existing Edge Function patterns:
 * {
 *   error: string,      // User-friendly message
 *   code: string,       // Machine-readable error code
 *   details?: unknown   // Additional info (dev only)
 * }
 */
export function errorHandler(
  err: Error | APIError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  // Log error for debugging
  console.error('Error occurred:', {
    name: err.name,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method
  });

  // Handle known API errors
  if (err instanceof APIError) {
    res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
      ...(process.env.NODE_ENV === 'development' && err.details ? { details: err.details } : {})
    });
    return;
  }

  // Handle unknown errors (don't expose internals)
  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' ? { message: err.message } : {})
  });
}
