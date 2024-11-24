import express from 'express';
import { PrismaClient } from '@prisma/client';
import QRCode from 'qrcode';
import crypto from 'crypto';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const prisma = new PrismaClient();

app.use(express.json());
app.use(cors());


const encryptionKeys = process.env.SECRET_KEY;
const algorithm = 'aes-128-cbc';

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
})

app.post('/generate-barcode', async (req, res) => {
    try {
        const { userId } = req.body;
        const user = await prisma.User.findUnique({ where: { id: userId } });

        if (!user) return res.status(404).json({ message: 'User not found' });

        const plainText = `USER-${userId}-${Date.now()}`;
        const encryptedText = encrypt(plainText, encryptionKeys);

        await prisma.user.update({
            where: { id: userId },
            data: { barcode: plainText },
        });

        const barcodeImage = await QRCode.toDataURL(encryptedText);

        console.log('Generated barcode for', encryptedText);

        res.json({ barcodeImage });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error generating barcode' });
    }
});


app.post('/scan-barcode', async (req, res) => {
    try {
        const { barcode } = req.body;
        if (!barcode) {
            return res.status(400).json({ message: 'Barcode tidak ditemukan!' });
        }
        // let decryptedText;
        // try {
        //     decryptedText = decrypt(barcode, encryptionKeys);
        // } catch (err) {
        //     return res.status(400).json({ message: 'Invalid barcode format' });
        // }
        const user = await prisma.User.findFirst({
            where: { barcode: barcode },
        });

        if (!user) return res.status(404).json({ message: 'Invalid barcode' });

        await prisma.absence.create({
            data: { userId: user.id },
        });

        res.json({ message: `Hai ${user.name}, kamu berhasil melakukan absen hari ini.` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error scanning barcode' });
    }
});


app.get('/absences', async (req, res) => {
    try {
        const absences = await prisma.Absence.findMany({
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
