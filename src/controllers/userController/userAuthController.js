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

