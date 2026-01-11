"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.authorize = authorize;
exports.optionalAuthenticate = optionalAuthenticate;
const authService_1 = require("../services/authService");
const database_1 = require("../config/database");
/**
 * Authentication middleware
 * Validates JWT token and attaches user to request
 */
async function authenticate(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('[Auth] No token provided');
            res.status(401).json({ error: 'No token provided' });
            return;
        }
        const token = authHeader.substring(7);
        const payload = authService_1.authService.verifyToken(token);
        // Verify user still exists and fetch roles
        const user = await database_1.prisma.user.findUnique({
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
    }
    catch (error) {
        console.error('[Auth] Authentication error:', error);
        res.status(401).json({ error: 'Invalid or expired token' });
    }
}
/**
 * Authorization middleware
 * Checks if user has required role(s)
 */
function authorize(...allowedRoles) {
    return (req, res, next) => {
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
async function optionalAuthenticate(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const payload = authService_1.authService.verifyToken(token);
            const user = await database_1.prisma.user.findUnique({
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
    }
    catch (error) {
        // Silently fail for optional auth
    }
    next();
}
//# sourceMappingURL=auth.js.map