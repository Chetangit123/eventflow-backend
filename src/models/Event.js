// models/Event.js
const mongoose = require('mongoose');
const { Schema } = mongoose;
const softDelete = require('../utils/softDelete');

const EventSchema = new Schema({
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: String,
    venueName: String,
    address: { type: Schema.Types.ObjectId, ref: 'Address' },
    images: [String],
    banner: String,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

softDelete(EventSchema);
module.exports = mongoose.model('Event', EventSchema);
