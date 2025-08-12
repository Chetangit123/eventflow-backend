// models/ProductRent.js
const mongoose = require('mongoose');
const { Schema } = mongoose;
const softDelete = require('../utils/softDelete');

const SizeStockSchema = new Schema({
    sizeLabel: String, // eg: S, M, L or numeric
    stock: { type: Number, default: 0 }
}, { _id: false });

const ProductRentSchema = new Schema({
    title: { type: String, required: true },
    sku: String,
    description: String,
    rentPricePerDay: { type: Number, required: true },
    deposit: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' },
    sizes: [SizeStockSchema],
    images: [String],
    category: String,
    totalStock: { type: Number, default: 0 }
}, { timestamps: true });

softDelete(ProductRentSchema);
module.exports = mongoose.model('ProductRent', ProductRentSchema);
