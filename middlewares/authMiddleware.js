import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const authMiddleware = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid or expired token' });
        }
        const session = await prisma.user.findUnique({
            where: { token: token },
        });

        if (!session) {
            return res.status(403).json({ message: 'Token not found in database' });
        }

        req.user = decoded;
        next();
    });
};

export const authorizeRole = (requiredRoles) => {
    return async (req, res, next) => {
        try {
            const user = await prisma.user.findUnique({ where: { id: req.user.id } });
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            if (!requiredRoles.includes(user.role)) {
                return res.status(403).json({ message: 'Unauthorized: Insufficient permissions' });
            }
            next();
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error' });
        }
    };
};