import { Request, Response, NextFunction } from 'express';

/**
 * Request Logger Middleware
 *
 * Logs incoming requests for debugging and monitoring.
 * In production, this would integrate with a proper logging service.
 *
 * Output format aligned with existing Edge Function logging patterns.
 */
export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const start = Date.now();

  // Log when response finishes
  res.on('finish', () => {
    const duration = Date.now() - start;

    // Color code by status
    const statusColor = res.statusCode >= 500 ? '\x1b[31m' : // Red for 5xx
                       res.statusCode >= 400 ? '\x1b[33m' : // Yellow for 4xx
                       res.statusCode >= 300 ? '\x1b[36m' : // Cyan for 3xx
                       '\x1b[32m'; // Green for 2xx
    const reset = '\x1b[0m';

    console.log(
      `${statusColor}${req.method}${reset} ${req.path} ` +
      `${statusColor}${res.statusCode}${reset} ${duration}ms`
    );
  });

  next();
}
