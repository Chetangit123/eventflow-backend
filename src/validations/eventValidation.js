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

// ✅ Create Event Session Validation (Array only)
const createEventSession = Joi.array().items(
    Joi.object({
        event: Joi.string().required(),
        specialNameOfDay: Joi.string().required(),
        date: Joi.date().required(),
        startTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required(), // HH:mm
        endTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required(),
        pricePerTicket: Joi.number().positive().required(),
        currency: Joi.string().default("INR"),
        totalCapacity: Joi.number().positive().required(),
        remainingCapacity: Joi.number().positive().required(),
        status: Joi.string().valid("scheduled", "cancelled", "completed").default("scheduled")
    })
).min(1).required();

const eventValidation = {
    createEvent,
    createEventSession
};

module.exports = eventValidation;
