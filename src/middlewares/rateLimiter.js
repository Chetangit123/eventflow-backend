const rateLimit = require("express-rate-limit");

module.exports = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 100, // limit each IP to 100 requests per window
    message: "Too many requests, please try again later.",
});
