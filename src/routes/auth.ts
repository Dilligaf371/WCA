import { Router, Request, Response } from 'express';
import { authService } from '../services/authService';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * POST /auth/register
 * Register a new user account
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, walletAddress } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const result = await authService.register(email, password, walletAddress);

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Registration failed',
    });
  }
});

/**
 * POST /auth/login
 * Login user and receive JWT token
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const result = await authService.login(email, password);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(401).json({
      error: error instanceof Error ? error.message : 'Login failed',
    });
  }
});

/**
 * GET /auth/me
 * Get current user information
 */
router.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    const { prisma } = await import('../config/database');
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
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
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
});

/**
 * POST /auth/google
 * Login or register with Google OAuth
 */
router.post('/google', async (req: Request, res: Response) => {
  try {
    const { providerId, email, name } = req.body;

    if (!providerId || !email) {
      res.status(400).json({ error: 'providerId and email are required' });
      return;
    }

    const result = await authService.loginWithOAuth('google', providerId, email, name);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Google authentication failed',
    });
  }
});

/**
 * POST /auth/apple
 * Login or register with Apple OAuth
 */
router.post('/apple', async (req: Request, res: Response) => {
  try {
    const { providerId, email, name } = req.body;

    if (!providerId || !email) {
      res.status(400).json({ error: 'providerId and email are required' });
      return;
    }

    const result = await authService.loginWithOAuth('apple', providerId, email, name);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
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
router.post('/dndbeyond', async (req: Request, res: Response) => {
  try {
    const { providerId, email, name } = req.body;

    if (!providerId || !email) {
      res.status(400).json({ error: 'providerId and email are required' });
      return;
    }

    const result = await authService.loginWithOAuth('dndbeyond', providerId, email, name);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : 'D&D Beyond authentication failed',
    });
  }
});

/**
 * PUT /auth/wallet
 * Update user wallet address
 */
router.put('/wallet', authenticate, async (req: Request, res: Response) => {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress) {
      res.status(400).json({ error: 'Wallet address is required' });
      return;
    }

    await authService.updateWalletAddress(req.user!.id, walletAddress);

    res.json({
      success: true,
      message: 'Wallet address updated',
    });
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to update wallet address',
    });
  }
});

/**
 * PUT /auth/profile
 * Update user profile (displayName, bio)
 */
router.put('/profile', authenticate, async (req: Request, res: Response) => {
  try {
    const { displayName, bio, avatarUrl } = req.body;

    await authService.updateProfile(req.user!.id, displayName, bio, avatarUrl);

    res.json({
      success: true,
      message: 'Profile updated',
    });
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to update profile',
    });
  }
});

export default router;
