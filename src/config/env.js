const dotenv = require("dotenv");
dotenv.config();

module.exports = {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT || 8000,
    MONGO_URI: process.env.MONGO_URI,
    EMAIL_VERIFICATION_LINK: `${process.env.FRONTEND_URL}/email-verification`,
    FORGET_PASSWORD_LINK: `${process.env.FRONTEND_URL}/forget-password`
};