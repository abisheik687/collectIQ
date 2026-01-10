import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

export interface AuthRequest extends Request {
    user?: {
        id: number;
        email: string;
        name: string;
        role: 'enterprise' | 'dca';
        agency?: string;
    };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'No token provided',
            });
        }

        const token = authHeader.substring(7);
        const secret = process.env.JWT_SECRET || 'your-secret-key';

        const decoded = jwt.verify(token, secret) as {
            id: number;
            email: string;
            name: string;
            role: 'enterprise' | 'dca';
            agency?: string;
        };

        req.user = decoded;
        next();
    } catch (error) {
        logger.error('Authentication error:', error);
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid or expired token',
        });
    }
};

export const authorize = (...roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Authentication required',
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'Insufficient permissions',
            });
        }

        next();
    };
};
