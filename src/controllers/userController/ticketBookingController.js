const AppError = require("../../utils/AppError");
const catchAsync = require("../../utils/catchAsync");
const EventSession = require("../../models/EventSession");
const Event = require("../../models/Event");
const fs = require("fs");
const path = require("path");
const TicketBooking = require("../../models/TicketBooking");
const UserService = require("../../services/userServices");
const { successRes } = require("../../utils/responseFormatter");
const sendMail = require("../../utils/sendMail");
const QRCode = require("qrcode");
const moment = require("moment");
const { createCanvas, loadImage } = require("canvas");
const { GarbaGalaTemplate } = require("../../emailTemplates/ticketTemplate");
const nodeHtmlToImage = require("node-html-to-image");
const { thanksMailToUser } = require("../../emailTemplates/thanksMailTemplate");
const User = require("../../models/User");
const { formatTime24to12 } = require("../../utils/helper");


function generateTicketId(eventCode) {
    const year = new Date().getFullYear();
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    return `${eventCode.toUpperCase()}-${year}-${randomNum}`;
}

const USE_PDF = false; // true => PDF, false => PNG
//Perfect Working code for ticket generation before integrating BullMq


exports.bookTickets = catchAsync(async (req, res, next) => {
    const start = Date.now();
    const { eventSession, event, quantity, attendeeDetails, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    const userId = req.user._id;

    if (!eventSession || !event || !quantity || !attendeeDetails?.length) {
        return next(new AppError("All fields are required", 400));
    }

    const findUser = await User.findOne({ _id: userId, isDeleted: false });
    if (!findUser) return next(new AppError("User not found", 404));

    const eventData = await Event.findOne({ _id: event, isDeleted: false });
    if (!eventData) return next(new AppError("Event not found", 404));

    const sessionData = await EventSession.findOne({ _id: eventSession, event: event, isDeleted: false });
    if (!sessionData) return next(new AppError("Event session not found", 404));

    const pricePerTicket = sessionData.pricePerTicket || eventData.price || 0;
    const totalAmount = pricePerTicket * quantity;

    const ticketDir = path.join(__dirname, "../../../Uploads/tickets");
    if (!fs.existsSync(ticketDir)) fs.mkdirSync(ticketDir, { recursive: true });

    // Create booking with pending ticketStatus
    const booking = await TicketBooking.create({
        user: userId,
        eventSession,
        event,
        quantity,
        attendeeDetails,
        pricePerTicket,
        totalAmount,
        paymentMethod: "razorpay",
        paymentStatus: "paid",
        ticketStatus: "pending",
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        tickets: []
    });

    res.status(201).json({
        success: true,
        message: "Booking confirmed! Tickets will be emailed shortly.",
        bookingId: booking._id
    });

    // Background ticket generation
    setImmediate(async () => {
        try {
            const tickets = [];

            for (const attendee of attendeeDetails) {
                const ticketId = generateTicketId("TAAL-EVENT");
                const qrPayload = {
                    ticketId,
                    attendeeName: attendee.name,
                    eventName: eventData.name,
                    dateTime: `${sessionData.date} | ${sessionData.startTime}-${sessionData.endTime}`
                };
                const qrData = JSON.stringify(qrPayload);
                const qrImage = await QRCode.toDataURL(qrData);

                const dateObj = new Date(sessionData?.date);
                const day = String(dateObj.getDate()).padStart(2, '0');
                const month = String(dateObj.getMonth() + 1).padStart(2, '0'); // 0-indexed
                const year = dateObj.getFullYear();
                const formattedDate = `${day}-${month}-${year}`;

                const startTime12 = formatTime24to12(sessionData.startTime); // 12:00 AM
                const endTime12 = formatTime24to12(sessionData.endTime);   // 8:00 PM

                const timeText = `${startTime12} - ${endTime12}`;


                const htmlContent = GarbaGalaTemplate({
                    headline: eventData.title,
                    mainLogo: 'https://ondseller.co/uploads/deliveryPartnerProfile/1755266790483.jpeg',
                    dateText: formattedDate,
                    timeText: timeText,
                    venueText: eventData?.venueName,
                    noteText: "Show this ticket at entry",
                    tagline: eventData.description,
                    qrCodeLink: qrImage,
                    attendeeName: attendee.name,
                    ticketId: ticketId
                });

                const fileName = `${ticketId}.${USE_PDF ? "pdf" : "png"}`;
                const absPath = path.join(ticketDir, fileName);
                const relPath = `/uploads/tickets/${fileName}`;

                let status = "generated";

                try {
                    if (USE_PDF) {
                        const puppeteer = require("puppeteer");
                        const browser = await puppeteer.launch({ headless: "new" });
                        const page = await browser.newPage();
                        await page.setContent(htmlContent, { waitUntil: "networkidle0" });
                        await page.pdf({ path: absPath, format: "A4", printBackground: true });
                        await browser.close();
                    } else {
                        await nodeHtmlToImage({
                            output: absPath,
                            html: htmlContent,
                            type: "png",
                            quality: 100
                        });
                    }
                } catch (ticketErr) {
                    console.error("Ticket generation failed for attendee:", attendee.name, ticketErr);
                    status = "failed";
                }

                tickets.push({
                    ticketId,
                    qrData,
                    qrImage,
                    pdfPath: relPath,
                    attendeeName: attendee.name,
                    status
                });
            }

            booking.tickets = tickets;

            // Update overall ticketStatus
            const allSuccess = tickets.every(t => t.status === "generated");
            const someFailed = tickets.some(t => t.status === "failed");

            if (allSuccess) booking.ticketStatus = "confirmed";
            else if (someFailed) booking.ticketStatus = "failed";

            await booking.save();

            // Send email to user with ticket IDs
            const emailTemplate = thanksMailToUser({
                name: findUser.name,
                eventName: eventData.title,
                eventDate: sessionData.date,
                eventTime: sessionData.startTime,
                venue: eventData.venueName,
                ticketIds: tickets.map(t => t.ticketId)
            });

            await sendMail({
                to: findUser.email,
                subject: "Your Event Tickets",
                text: "Your ticket booking details",
                template: emailTemplate,
                attachments: tickets.map(t => ({
                    filename: `${t.ticketId}.${USE_PDF ? "pdf" : "png"}`,
                    path: path.join(ticketDir, `${t.ticketId}.${USE_PDF ? "pdf" : "png"}`)
                }))
            });

            // Admin alert if any ticket failed
            if (someFailed) {
                await sendMail({
                    to: "superadmin@yopmail.com",
                    subject: "Ticket Generation Failed",
                    text: `Some tickets failed for booking ${booking._id}. Check logs.`,
                });
            }

            const end = Date.now();
            console.log(`Ticket generation completed in ${end - start} ms`);

        } catch (err) {
            console.error("Unexpected error in background ticket generation:", err.message);
            await sendMail({
                to: "superadmin@yopmail.com",
                subject: "Ticket Generation Failed",
                text: `Ticket generation failed for booking ${booking._id}. Check logs. : ${err.message}`,
                html: `<p>Ticket generation failed for booking ${booking._id}. Check logs. : ${err.message}. </p>`
            });
        }
    });
});


// const { ticketQueue } = require('../../queues/ticketQueue');

// exports.bookTickets = catchAsync(async (req, res, next) => {
//     const { eventSession, event, quantity, attendeeDetails, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
//     const userId = req.user._id;

//     if (!eventSession || !event || !quantity || !attendeeDetails?.length)
//         return next(new AppError("All fields are required", 400));

//     const findUser = await User.findOne({ _id: userId, isDeleted: false });
//     if (!findUser) return next(new AppError("User not found", 404));

//     const eventData = await Event.findOne({ _id: event, isDeleted: false });
//     if (!eventData) return next(new AppError("Event not found", 404));

//     const sessionData = await EventSession.findOne({ _id: eventSession, event: event, isDeleted: false });
//     if (!sessionData) return next(new AppError("Event session not found", 404));

//     const pricePerTicket = sessionData.pricePerTicket || eventData.price || 0;
//     const totalAmount = pricePerTicket * quantity;

//     // Create booking with pending ticketStatus
//     const booking = await TicketBooking.create({
//         user: userId,
//         eventSession,
//         event,
//         quantity,
//         attendeeDetails,
//         pricePerTicket,
//         totalAmount,
//         paymentMethod: "razorpay",
//         paymentStatus: "paid",
//         ticketStatus: "pending",
//         razorpayOrderId,
//         razorpayPaymentId,
//         razorpaySignature,
//         tickets: []
//     });

//     // Add job to BullMQ queue
//     await ticketQueue.add('generateTickets', { bookingId: booking._id }, {
//         attempts: 3, // retry 3 times if failed
//         backoff: { type: 'exponential', delay: 5000 }
//     });

//     res.status(201).json({
//         success: true,
//         message: "Booking confirmed! Tickets will be emailed shortly.",
//         bookingId: booking._id
//     });
// });
