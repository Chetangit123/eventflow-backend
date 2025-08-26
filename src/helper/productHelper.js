/* ============================== Helpers ============================== */

const isValidId = (id) => mongoose.isValidObjectId(id);

const effectivePriceOf = (variant) => {
    const p = Number(variant?.price || 0);
    const dp = Number(variant?.discountPrice || 0);
    return dp > 0 ? dp : p;
};

const discountPctOf = (variant) => {
    const p = Number(variant?.price || 0);
    const dp = Number(variant?.discountPrice || 0);
    if (p > 0 && dp > 0) return ((p - dp) / p) * 100;
    return 0;
};

// Shipping rule example (customize):
// - Free shipping if subtotal >= 999
// - Else flat 79
const calcShipping = (subtotal) => {
    if (subtotal >= 999) return 0;
    return 79;
};

// Optional coupon hook (replace with real Coupon model if you have)
async function applyCouponIfAny({ couponCode, userId, items, subtotal }) {
    // TODO: integrate your Coupon model & validations (expiry, user limit, min cart value, etc.)
    // For now, simple demo:
    if (!couponCode) return { coupon: null, discountAmount: 0, reason: null };

    const code = String(couponCode).toUpperCase();
    if (code === 'FLAT100' && subtotal >= 500) {
        return { coupon: code, discountAmount: 100, reason: null };
    }
    // invalid or not applicable
    return { coupon: null, discountAmount: 0, reason: 'Invalid or not applicable' };
}

// Load product + specific variant
async function loadProductAndVariant(productId, variantId, session = null) {
    const product = await ProductSale.findById(productId).session(session);
    if (!product) throw new AppError('Product not found', 404);

    const variant = product.variants.id(variantId);
    if (!variant) throw new AppError('Variant not found', 404);

    return { product, variant };
}

// Build order item snapshot
function buildOrderItemSnapshot({ product, variant, qty }) {
    const price = Number(variant.price || 0);
    const discountPrice = Number(variant.discountPrice || 0);
    const sell = effectivePriceOf(variant);

    return {
        product: product._id,
        variantId: variant._id,
        titleSnapshot: product.title,
        colorSnapshot: variant.color || null,
        sizeSnapshot: variant.size || null,
        skuSnapshot: variant.sku || null,
        qty: Number(qty),
        priceSnapshot: price,
        discountPriceSnapshot: discountPrice > 0 ? discountPrice : null,
        total: sell * Number(qty)
    };
}

// Atomic stock decrement for ONE line item
async function decrementStockAtomic({ productId, variantId, qty, session }) {
    const res = await ProductSale.updateOne(
        { _id: productId, 'variants._id': variantId, 'variants.stock': { $gte: qty } },
        { $inc: { 'variants.$.stock': -qty } },
        { session }
    );
    return res.matchedCount === 1 && res.modifiedCount === 1;
}

module.exports = {
    isValidId,
    effectivePriceOf,
    discountPctOf,
    calcShipping,
    applyCouponIfAny,
    loadProductAndVariant,
    buildOrderItemSnapshot,
    decrementStockAtomic
};