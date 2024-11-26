import { z } from 'zod';


const registerValidator = z.object({
    name: z.string().min(3, 'Name must be at least 3 characters long'),
    email: z.string().email('Invalid email address').min(5, 'Email must be at least 5 characters long'),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
});


const loginValidator = z.object({
    credential: z.string().min(3, 'Must be at least 3 characters long'),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
});


export { registerValidator, loginValidator };
