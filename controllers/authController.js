import bcrypt from 'bcrypt';
import { generateToken } from '../utils/jwtUtils.js';
import { createUser, loginToken, findUserByUsernameOrEmail, findUserByEmail } from '../models/userModel.js';
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
    try {
        const validatedData = loginValidator.parse(req.body);
        const { credential, password } = validatedData;
        const user = await findUserByUsernameOrEmail(credential);

        if (!user) {
            return res.status(400).json({ message: 'Invalid username/email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid username/email or password' });
        }

        const token = generateToken(user);
        if (!token) {
            return res.status(500).json({ message: 'Error generating token' });
        }

        await loginToken(user, token);

        res.json({
            message: 'Login successful',
            user: { name: user.name, email: user.email, role: user.role, id: user.id },
            token,
        });
    } catch (err) {
        console.log(err);
        if (err instanceof z.ZodError) {
            return res.status(400).json({ message: 'Validation error', details: err.errors });
        }
        res.status(500).json({ message: 'Internal server error' });
    }
};


export { registerUser, loginUser };
