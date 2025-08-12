// src/services/userService.js
const { EMAIL_VERIFICATION_LINK } = require("../config/env");
const { EmailVerificationTemplate } = require("../emailTemplates/userVerificationTemplate");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const { signToken } = require("../utils/jwt");
const sendMail = require("../utils/sendMail");
const QueryBuilder = require("./queryBuilder");


class UserService {

    static async createUser({ name, email, phone, password }) {
        // 1️⃣ Check required fields (optional - if already validated in controller, skip this)
        if (!name || !email || !phone || !password) {
            throw new AppError("Name, Email, Phone, and Password are required", 400);
        }

        // 2️⃣ Check if email OR phone already exists in one go
        const existingUser = await new QueryBuilder(User)
            .filter({ $or: [{ email }, { phone }] })
            .exec();

        if (existingUser.length > 0) {
            if (existingUser[0].email === email) {
                throw new AppError("Email already exists", 409);
            }
            if (existingUser[0].phone === phone) {
                throw new AppError("Phone already exists", 409);
            }
        }

        // 3️⃣ Create user
        const user = await new QueryBuilder(User)
            .create({
                name,
                email,
                phone,
                passwordHash: password // plain password; hashing handled by schema middleware
            })
            .exec();

        // 4️⃣ Generate verification token & link
        const token = signToken(user._id, user.email);
        user.verificationToken = token;
        await user.save(); // ensure token is saved before sending email

        const verificationLink = `${EMAIL_VERIFICATION_LINK}/${token}`;
        const template = EmailVerificationTemplate(user.name, verificationLink);

        // 5️⃣ Send verification email
        sendMail({
            to: user.email,
            subject: "Email Verification",
            template
        });

        return user;
    }


    static async verifyEmailWithLink(token) {
        const user = await User.findOne({ verificationToken: token });
        if (!user) throw new AppError("Invalid token", 400);
        if (user.isVerified) throw new AppError("Email already verified", 400);
        if (user.isBlocked) throw new AppError("Your account has been blocked", 401);
        user.isVerified = true;
        user.verificationToken = null;
        await user.save();
        return user;
    }

    static async getUserById(userId) {
        const user = await User.findById(userId).populate({
            path: "addresses",
            select: "street city state zipCode country"
        });
        if (!user) throw new AppError("User not found", 404);
        return user;
    }

}

module.exports = UserService;
