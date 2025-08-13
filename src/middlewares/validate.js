const AppError = require("../utils/AppError");

module.exports = (schema) => {
    return (req, res, next) => {
        if (!req.body) {
            return next(new AppError("Request body is missing", 400));
        }

        const { error } = schema.validate(req.body, { abortEarly: true });

        if (error) {
            // Clean the message: remove double quotes
            const rawMessage = error.details[0].message;
            const cleanMessage = rawMessage.replace(/"/g, "");
            return next(new AppError(cleanMessage, 400));
        }

        next();
    };
};
