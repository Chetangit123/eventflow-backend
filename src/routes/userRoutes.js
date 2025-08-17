const express = require("express");
const router = express.Router();
const authController = require("../controllers/commonController/authController");
const userAuthController = require("../controllers/userController/userAuthController");
const TicketBookingController = require("../controllers/userController/ticketBookingController");
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

/** Ticket Booking Routes */
router.post('/book-tickets', protect('user'), TicketBookingController.bookTickets);
// router.get('/get-all-bookings', protect('user'), TicketBookingController.getAllBookings);
// router.get('/get-booking-by-id', protect('user'), TicketBookingController.getBookingById);
// router.get('/get-all-events', protect('user'), TicketBookingController.getAllEvents);

module.exports = router;
