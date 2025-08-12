const QueryBuilder = require("../../services/queryBuilder");
const User = require("../../models/User");
const AppError = require("../../utils/AppError");
const { successRes } = require("../../utils/responseFormatter");
const sendMail = require("../../utils/sendMail");
const catchAsync = require("../../utils/catchAsync");
const SuperAdminServices = require("../../services/superAdminServices");

exports.createGatekeeper = catchAsync(async (req, res, next) => {
    const { name, email, password, phone } = req.body;

    if (!email || !password || !phone || !name) {
        return next(new AppError("Email, Password, Phone, and Name are required", 400));
    }

    let newUser = await SuperAdminServices.createGatekeeper({ name, email, phone, password });

    return successRes(res, 200, true, "Gatekeeper created successfully", newUser);
});