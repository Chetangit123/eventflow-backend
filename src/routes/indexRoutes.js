const express = require("express");
const router = express.Router();

router.use("/user", require("./userRoutes"));
router.use("/superadmin", require("./superadminRoutes"));

module.exports = router;
