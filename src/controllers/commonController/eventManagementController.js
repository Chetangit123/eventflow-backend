const { default: mongoose } = require("mongoose");
const Event = require("../../models/Event");
const EventSession = require("../../models/EventSession");
const QueryBuilder = require("../../services/queryBuilder");
const catchAsync = require("../../utils/catchAsync");
const { successRes } = require("../../utils/responseFormatter");
const AppError = require("../../utils/AppError");

exports.createEvent = catchAsync(async (req, res, next) => {
    const { title, slug, description, venueName, address, images, banner, startDate, endDate, createdBy } = req.body;
    const event = await new Event({ title, slug, description, venueName, address, images, banner, startDate, endDate, createdBy }).save();
    return successRes(res, 201, true, "Event created successfully", event);
});

//get all events with sessions
exports.getAllEvents = catchAsync(async (req, res, next) => {
    let status = req.query?.status;
    const qb = new QueryBuilder(Event);

    // Base match filter
    let matchFilter = { isDeleted: false };

    // Agar status param aaya hai to filter me isActive add karo
    if (status !== undefined) {
        matchFilter.isActive = status === "true"; // string ko boolean me convert
    }

    qb.aggregate([
        {
            $match: matchFilter // ✅ Dynamic filter
        },
        {
            $lookup: {
                from: "eventsessions",
                let: { eventId: "$_id" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$event", "$$eventId"] },
                                    { $eq: ["$isDeleted", false] }
                                ]
                            }
                        }
                    }
                ],
                as: "sessions"
            }
        },
        {
            $sort: { createdAt: -1 }
        }
    ]);

    const events = await qb.query;

    return successRes(res, 200, true, "Events with sessions retrieved successfully", events);
});

//get event by is with sessions
exports.getEvent = catchAsync(async (req, res, next) => {
    const eventId = req.query?.eventId;
    if (!eventId) return next(new AppError("Event id is required", 400));

    const qb = new QueryBuilder(Event);
    qb.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(eventId),
                isDeleted: false // ✅ Event filter
            }
        },
        {
            $lookup: {
                from: "eventsessions",
                let: { eventId: "$_id" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$event", "$$eventId"] },
                                    { $eq: ["$isDeleted", false] } // ✅ Session filter
                                ]
                            }
                        }
                    }
                ],
                as: "sessions"
            }
        }
    ]);

    const event = await qb.query;

    return successRes(res, 200, true, "Event retrieved successfully", event);
});

exports.changeEventStatus = catchAsync(async (req, res, next) => {
    const eventId = req.body?.eventId;
    const isActive = req.body?.isActive;
    if (!eventId) return next(new AppError("Event id is required", 400));
    if (![true, false].includes(isActive)) return next(new AppError("Invalid isActive value", 400));
    let qb = new QueryBuilder(Event);
    const event = await qb.findOne({ _id: eventId }).exec();
    if (!event) {
        return next(new AppError("Event not found", 404));
    }
    event.isActive = isActive;
    await event.save();
    return successRes(res, 200, true, "Event status updated successfully", null);
})

exports.updateEvent = catchAsync(async (req, res, next) => {
    const { eventId, title, slug, description, venueName, address, images, banner, startDate, endDate } = req.body;
    if (!eventId) return next(new AppError("Event id is required", 400));
    let qb = new QueryBuilder(Event);
    const event = await qb.findOne({ _id: eventId }).exec();
    if (!event) {
        return next(new AppError("Event not found", 404));
    }
    event.title = title;
    event.slug = slug;
    event.description = description;
    event.venueName = venueName;
    event.address = address;
    event.images = images;
    event.banner = banner;
    event.startDate = startDate;
    event.endDate = endDate;
    await event.save();
    return successRes(res, 200, true, "Event updated successfully", null);
});

exports.deleteEvent = catchAsync(async (req, res, next) => {
    const eventId = req.body?.eventId;
    if (!eventId) return next(new AppError("Event id is required", 400));

    let qb = new QueryBuilder(Event);
    const event = await qb.findOne({ _id: eventId }).exec();

    if (!event) {
        return next(new AppError("Event not found", 404));
    }

    // ✅ Soft delete event
    event.isDeleted = true;
    event.deletedAt = Date.now();
    await event.save();

    // ✅ Soft delete all related sessions
    await EventSession.updateMany(
        { event: eventId, isDeleted: false },
        { $set: { isDeleted: true, deletedAt: Date.now() } }
    );

    return successRes(res, 200, true, "Event and related sessions deleted successfully", null);
});

exports.createEventSession = catchAsync(async (req, res, next) => {
    const createdBy = req.user._id;
    const sessionsData = req.body; // Always array (validated by Joi)

    // ✅ Check if event exists & get details
    const eventIds = [...new Set(sessionsData.map(s => s.event))];
    const events = await Event.find({ _id: { $in: eventIds } });

    if (events.length !== eventIds.length) {
        return next(new AppError("One or more events not found", 404));
    }

    function normalizeDate(date) {
        return new Date(date.toISOString().split("T")[0]); // removes time, works in UTC
    }

    // ✅ Duplicate check in request body itself
    const seen = new Set();
    for (let session of sessionsData) {
        const event = events.find(e => e._id.toString() === session.event);
        const startDate = normalizeDate(event.startDate);
        const endDate = normalizeDate(event.endDate);
        const sessionDate = normalizeDate(new Date(session.date));

        if (sessionDate < startDate || sessionDate > endDate) {
            return next(
                new AppError(`Session date ${session.date} is outside event date range`, 400)
            );
        }

        const key = `${session.event}_${sessionDate.toISOString()}_${session.startTime}_${session.endTime}`;
        if (seen.has(key)) {
            return next(
                new AppError(`Please provide unique sessions for date ${session.date}`, 400)
            );
        }
        seen.add(key);
    }

    // ✅ Check duplicates in DB
    for (let session of sessionsData) {
        const sessionDate = normalizeDate(new Date(session.date));

        const existing = await EventSession.findOne({
            event: session.event,
            date: sessionDate,
            startTime: session.startTime,
            endTime: session.endTime,
            isDeleted: false
        });

        if (existing) {
            return next(
                new AppError(
                    `Session already exists for event on ${session.date} with same timings`,
                    400
                )
            );
        }
    }

    // ✅ Add createdBy to each session
    const sessionsToInsert = sessionsData.map(session => ({
        ...session,
        createdBy
    }));

    // ✅ Bulk insert
    const insertedSessions = await EventSession.insertMany(sessionsToInsert);

    return successRes(res, 201, true, "Event sessions created successfully", insertedSessions);
});

exports.getEventSessionBySessionId = catchAsync(async (req, res, next) => {
    const sessionId = req.query.sessionId;
    if (!sessionId) {
        return next(new AppError("Session id is required", 400));
    }

    const qb = new QueryBuilder(EventSession);
    qb.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(sessionId),
                isDeleted: false
            }
        },
        {
            $lookup: {
                from: "events", // events collection
                localField: "event",
                foreignField: "_id",
                as: "eventDetails"
            }
        },
        { $unwind: "$eventDetails" } // Single object instead of array
    ]);

    const session = await qb.query;

    if (!session.length) {
        return next(new AppError("Event session not found", 404));
    }

    return successRes(res, 200, true, "Event session found successfully", session[0]);
});

exports.deleteEventSession = catchAsync(async (req, res, next) => {
    const sessionId = req.body?.sessionId;
    if (!sessionId) return next(new AppError("Session id is required", 400));
    const qb = new QueryBuilder(EventSession);
    const session = await qb.findOne({ _id: sessionId }).exec();
    if (!session) {
        return next(new AppError("Event session not found", 404));
    }
    session.isDeleted = true;
    session.deletedAt = Date.now();
    await session.save();
    return successRes(res, 200, true, "Event session deleted successfully", session);
});

exports.changeEventSessionStatus = catchAsync(async (req, res, next) => {
    const sessionId = req.body?.sessionId;
    const sessionStatus = req.body?.sessionStatus;
    if (!sessionId) return next(new AppError("Session id is required", 400));
    if (!['scheduled', 'cancelled', 'completed'].includes(sessionStatus)) return next(new AppError("Invalid sessionStatus value", 400));
    const qb = new QueryBuilder(EventSession);
    const session = await qb.findOne({ _id: sessionId }).exec();
    if (!session) {
        return next(new AppError("Event session not found", 404));
    }
    session.status = sessionStatus;
    await session.save();
    return successRes(res, 200, true, "Event session status updated successfully", session);
})

