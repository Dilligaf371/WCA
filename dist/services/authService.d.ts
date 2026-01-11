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
export declare class AuthService {
    /**
     * Register a new user
     */
    register(email: string, password: string, walletAddress?: string): Promise<{
        user: {
            id: string;
            email: string;
            walletAddress: string | null;
        };
        token: string;
    }>;
    /**
     * Login user
     */
    login(email: string, password: string): Promise<{
        user: {
            id: string;
            email: string;
            walletAddress: string | null;
        };
        token: string;
    }>;
    /**
     * Generate JWT token
     */
    generateToken(userId: string, email: string, roles: UserRole[]): string;
    /**
     * Verify JWT token
     */
    verifyToken(token: string): JWTPayload;
    /**
     * Register or login with OAuth provider (Google/Apple/D&D Beyond)
     */
    loginWithOAuth(provider: 'google' | 'apple' | 'dndbeyond', providerId: string, email: string, name?: string): Promise<{
        user: {
            id: string;
            email: string;
            walletAddress: string | null;
        };
        token: string;
    }>;
    /**
     * Update user wallet address
     */
    updateWalletAddress(userId: string, walletAddress: string): Promise<void>;
    /**
     * Update user profile (displayName, bio, avatarUrl)
     */
    updateProfile(userId: string, displayName?: string, bio?: string, avatarUrl?: string): Promise<void>;
}
export declare const authService: AuthService;
//# sourceMappingURL=authService.d.ts.map