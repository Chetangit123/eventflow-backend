const cron = require("node-cron");
const TicketBooking = require("../models/TicketBooking");
const { generateTicketsForBooking } = require("../services/ticket.service");
const sendMail = require("../utils/sendMail");
const ENVIRONMENT = require("../config/env");

const MAX_RETRIES = 3;
const ADMIN_EMAIL = ENVIRONMENT.ADMIN_EMAIL || "superadmin@yopmail.com";

cron.schedule("*/1 * * * *", async () => {
    console.log("🎯 Ticket Worker running...");

    const pendingBookings = await TicketBooking.find({
        ticketStatus: { $in: ["pending", "processing", "retrying"] },
        paymentStatus: "paid"
    }).limit(5);

    for (const booking of pendingBookings) {
        try {
            if (!booking.retryCount) booking.retryCount = 0;

            booking.ticketStatus = "processing";
            await booking.save();

            await generateTicketsForBooking(booking._id);

            console.log(`✅ Tickets generated for booking ${booking._id}`);
        } catch (err) {
            console.error(`❌ Ticket generation failed for ${booking._id}:`, err.message);

            booking.retryCount = (booking.retryCount || 0) + 1;

            if (booking.retryCount < MAX_RETRIES) {
                booking.ticketStatus = "retrying";
                booking.lastError = err.message;
                await booking.save();
                console.log(`🔁 Retrying booking ${booking._id} (attempt ${booking.retryCount})`);
            } else {
                booking.ticketStatus = "failed";
                booking.lastError = err.message;
                await booking.save();

                // 🚨 Alert admin
                await sendMail({
                    to: ADMIN_EMAIL,
                    subject: `⚠️ Ticket Generation Failed (Booking ${booking._id})`,
                    text: `
Booking failed after ${MAX_RETRIES} retries.

Booking ID: ${booking._id}
User: ${booking.user}
Event: ${booking.event}
Session: ${booking.eventSession}
Error: ${err.message}

Please check logs for details.`,
                });
                console.log(`🚨 Admin notified about booking ${booking._id} failure`);
            }
        }
    }
});
