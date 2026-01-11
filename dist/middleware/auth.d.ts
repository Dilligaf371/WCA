import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
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
export declare function authenticate(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * Authorization middleware
 * Checks if user has required role(s)
 */
export declare function authorize(...allowedRoles: UserRole[]): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Optional authentication middleware
 * Attaches user if token is valid, but doesn't require it
 */
export declare function optionalAuthenticate(req: Request, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=auth.d.ts.map