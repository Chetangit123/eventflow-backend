const express = require("express");
const router = express.Router();
const eventManagementController = require("../controllers/commonController/eventManagementController");
const { protect } = require("../utils/jwt");
const validate = require("../middlewares/validate");
const eventValidation = require("../validations/eventValidation");

router.post('/create-event', protect('superadmin', 'event_manager'), validate(eventValidation.createEvent), eventManagementController.createEvent);
router.get('/get-all-events', protect('superadmin', 'event_manager'), eventManagementController.getAllEvents);
router.get('/get-event', protect('superadmin', 'event_manager'), eventManagementController.getEvent);
router.put('/change-event-status', protect('superadmin', 'event_manager'), eventManagementController.changeEventStatus);
router.put('/update-event', protect('superadmin', 'event_manager'), validate(eventValidation.updateEvent), eventManagementController.updateEvent);
router.put('/delete-event', protect('superadmin', 'event_manager'), eventManagementController.deleteEvent);
/** Event Session Management */

router.post('/create-event-session', protect('superadmin', 'event_manager'), validate(eventValidation.createEventSession), eventManagementController.createEventSession);
router.get('/get-session-by-id', protect('superadmin', 'event_manager'), eventManagementController.getEventSessionBySessionId);
router.put('/delete-event-session', protect('superadmin', 'event_manager'), eventManagementController.deleteEventSession);
router.put('/change-event-session-status', protect('superadmin', 'event_manager'), eventManagementController.changeEventSessionStatus);



module.exports = router;
