import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { generateToken, generateRefreshToken } from '../utils/jwtUtils.js';
import { createUser, loginToken, findUserByUsernameOrEmail, findUserByEmail, findRefreshToken, deleteRefreshToken } from '../models/userModel.js';
import { registerValidator, loginValidator } from '../validators/authValidator.js';
import { z } from 'zod';

const registerUser = async (req, res) => {
    try {
        const validatedData = registerValidator.parse(req.body);
        const { name, email, password } = validatedData;
        const existingUser = await findUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await createUser(name, email, hashedPassword);
        res.json({ message: 'User created successfully', user });
    } catch (err) {
        console.log(err);
        if (err instanceof z.ZodError) {
            return res.status(400).json({ message: 'Validation error', details: err.errors });
        }
        res.status(500).json({ message: 'Internal server error' });
    }
};

const loginUser = async (req, res) => {
    const { credential, password } = loginValidator.parse(req.body);

    const user = await findUserByUsernameOrEmail(credential);
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(400).json({ message: 'Invalid username/email or password' });
    }

    const accessToken = generateToken(user);
    const refreshToken = generateRefreshToken(user);
    await loginToken(user, refreshToken);

    res
        .cookie('_XYZabc123', refreshToken, {
            httpOnly: true,
            maxAge: 3 * 24 * 60 * 60 * 1000,
            sameSite: 'none',
            secure: true,
        })
        .status(200).json({
            message: 'Login successful',
            user: { name: user.name, email: user.email, role: user.role, id: user.id },
            token: accessToken,
        });
};

const logoutUser = async (req, res) => {
    res.clearCookie('_XYZabc123');
    res.sendStatus(200);
}

const refreshTokenUser = async (req, res) => {
    try {
        const refreshToken = req.cookies._XYZabc123;
        if (!refreshToken) return res.sendStatus(403);
        jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, async (err, decoded) => {
            if (err) {
                return res.sendStatus(403);
            }
            const user = await findRefreshToken(refreshToken)
            if (!user) return res.sendStatus(403);
            const accessToken = generateToken(user);
            res.json({ token: accessToken });
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export { registerUser, loginUser, logoutUser, refreshTokenUser };
