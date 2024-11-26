import crypto from 'crypto';

const algorithm = 'aes-128-cbc';
const encryptionKeys = process.env.SECRET_KEY;

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

export { encrypt, decrypt, encryptionKeys };