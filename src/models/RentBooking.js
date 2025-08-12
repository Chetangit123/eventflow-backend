// models/RentBooking.js
const mongoose = require('mongoose');
const { Schema } = mongoose;
const softDelete = require('../utils/softDelete');

const RentItemSchema = new Schema({
    product: { type: Schema.Types.ObjectId, ref: 'ProductRent', required: true },
    size: String,
    qty: { type: Number, required: true },
    pricePerDaySnapshot: { type: Number, required: true }
}, { _id: false });

const RentBookingSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    items: [RentItemSchema],
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    days: { type: Number, required: true },
    rentAmount: Number,
    depositAmount: Number,
    paymentMethod: { type: String, enum: ['online', 'cod'], default: 'online' },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
    pickupAddress: { type: Schema.Types.ObjectId, ref: 'Address' },
    returnAddress: { type: Schema.Types.ObjectId, ref: 'Address' },
    deliveryMethod: { type: String, enum: ['localPickup', 'courier'], default: 'localPickup' },
    status: { type: String, enum: ['booked', 'dispatched', 'in_use', 'returned', 'completed', 'cancelled'], default: 'booked' }
}, { timestamps: true });

softDelete(RentBookingSchema);
module.exports = mongoose.model('RentBooking', RentBookingSchema);
