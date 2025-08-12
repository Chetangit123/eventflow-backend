// models/SaleOrder.js
const mongoose = require('mongoose');
const { Schema } = mongoose;
const softDelete = require('../utils/softDelete');

const OrderItemSchema = new Schema({
    product: { type: Schema.Types.ObjectId, ref: 'ProductSale', required: true },
    titleSnapshot: String,
    qty: { type: Number, required: true },
    priceSnapshot: { type: Number, required: true },
    total: { type: Number, required: true }
}, { _id: false });

const ShipmentSchema = new Schema({
    courier: { type: String, default: 'Bluedart' },
    awb: String,
    trackingUrl: String,
    status: String
}, { _id: false });

const SaleOrderSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    items: [OrderItemSchema],
    subtotal: Number,
    shippingCharges: Number,
    total: Number,
    address: { type: Schema.Types.ObjectId, ref: 'Address', required: true },
    paymentMethod: { type: String, enum: ['online', 'cod'], required: true },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
    shipment: ShipmentSchema,
    orderStatus: { type: String, enum: ['placed', 'packed', 'shipped', 'delivered', 'cancelled', 'returned'], default: 'placed' }
}, { timestamps: true });

softDelete(SaleOrderSchema);
module.exports = mongoose.model('SaleOrder', SaleOrderSchema);
