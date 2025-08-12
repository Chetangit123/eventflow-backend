// models/ProductSale.js
const mongoose = require('mongoose');
const { Schema } = mongoose;
const softDelete = require('../utils/softDelete');

const ProductSaleSchema = new Schema({
    title: { type: String, required: true },
    sku: { type: String, index: true },
    description: String,
    price: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    stock: { type: Number, default: 0 },
    images: [String],
    category: String,
    isBluedartEligible: { type: Boolean, default: true },
    dimensions: { height: Number, width: Number, depth: Number },
    weightGrams: Number
}, { timestamps: true });

softDelete(ProductSaleSchema);
module.exports = mongoose.model('ProductSale', ProductSaleSchema);
