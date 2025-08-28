// models/TicketBooking.js
const mongoose = require('mongoose');
const { Schema } = mongoose;
const softDelete = require('../utils/softDelete');

const TicketSubSchema = new Schema({
    ticketId: { type: String, required: true },
    qrData: { type: String, required: true, },
    qrImage: String,
    pdfPath: String,
    attendeeName: String,
    scanned: { type: Boolean, default: false },
    scannedAt: Date,
    status: { type: String, enum: ['pending', 'generated', 'failed'], default: 'pending' } // new
}, { _id: false });

const TicketBookingSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    eventSession: { type: Schema.Types.ObjectId, ref: 'EventSession', required: true },
    event: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    quantity: { type: Number, required: true },
    attendeeDetails: [{ name: String, phone: String }],
    pricePerTicket: { type: Number },
    totalAmount: { type: Number },
    currency: { type: String, default: 'INR' },
    paymentMethod: { type: String, enum: ['razorpay'], required: true },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
    ticketStatus: {
        type: String, enum: ['pending', 'processing', 'retrying', 'confirmed', 'failed'], default: 'pending'
    }, // new
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,
    tickets: [TicketSubSchema],
    bookedAt: { type: Date, default: Date.now },
    notes: String
}, { timestamps: true });

TicketBookingSchema.index({ user: 1, eventSession: 1 });

softDelete(TicketBookingSchema);
module.exports = mongoose.model('TicketBooking', TicketBookingSchema);
