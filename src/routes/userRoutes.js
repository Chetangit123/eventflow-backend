const express = require("express");
const router = express.Router();
const authController = require("../controllers/commonController/authController");
const userAuthController = require("../controllers/userController/userAuthController");
const TicketBookingController = require("../controllers/userController/ticketBookingController");
const eventManagementController = require("../controllers/commonController/eventManagementController");
const cartController = require("../controllers/userController/cartController");
const { protect } = require("../utils/jwt");



router.post('/create-user', authController.createUser);
router.put('/verify-email-with-link', authController.verifyEmailWithLink);
router.post('/login-user', authController.loginUser);
router.get('/get-user-profile', protect('user'), authController.getUserProfile);
router.put('/update-user-profile', protect('user'), authController.updateUserProfile);
router.put('/change-password', protect('user'), authController.changePassword);
router.post('/forget-password', authController.forgetPassowrd);
router.put('/reset-password', authController.resetPassword);
router.post('/create-address', protect('user'), userAuthController.createAddress);

/** event Details Routes */
router.get('/get-all-events', eventManagementController.getAllEvents);
router.get('/get-event', eventManagementController.getEvent);
router.get('/get-event-session', eventManagementController.getEventSessionBySessionId);

/** Ticket Booking Routes */
router.post('/book-tickets', protect('user'), TicketBookingController.bookTickets);
router.get('/get-all-ticket-bookings', protect('user'), TicketBookingController.getTicketBookings);
router.get('/get-booking-by-id', protect('user'), TicketBookingController.getBookingById);


/** Cart Management */

router.post('/add-to-cart', protect('user'), cartController.addToCart);
router.get('/get-cart', protect('user'), cartController.getCart);
router.put('/remove-item-from-cart', protect('user'), cartController.removeItemFromCart);
router.put('/clear-cart', protect('user'), cartController.clearCart);
router.put('/update-item-quantity', protect('user'), cartController.updateItemQuantity);

module.exports = router;
