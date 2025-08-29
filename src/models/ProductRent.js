// models/ProductRent.js
const mongoose = require('mongoose');
const { Schema } = mongoose;
const softDelete = require('../utils/softDelete');

const VariantSchema = new Schema({
    _id: { type: Schema.Types.ObjectId, auto: true },
    color: { type: String, required: true },
    size: { type: String, default: 'free' },
    sku: { type: String }, // validated unique within product (see pre-validate)
    price: { type: Number, required: true },
    discountPrice: { type: Number, default: 0 },
    stock: { type: Number, default: 0, min: 0 },
    images: { type: [String], default: [] }
}, { _id: true });

const ProductRentSchema = new Schema({
    title: { type: String, required: true, trim: true },
    sku: { type: String, index: true },
    description: { type: String, default: '' },
    rentPricePerDay: { type: Number, required: true },
    deposit: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' },
    variants: { type: [VariantSchema], default: [] },
    tags: { type: [String], default: [] },
    status: { type: String, enum: ['available', 'unavailable'], default: 'available' },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    totalStock: { type: Number, default: 0, min: 0 }
}, { timestamps: true });

// Validate duplicate variant SKUs within same product & compute totalStock
ProductRentSchema.pre('validate', function (next) {
    if (this.variants && this.variants.length) {
        const skus = this.variants.map(v => v.sku).filter(Boolean);
        const dup = skus.find((s, i) => skus.indexOf(s) !== i);
        if (dup) return next(new Error(`Duplicate variant SKU in product: ${dup}`));
        this.totalStock = this.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
    } else {
        this.totalStock = 0;
    }
    next();
});

/**
 * Atomically adjust variant stock and product totalStock.
 * Use inside a transaction/session for safety.
 * @param {ObjectId} productId
 * @param {ObjectId} variantId
 * @param {Number} delta (negative to decrement)
 * @param {ClientSession|null} session
 */
ProductRentSchema.statics.adjustVariantStock = async function (productId, variantId, delta, session = null) {
    const opts = {};
    if (session) opts.session = session;

    // Try to update the specific variant stock and product totalStock
    const updated = await this.findOneAndUpdate(
        { _id: productId, 'variants._id': variantId },
        { $inc: { 'variants.$.stock': delta, totalStock: delta } },
        { new: true, ...opts }
    );

    if (!updated) throw new Error('Product or variant not found');
    // Ensure variant stock non-negative
    const variant = updated.variants.id(variantId);
    if (!variant) throw new Error('Variant not found after update');
    if (variant.stock < 0) throw new Error('Insufficient stock - operation would make stock negative');

    return updated;
};

softDelete(ProductRentSchema);

module.exports = mongoose.model('ProductRent', ProductRentSchema);
