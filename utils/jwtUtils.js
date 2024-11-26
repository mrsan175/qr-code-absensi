import jwt from 'jsonwebtoken';

export const generateToken = (user) => {
    const payload = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
    };
    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: '1h',
    });
};

export const verifyToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET);
};
