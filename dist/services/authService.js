"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../config/database");
const env_1 = require("../config/env");
const client_1 = require("@prisma/client");
/**
 * Authentication Service
 * Handles user registration, login, and JWT token management
 */
class AuthService {
    /**
     * Register a new user
     */
    async register(email, password, walletAddress) {
        // Validate email
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            throw new Error('Invalid email format');
        }
        // Validate password strength
        if (password.length < 8) {
            throw new Error('Password must be at least 8 characters');
        }
        // Validate wallet address if provided
        if (walletAddress && !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
            throw new Error('Invalid wallet address format');
        }
        // Check if user already exists
        const existing = await database_1.prisma.user.findUnique({
            where: { email },
        });
        if (existing) {
            throw new Error('User already exists');
        }
        // Check wallet address uniqueness if provided
        if (walletAddress) {
            const existingWallet = await database_1.prisma.user.findUnique({
                where: { walletAddress },
            });
            if (existingWallet) {
                throw new Error('Wallet address already registered');
            }
        }
        // Hash password
        const passwordHash = await bcryptjs_1.default.hash(password, env_1.env.BCRYPT_ROUNDS);
        // Create user
        const user = await database_1.prisma.user.create({
            data: {
                email,
                passwordHash,
                walletAddress: walletAddress || null,
                provider: null,
                providerId: null,
            },
            select: {
                id: true,
                email: true,
                walletAddress: true,
            },
        });
        // Generate JWT token
        const token = this.generateToken(user.id, user.email, [client_1.UserRole.USER]);
        return { user, token };
    }
    /**
     * Login user
     */
    async login(email, password) {
        const user = await database_1.prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            throw new Error('Invalid email or password');
        }
        // Check if user is OAuth-only (no password)
        if (!user.passwordHash) {
            throw new Error('This account uses OAuth login. Please use Google or Apple sign-in.');
        }
        // Verify password
        const isValid = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isValid) {
            throw new Error('Invalid email or password');
        }
        // Update last login
        await database_1.prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });
        // Generate JWT token
        const token = this.generateToken(user.id, user.email, [user.roles]);
        return {
            user: {
                id: user.id,
                email: user.email,
                walletAddress: user.walletAddress,
            },
            token,
        };
    }
    /**
     * Generate JWT token
     */
    generateToken(userId, email, roles) {
        const payload = {
            userId,
            email,
            roles,
        };
        return jsonwebtoken_1.default.sign(payload, env_1.env.JWT_SECRET, {
            expiresIn: env_1.env.JWT_EXPIRES_IN,
        });
    }
    /**
     * Verify JWT token
     */
    verifyToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
        }
        catch (error) {
            throw new Error('Invalid or expired token');
        }
    }
    /**
     * Register or login with OAuth provider (Google/Apple/D&D Beyond)
     */
    async loginWithOAuth(provider, providerId, email, name) {
        // Validate email
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            throw new Error('Invalid email format');
        }
        // Check if user exists with this provider
        let user = await database_1.prisma.user.findFirst({
            where: {
                provider,
                providerId,
            },
        });
        if (user) {
            // User exists, update last login
            await database_1.prisma.user.update({
                where: { id: user.id },
                data: { lastLoginAt: new Date() },
            });
            const token = this.generateToken(user.id, user.email, [user.roles]);
            return {
                user: {
                    id: user.id,
                    email: user.email,
                    walletAddress: user.walletAddress,
                },
                token,
            };
        }
        // Check if user exists with same email but different provider
        const existingByEmail = await database_1.prisma.user.findUnique({
            where: { email },
        });
        if (existingByEmail) {
            // Link OAuth account to existing user
            if (existingByEmail.passwordHash) {
                throw new Error('An account with this email already exists. Please use email/password login.');
            }
            // Update existing user with OAuth info
            user = await database_1.prisma.user.update({
                where: { id: existingByEmail.id },
                data: {
                    provider,
                    providerId,
                    oauthEmail: email,
                    lastLoginAt: new Date(),
                },
            });
        }
        else {
            // Create new user with OAuth
            user = await database_1.prisma.user.create({
                data: {
                    email,
                    provider,
                    providerId,
                    oauthEmail: email,
                    passwordHash: null, // OAuth users don't have passwords
                    roles: client_1.UserRole.USER,
                },
            });
        }
        const token = this.generateToken(user.id, user.email, [user.roles]);
        return {
            user: {
                id: user.id,
                email: user.email,
                walletAddress: user.walletAddress,
            },
            token,
        };
    }
    /**
     * Update user wallet address
     */
    async updateWalletAddress(userId, walletAddress) {
        if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
            throw new Error('Invalid wallet address format');
        }
        // Check if wallet is already in use
        const existing = await database_1.prisma.user.findUnique({
            where: { walletAddress },
        });
        if (existing && existing.id !== userId) {
            throw new Error('Wallet address already registered to another user');
        }
        await database_1.prisma.user.update({
            where: { id: userId },
            data: { walletAddress },
        });
    }
    /**
     * Update user profile (displayName, bio, avatarUrl)
     */
    async updateProfile(userId, displayName, bio, avatarUrl) {
        const updateData = {};
        if (displayName !== undefined) {
            updateData.displayName = displayName.trim() || null;
        }
        if (bio !== undefined) {
            updateData.bio = bio.trim() || null;
        }
        if (avatarUrl !== undefined) {
            updateData.avatarUrl = avatarUrl.trim() || null;
        }
        // Only update if there's data to update
        if (Object.keys(updateData).length > 0) {
            await database_1.prisma.user.update({
                where: { id: userId },
                data: updateData,
            });
        }
    }
}
exports.AuthService = AuthService;
exports.authService = new AuthService();
//# sourceMappingURL=authService.js.map