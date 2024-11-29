import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const authMiddleware = (req, res, next) => {
    try {
        const token = req.headers['authorization']?.split(' ')[1];
        if (token === null) return res.sendStatus(401);
        jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
            if (err) {
                console.error(err);
                return res.sendStatus(403);
            }
            const refreshToken = req.cookies._XYZabc123;
            if (!refreshToken) return res.sendStatus(403);
            req.user = decoded;
            next();
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error   ' });
    }
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