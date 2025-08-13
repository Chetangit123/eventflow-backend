// models/Event.js
const mongoose = require('mongoose');
const { Schema } = mongoose;
const softDelete = require('../utils/softDelete');

const EventSchema = new Schema({
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true }, // SEO friendly URL
    description: String,
    venueName: String,
    address: { type: Schema.Types.ObjectId, ref: 'Address' },
    images: [String],
    banner: String,
    startDate: { type: Date, required: true }, // ✅ Event start date
    endDate: { type: Date, required: true },   // ✅ Event end date
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

softDelete(EventSchema);
module.exports = mongoose.model('Event', EventSchema);
