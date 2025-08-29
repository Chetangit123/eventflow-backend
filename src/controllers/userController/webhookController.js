// src/controllers/webhookController.js
const crypto = require("crypto");
const TicketBooking = require("../../models/TicketBooking");

exports.razorpayWebhook = catchAsync(async (req, res, next) => {
    const secret = ENVIRONMENT.RAZORPAY_WEBHOOK_SECRET;

    const shasum = crypto.createHmac("sha256", secret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest("hex");

    if (digest !== req.headers["x-razorpay-signature"]) {
        return res.status(400).json({ status: "failed", message: "Invalid signature" });
    }

    const event = req.body.event;
    const payment = req.body.payload.payment.entity;

    if (event === "payment.captured") {
        await TicketBooking.findOneAndUpdate(
            { razorpayOrderId: payment.order_id },
            {
                razorpayPaymentId: payment.id,
                paymentStatus: "paid"
            }
        );
    }

    if (event === "payment.failed") {
        await TicketBooking.findOneAndUpdate(
            { razorpayOrderId: payment.order_id },
            {
                paymentStatus: "failed",
                notes: payment.error_description || "Payment failed/cancelled",
            }
        );
    }

    return res.json({ status: "ok" });
});
