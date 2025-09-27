const TicketBooking = require("../../models/TicketBooking");
const catchAsync = require("../../utils/catchAsync");
const { successRes } = require("../../utils/responseFormatter");
const mongoose = require("mongoose");

const getOverallTicketsFromUsers = catchAsync(async (req, res, next) => {
    const { sessionId } = req.query;

    // ✅ Single filter for both tickets count and totalAmount
    const baseFilter = {
        generatedBy: "user",
        ticketStatus: "confirmed",
        paymentStatus: "paid",
        totalAmount: { $gte: 250 }
    };

    if (sessionId) {
        if (mongoose.Types.ObjectId.isValid(sessionId)) {
            baseFilter.eventSession = new mongoose.Types.ObjectId(sessionId);
        } else {
            baseFilter.eventSession = sessionId;
        }
    }

    const result = await TicketBooking.aggregate([
        { $match: baseFilter },
        {
            $project: {
                ticketCount: { $size: { $ifNull: ["$tickets", []] } },
                totalAmount: { $ifNull: ["$totalAmount", 0] }
            }
        },
        {
            $group: {
                _id: null,
                totalTickets: { $sum: "$ticketCount" },
                totalAmount: { $sum: "$totalAmount" }
            }
        }
    ]);

    if (result.length === 0) {
        return successRes(res, 200, true, "No tickets sold yet", {
            totalTickets: 0,
            totalAmount: 0
        });
    }

    const data = result[0];

    return successRes(res, 200, true, "Dashboard data fetched successfully", {
        totalTickets: data.totalTickets,
        totalAmount: data.totalAmount
    });
});

module.exports = { getOverallTicketsFromUsers };
