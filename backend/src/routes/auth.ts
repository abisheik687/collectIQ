import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// Register
router.post('/register', async (req, res, next) => {
    try {
        const { email, password, name, role, agency } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            throw new AppError('User already exists', 400);
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await User.create({
            email,
            password: hashedPassword,
            name,
            role: role || 'dca',
            agency,
            isActive: true,
        });

        res.status(201).json({
            message: 'User created successfully',
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
        });
    } catch (error) {
        next(error);
    }
});

// Login
router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ where: { email } });
        if (!user) {
            throw new AppError('Invalid credentials', 401);
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            throw new AppError('Invalid credentials', 401);
        }

        if (!user.isActive) {
            throw new AppError('Account is disabled', 403);
        }

        // Generate JWT - P2 FIX: Validate JWT_SECRET in production
        const secret = process.env.JWT_SECRET;
        if (!secret && process.env.NODE_ENV === 'production') {
            throw new AppError('JWT_SECRET configuration error', 500);
        }
        const jwtSecret = secret || 'your-secret-key';
        const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                agency: user.agency,
            },
            jwtSecret,
            { expiresIn }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                agency: user.agency,
            },
        });
    } catch (error) {
        next(error);
    }
});

// Get current user
router.get('/me', authenticate, async (req: AuthRequest, res: Response, next) => {
    try {
        const user = await User.findByPk(req.user!.id, {
            attributes: { exclude: ['password'] },
        });

        if (!user) {
            throw new AppError('User not found', 404);
        }

        res.json({ user });
    } catch (error) {
        next(error);
    }
});

export default router;
