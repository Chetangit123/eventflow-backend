const getTicketSalesDashboard = catchAsync(async (req, res, next) => {
    // Optional: get date range from query params
    const { startDate, endDate } = req.query;
    const match = { ticketStatus: 'confirmed' };

    if (startDate || endDate) {
        match.bookedAt = {};
        if (startDate) match.bookedAt.$gte = new Date(startDate);
        if (endDate) match.bookedAt.$lte = new Date(endDate);
    }

    const result = await TicketBooking.aggregate([
        { $match: match },

        // Unwind the tickets array to count each ticket individually
        { $unwind: "$tickets" },

        // Only consider tickets that are generated or confirmed
        { $match: { "tickets.status": { $in: ["generated"] } } },

        {
            $group: {
                _id: null,
                totalTicketsSold: { $sum: 1 },
                totalRevenue: { $sum: "$totalAmount" },
                paymentBreakdown: {
                    $push: {
                        paymentMethod: "$paymentMethod",
                        amount: "$totalAmount"
                    }
                }
            }
        }
    ]);

    if (result.length === 0) {
        return successRes(res, 200, true, "No tickets sold yet", {
            totalTicketsSold: 0,
            totalRevenue: 0,
            paymentBreakdown: []
        });
    }

    const data = result[0];

    return successRes(res, 200, true, "Dashboard data fetched successfully", {
        totalTicketsSold: data.totalTicketsSold,
        totalRevenue: data.totalRevenue,
        paymentBreakdown: data.paymentBreakdown
    });
});