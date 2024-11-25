import express from 'express';
import { PrismaClient } from '@prisma/client';
import QRCode from 'qrcode';
import crypto from 'crypto';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

dotenv.config();

const app = express();
const prisma = new PrismaClient();

app.use(express.json());
app.use(cors());
app.use(helmet());

const encryptionKeys = process.env.SECRET_KEY;
const algorithm = 'aes-128-cbc';


const generateQrcodeLimiter = rateLimit({
    windowMs: 4000,
    max: 1,
    message: 'Too many requests, please try again after 3 seconds.',
});

function encrypt(text, encryptionKey) {
    if (encryptionKey.length !== 32) {
        throw new Error('Invalid key length');
    }
    const iv = crypto.randomBytes(16);
    const key = Buffer.from(encryptionKey, 'hex');
    const cipher = crypto.createCipheriv('aes-128-cbc', key, iv);
    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return `${iv.toString('hex')}:${encrypted}`;
}

function decrypt(encryptedText, encryptionKey) {
    if (encryptionKey.length !== 32) {
        throw new Error('Invalid key length');
    }
    const [ivString, encrypted] = encryptedText.split(':');
    const iv = Buffer.from(ivString, 'hex');
    const key = Buffer.from(encryptionKey, 'hex');
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

app.get('/', (req, res) => {
    res.send('Qrcode Absensi API by mrsan');
});


app.post('/generate-qrcode', generateQrcodeLimiter, async (req, res) => {
    try {
        const { userId } = req.body;
        const user = await prisma.user.findUnique({ where: { id: userId } });

        if (!user) return res.status(404).json({ message: 'User not found' });

        const plainText = `USER-${userId}-${Date.now()}`;
        const encryptedText = encrypt(plainText, encryptionKeys);

        await prisma.user.update({
            where: { id: userId },
            data: { barcode: plainText },
        });

        const barcodeImage = await QRCode.toDataURL(encryptedText);

        console.log('Generated QR Code for', encryptedText);

        res.json({ barcodeImage });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error generating QR Code' });
    }
});

app.post('/scan-qrcode', async (req, res) => {
    try {
        const { qrcode } = req.body;
        if (!qrcode) {
            return res.status(400).json({ message: 'QR Code not found' });
        }
        const user = await prisma.user.findFirst({
            where: { barcode: qrcode },
        });

        if (!user) {
            return res.status(404).json({ message: 'QR Code not valid' });
        }

        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const endOfDay = new Date(today.setHours(23, 59, 59, 999));

        const existingAbsence = await prisma.absence.findFirst({
            where: {
                userId: user.userId,
                timestamp: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
            },
        });

        if (existingAbsence) {
            return res.json({ message: `Hai ${user.name}, kamu sudah absen hari ini.` });
        }

        await prisma.absence.create({
            data: { userId: user.id },
        });

        await prisma.user.update({
            where: { id: user.id },
            data: { barcode: null },
        });

        res.json({ message: `Hai ${user.name}, kamu berhasil melakukan absen hari ini.` });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error scanning QR Code' });
    }
});

app.get('/absences', async (req, res) => {
    try {
        const absences = await prisma.absence.findMany({
            include: { user: true },
        });
        res.json(absences);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching absences' });
    }
});

const port = process.env.SERVER_PORT || 8000;
app.listen(process.env.SERVER_PORT || port, () => {
    console.log(`Server is running on port ${process.env.SERVER_PORT || port}`);
});
