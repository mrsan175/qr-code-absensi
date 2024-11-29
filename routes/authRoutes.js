import express from 'express';
import { registerUser, loginUser, logoutUser, refreshTokenUser } from '../controllers/authController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { loginRateLimiter } from '../middlewares/rateLimiter.js';

const authRouter = express.Router();

authRouter.post('/auth/register', registerUser)
    .post('/auth/login', loginRateLimiter, loginUser)
    .delete('/auth/logout', logoutUser)
    .get('/auth/profile', authMiddleware, (req, res) => {
        res.json({ message: `Welcome, ${req.user.role}!` });
    })
    .get('/auth/token', refreshTokenUser);

export default authRouter;
