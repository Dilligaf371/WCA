"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const zod_1 = require("zod");
const dotenv_1 = __importDefault(require("dotenv"));
// Load .env file
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    // Database
    DATABASE_URL: zod_1.z.string().min(1),
    // Server
    PORT: zod_1.z.coerce.number().default(3000),
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    JWT_SECRET: zod_1.z.string().min(32),
    JWT_EXPIRES_IN: zod_1.z.string().default('7d'),
    // Redis
    REDIS_URL: zod_1.z.string().url().optional(),
    // Polygon
    POLYGON_RPC_URL: zod_1.z.string().min(1),
    POLYGON_PRIVATE_KEY: zod_1.z.string().min(1),
    FIGURINE_CONTRACT_ADDRESS: zod_1.z.string().optional(),
    // IPFS
    IPFS_GATEWAY_URL: zod_1.z.string().url().optional(),
    IPFS_API_URL: zod_1.z.string().url().optional(),
    IPFS_JWT_TOKEN: zod_1.z.string().optional(),
    // D&D Beyond (optional)
    DND_BEYOND_API_URL: zod_1.z.string().url().optional(),
    DND_BEYOND_API_KEY: zod_1.z.string().optional(),
    // Security
    BCRYPT_ROUNDS: zod_1.z.coerce.number().default(12),
});
let env;
try {
    exports.env = env = envSchema.parse(process.env);
}
catch (error) {
    if (error instanceof zod_1.z.ZodError) {
        console.error('[Config] Environment validation failed:');
        error.errors.forEach((err) => {
            console.error(`  - ${err.path.join('.')}: ${err.message}`);
        });
        process.exit(1);
    }
    throw error;
}
