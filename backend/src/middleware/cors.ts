import cors from 'cors';

/**
 * CORS Configuration
 *
 * Allows requests from:
 * - Production: aimpactscanner.com
 * - Staging: develop--aimpactscanner.netlify.app
 * - Local dev: localhost:5173
 *
 * Aligned with existing Netlify deployment architecture from architecture.md
 *
 * SECURITY: Only allow specific origins to prevent CSRF attacks
 */

const getAllowedOrigins = (): string[] => {
  const origins = process.env.ALLOWED_ORIGINS?.split(',') || [];

  // Default allowed origins for development
  const defaultOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
  ];

  // Production and staging origins (only in production/staging)
  if (process.env.NODE_ENV === 'production') {
    return [
      'https://aimpactscanner.com',
      'https://www.aimpactscanner.com',
      'https://develop--aimpactscanner.netlify.app',
      ...origins
    ];
  }

  return [...defaultOrigins, ...origins];
};

const allowedOrigins = getAllowedOrigins();

export const corsMiddleware = cors({
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (mobile apps, Postman, curl, etc.)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining'],
  maxAge: 86400 // 24 hours
});
