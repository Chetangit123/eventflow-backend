const Joi = require("joi");

// ✅ Create Event Validation
const createEvent = Joi.object({
    title: Joi.string().min(3).max(100).required(),
    slug: Joi.string()
        .pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
        .optional()
        .messages({
            "string.pattern.base": "Slug must be URL-friendly (lowercase, hyphens allowed)"
        }),
    description: Joi.string().required().max(2000),
    venueName: Joi.string().required().max(200),
    address: Joi.object({
        address: Joi.string().required().max(300),
        landmark: Joi.string().required().max(200),
        city: Joi.string().required().max(200),
        state: Joi.string().required().max(200),
        pincode: Joi.string().pattern(/^\d{5,6}$/).required().max(200),
        country: Joi.string().allow(null, ""),
        maplink: Joi.string().uri().allow(null, ""),
        lat: Joi.number().min(-90).max(90).allow(null),
        lng: Joi.number().min(-180).max(180).allow(null)
    }).optional(),
    images: Joi.array().items(Joi.string().uri()).default([]),
    banner: Joi.string().uri().allow(null, ""),
    startDate: Joi.date().required(),
    endDate: Joi.date().required().min(Joi.ref("startDate"))
        .messages({
            "date.min": "End date must be after start date"
        }),
});

// ✅ Example: Create Event Session Validation
const createEventSession = Joi.object({
    eventId: Joi.string().required(),
    sessionName: Joi.string().min(3).max(100).required(),
    startTime: Joi.date().required(),
    endTime: Joi.date().required().min(Joi.ref("startTime")),
    speaker: Joi.string().allow("", null),
    description: Joi.string().allow("", null)
});

const eventValidation = {
    createEvent,
    createEventSession
};

module.exports = eventValidation;
