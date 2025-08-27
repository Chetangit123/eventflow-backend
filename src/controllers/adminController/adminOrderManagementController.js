const { toInt, isValidId } = require("../../helper/productHelper");
const SaleOrder = require("../../models/SaleOrder");
const catchAsync = require("../../utils/catchAsync");
const { successRes } = require("../../utils/responseFormatter");

/**
 * (Optional) ADMIN list — if needed later
 * GET /api/v1/admin/orders
 * Supports user/email search, statuses, date range, pagination, etc.
 */
exports.adminListOrders = catchAsync(async (req, res, next) => {
    // only if req.user.role === 'admin' (guard outside)
    const {
        page = 1,
        limit = 30,
        sort = 'newest',
        q, // orderId/email/sku
        orderStatus,
        paymentStatus,
        from,
        to
    } = req.query;

    const pageNum = toInt(page, 1);
    const perPage = Math.min(toInt(limit, 20), 200);
    const skip = (pageNum - 1) * perPage;

    const match = { isDeleted: { $ne: true } };
    if (orderStatus) match.orderStatus = orderStatus;
    if (paymentStatus) match.paymentStatus = paymentStatus;
    if (from || to) {
        match.createdAt = {};
        if (from) match.createdAt.$gte = new Date(from + 'T00:00:00.000Z');
        if (to) match.createdAt.$lte = new Date(to + 'T23:59:59.999Z');
    }

    const pipeline = [
        { $match: match },
        ...(q && q.trim()
            ? [{
                $match: {
                    $or: [
                        { _id: isValidId(q) ? new mongoose.Types.ObjectId(q) : null },
                        { notes: new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
                        { 'items.skuSnapshot': new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
                        { 'items.titleSnapshot': new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }
                    ]
                }
            }]
            : []),
        // populate user
        {
            $lookup: {
                from: 'users',
                let: { uid: "$user" },
                pipeline: [
                    { $match: { $expr: { $eq: ["$_id", "$$uid"] } } },
                    { $project: { _id: 1, name: 1, email: 1, phone: 1 } }
                ],
                as: "user"
            }
        },
        { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },

        // populate address
        {
            $lookup: {
                from: 'addresses',
                let: { aid: "$address" },
                pipeline: [
                    { $match: { $expr: { $eq: ["$_id", "$$aid"] } } },
                    {
                        $project: {
                            _id: 1,
                            label: 1,
                            line1: 1,
                            line2: 1,
                            city: 1,
                            state: 1,
                            pincode: 1,
                            country: 1,
                            lat: 1,
                            lng: 1,
                            isDefault: 1
                        }
                    }
                ],
                as: "address"
            }
        },
        { $unwind: { path: "$address", preserveNullAndEmptyArrays: true } },

        {
            $project: {
                _id: 1,
                user: 1,
                address: 1,
                createdAt: 1,
                orderStatus: 1,
                paymentStatus: 1,
                paymentGateway: 1,
                total: 1,
                currency: 1,
                itemsCount: { $size: { $ifNull: ['$items', []] } }
            }
        },
        ...(() => {
            switch (sort) {
                case 'oldest': return [{ $sort: { createdAt: 1, _id: 1 } }];
                case 'total_asc': return [{ $sort: { total: 1, _id: 1 } }];
                case 'total_desc': return [{ $sort: { total: -1, _id: 1 } }];
                default: return [{ $sort: { createdAt: -1, _id: 1 } }];
            }
        })(),
        {
            $facet: {
                items: [{ $skip: skip }, { $limit: perPage }],
                total: [{ $count: 'count' }]
            }
        }
    ];
    const [{ items, total }] = await SaleOrder.aggregate(pipeline);
    const totalItems = total?.[0]?.count || 0;
    return successRes(res, 200, 'Order list fetched', {
        page: pageNum,
        limit: perPage,
        totalItems,
        totalPages: Math.ceil(totalItems / perPage),
        items
    });
});