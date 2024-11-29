import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const createUser = async (name, email, password) => {
    try {
        const user = await prisma.user.create({
            data: {
                name: name,
                email: email,
                password: password,
            },
        });
        return user;
    } catch (err) {
        console.error('Error creating user:', err);
        throw new Error('Could not create user');
    }
};

const loginToken = async (user, token) => {
    try {
        const res = await prisma.user.update({
            where: { id: user.id },
            data: { token: token },
        });
        return res;
    } catch (err) {
        console.error('Error updating token:', err);
        throw new Error('Could not update token');
    }
};

const findUserByEmail = async (email) => {
    try {
        const user = await prisma.user.findUnique({
            where: { email: email },
        });
        return user;
    } catch (err) {
        console.error('Error finding user by email:', err);
        throw new Error('Could not find user');
    }
};

const findUserByUsernameOrEmail = async (credential) => {
    try {
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: credential },
                    { name: credential },
                ],
            },
        });
        return user;
    } catch (err) {
        console.error('Error finding user by username or email:', err);
        throw new Error('Could not find user');
    }
};

const findRefreshToken = async (refreshToken) => {
    try {
        const session = await prisma.user.findUnique({
            where: { token: refreshToken },
        });
        return session;
    } catch (err) {
        console.error('Error finding refresh token:', err);
        throw new Error('Could not find refresh token');
    }
}

const deleteRefreshToken = async (refreshToken) => {
    try {
        const session = await prisma.user.update({
            where: { token: refreshToken },
            data: { token: null },
        });
        return session;
    } catch (err) {
        console.error('Error deleting refresh token:', err);
        throw new Error('Could not delete refresh token');
    }
}

export { createUser, loginToken, findUserByEmail, findUserByUsernameOrEmail, findRefreshToken, deleteRefreshToken };