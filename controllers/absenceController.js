import QRCode from 'qrcode';
import { PrismaClient } from "@prisma/client";
import { encrypt, encryptionKeys } from "../utils/encryptionUtils.js";
const prisma = new PrismaClient();

const generateQrcode = async (req, res) => {
    try {
        const { userId } = req.body;
        const user = await prisma.user.findUnique({ where: { id: userId } });

        if (!user) return res.status(404).json({ message: 'User not found' });

        const plainText = `USER-${userId}-${Date.now()}`;
        const encryptedText = encrypt(plainText, encryptionKeys);

        await prisma.user.update({
            where: { id: userId },
            data: { qrcode: plainText },
        });

        const barcodeImage = await QRCode.toDataURL(encryptedText);

        console.log('Generated QR Code for', encryptedText);

        res.json({ barcodeImage });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error generating QR Code' });
    }
}

const createAbsence = async (req, res) => {
    try {
        const { qrcode } = req.body;
        if (!qrcode) {
            return res.status(400).json({ message: 'QR Code not found' });
        }
        const user = await prisma.user.findFirst({
            where: { qrcode: qrcode },
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
            data: { qrcode: null },
        });

        res.json({ message: `Hai ${user.name}, kamu berhasil melakukan absen hari ini.` });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error scanning QR Code' });
    }
}

const getAbsences = async (req, res) => {
    try {
        const absences = await prisma.absence.findMany({
            include: { user: true },
        });
        res.json(absences);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching absences' });
    }
}

export { generateQrcode, createAbsence, getAbsences };