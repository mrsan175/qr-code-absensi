import express from 'express';
import { generateQrcode } from '../controllers/absenceController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const userRouter = express.Router();

userRouter.get('/user', authMiddleware, (req, res) => {
    res.json({ message: 'Welcome to the user dashboard' });
})

userRouter.post('/user/generate-qrcode', generateQrcode);



export default userRouter;