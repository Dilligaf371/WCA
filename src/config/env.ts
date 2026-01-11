import { z } from 'zod';
import dotenv from 'dotenv';

// Load .env file
dotenv.config();

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1),
  
  // Server
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),
  
  // Redis
  REDIS_URL: z.string().url().optional(),
  
  // Polygon
  POLYGON_RPC_URL: z.string().min(1),
  POLYGON_PRIVATE_KEY: z.string().min(1),
  FIGURINE_CONTRACT_ADDRESS: z.string().optional(),
  
  // IPFS
  IPFS_GATEWAY_URL: z.string().url().optional(),
  IPFS_API_URL: z.string().url().optional(),
  IPFS_JWT_TOKEN: z.string().optional(),
  
  // D&D Beyond (optional)
  DND_BEYOND_API_URL: z.string().url().optional(),
  DND_BEYOND_API_KEY: z.string().optional(),
  
  // Security
  BCRYPT_ROUNDS: z.coerce.number().default(12),
});

export type Env = z.infer<typeof envSchema>;

let env: Env;

try {
  env = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('[Config] Environment validation failed:');
    error.errors.forEach((err) => {
      console.error(`  - ${err.path.join('.')}: ${err.message}`);
    });
    process.exit(1);
  }
  throw error;
}

export { env };
