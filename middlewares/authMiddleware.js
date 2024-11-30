import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const authMiddleware = async (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (token === null) return res.sendStatus(401);

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const refreshToken = req.cookies._XYZabc123;
        if (!refreshToken) return res.sendStatus(403);
        req.user = decoded;
        next();
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error   ' });
    }
};

export const authorizeRole = (requiredRoles) => {
    return async (req, res, next) => {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: { role: true },
        });
        if (!user || !requiredRoles.includes(user.role)) {
            return res.status(user ? 403 : 404).json({
                message: user ? 'Unauthorized: Insufficient permissions' : 'User not found',
            });
        }
        next();
    };
};
