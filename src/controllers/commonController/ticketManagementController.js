const { default: mongoose } = require("mongoose");
const Event = require("../../models/Event");
const EventSession = require("../../models/EventSession");
const QueryBuilder = require("../../services/queryBuilder");
const catchAsync = require("../../utils/catchAsync");
const { successRes } = require("../../utils/responseFormatter");
const AppError = require("../../utils/AppError");
const GatekeeperScan = require("../../models/GatekeeperScan");
const ENVIRONMENT = require("../../config/env.js");
const { isValidId } = require("../../helper/productHelper.js");
const TicketBooking = require("../../models/TicketBooking.js");

const getTicketsBySessionId = catchAsync(async (req, res, next) => {
    const { sessionId, page = 1, limit = 10 } = req.query;

    if (!isValidId(sessionId)) return next(new AppError('Invalid session id', 400));

    // Count total tickets
    const countBuilder = new QueryBuilder(TicketBooking);
    const totalTickets = await countBuilder
        .filter({ eventSession: new mongoose.Types.ObjectId(sessionId) })
        .count();

    // Fetch paginated tickets
    let qb = new QueryBuilder(TicketBooking);
    const tickets = await qb
        .aggregate([
            {
                $match: {
                    eventSession: new mongoose.Types.ObjectId(sessionId),
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "user",
                    foreignField: "_id",
                    as: "userDetails",
                },
            },
            { $unwind: "$userDetails" },
            { $skip: (parseInt(page, 10) - 1) * parseInt(limit, 10) },
            { $limit: parseInt(limit, 10) }
        ])
        .exec();

    return successRes(res, 200, true, "Tickets fetched successfully", {
        total: totalTickets,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        data: tickets
    });
});

const getTicketById = catchAsync(async (req, res, next) => {
    const ticketId = req.query.ticketId;

    if (!isValidId(ticketId)) {
        return next(new AppError('Invalid ticket id', 400));
    }

    const qb = new QueryBuilder(TicketBooking);
    const ticket = await qb
        .filter({ _id: new mongoose.Types.ObjectId(ticketId) })
        .populate("user", "-password") // Adjust fields as needed
        .exec();

    if (!ticket) {
        return next(new AppError('Ticket not found', 404));
    }

    return successRes(res, 200, true, "Ticket fetched successfully", ticket);
});


module.exports = {
    getTicketsBySessionId,
    getTicketById
};