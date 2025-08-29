const Joi = require("joi");

const mongoose = require('mongoose');

const objectId = (value, helpers) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.message('"{{#label}}" must be a valid ObjectId');
    }
    return value;
};

module.exports = {
    rentNowValidation: Joi.object({
        productId: Joi.string().custom(objectId).required(),
        variantId: Joi.string().custom(objectId).required(),
        qty: Joi.number().integer().min(1).default(1),
        startDate: Joi.date().iso().required()
            .messages({ 'date.format': 'startDate must be in ISO format (YYYY-MM-DD)' }),
        endDate: Joi.date().iso().greater(Joi.ref('startDate')).required()
            .messages({ 'date.greater': 'endDate must be greater than startDate' }),
        addressId: Joi.string().custom(objectId).required(),
        paymentMethod: Joi.string().valid('cod', 'online').required(),
        gateway: Joi.string().valid('razorpay', 'stripe').default('razorpay')
    }),

}

