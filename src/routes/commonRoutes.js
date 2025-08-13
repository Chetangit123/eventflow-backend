const express = require("express");
const router = express.Router();
const eventManagementController = require("../controllers/commonController/eventManagementController");
const { protect } = require("../utils/jwt");
const validate = require("../middlewares/validate");
const eventValidation = require("../validations/eventValidation");

router.post('/create-event', protect('superadmin', 'event_manager'), validate(eventValidation.createEvent), eventManagementController.createEvent);

module.exports = router;
