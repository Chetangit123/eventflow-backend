require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const rateLimit = require("./src/middlewares/rateLimiter");
const indexRoutes = require("./src/routes/indexRoutes");
const notFound = require("./src/middlewares/notFound");
const globalErrorHandler = require("./src/middlewares/errorHandler");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./src/config/swagger");
const path = require("path");
const ENVIRONMENT = require("./src/config/env");
//cron file
require("./src/workers/ticketGenerator");
require("./src/workers/cancelOrderCron");
console.log(ENVIRONMENT.NODE_ENV, "NODEENV")

const app = express();

// ------------------------
// ✅ Global Middlewares
// ------------------------

// Secure HTTP headers
app.use(helmet());

const corsOptions = {
    origin: function (origin, callback) {
        if (ENVIRONMENT.NODE_ENV === 'development') {
            callback(null, 'http://localhost:3000');
        } else if (ENVIRONMENT.NODE_ENV === 'production') {
            callback(null, 'http://localhost:3000');
        } else {
            callback(null, false);
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
};

// Enable CORS
app.use(cors(corsOptions));

// Parse JSON body
app.use(express.json());

// Optional: if you're using URL-encoded forms too
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ Patch: Clone req.query before sanitization (avoids error)
app.use((req, res, next) => {
    req.query = { ...req.query };
    next();
});



// Rate limiter to prevent abuse
app.use(rateLimit);

// ------------------------
// ✅ Swagger Docs
// ------------------------
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ------------------------
// ✅ Routes
// ------------------------
app.use("/api/v1", indexRoutes);

//dummy route
app.get("/api/v1/test", (req, res) => {
    res.send("Hello world!");
});

// ------------------------
// ✅ 404 + Error Handler
// ------------------------
app.use(notFound);
app.use(globalErrorHandler);

module.exports = app;
