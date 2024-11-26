import jwt from 'jsonwebtoken';

const key = "6635faeb0ed57c943fb1a48fa9148787f39120e3783da2b78afbe6d3cd470f0a"

export const generateToken = (user) => {
    const payload = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
    };
    return jwt.sign(payload, key, {
        expiresIn: '1h',
    });
};

export const verifyToken = (token) => {
    return jwt.verify(token, key);
};
