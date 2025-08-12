// models/EventSession.js
const mongoose = require('mongoose');
const { Schema } = mongoose;
const softDelete = require('../utils/softDelete');

const EventSessionSchema = new Schema({
    event: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    date: { type: Date, required: true, index: true }, // specific date for which this session runs
    startTime: { type: String, required: true }, // "20:00"
    endTime: { type: String, required: true },   // "00:00"
    pricePerTicket: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    totalCapacity: { type: Number, required: true }, // total seats
    remainingCapacity: { type: Number, required: true }, // update atomically
    status: { type: String, enum: ['scheduled', 'cancelled', 'completed'], default: 'scheduled' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

EventSessionSchema.index({ event: 1, date: 1 }, { unique: true }); // one session per event per date

softDelete(EventSessionSchema);
module.exports = mongoose.model('EventSession', EventSessionSchema);
