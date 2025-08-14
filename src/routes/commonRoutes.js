const express = require("express");
const router = express.Router();
const eventManagementController = require("../controllers/commonController/eventManagementController");
const { protect } = require("../utils/jwt");
const validate = require("../middlewares/validate");
const eventValidation = require("../validations/eventValidation");

router.post('/create-event', protect('superadmin', 'event_manager'), validate(eventValidation.createEvent), eventManagementController.createEvent);
router.get('/get-all-events', protect('superadmin', 'event_manager'), eventManagementController.getAllEvents);
router.get('/get-event', protect('superadmin', 'event_manager'), eventManagementController.getEvent);

/** Event Session Management */


router.post('/create-event-session', protect('superadmin', 'event_manager'), validate(eventValidation.createEventSession), eventManagementController.createEventSession);



module.exports = router;
