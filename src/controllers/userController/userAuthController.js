const User = require("../../models/User");
const Address = require("../../models/Address");
const catchAsync = require("../../utils/catchAsync");
const AppError = require("../../utils/AppError");
const { successRes } = require("../../utils/responseFormatter");
const { signToken } = require("../../utils/jwt");
const bcrypt = require('bcryptjs');
const buildAggregationPipeline = require("../../utils/buildAggregationPipeline");
const UserService = require("../../services/userServices");
const { default: mongoose } = require("mongoose");

exports.createUser = catchAsync(async (req, res, next) => {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
        return next(new AppError("Name, Email, Phone, and Password are required", 400));
    }

    const user = await UserService.createUser({ name, email, phone, password });

    return successRes(res, 201, true, "User created successfully", user);
});

exports.verifyEmailWithLink = catchAsync(async (req, res, next) => {
    const { token } = req.body;
    const user = await UserService.verifyEmailWithLink(token);
    return successRes(res, 200, true, "Email verified successfully", user);
});

exports.loginUser = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return next(new AppError("Please provide email and password", 400));
    }

    const user = await User.findOne({ email }).select("+passwordHash");
    if (!user || !(await user.comparePassword(password))) {
        return next(new AppError("Invalid email or password", 401));
    }

    if (!user.isVerified) return next(new AppError("Please verify your email", 401));

    if (user.isBlocked) return next(new AppError("Your account has been blocked", 401));

    const token = signToken(user._id, user.email);

    return successRes(res, 200, true, "Login successful", { user, token });
});

exports.getUserProfile = catchAsync(async (req, res, next) => {
    const userId = req?.user?.id;

    if (!userId) return next(new AppError("User not found", 404));

    const aggregationPipeline = buildAggregationPipeline({
        match: { _id: new mongoose.Types.ObjectId(userId) },
        lookups: [
            {
                from: "addresses",
                localField: "addresses",
                foreignField: "_id",
                as: "addresses"
            }
        ],
        project: {
            passwordHash: 0,
            verificationToken: 0,
            __v: 0
        },
        limit: 1
    });

    const user = await User.aggregate(aggregationPipeline);

    if (!user || user.length === 0) {
        return next(new AppError("User profile not found", 404));
    }

    return successRes(res, 200, true, "User profile retrieved successfully", user[0]);
});


exports.createAddress = catchAsync(async (req, res, next) => {
    const userId = req.userId;
    const { street, city, state, zipCode, country } = req.body;

    if (!street || !city || !state || !zipCode || !country) {
        return next(new AppError("All address fields are required", 400));
    }
    const address = await Address.create({ user: userId, street, city, state, zipCode, country });

    await User.findByIdAndUpdate(userId, { $push: { addresses: address._id } });

    res.status(201).json(formatResponse(201, true, "Address added", address));
});


