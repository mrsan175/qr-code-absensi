import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import authRouter from './routes/authRoutes.js';
import adminRouter from './routes/adminRoutes.js';
import userRouter from './routes/userRoutes.js';

dotenv.config();

const app = express();
const port = process.env.SERVER_PORT || 8000;

app.set('trust proxy', 3);
app.use(express.json());
app.use(
    cors({
        origin: '*',
        credentials: true,
    })
);
app.use(helmet());
app.use('/api', authRouter);
app.use('/api', adminRouter);
app.use('/api', userRouter);

app.use((err, req, res, next) => {
    if (err instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', details: err.errors });
    }
    res.status(500).json({ message: 'Internal server error' });
});

app.get('/', (req, res) => {
    res.send('Qrcode Absensi API by mrsan');
});

app.listen(process.env.SERVER_PORT || port, () => {
    console.log(`Server is running on port ${process.env.SERVER_PORT || port}`);
});
