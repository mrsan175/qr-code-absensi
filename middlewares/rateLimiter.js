import rateLimit from "express-rate-limit";

export const generateQrcodeLimiter = rateLimit({
    windowMs: 3000,
    max: 20,
    message: 'Too many requests, please try again after 3 seconds.',
});

export const loginRateLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 10,
    message: 'Too many requests, please try again after 1 minute.',
})