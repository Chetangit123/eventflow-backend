const dotenv = require("dotenv");
// Decide kaunsa .env load karna hai
const envFile = process.env.NODE_ENV === "production" ? ".env.production" : ".env.development";
dotenv.config({ path: envFile });

console.log(`NODE_ENV: ${process.env.NODE_ENV}`);

const ENVIRONMENT = {
    NODE_ENV: process.env.NODE_ENV,
    JWT_SECRET: process.env.JWT_SECRET || "your_jwt_secret_key",
    PORT: process.env.PORT || 8000,
    MONGO_URI: process.env.MONGO_URI,
    EMAIL_VERIFICATION_LINK: `${process.env.FRONTEND_URL}/email-verification`,
    FORGET_PASSWORD_LINK: `${process.env.FRONTEND_URL}/reset-password`,
    IMAGE_FILE_PATH: process.env.FILE_URL,
    RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET
};

module.exports = ENVIRONMENT;