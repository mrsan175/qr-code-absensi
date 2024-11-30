import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import authRouter from './routes/authRoutes.js';
import adminRouter from './routes/adminRoutes.js';
import userRouter from './routes/userRoutes.js';
import http from 'http';
import { setupSocket } from './socket.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const port = process.env.SERVER_PORT || 8000;
const allowedOrigins = ['https://qrcode-absensi.vercel.app'];
const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}

setupSocket(server);

app.set('trust proxy', 3);
app.use(express.json());
app.use(
    cors(corsOptions)
);
app.use(helmet());
app.use(cookieParser());
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

server.listen(port, () => {
    console.log(`Socket is running on port ${port}`);
})

// app.listen(process.env.SERVER_PORT || port, () => {
//     console.log(`Server is running on port ${process.env.SERVER_PORT || port}`);
// });
