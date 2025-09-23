// src/middlewares/rateLimiter.js
const rateLimit = require("express-rate-limit");

const userRateLimiter = rateLimit({
    windowMs: 60 * 1000, // 10 minutes
    max: 2, // ek IP se max 10 requests per window
    message: "Too many requests from this IP, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.ip // IP based limiting
});

module.exports = userRateLimiter;
