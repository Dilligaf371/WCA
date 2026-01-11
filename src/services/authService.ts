import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { env } from '../config/env';
import { UserRole } from '@prisma/client';

export interface JWTPayload {
  userId: string;
  email: string;
  roles: UserRole[];
}

/**
 * Authentication Service
 * Handles user registration, login, and JWT token management
 */
export class AuthService {
  /**
   * Register a new user
   */
  async register(email: string, password: string, walletAddress?: string): Promise<{
    user: { id: string; email: string; walletAddress: string | null };
    token: string;
  }> {
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
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      throw new Error('User already exists');
    }

    // Check wallet address uniqueness if provided
    if (walletAddress) {
      const existingWallet = await prisma.user.findUnique({
        where: { walletAddress },
      });

      if (existingWallet) {
        throw new Error('Wallet address already registered');
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, env.BCRYPT_ROUNDS);

    // Create user
    const user = await prisma.user.create({
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
    const token = this.generateToken(user.id, user.email, [UserRole.USER]);

    return { user, token };
  }

  /**
   * Login user
   */
  async login(email: string, password: string): Promise<{
    user: { id: string; email: string; walletAddress: string | null };
    token: string;
  }> {
    const user = await prisma.user.findUnique({
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
    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      throw new Error('Invalid email or password');
    }

    // Update last login
    await prisma.user.update({
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
  generateToken(userId: string, email: string, roles: UserRole[]): string {
    const payload: JWTPayload = {
      userId,
      email,
      roles,
    };

    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN,
    });
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, env.JWT_SECRET) as JWTPayload;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Register or login with OAuth provider (Google/Apple/D&D Beyond)
   */
  async loginWithOAuth(
    provider: 'google' | 'apple' | 'dndbeyond',
    providerId: string,
    email: string,
    name?: string
  ): Promise<{
    user: { id: string; email: string; walletAddress: string | null };
    token: string;
  }> {
    // Validate email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Invalid email format');
    }

    // Check if user exists with this provider
    let user = await prisma.user.findFirst({
      where: {
        provider,
        providerId,
      },
    });

    if (user) {
      // User exists, update last login
      await prisma.user.update({
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
    const existingByEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (existingByEmail) {
      // Link OAuth account to existing user
      if (existingByEmail.passwordHash) {
        throw new Error('An account with this email already exists. Please use email/password login.');
      }
      
      // Update existing user with OAuth info
      user = await prisma.user.update({
        where: { id: existingByEmail.id },
        data: {
          provider,
          providerId,
          oauthEmail: email,
          lastLoginAt: new Date(),
        },
      });
    } else {
      // Create new user with OAuth
      user = await prisma.user.create({
        data: {
          email,
          provider,
          providerId,
          oauthEmail: email,
          passwordHash: null, // OAuth users don't have passwords
          roles: UserRole.USER,
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
  async updateWalletAddress(userId: string, walletAddress: string): Promise<void> {
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      throw new Error('Invalid wallet address format');
    }

    // Check if wallet is already in use
    const existing = await prisma.user.findUnique({
      where: { walletAddress },
    });

    if (existing && existing.id !== userId) {
      throw new Error('Wallet address already registered to another user');
    }

    await prisma.user.update({
      where: { id: userId },
      data: { walletAddress },
    });
  }

  /**
   * Update user profile (displayName, bio, avatarUrl)
   */
  async updateProfile(userId: string, displayName?: string, bio?: string, avatarUrl?: string): Promise<void> {
    const updateData: { displayName?: string | null; bio?: string | null; avatarUrl?: string | null } = {};
    
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
      await prisma.user.update({
        where: { id: userId },
        data: updateData,
      });
    }
  }
}

export const authService = new AuthService();
