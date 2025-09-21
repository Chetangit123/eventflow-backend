// src/controllers/adminBookingController.js
const catchAsync = require("../../utils/catchAsync");
const TicketBooking = require("../../models/TicketBooking");
const User = require("../../models/User");
const QueryBuilder = require("../../services/queryBuilder");
const Razorpay = require("razorpay");
const { successRes } = require("../../utils/responseFormatter");
const AppError = require("../../utils/AppError");

const searchBookings = catchAsync(async (req, res, next) => {
    const { q } = req.query;

    if (!q || q.trim() === "") {
        return res.status(400).json({ success: false, message: "Provide a search query" });
    }

    const searchRegex = new RegExp(q, "i");

    // Search users by name, email, or phone
    const userQb = new QueryBuilder(User)
        .filter({
            $or: [
                { name: searchRegex },
                { email: searchRegex },
                { phone: searchRegex }
            ]
        })
        .select("_id name email phone")

    const users = await userQb.exec();
    const userIds = users.map(u => u._id);
    console.log(userIds, "111111111111")
    // Fetch bookings for matched users
    const bookingsQb = new QueryBuilder(TicketBooking)
        .filter({ user: { $in: userIds }, generatedBy: "user" })
        .populate("user", "name email phone")
        .populate("event", "name")
        .populate("eventSession", "date specialNameOfDay")

    const bookings = await bookingsQb.exec();
    return successRes(res, 200, true, "Bookings fetched successfully", bookings);
});


const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const checkPaymentStatus = catchAsync(async (req, res, next) => {
    const bookingId = req.query?.bookingId;

    const booking = await new QueryBuilder(TicketBooking).filter({ _id: bookingId }).exec().then(b => b[0]);
    if (!booking) return next(new AppError("Booking not found", 404));

    if (!booking.razorpayOrderId) {
        return next(new AppError("Razorpay order id not found", 404));
    }

    const payments = await razorpay.orders.fetchPayments(booking.razorpayOrderId);
    const capturedPayment = payments.items.find(p => p.status === "captured");
    return successRes(res, 200, true, "Payment status fetched successfully", {
        paymentStatus: capturedPayment ? "paid" : "pending",
        razorpayPaymentId: capturedPayment ? capturedPayment.id : null,
        raw: payments.items
    })
});

const updatePaymentStatus = catchAsync(async (req, res, next) => {
    const bookingId = req.body?.bookingId;

    if (!bookingId) {
        return next(new AppError("Booking ID is required", 400));
    }

    // Fetch booking
    const booking = await new QueryBuilder(TicketBooking).filter({ _id: bookingId }).exec().then(b => b[0]);
    if (!booking) return next(new AppError("Booking not found", 404));

    if (!booking.razorpayOrderId) {
        return next(new AppError("Razorpay order id not found", 404));
    }

    // Fetch payments from Razorpay
    const payments = await razorpay.orders.fetchPayments(booking.razorpayOrderId);
    const capturedPayment = payments.items.find(p => p.status === "captured");

    if (!capturedPayment) {
        return next(new AppError("No captured payment found for this booking", 400));
    }

    // Update booking in backend
    booking.paymentStatus = "paid";
    booking.ticketStatus = "pending"; // tickets will be generated
    booking.razorpayPaymentId = capturedPayment.id;
    booking.paymentProcessedUsing = "admin-manual";
    await booking.save();

    return successRes(res, 200, true, "Payment status updated successfully", booking);
});


module.exports = {
    searchBookings,
    checkPaymentStatus,
    updatePaymentStatus
};