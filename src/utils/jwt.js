const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const AppError = require("../utils/AppError");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";
const JWT_EXPIRES_IN = "365d"; // token expiry

// ✅ Sign token
function signToken(userId, email) {
    return jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// ✅ Middleware to verify token
const protect = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization?.startsWith("Bearer")) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (!token) {
            return next(new AppError("You are not logged in! Please log in.", 401));
        }

        const decoded = await promisify(jwt.verify)(token, JWT_SECRET);

        const findUser = await User.findById(decoded.id);
        if (!findUser) {
            return next(new AppError("The user belonging to this token does no longer exist.", 401));
        }
        console.log(findUser.changedPasswordAfter(decoded.iat), "findUser.changedPasswordAfter(decoded.iat)");
        if (findUser.changedPasswordAfter && findUser.changedPasswordAfter(decoded.iat)) {
            return next(new AppError("User recently changed password! Please log in again.", 401));
        }

        req.userId = decoded.id;
        req.user = findUser;

        next();
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            return next(new AppError("Your token has expired! Please log in again.", 401));
        }
        if (err.name === "JsonWebTokenError") {
            return next(new AppError("Invalid token! Please log in again.", 401));
        }
        return next(new AppError("Authentication failed.", 401));
    }
};

module.exports = {
    signToken,
    protect,
};
