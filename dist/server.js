"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const env_1 = require("./config/env");
const database_1 = require("./config/database");
const redis_1 = require("./config/redis");
// Routes
const auth_1 = __importDefault(require("./routes/auth"));
const characters_1 = __importDefault(require("./routes/characters"));
const figurines_1 = __importDefault(require("./routes/figurines"));
const nfts_1 = __importDefault(require("./routes/nfts"));
const app = (0, express_1.default)();
// CORS configuration
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
}));
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', limiter);
// Body parsing middleware
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        // Check database connection
        await database_1.prisma.$queryRaw `SELECT 1`;
        // Check Redis connection (optional)
        let redisStatus = 'disconnected';
        try {
            const redis = await (0, redis_1.getRedisClient)();
            if (redis && redis.isOpen) {
                redisStatus = 'connected';
            }
        }
        catch (error) {
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
    }
    catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: 'Database connection failed',
        });
    }
});
// API routes
app.use('/api/auth', auth_1.default);
app.use('/api/characters', characters_1.default);
app.use('/api/figurines', figurines_1.default);
app.use('/api/nfts', nfts_1.default);
// Root endpoint
app.get('/', (req, res) => {
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
app.use((err, req, res, next) => {
    console.error('[Server] Error:', err);
    res.status(500).json({
        success: false,
        error: env_1.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
        ...(env_1.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
});
// 404 handler
app.use((req, res) => {
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
            await (0, redis_1.getRedisClient)();
            console.log('[Server] Redis connected');
        }
        catch (error) {
            console.warn('[Server] Redis connection failed (optional):', error);
        }
        // Verify database connection
        await database_1.prisma.$connect();
        console.log('[Server] Database connected');
        const PORT = env_1.env.PORT;
        app.listen(PORT, () => {
            console.log(`[Server] WarChain Arena Platform running on port ${PORT}`);
            console.log(`[Server] Environment: ${env_1.env.NODE_ENV}`);
            console.log(`[Server] Health check: http://localhost:${PORT}/health`);
            console.log(`[Server] API docs: http://localhost:${PORT}/`);
        });
    }
    catch (error) {
        console.error('[Server] Failed to start:', error);
        process.exit(1);
    }
}
// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('[Server] SIGTERM signal received: shutting down gracefully');
    await database_1.prisma.$disconnect();
    await (0, redis_1.closeRedis)();
    process.exit(0);
});
process.on('SIGINT', async () => {
    console.log('[Server] SIGINT signal received: shutting down gracefully');
    await database_1.prisma.$disconnect();
    await (0, redis_1.closeRedis)();
    process.exit(0);
});
// Start the server
startServer();
exports.default = app;
//# sourceMappingURL=server.js.map