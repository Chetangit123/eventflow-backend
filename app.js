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
require("dotenv").config();

const app = express();

// ------------------------
// ✅ Global Middlewares
// ------------------------

// Secure HTTP headers
app.use(helmet());

// Enable CORS
app.use(cors());

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

// ------------------------
// ✅ 404 + Error Handler
// ------------------------
app.use(notFound);
app.use(globalErrorHandler);

module.exports = app;
