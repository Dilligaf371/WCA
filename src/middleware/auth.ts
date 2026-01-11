import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService';
import { prisma } from '../config/database';
import { UserRole } from '@prisma/client';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        roles: UserRole[];
      };
    }
  }
}

/**
 * Authentication middleware
 * Validates JWT token and attaches user to request
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[Auth] No token provided');
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const token = authHeader.substring(7);
    const payload = authService.verifyToken(token);

    // Verify user still exists and fetch roles
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, roles: true },
    });

    if (!user) {
      console.log('[Auth] User not found:', payload.userId);
      res.status(401).json({ error: 'User not found' });
      return;
    }

    console.log('[Auth] User authenticated:', user.id, user.email);

    req.user = {
      id: user.id,
      email: user.email,
      roles: [user.roles],
    };

    next();
  } catch (error) {
    console.error('[Auth] Authentication error:', error);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Authorization middleware
 * Checks if user has required role(s)
 */
export function authorize(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const hasRole = req.user.roles.some((role) => allowedRoles.includes(role));

    if (!hasRole) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
}

/**
 * Optional authentication middleware
 * Attaches user if token is valid, but doesn't require it
 */
export async function optionalAuthenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = authService.verifyToken(token);

      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, email: true, roles: true },
      });

      if (user) {
        req.user = {
          id: user.id,
          email: user.email,
          roles: [user.roles],
        };
      }
    }
  } catch (error) {
    // Silently fail for optional auth
  }

  next();
}
