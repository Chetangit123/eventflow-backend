// models/RentBooking.js
const mongoose = require('mongoose');
const { Schema } = mongoose;
const softDelete = require('../utils/softDelete');
const { launch } = require('puppeteer');

const RentItemSchema = new Schema({
    product: { type: Schema.Types.ObjectId, ref: 'ProductRent', required: true },
    variantId: { type: Schema.Types.ObjectId }, // selected variant id
    size: String,
    qty: { type: Number, required: true, min: 1 },
    pricePerDaySnapshot: { type: Number, required: true }, // snapshot of price used for booking
    productSnapshot: { // product & variant snapshot at booking time
        _id: Schema.Types.ObjectId,
        title: String,
        sku: String,
        deposit: Number,
        rentPricePerDay: Number,
        currency: String,
        variantSnapshot: {
            _id: Schema.Types.ObjectId,
            color: String,
            size: String,
            sku: String
        },
        images: { type: [String], default: [] }
    }
}, { _id: false });

// snapshot shape for addresses (keeps history)
const AddressSnapshotSchema = new Schema({
    fullName: String,
    phone: String,
    labeL: String,
    line1: String,
    line2: String,
    city: String,
    state: String,
    pincode: String,
    country: String,
}, { _id: false });

const RentBookingSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },

    items: { type: [RentItemSchema], required: true },

    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    days: { type: Number, required: true },

    rentAmount: { type: Number, default: 0 },
    depositAmount: { type: Number, default: 0 },

    paymentMethod: { type: String, enum: ['online', 'cod'], default: 'online' },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },

    pickupAddress: { type: Schema.Types.ObjectId, ref: 'Address' },
    pickupAddressSnapshot: AddressSnapshotSchema,

    returnAddress: { type: Schema.Types.ObjectId, ref: 'Address' },
    returnAddressSnapshot: AddressSnapshotSchema,

    deliveryMethod: { type: String, enum: ['localPickup', 'courier'], default: 'localPickup' },

    status: { type: String, enum: ['booked', 'dispatched', 'in_use', 'returned', 'completed', 'cancelled'], default: 'booked' }
}, { timestamps: true });

// indexes for faster queries
RentBookingSchema.index({ user: 1, status: 1, paymentStatus: 1, createdAt: -1 });

/**
 * Compute inclusive days between startDate and endDate and compute amounts
 */
RentBookingSchema.pre('validate', function (next) {
    const MS_PER_DAY = 24 * 60 * 60 * 1000;
    if (this.startDate && this.endDate) {
        const s = new Date(this.startDate);
        const e = new Date(this.endDate);
        // normalize to midnight for inclusive whole-day counting
        s.setHours(0, 0, 0, 0);
        e.setHours(0, 0, 0, 0);
        const diff = Math.round((e - s) / MS_PER_DAY) + 1;
        this.days = Math.max(1, diff);
    } else {
        this.days = this.days || 1;
    }

    if (this.items && this.items.length) {
        let rent = 0;
        let deposit = 0;
        this.items.forEach(it => {
            const qty = it.qty || 1;
            const pricePerDay = it.pricePerDaySnapshot || (it.productSnapshot && it.productSnapshot.rentPricePerDay) || 0;
            rent += pricePerDay * qty * this.days;
            deposit += (it.productSnapshot?.deposit || 0) * qty;
        });
        this.rentAmount = rent;
        this.depositAmount = deposit;
    }

    next();
});

/**
 * When creating a new booking we decrement variant stock atomically.
 * This uses ProductRent.adjustVariantStock which itself is transaction-aware.
 * IMPORTANT: ensure ProductRent model is registered before RentBooking (require order).
 */
RentBookingSchema.pre('save', async function (next) {
    if (!this.isNew) return next(); // only apply on new bookings
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const ProductRent = mongoose.model('ProductRent');
        for (const it of this.items) {
            const productId = it.product;
            const variantId = it.variantId;
            const qty = it.qty;
            // decrement stock
            await ProductRent.adjustVariantStock(productId, variantId, -qty, session);
        }
        await session.commitTransaction();
        session.endSession();
        next();
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        next(err);
    }
});

/**
 * Restore stock helper (call when booking cancelled/refunded/returned as appropriate).
 * This will increase qty back to product variant and totalStock.
 */
RentBookingSchema.methods.restoreStock = async function () {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const ProductRent = mongoose.model('ProductRent');
        for (const it of this.items) {
            await ProductRent.adjustVariantStock(it.product, it.variantId, +it.qty, session);
        }
        await session.commitTransaction();
        session.endSession();
        return true;
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        throw err;
    }
};

softDelete(RentBookingSchema);
module.exports = mongoose.model('RentBooking', RentBookingSchema);
