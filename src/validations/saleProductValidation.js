// validations/productValidations.js
const Joi = require("joi");

const createProduct = Joi.object({
    title: Joi.string().trim().required(),
    description: Joi.string().allow(""),
    category: Joi.string().required(),
    tags: Joi.array().items(Joi.string()),

    variants: Joi.array()
        .items(
            Joi.object({
                color: Joi.string().required(),
                size: Joi.string().required(),
                price: Joi.number().positive().required(),
                discountPrice: Joi.number().positive().less(Joi.ref('price')).optional(),
                stock: Joi.number().integer().min(0).default(0),
                images: Joi.array().items(Joi.string().uri()).default([]),
                sku: Joi.string().optional()
            })
        )
        .min(1)
        .required(),

    status: Joi.string().valid("active", "inactive", "draft").default("active")
});

module.exports = { createProduct };
