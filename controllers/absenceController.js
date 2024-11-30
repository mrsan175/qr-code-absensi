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
        const barcodeImage = await QRCode.toDataURL(encryptedText, { errorCorrectionLevel: 'H' });

        await prisma.user.update({ where: { id: userId }, data: { qrcode: plainText } });

        return res.json({ barcodeImage });
    } catch (error) {
        console.error('Error generating QR Code:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

const createAbsence = async (req, res) => {
    const { qrcode } = req.body;

    const user = await prisma.user.findFirst({
        where: { qrcode },
    });

    if (!user || !user.qrcode) {
        return res.status(404).json({ message: 'QR Code not valid' });
    }

    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const absence = await prisma.absence.findFirst({
        where: { userId: user.id, timestamp: { gte: startOfDay, lte: endOfDay } },
    });

    const isWeekend = [0, 5].includes(new Date().getDay());

    const deleteQrcode = await prisma.user.update({ where: { id: user.id }, data: { qrcode: null } });

    if (isWeekend) {
        deleteQrcode;
        return res.json({ message: `Hari ini adalah hari libur, ${user.name}.` });
    }

    if (absence) {
        deleteQrcode;
        return res.json({ message: `Hai ${user.name}, kamu sudah melakukan absen hari ini.` });
    }

    await prisma.$transaction([
        prisma.absence.create({ data: { userId: user.id } }),
        prisma.user.update({ where: { id: user.id }, data: { qrcode: null } }),
    ]);

    res.json({ message: `${user.name} berhasil melakukan absen hari ini.` });
};

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