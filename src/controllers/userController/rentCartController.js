// controllers/rentCartController.js
const mongoose = require('mongoose');
const RentCart = mongoose.model('RentCart');
const ProductRent = mongoose.model('ProductRent');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/AppError');
const { recalcRentCartTotals } = require('../../utils/cartUtils');

// helper: find or create cart for user
async function findOrCreateCart(userId) {
    let cart = await RentCart.findOne({ user: userId });
    if (!cart) cart = await RentCart.create({ user: userId });
    return cart;
}

exports.getCart = catchAsync(async (req, res, next) => {
    const cart = await RentCart.findOne({ user: req.user._id }).lean();
    if (!cart) return res.json({ success: true, cart: null });
    return res.json({ success: true, cart });
});

exports.addItem = catchAsync(async (req, res, next) => {
    // body: { productId, variantId, qty, startDate?, endDate? }
    const { productId, variantId, qty = 1, startDate, endDate } = req.body || {};
    if (!productId || !variantId) return next(new AppError('productId and variantId are required', 400));

    const product = await ProductRent.findById(productId).lean();
    if (!product) return next(new AppError('Product not found', 404));

    const variant = product.variants.find(v => String(v._id) === String(variantId));
    if (!variant) return next(new AppError('Variant not found', 404));

    const cart = await findOrCreateCart(req.user._id);

    // merge if same product+variant already in cart
    const existingIndex = cart.items.findIndex(it => String(it.product) === String(productId) && String(it.variantId) === String(variantId));
    const days = (startDate && endDate) ? undefined : undefined; // we will set cart.startDate if provided below

    if (existingIndex > -1) {
        cart.items[existingIndex].qty += Number(qty || 1);
        // refresh price snapshots in case product changed
        cart.items[existingIndex].rentPricePerDay = variant.price || product.rentPricePerDay;
        cart.items[existingIndex].deposit = product.deposit || 0;
    } else {
        cart.items.push({
            product: product._id,
            variantId: variant._id,
            qty: Number(qty || 1),
            rentPricePerDay: variant.price != null ? variant.price : product.rentPricePerDay,
            deposit: product.deposit || 0,
            lineTotal: 0
        });
    }

    if (startDate) cart.startDate = startDate;
    if (endDate) cart.endDate = endDate;

    recalcRentCartTotals(cart);
    await cart.save();
    return res.status(200).json({ success: true, cart });
});

exports.updateItemQty = catchAsync(async (req, res, next) => {
    // body: { productId, variantId, qty, startDate?, endDate? }
    const { productId, variantId, qty, startDate, endDate } = req.body || {};
    if (!productId || !variantId || typeof qty === 'undefined') return next(new AppError('productId, variantId and qty required', 400));

    const cart = await RentCart.findOne({ user: req.user._id });
    if (!cart) return next(new AppError('Cart not found', 404));

    const idx = cart.items.findIndex(it => String(it.product) === String(productId) && String(it.variantId) === String(variantId));
    if (idx === -1) return next(new AppError('Item not found in cart', 404));

    cart.items[idx].qty = Number(qty);
    if (startDate) cart.startDate = startDate;
    if (endDate) cart.endDate = endDate;

    recalcRentCartTotals(cart);
    await cart.save();
    return res.json({ success: true, cart });
});

exports.removeItem = catchAsync(async (req, res, next) => {
    // body: { productId, variantId }
    const { productId, variantId } = req.body || {};
    if (!productId || !variantId) return next(new AppError('productId and variantId required', 400));

    const cart = await RentCart.findOne({ user: req.user._id });
    if (!cart) return next(new AppError('Cart not found', 404));

    cart.items = cart.items.filter(it => !(String(it.product) === String(productId) && String(it.variantId) === String(variantId)));
    recalcRentCartTotals(cart);
    await cart.save();
    return res.json({ success: true, cart });
});

exports.clearCart = catchAsync(async (req, res, next) => {
    const cart = await RentCart.findOne({ user: req.user._id });
    if (!cart) return res.json({ success: true, cart: null });
    cart.items = [];
    cart.startDate = undefined;
    cart.endDate = undefined;
    cart.grossSubtotal = 0;
    cart.totalDeposit = 0;
    cart.totalPayable = 0;
    await cart.save();
    return res.json({ success: true, cart });
});

// admin or user might want to fetch cart by id
exports.getCartById = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const cart = await RentCart.findById(id).lean();
    if (!cart) return next(new AppError('Cart not found', 404));
    return res.json({ success: true, cart });
});