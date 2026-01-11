"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authService_1 = require("../services/authService");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
/**
 * POST /auth/register
 * Register a new user account
 */
router.post('/register', async (req, res) => {
    try {
        const { email, password, walletAddress } = req.body;
        if (!email || !password) {
            res.status(400).json({ error: 'Email and password are required' });
            return;
        }
        const result = await authService_1.authService.register(email, password, walletAddress);
        res.status(201).json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        res.status(400).json({
            error: error instanceof Error ? error.message : 'Registration failed',
        });
    }
});
/**
 * POST /auth/login
 * Login user and receive JWT token
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ error: 'Email and password are required' });
            return;
        }
        const result = await authService_1.authService.login(email, password);
        res.json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        res.status(401).json({
            error: error instanceof Error ? error.message : 'Login failed',
        });
    }
});
/**
 * GET /auth/me
 * Get current user information
 */
router.get('/me', auth_1.authenticate, async (req, res) => {
    try {
        const { prisma } = await Promise.resolve().then(() => __importStar(require('../config/database')));
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                email: true,
                walletAddress: true,
                roles: true,
                createdAt: true,
                provider: true,
                providerId: true,
                displayName: true,
                bio: true,
                avatarUrl: true,
            },
        });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        res.json({
            success: true,
            data: user,
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch user data' });
    }
});
/**
 * POST /auth/google
 * Login or register with Google OAuth
 */
router.post('/google', async (req, res) => {
    try {
        const { providerId, email, name } = req.body;
        if (!providerId || !email) {
            res.status(400).json({ error: 'providerId and email are required' });
            return;
        }
        const result = await authService_1.authService.loginWithOAuth('google', providerId, email, name);
        res.json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        res.status(400).json({
            error: error instanceof Error ? error.message : 'Google authentication failed',
        });
    }
});
/**
 * POST /auth/apple
 * Login or register with Apple OAuth
 */
router.post('/apple', async (req, res) => {
    try {
        const { providerId, email, name } = req.body;
        if (!providerId || !email) {
            res.status(400).json({ error: 'providerId and email are required' });
            return;
        }
        const result = await authService_1.authService.loginWithOAuth('apple', providerId, email, name);
        res.json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        res.status(400).json({
            error: error instanceof Error ? error.message : 'Apple authentication failed',
        });
    }
});
/**
 * POST /auth/dndbeyond
 * Login or register with D&D Beyond OAuth
 *
 * NOTE: D&D Beyond does not currently offer a public OAuth API.
 * This endpoint is prepared for future integration or partner access.
 * For now, you would need to contact D&D Beyond for API access.
 */
router.post('/dndbeyond', async (req, res) => {
    try {
        const { providerId, email, name } = req.body;
        if (!providerId || !email) {
            res.status(400).json({ error: 'providerId and email are required' });
            return;
        }
        const result = await authService_1.authService.loginWithOAuth('dndbeyond', providerId, email, name);
        res.json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        res.status(400).json({
            error: error instanceof Error ? error.message : 'D&D Beyond authentication failed',
        });
    }
});
/**
 * PUT /auth/wallet
 * Update user wallet address
 */
router.put('/wallet', auth_1.authenticate, async (req, res) => {
    try {
        const { walletAddress } = req.body;
        if (!walletAddress) {
            res.status(400).json({ error: 'Wallet address is required' });
            return;
        }
        await authService_1.authService.updateWalletAddress(req.user.id, walletAddress);
        res.json({
            success: true,
            message: 'Wallet address updated',
        });
    }
    catch (error) {
        res.status(400).json({
            error: error instanceof Error ? error.message : 'Failed to update wallet address',
        });
    }
});
/**
 * PUT /auth/profile
 * Update user profile (displayName, bio)
 */
router.put('/profile', auth_1.authenticate, async (req, res) => {
    try {
        const { displayName, bio, avatarUrl } = req.body;
        await authService_1.authService.updateProfile(req.user.id, displayName, bio, avatarUrl);
        res.json({
            success: true,
            message: 'Profile updated',
        });
    }
    catch (error) {
        res.status(400).json({
            error: error instanceof Error ? error.message : 'Failed to update profile',
        });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map