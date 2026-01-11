import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { prisma } from './config/database';
import { getRedisClient, closeRedis } from './config/redis';

// Routes
import authRoutes from './routes/auth';
import characterRoutes from './routes/characters';
import figurineRoutes from './routes/figurines';
import nftRoutes from './routes/nfts';

const app: Express = express();

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Check Redis connection (optional)
    let redisStatus = 'disconnected';
    try {
      const redis = await getRedisClient();
      if (redis && redis.isOpen) {
        redisStatus = 'connected';
      }
    } catch (error) {
      // Redis is optional, don't fail health check
    }

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'WarChain Arena Platform',
      database: 'connected',
      redis: redisStatus,
      version: '1.0.0',
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed',
    });
  }
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/characters', characterRoutes);
app.use('/api/figurines', figurineRoutes);
app.use('/api/nfts', nftRoutes);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'WarChain Arena Platform API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        me: 'GET /api/auth/me',
        wallet: 'PUT /api/auth/wallet',
        profile: 'PUT /api/auth/profile',
      },
      characters: {
        import: 'POST /api/characters/import',
        list: 'GET /api/characters',
        get: 'GET /api/characters/:id',
        delete: 'DELETE /api/characters/:id',
        sync: 'POST /api/characters/:id/sync',
        checkSync: 'GET /api/characters/:id/check-sync',
      },
      figurines: {
        bind: 'POST /api/figurines/bind',
        list: 'GET /api/figurines',
        get: 'GET /api/figurines/:id',
        linkCharacter: 'POST /api/figurines/:id/link-character',
        unlinkCharacter: 'DELETE /api/figurines/:id/unlink-character',
        nfcScan: 'GET /api/figurines/nfc/:nfcUid',
      },
      nfts: {
        mint: 'POST /api/nfts/mint',
        verify: 'GET /api/nfts/verify/:figurineId',
        owner: 'GET /api/nfts/owner/:tokenId',
      },
    },
  });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[Server] Error:', err);

  res.status(500).json({
    success: false,
    error: env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
  });
});

// Start server
async function startServer() {
  try {
    // Initialize Redis connection
    try {
      await getRedisClient();
      console.log('[Server] Redis connected');
    } catch (error) {
      console.warn('[Server] Redis connection failed (optional):', error);
    }

    // Verify database connection
    await prisma.$connect();
    console.log('[Server] Database connected');

    const PORT = env.PORT;
    app.listen(PORT, () => {
      console.log(`[Server] WarChain Arena Platform running on port ${PORT}`);
      console.log(`[Server] Environment: ${env.NODE_ENV}`);
      console.log(`[Server] Health check: http://localhost:${PORT}/health`);
      console.log(`[Server] API docs: http://localhost:${PORT}/`);
    });
  } catch (error) {
    console.error('[Server] Failed to start:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[Server] SIGTERM signal received: shutting down gracefully');
  await prisma.$disconnect();
  await closeRedis();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('[Server] SIGINT signal received: shutting down gracefully');
  await prisma.$disconnect();
  await closeRedis();
  process.exit(0);
});

// Start the server
startServer();

export default app;
