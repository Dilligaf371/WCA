"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeRedis = exports.releaseLock = exports.acquireLock = exports.getRedisClient = void 0;
const redis_1 = require("redis");
let redisClient = null;
/**
 * Initialize Redis client for caching and distributed locking
 * Used for NFC binding operations to prevent race conditions
 */
const getRedisClient = async () => {
    if (redisClient && redisClient.isOpen) {
        return redisClient;
    }
    const url = process.env.REDIS_URL || 'redis://localhost:6379';
    redisClient = (0, redis_1.createClient)({
        url,
        socket: {
            reconnectStrategy: (retries) => {
                if (retries > 10) {
                    console.error('[Redis] Max reconnection attempts reached');
                    return new Error('Max reconnection attempts reached');
                }
                return Math.min(retries * 100, 3000);
            },
        },
    });
    redisClient.on('error', (err) => {
        console.error('[Redis] Error:', err);
    });
    redisClient.on('connect', () => {
        console.log('[Redis] Connected');
    });
    await redisClient.connect();
    return redisClient;
};
exports.getRedisClient = getRedisClient;
/**
 * Acquire a distributed lock using Redis
 * @param key Lock key
 * @param ttl Time-to-live in seconds (default: 30)
 * @returns Lock identifier if acquired, null otherwise
 */
const acquireLock = async (key, ttl = 30) => {
    const client = await (0, exports.getRedisClient)();
    const lockValue = `${Date.now()}-${Math.random()}`;
    const lockKey = `lock:${key}`;
    try {
        // SET key value NX EX ttl - only set if not exists, with expiration
        const result = await client.setNX(lockKey, lockValue);
        if (result) {
            await client.expire(lockKey, ttl);
            return lockValue;
        }
        return null;
    }
    catch (error) {
        console.error(`[Redis] Failed to acquire lock for ${key}:`, error);
        return null;
    }
};
exports.acquireLock = acquireLock;
/**
 * Release a distributed lock
 * @param key Lock key
 * @param lockValue Lock identifier from acquireLock
 */
const releaseLock = async (key, lockValue) => {
    const client = await (0, exports.getRedisClient)();
    const lockKey = `lock:${key}`;
    try {
        // Use Lua script to ensure we only delete our own lock
        const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
        await client.eval(script, {
            keys: [lockKey],
            arguments: [lockValue],
        });
    }
    catch (error) {
        console.error(`[Redis] Failed to release lock for ${key}:`, error);
    }
};
exports.releaseLock = releaseLock;
const closeRedis = async () => {
    if (redisClient && redisClient.isOpen) {
        await redisClient.quit();
        redisClient = null;
    }
};
exports.closeRedis = closeRedis;
//# sourceMappingURL=redis.js.map