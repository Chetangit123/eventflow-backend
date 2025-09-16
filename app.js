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

app.use(helmet());
const corsOptions = {
    origin: "*", // allow all domains
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    preflightContinue: false,
    optionsSuccessStatus: 204
};
app.use(cors(corsOptions));

app.use(express.json());

app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));




app.use((req, res, next) => {
    req.query = { ...req.query };
    next();
});

// app.use(rateLimit);

// ------------------------
// ✅ Routes
// ------------------------
app.use("/api/v1", indexRoutes);

//dummy route
app.get("/api/v1/test", (req, res) => {
    res.send("Hello world!");
});

app.get("/api/v1/download-ticket/*", (req, res) => {
    // Get the full filename after /download-ticket/
    const filename = req.params[0]; // req.params[0] contains everything after *
    const file = path.join(__dirname, "uploads/tickets", filename);

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
    res.sendFile(file, (err) => {
        if (err) res.status(404).json({ success: false, message: "File not found" });
    });
});

app.use(notFound);
app.use(globalErrorHandler);

module.exports = app;



// require("dotenv").config();
// const express = require("express");
// const cors = require("cors");
// const helmet = require("helmet");
// const mongoSanitize = require("express-mongo-sanitize");
// const xss = require("xss-clean");
// const rateLimit = require("./src/middlewares/rateLimiter");
// const indexRoutes = require("./src/routes/indexRoutes");
// const notFound = require("./src/middlewares/notFound");
// const globalErrorHandler = require("./src/middlewares/errorHandler");
// const swaggerUi = require("swagger-ui-express");
// const swaggerSpec = require("./src/config/swagger");
// const path = require("path");
// const morgan = require("morgan");
// const ENVIRONMENT = require("./src/config/env");

// // Cron jobs
// require("./src/workers/ticketGenerator");
// require("./src/workers/cancelOrderCron");

// console.log(ENVIRONMENT.NODE_ENV, "NODEENV");

// const app = express();

// // ------------------------
// // ✅ Security Middlewares
// // ------------------------

// // Secure HTTP headers
// app.use(
//     helmet({
//         contentSecurityPolicy: {
//             directives: {
//                 defaultSrc: ["'self'"],
//                 scriptSrc: ["'self'"],
//                 objectSrc: ["'none'"],
//                 upgradeInsecureRequests: [],
//             },
//         },
//         crossOriginEmbedderPolicy: false,
//     })
// );

// // Prevent XSS attacks
// // app.use(xss());

// // Prevent NoSQL Injection
// // app.use(mongoSanitize());

// // Rate limiting
// app.use(rateLimit);

// // ------------------------
// // ✅ CORS Configuration
// // ------------------------
// const corsOptions = {
//     origin: function (origin, callback) {
//         if (ENVIRONMENT.NODE_ENV === "development") {
//             callback(null, "http://localhost:3000");
//         } else if (ENVIRONMENT.NODE_ENV === "production") {
//             callback(null, "https://your-production-frontend.com"); // replace with real domain
//         } else {
//             callback(null, false);
//         }
//     },
//     methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//     credentials: true,
// };

// app.use(cors(corsOptions));

// // ------------------------
// // ✅ Logging
// // ------------------------
// if (ENVIRONMENT.NODE_ENV === "development") {
//     app.use(morgan("dev"));
// }

// // ------------------------
// // ✅ Body Parsers
// // ------------------------
// app.use(express.json({ limit: "10kb" })); // limit request body size
// app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// // Clone req.query to prevent issues with sanitization
// app.use((req, res, next) => {
//     req.query = { ...req.query };
//     next();
// });

// // ------------------------
// // ✅ Static Files Security
// // ------------------------
// app.use("/uploads", (req, res, next) => {
//     res.header(
//         "Access-Control-Allow-Origin",
//         ENVIRONMENT.NODE_ENV === "development"
//             ? "http://localhost:3000"
//             : "https://your-production-frontend.com"
//     );
//     res.header("Access-Control-Allow-Methods", "GET,OPTIONS");
//     res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
//     res.header("X-Content-Type-Options", "nosniff");
//     res.header("X-Frame-Options", "DENY"); // clickjacking
//     next();
// }, express.static(path.join(__dirname, "uploads")));

// // ------------------------
// // ✅ Swagger Docs (Optional: protect in prod)
// // ------------------------
// app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// // ------------------------
// // ✅ Routes
// // ------------------------
// app.use("/api/v1", indexRoutes);

// // Dummy test route
// app.get("/api/v1/test", (req, res) => {
//     res.send("Hello world!");
// });

// // ------------------------
// // ✅ 404 + Global Error Handler
// // ------------------------
// app.use(notFound);
// app.use(globalErrorHandler);

// module.exports = app;
