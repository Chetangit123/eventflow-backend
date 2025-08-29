const Address = require("../../models/Address");
const ProductRent = require("../../models/ProductRent");
const RentBooking = require("../../models/RentBooking");
const AppError = require("../../utils/AppError");
const { successRes } = require("../../utils/responseFormatter");
const mongoose = require("mongoose");


async function mapAddressSnapshot(addressDoc) {
    if (!addressDoc) return undefined;
    return {
        _id: addressDoc._id,
        label: addressDoc.label,
        line1: addressDoc.line1,
        line2: addressDoc.line2,
        city: addressDoc.city,
        state: addressDoc.state,
        pincode: addressDoc.pincode,
        country: addressDoc.country,
    };
}

exports.createRentBooking = async (req, res, next) => {
    // default {} so destructuring safe ho jaye
    const {
        items: clientItems,
        startDate,
        endDate,
        pickupAddressId,
        returnAddressId,
        deliveryMethod
    } = req.body || {};

    // ✅ Step 1: Basic validations
    if (!clientItems || !Array.isArray(clientItems) || !clientItems.length) {
        return next(new AppError("Items are required and must be a non-empty array", 400));
    }
    if (!startDate || !endDate) {
        return next(new AppError("Start date and end date are required", 400));
    }

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const items = [];

        for (const ci of clientItems) {
            if (!ci.productId || !ci.variantId) {
                throw new Error("Each item must have productId and variantId");
            }

            const product = await ProductRent.findById(ci.productId).lean();
            if (!product) throw new Error("Product not found: " + ci.productId);

            const variant = product.variants.find(v => String(v._id) === String(ci.variantId));
            if (!variant) throw new Error("Variant not found: " + ci.variantId);

            items.push({
                product: product._id,
                variantId: variant._id,
                size: variant.size,
                qty: Number(ci.qty || 1),
                pricePerDaySnapshot: (variant.price != null) ? variant.price : product.rentPricePerDay,
                productSnapshot: {
                    _id: product._id,
                    title: product.title,
                    sku: product.sku,
                    deposit: product.deposit,
                    rentPricePerDay: product.rentPricePerDay,
                    currency: product.currency,
                    variantSnapshot: {
                        _id: variant._id,
                        color: variant.color,
                        size: variant.size,
                        sku: variant.sku
                    },
                    images: variant.images || []
                }
            });
        }

        // ✅ Step 2: Address snapshots
        const pickupDoc = pickupAddressId ? await Address.findById(pickupAddressId).lean() : null;
        const returnDoc = returnAddressId ? await Address.findById(returnAddressId).lean() : null;

        const [booking] = await RentBooking.create([{
            user: req.user._id,
            items,
            startDate,
            endDate,
            pickupAddress: pickupAddressId,
            pickupAddressSnapshot: await mapAddressSnapshot(pickupDoc),
            returnAddress: returnAddressId,
            returnAddressSnapshot: await mapAddressSnapshot(returnDoc),
            deliveryMethod
        }], { session });

        await session.commitTransaction();
        session.endSession();
        return successRes(res, 201, true, "Booking created successfully", booking);

    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        return next(new AppError(err.message, 400));
    }
};

