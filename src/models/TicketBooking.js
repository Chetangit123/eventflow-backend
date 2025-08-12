// models/TicketBooking.js
const mongoose = require('mongoose');
const { Schema } = mongoose;
const softDelete = require('../utils/softDelete');

const TicketSubSchema = new Schema({
    ticketId: { type: String, required: true, unique: true }, // eg: NAV-2025-XXXXX
    qrData: { type: String, required: true, unique: true }, // encoded payload used to generate QR
    qrImage: String, // path or url to generated QR image (optional)
    pdfPath: String,  // path or url to generated ticket PDF
    attendeeName: String,
    scanned: { type: Boolean, default: false },
    scannedAt: Date
}, { _id: false });

const TicketBookingSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    eventSession: { type: Schema.Types.ObjectId, ref: 'EventSession', required: true },
    quantity: { type: Number, required: true },
    attendeeDetails: [{ name: String, phone: String }], // optional per-ticket details
    pricePerTicket: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    paymentMethod: { type: String, enum: ['razorpay'], required: true }, // only razorpay for tickets
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,
    tickets: [TicketSubSchema], // generated after payment success
    bookedAt: { type: Date, default: Date.now },
    notes: String
}, { timestamps: true });

TicketBookingSchema.index({ user: 1, eventSession: 1 });

softDelete(TicketBookingSchema);
module.exports = mongoose.model('TicketBooking', TicketBookingSchema);
