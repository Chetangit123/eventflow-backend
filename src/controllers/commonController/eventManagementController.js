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
    const qb = new QueryBuilder(Event);

    qb.aggregate([
        {
            $lookup: {
                from: "eventsessions", // collection name (plural & lowercase)
                localField: "_id",
                foreignField: "event",
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
    const { eventId } = req.query;
    console.log(eventId, "eventId");
    const qb = new QueryBuilder(Event);
    qb.aggregate([
        {
            $match: { _id: new mongoose.Types.ObjectId(eventId) }
        },
        {
            $lookup: {
                from: "eventsessions", // collection name (plural & lowercase)
                localField: "_id",
                foreignField: "event",
                as: "sessions"
            }
        }
    ]);

    const event = await qb.query;

    return successRes(res, 200, true, "Event retrieved successfully", event);
});

exports.createEventSession = catchAsync(async (req, res, next) => {
    const createdBy = req.user._id;
    const sessionsData = req.body; // hamesha array (validated by Joi)

    // ✅ Check if event exists & get details
    const eventIds = [...new Set(sessionsData.map(s => s.event))];
    const events = await Event.find({ _id: { $in: eventIds } });

    if (events.length !== eventIds.length) {
        return next(new AppError("One or more events not found", 404));
    }

    function normalizeDate(date) {
        return new Date(date.toISOString().split("T")[0]); // removes time part, works in UTC
    }

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


