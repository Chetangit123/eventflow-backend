const Address = require("../../models/Address");
const ProductRent = require("../../models/ProductRent");
const ProductSale = require("../../models/ProductSale");
const RentBooking = require("../../models/RentBooking");
const AppError = require("../../utils/AppError");
const catchAsync = require("../../utils/catchAsync");
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

const parseCSV = (val) =>
    typeof val === 'string'
        ? val.split(',').map(s => s.trim()).filter(Boolean)
        : Array.isArray(val) ? val : undefined;

const toBool = (v) => v === '1' || v === 'true' || v === true;

const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const toInt = (v, d) => {
    const x = parseInt(v, 10);
    return Number.isFinite(x) && x > 0 ? x : d;
};
const parseBool = v => v === true || v === 'true' || v === '1';

const sortStages = (sortKey, mode = 'product') => {
    switch (sortKey) {
        case 'newest': return [{ $sort: { createdAt: -1, _id: 1 } }];
        case 'oldest': return [{ $sort: { createdAt: 1, _id: 1 } }];
        case 'price_asc': return mode === 'product'
            ? [{ $sort: { minPrice: 1, _id: 1 } }]
            : [{ $sort: { effectivePrice: 1, _id: 1 } }];
        case 'price_desc': return mode === 'product'
            ? [{ $sort: { minPrice: -1, _id: 1 } }]
            : [{ $sort: { effectivePrice: -1, _id: 1 } }];
        case 'discount_desc': return mode === 'product'
            ? [{ $sort: { maxDiscountPct: -1, _id: 1 } }]
            : [{ $sort: { discountPct: -1, _id: 1 } }];
        default: return [{ $sort: { createdAt: -1, _id: 1 } }];
    }
};

exports.rentProductList = catchAsync(async (req, res, next) => {
    const {
        page = 1,
        limit = 24,
        sort = 'relevance',
        mode = 'product', // product | variant
        q,
        category,
        tags,
        colors,
        sizes,
        minPrice,
        maxPrice,
        inStock,
        hasDiscount,
        status,
        gender
    } = req.query;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const perPage = Math.min(Math.max(parseInt(limit, 10) || 24, 1), 100);
    const skip = (pageNum - 1) * perPage;

    const tagList = parseCSV(tags);
    const colorList = parseCSV(colors);
    const sizeList = parseCSV(sizes);

    // ---- Product filters ----
    const productMatch = {};
    productMatch.isDeleted = false;
    productMatch.status = status || 'active';

    if (category) {
        if (!mongoose.isValidObjectId(category)) {
            return next(new AppError('Invalid category id', 400));
        }
        productMatch.category = new mongoose.Types.ObjectId(category);
    }

    if (tagList?.length) {
        productMatch.tags = { $in: tagList };
    }

    if (gender) {
        const g = String(gender).toLowerCase();
        const allowed = ['men', 'women', 'unisex', 'boys', 'girls'];
        if (!allowed.includes(g)) return next(new AppError('Invalid gender value', 400));
        productMatch.gender = g;
    }

    // ---- Variant filters ----
    const variantMatch = {};
    if (colorList?.length) variantMatch['variants.color'] = { $in: colorList };
    if (sizeList?.length) variantMatch['variants.size'] = { $in: sizeList };
    if (toBool(inStock)) variantMatch['variants.stock'] = { $gt: 0 };
    if (toBool(hasDiscount)) variantMatch['variants.discountPrice'] = { $gt: 0 };

    // ---- Pipeline ----
    const pipeline = [
        { $match: productMatch },
        { $unwind: "$variants" },
        Object.keys(variantMatch).length ? { $match: variantMatch } : null,
    ].filter(Boolean);

    // ---- Search ----
    if (q && q.trim()) {
        const tokens = q.trim().split(/\s+/).slice(0, 6);
        const andClauses = tokens.map(tok => {
            const rx = new RegExp(escapeRegExp(tok), 'i');
            return {
                $or: [
                    { title: rx },
                    { description: rx },
                    { tags: rx },
                    { 'variants.color': rx },
                    { 'variants.size': rx },
                    { 'variants.sku': rx },
                ]
            };
        });
        pipeline.push({ $match: { $and: andClauses } });
    }

    // ---- Effective Price / Discount ----
    pipeline.push({
        $addFields: {
            effectivePrice: {
                $cond: [
                    { $and: [{ $gt: ['$variants.discountPrice', 0] }] },
                    '$variants.discountPrice',
                    '$variants.price'
                ]
            },
            discountPct: {
                $cond: [
                    { $and: [{ $gt: ['$variants.discountPrice', 0] }, { $gt: ['$variants.price', 0] }] },
                    {
                        $multiply: [
                            {
                                $divide: [
                                    { $subtract: ['$variants.price', '$variants.discountPrice'] },
                                    '$variants.price'
                                ]
                            },
                            100
                        ]
                    },
                    0
                ]
            }
        }
    });

    // ---- Price range filter ----
    if (minPrice || maxPrice) {
        const range = {};
        if (minPrice) range.$gte = Number(minPrice);
        if (maxPrice) range.$lte = Number(maxPrice);
        pipeline.push({ $match: { effectivePrice: range } });
    }

    // ---- Variant mode ----
    if (mode === 'variant') {
        pipeline.push(
            {
                $project: {
                    _id: 1,
                    title: 1,
                    slug: 1,
                    category: 1,
                    status: 1,
                    createdAt: 1,
                    variantId: '$variants._id',
                    color: '$variants.color',
                    size: '$variants.size',
                    sku: '$variants.sku',
                    stock: '$variants.stock',
                    images: '$variants.images',
                    price: '$variants.price',
                    discountPrice: '$variants.discountPrice',
                    effectivePrice: 1,
                    discountPct: 1
                }
            },
            ...sortStages(sort, 'variant'),
            {
                $facet: {
                    items: [{ $skip: skip }, { $limit: perPage }],
                    total: [{ $count: 'count' }]
                }
            }
        );

        const [{ items, total }] = await ProductRent.aggregate(pipeline);
        const totalItems = total?.[0]?.count || 0;
        return successRes(res, 200, true, 'Rent variants fetched', {
            page: pageNum,
            limit: perPage,
            totalItems,
            totalPages: Math.ceil(totalItems / perPage),
            mode: 'variant',
            items
        });
    }

    // ---- Product regroup ----
    pipeline.push(
        {
            $group: {
                _id: '$_id',
                title: { $first: '$title' },
                slug: { $first: '$slug' },
                description: { $first: '$description' },
                category: { $first: '$category' },
                tags: { $first: '$tags' },
                status: { $first: '$status' },
                createdAt: { $first: '$createdAt' },
                minPrice: { $min: '$effectivePrice' },
                maxPrice: { $max: '$effectivePrice' },
                maxDiscountPct: { $max: '$discountPct' },
                totalStock: { $sum: '$variants.stock' },
                variantCount: { $sum: 1 },
                thumbnail: {
                    $first: {
                        $cond: [
                            { $gt: [{ $size: { $ifNull: ['$variants.images', []] } }, 0] },
                            { $arrayElemAt: ['$variants.images', 0] },
                            null
                        ]
                    }
                }
            }
        },
        ...sortStages(sort, 'product'),
        {
            $facet: {
                items: [{ $skip: skip }, { $limit: perPage }],
                total: [{ $count: 'count' }]
            }
        }
    );

    const [{ items, total }] = await ProductRent.aggregate(pipeline);
    console.log(items, "items")
    const totalItems = total?.[0]?.count || 0;
    return successRes(res, 200, true, 'Rent products fetched', {
        page: pageNum,
        limit: perPage,
        totalItems,
        totalPages: Math.ceil(totalItems / perPage),
        mode: 'product',
        items
    });
});

exports.getRentProductById = catchAsync(async (req, res, next) => {
    const { productId, variantId } = req.query;

    if (!productId) return next(new AppError('productId query parameter is required', 400));
    if (!mongoose.isValidObjectId(productId)) return next(new AppError('Invalid productId', 400));

    // fetch product (with category minimal)
    const product = await ProductRent.findById(productId)
        .populate('category', 'name slug')
        .lean();

    if (!product) return next(new AppError('Product not found', 404));

    // helpers
    const calcEffectivePrice = v => {
        const p = Number(v.price || 0);
        const dp = Number(v.discountPrice || 0);
        return dp && dp > 0 ? dp : p;
    };
    const calcDiscountPct = v => {
        const p = Number(v.price || 0);
        const dp = Number(v.discountPrice || 0);
        if (p > 0 && dp > 0) return ((p - dp) / p) * 100;
        return 0;
    };

    // ensure variants array
    const rawVariants = Array.isArray(product.variants) ? product.variants : [];

    // compute runtime fields per variant
    const variants = rawVariants.map(v => {
        const effectivePrice = calcEffectivePrice(v);
        const discountPct = calcDiscountPct(v);
        const stock = Number(v.stock || 0);
        const inStock = stock > 0;
        return {
            variantId: v._id ? String(v._id) : null,
            color: v.color || null,
            size: v.size || null,
            sku: v.sku || null,
            price: Number(v.price || 0),
            discountPrice: Number(v.discountPrice || 0),
            effectivePrice,
            discountPct: Number(discountPct.toFixed(2)),
            stock,
            inStock,
            images: Array.isArray(v.images) ? v.images : [],
            raw: v // optional: raw fields if you need more later
        };
    });

    // pricing & stock summary
    const effectivePrices = variants.map(v => v.effectivePrice).filter(p => typeof p === 'number');
    const minPrice = effectivePrices.length ? Math.min(...effectivePrices) : 0;
    const maxPrice = effectivePrices.length ? Math.max(...effectivePrices) : 0;
    const totalStock = variants.reduce((s, v) => s + (Number(v.stock) || 0), 0);

    // build variant options & matrix: colors, sizes, colorSummary
    const colorsSet = new Set();
    const sizesSet = new Set();
    const matrix = {}; // matrix[color][size] => variant info
    const colorSummary = {}; // color -> { totalStock, minPrice, thumbnail }

    for (const v of variants) {
        const c = (v.color || 'other').toString();
        const s = (v.size || 'free').toString();
        colorsSet.add(c);
        sizesSet.add(s);

        matrix[c] = matrix[c] || {};
        matrix[c][s] = {
            variantId: v.variantId,
            sku: v.sku,
            price: v.price,
            discountPrice: v.discountPrice,
            effectivePrice: v.effectivePrice,
            discountPct: v.discountPct,
            stock: v.stock,
            inStock: v.inStock,
            images: v.images
        };

        if (!colorSummary[c]) {
            colorSummary[c] = { totalStock: 0, minPrice: v.effectivePrice, thumbnail: v.images && v.images[0] ? v.images[0] : null };
        }
        colorSummary[c].totalStock += v.stock || 0;
        if (v.effectivePrice < (colorSummary[c].minPrice || Infinity)) {
            colorSummary[c].minPrice = v.effectivePrice;
            if (v.images && v.images[0]) colorSummary[c].thumbnail = v.images[0];
        }
    }

    const availableColors = Array.from(colorsSet);
    const availableSizes = Array.from(sizesSet);

    // Determine selected/default variant
    let selectedVariant = null;
    let selectedVariantId = null;

    if (variantId) {
        if (!mongoose.isValidObjectId(variantId)) return next(new AppError('Invalid variantId', 400));
        selectedVariant = variants.find(v => v.variantId === String(variantId));
        if (!selectedVariant) return next(new AppError('Variant not found for this product', 404));
        selectedVariantId = selectedVariant.variantId;
    } else {
        // default selection logic:
        // 1) prefer in-stock variants (lowest effectivePrice among in-stock)
        // 2) if none in stock, choose absolute lowest effectivePrice
        const inStockVariants = variants.filter(v => v.inStock);
        if (inStockVariants.length) {
            inStockVariants.sort((a, b) => a.effectivePrice - b.effectivePrice);
            selectedVariant = inStockVariants[0];
        } else if (variants.length) {
            variants.sort((a, b) => a.effectivePrice - b.effectivePrice);
            selectedVariant = variants[0];
        }
        selectedVariantId = selectedVariant ? selectedVariant.variantId : null;
    }

    // Build response; keep heavy fields (raw) optional — here we include variants (computed) for UI
    const response = {
        _id: product._id,
        title: product.title,
        slug: product.slug,
        description: product.description,
        category: product.category || null,
        tags: product.tags || [],
        gender: product.gender || null,
        status: product.status || null,
        createdAt: product.createdAt,

        pricing: {
            minPrice,
            maxPrice,
            totalStock
        },

        variantsCount: variants.length,
        availableColors,
        availableSizes,
        colorSummary,   // per-color quick info (thumbnail, minPrice, totalStock)
        matrix,         // matrix[color][size] => variant info (for UI selection)
        variants,       // full list of computed variants (good for listing/selecting)
        defaultVariantId: selectedVariantId, // UI can use this as the default selected
        selectedVariantId,
        selectedVariant: selectedVariant || null
    };

    return successRes(res, 200, true, "Product found", response);
});

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

