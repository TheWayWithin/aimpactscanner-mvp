import express, { Request, Response } from 'express';
import compression from 'compression';
import helmet from 'helmet';
import { config } from 'dotenv';
import { corsMiddleware } from './middleware/cors';
import { errorHandler } from './middleware/error-handler';
import { requestLogger } from './middleware/logger';
import { globalRateLimiter } from './middleware/rate-limit';
import analyzeRoutes from './routes/analyze';
import llmstxtRoutes from './routes/llmstxt';

// Load environment variables
config();

const app = express();
const PORT = process.env.PORT || 3001;

// Trust Railway's reverse proxy for accurate client IP detection
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(compression());
app.use(corsMiddleware);
app.use(express.json({ limit: '10mb' }));
app.use(requestLogger);
app.use(globalRateLimiter);

// Health check endpoint (no auth required)
// Used by Railway for health monitoring
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'aimpactscanner-backend',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/analyze', analyzeRoutes);
app.use('/api/llmstxt', llmstxtRoutes);

// Error handling (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 AImpactScanner Backend running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔒 CORS enabled for: ${process.env.ALLOWED_ORIGINS || 'localhost'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

export default app;
