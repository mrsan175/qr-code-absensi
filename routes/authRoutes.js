import express from 'express';
import { registerUser, loginUser } from '../controllers/authController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { loginRateLimiter } from '../middlewares/rateLimiter.js';

const authRouter = express.Router();

authRouter.post('/auth/register', registerUser)
    .post('/auth/login', loginRateLimiter, loginUser)
    .get('/auth/profile', authMiddleware, (req, res) => {
        res.json({ message: `Welcome, ${req.user.role}!` });
    });

export default authRouter;
