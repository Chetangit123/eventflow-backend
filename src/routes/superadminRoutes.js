const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController/userAuthController");
const authController = require("../controllers/commonController/authController");
const adminManagerController = require("../controllers/adminController/adminManagerController");
const { protect } = require("../utils/jwt");

//roles : superadmin, event_manager, gatekeeper

router.post('/login-admin', authController.loginUser);
router.get('/get-admin-profile', protect('superadmin', 'event_manager', 'gatekeeper'), authController.getUserProfile);
router.put('/update-admin-profile', protect('superadmin', 'event_manager', 'gatekeeper'), authController.updateUserProfile);
router.put('/change-password', protect('superadmin', 'event_manager', 'gatekeeper'), authController.changePassword);

/**  Event-Manager Management Routes */

router.post('/create-event-manager', protect('superadmin'), adminManagerController.createEventManager);
router.get('/get-all-event-managers', protect('superadmin'), adminManagerController.getAllEventManagers);
// router.get('/get-event-manager/:id', protect('superadmin'), adminManagerController.getEventManager);
// router.put('/update-event-manager/:id', protect('superadmin'), adminManagerController.updateEventManager);
// router.delete('/delete-event-manager/:id', protect('superadmin'), adminManagerController.deleteEventManager);

module.exports = router;
