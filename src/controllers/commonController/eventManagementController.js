const Event = require("../../models/Event");
const catchAsync = require("../../utils/catchAsync");
const { successRes } = require("../../utils/responseFormatter");

exports.createEvent = catchAsync(async (req, res, next) => {
    const { title, slug, description, venueName, address, images, banner, startDate, endDate, createdBy } = req.body;
    const event = await new Event({ title, slug, description, venueName, address, images, banner, startDate, endDate, createdBy }).save();
    return successRes(res, 201, true, "Event created successfully", event);
});