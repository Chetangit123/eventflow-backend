const QueryBuilder = require("../../services/queryBuilder");
const User = require("../../models/User");
const AppError = require("../../utils/AppError");
const { successRes } = require("../../utils/responseFormatter");
const sendMail = require("../../utils/sendMail");
const welcomeEventManager = require("../../emailTemplates/welcomeEventManager");
const catchAsync = require("../../utils/catchAsync");

exports.createEventManager = catchAsync(async (req, res, next) => {
    const { name, email, password, phone } = req.body;

    if (!email || !password) {
        return next(new AppError("Email and password are required", 400));
    }

    const qb = new QueryBuilder(User);

    const existingUser = await qb.findOne({ email }).exec();
    if (existingUser) {
        return next(new AppError("User with this email already exists", 400));
    }

    const newUser = await new QueryBuilder(User)
        .create({
            name,
            email,
            passwordHash: password,
            phone,
            role: "event_manager",
            isVerified: true
        })
        .exec();
    let template = welcomeEventManager({ name, email, password });
    sendMail({
        to: email,
        subject: "Welcome to the Event Management Team 🎉",
        template: template
    });

    return successRes(res, 201, true, "Event manager created successfully", newUser);
});

exports.getAllEventManagers = catchAsync(async (req, res, next) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const qb = new QueryBuilder(User) // true = deleted bhi include karo
        .filter({ role: "event_manager" })
        .sort("-createdAt")
        .paginate(page, limit);

    const eventManagers = await qb.exec();
    const totalDocument = await qb.count();
    const totalPages = Math.ceil(totalDocument / limit);

    return successRes(res, 200, true, "Event managers retrieved successfully", {
        data: eventManagers,
        totalDocument,
        totalPages,
        pageNo: page,
        limit
    });
});



