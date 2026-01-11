import { RedisClientType } from 'redis';
/**
 * Initialize Redis client for caching and distributed locking
 * Used for NFC binding operations to prevent race conditions
 */
export declare const getRedisClient: () => Promise<RedisClientType>;
/**
 * Acquire a distributed lock using Redis
 * @param key Lock key
 * @param ttl Time-to-live in seconds (default: 30)
 * @returns Lock identifier if acquired, null otherwise
 */
export declare const acquireLock: (key: string, ttl?: number) => Promise<string | null>;
/**
 * Release a distributed lock
 * @param key Lock key
 * @param lockValue Lock identifier from acquireLock
 */
export declare const releaseLock: (key: string, lockValue: string) => Promise<void>;
export declare const closeRedis: () => Promise<void>;
//# sourceMappingURL=redis.d.ts.map