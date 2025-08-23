const GatekeeperScan = require("../../models/GatekeeperScan");
const TicketBooking = require("../../models/TicketBooking");
const QueryBuilder = require("../../services/queryBuilder");
const AppError = require("../../utils/AppError");
const catchAsync = require("../../utils/catchAsync");
const { successRes } = require("../../utils/responseFormatter");
const mongoose = require("mongoose");

exports.validateTicket = catchAsync(async (req, res, next) => {
    const ticketId = req?.body?.ticketId;
    const gatekeeperId = req.user?._id;

    if (!ticketId) {
        return next(new AppError("Ticket ID is required", 400));
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        let bookingQb = new QueryBuilder(TicketBooking);
        const booking = await bookingQb
            .findOne({ "tickets.ticketId": ticketId })
            .populate("event")
            .populate("eventSession")
            .session(session)
            .exec();

        let result = "valid";
        let responseMsg = "Ticket validated successfully";
        let extraData = {};

        if (!booking) {
            result = "not_found";
            responseMsg = "Invalid Ticket - not found";

            await GatekeeperScan.create([{
                gatekeeper: gatekeeperId,
                eventSession: null,
                event: null,
                ticketId,
                result,
                notes: responseMsg
            }], { session });

            await session.commitTransaction();
            session.endSession();
            return successRes(res, 404, false, responseMsg);
        }

        const ticket = booking.tickets.find(t => t.ticketId === ticketId);
        if (!ticket) {
            result = "not_found";
            responseMsg = "Invalid Ticket - not found";

            await GatekeeperScan.create([{
                gatekeeper: gatekeeperId,
                ticketId,
                ticketRef: null,
                eventSession: booking.eventSession,
                event: booking.event,
                result,
                notes: responseMsg
            }], { session });

            await session.commitTransaction();
            session.endSession();
            return successRes(res, 404, false, responseMsg);
        }

        // ✅ Check session status (cancelled or completed)
        if (booking.eventSession?.status === "cancelled") {
            result = "invalid";
            responseMsg = "This event session has been cancelled";
        } else if (booking.eventSession?.status === "completed") {
            result = "invalid";
            responseMsg = "This event session has already been completed";
        } else if (ticket.status !== "generated") {
            result = "invalid";
            responseMsg = "Ticket not active";
        } else if (booking.paymentStatus !== "paid") {
            result = "invalid";
            responseMsg = "Payment not verified";
        } else if (ticket.scanned) {
            result = "already_scanned";
            responseMsg = "Ticket already used";
            extraData = {
                scannedAt: ticket.scannedAt,
                attendeeName: ticket.attendeeName,
                eventName: booking.event.name,
            };
        } else {
            const now = new Date();
            const sessionDate = new Date(booking.eventSession.date);
            const startDateTime = new Date(`${booking.eventSession.date}T${booking.eventSession.startTime}`);
            const endDateTime = new Date(`${booking.eventSession.date}T${booking.eventSession.endTime}`);

            if (now.toDateString() !== sessionDate.toDateString()) {
                result = "invalid";
                responseMsg = "Ticket not valid for today";
            } else if (now < startDateTime) {
                result = "invalid";
                responseMsg = "Event has not started yet";
            } else if (now > endDateTime) {
                result = "expired";
                responseMsg = "Event already ended";
            } else {
                // ✅ Valid ticket -> mark scanned
                ticket.scanned = true;
                ticket.scannedAt = now;
                await booking.save({ session });

                result = "valid";
                responseMsg = "Ticket validated successfully";
                extraData = {
                    ticketId: ticket.ticketId,
                    attendeeName: ticket.attendeeName,
                    eventName: booking.event.name,
                    eventDateTime: `${booking.eventSession.date} | ${booking.eventSession.startTime}-${booking.eventSession.endTime}`,
                    scannedAt: ticket.scannedAt,
                };
            }
        }

        // 🎯 Save scan log
        await GatekeeperScan.create([{
            gatekeeper: gatekeeperId,
            ticketId,
            eventSession: booking.eventSession,
            ticketRef: ticket?._id,
            event: booking.event,
            result,
            notes: responseMsg
        }], { session });

        await session.commitTransaction();
        session.endSession();

        return successRes(
            res,
            result === "valid" ? 200 : 400,
            result === "valid",
            responseMsg,
            extraData
        );

    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        return next(new AppError(err.message, 500));
    }
});

// 📌 Get Scanned History
exports.getScannedHistory = catchAsync(async (req, res, next) => {
    const gatekeeperId = req.user?._id;

    if (!gatekeeperId) {
        return next(new AppError("Unauthorized - Gatekeeper required", 401));
    }

    const {
        eventId,
        sessionId,
        search,
        result,
        page = 1,
        limit = 10,
        sortBy = "scannedAt",
        sortOrder = "desc"
    } = req.query;

    const filters = { gatekeeper: gatekeeperId };

    // 🎯 event/session filter
    if (eventId) filters["event"] = eventId;
    if (sessionId) filters["eventSession"] = sessionId;

    // 🎯 search filter
    if (search) {
        filters.ticketId = { $regex: search, $options: "i" };
    }

    // 🎯 result filter mapping
    if (result) {
        const resultMap = {
            valid: "valid",
            invalid: "not_found",
            already_used: "already_scanned"
        };
        filters.result = resultMap[result] || result;
    }

    // sorting & pagination
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const perPage = parseInt(limit);

    // 🔎 fetch scans
    const scans = await GatekeeperScan.find(filters)
        .populate({
            path: "eventSession",
            select: "specialNameOfDay date startTime endTime"
        })
        .populate({
            path: "ticketRef",
            select: "attendeeName", // jo fields chahiye wo select kar
        })
        .populate({
            path: "event",
            select: "title"
        })
        .populate({
            path: "gatekeeper",
            select: "name"
        })
        .sort(sort)
        .skip(skip)
        .limit(perPage)
        .lean();

    // ✅ safe formatting: ticketRef missing hoga to null inject karo
    const formattedScans = scans.map(scan => ({
        ...scan,
        ticketRef: scan.ticketRef
            ? scan.ticketRef
            : {
                attendeeName: null,
                status: "invalid_ticket"
            }
    }));

    const total = await GatekeeperScan.countDocuments(filters);

    return successRes(res, 200, true, "Scanned history fetched", {
        totalDocument: total,
        page: parseInt(page),
        limit: perPage,
        totalPages: Math.ceil(total / perPage),
        scans: formattedScans
    });
});





