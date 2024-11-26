import express from 'express';
import { createAbsence } from '../controllers/absenceController.js';
import { authMiddleware, authorizeRole } from '../middlewares/authMiddleware.js';

const adminRouter = express.Router();

adminRouter.get('/admin', authMiddleware, authorizeRole(["admin"]), (req, res) => {
    res.json({ message: 'Welcome to the admin dashboard' });
})
    .post('/admin/scan-qrcode', authMiddleware, authorizeRole(["admin"]), createAbsence);

export default adminRouter;