import rateLimit from 'express-rate-limit';

// Standard rate limiter for all generic API routes (e.g., fetching templates, logs)
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 100 requests per windowMs
    message: { message: 'Too many requests from this IP, please try again after 15 minutes.' },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Strict rate limiter for Authentication routes (login/signup) to prevent brute-force attacks
export const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 15, // Limit each IP to 15 login/signup requests per hour
    message: { message: 'Too many authentication attempts, please try again after an hour.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Moderate rate limiter for sending notifications to prevent spam and high bills
export const notificationLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 20, // Limit each IP to 20 send requests per 5 minutes
    message: { message: 'You are sending notifications too fast. Please wait a few minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});
