// // src/services/ticket.service.js
// const QRCode = require("qrcode");
// const nodeHtmlToImage = require("node-html-to-image");
// const path = require("path");
// const fs = require("fs");
// const TicketBooking = require("../models/TicketBooking");
// const { GarbaGalaTemplate } = require("../emailTemplates/ticketTemplate");
// const sendMail = require("../utils/sendMail");
// const { thanksMailToUser } = require("../emailTemplates/thanksMailTemplate");

// const USE_PDF = false;

// const { v4: uuidv4 } = require("uuid");

// async function generateTicketId(eventCode) {
//     const year = new Date().getFullYear();
//     const uniqueId = uuidv4().split("-")[0]; // sirf chhota part lena ho to
//     return `${eventCode.toUpperCase()}-${year}-${uniqueId}`;
// }

// exports.generateTicketsForBooking = async (bookingId) => {
//     console.log("Generating tickets for booking in service file:", bookingId);
//     const booking = await TicketBooking.findById(bookingId)
//         .populate("event")
//         .populate("eventSession")
//         .populate("user");
//     console.log(booking, "booking details")
//     const findUser = booking?.user;

//     if (!booking) return;

//     const eventData = booking.event;
//     const sessionData = booking.eventSession;
//     const ticketDir = path.join(__dirname, "../../Uploads/tickets");
//     if (!fs.existsSync(ticketDir)) fs.mkdirSync(ticketDir, { recursive: true });

//     const tickets = [];
//     for (const attendee of booking.attendeeDetails) {
//         let status = "generated";
//         const ticketId = await generateTicketId("TAAL");

//         try {
//             const qrPayload = {
//                 ticketId,
//                 attendeeName: attendee.name,
//                 eventName: eventData.name,
//                 dateTime: `${sessionData.date} | ${sessionData.startTime}-${sessionData.endTime}`
//             };

//             const qrImage = await QRCode.toDataURL(JSON.stringify(qrPayload));

//             const htmlContent = GarbaGalaTemplate({
//                 headline: eventData.title,
//                 dateText: sessionData.date,
//                 timeText: `${sessionData.startTime}-${sessionData.endTime}`,
//                 venueText: eventData.venueName,
//                 noteText: "Show this ticket at entry",
//                 tagline: eventData.description,
//                 qrCodeLink: qrImage,
//                 attendeeName: attendee.name,
//                 ticketId
//             });

//             const fileName = `${ticketId}.${USE_PDF ? "pdf" : "png"}`;
//             const absPath = path.join(ticketDir, fileName);   // actual path for fs
//             const serverPath = `/uploads/tickets/${fileName}`; // this goes in DB

//             if (USE_PDF) {
//                 const puppeteer = require("puppeteer");
//                 const browser = await puppeteer.launch({ headless: "new" });
//                 const page = await browser.newPage();
//                 await page.setContent(htmlContent, { waitUntil: "networkidle0" });
//                 await page.pdf({ path: absPath, format: "A4", printBackground: true });
//                 await browser.close();
//             } else {
//                 await nodeHtmlToImage({ output: absPath, html: htmlContent });
//             }

//             tickets.push({ ticketId, qrImage, qrData: JSON.stringify(qrPayload), pdfPath: serverPath, attendeeName: attendee.name, status });
//         } catch (err) {
//             console.error("Ticket generation failed:", err);
//             status = "failed";
//             tickets.push({ ticketId, attendeeName: attendee.name, status });
//         }
//     }

//     booking.tickets = tickets;
//     booking.ticketStatus = tickets.every(t => t.status === "generated") ? "confirmed" : "failed";
//     await booking.save();

//     const emailTemplate = thanksMailToUser({
//         name: findUser.name,
//         eventName: eventData.title,
//         eventDate: sessionData.date,
//         eventTime: sessionData.startTime,
//         venue: eventData.venueName,
//         ticketIds: tickets.map(t => t.ticketId)
//     });

//     await sendMail({
//         to: findUser.email,
//         subject: "Your Event Tickets",
//         text: "Your ticket booking details",
//         template: emailTemplate,
//         attachments: tickets.map(t => ({
//             filename: `${t.ticketId}.${USE_PDF ? "pdf" : "png"}`,
//             path: path.join(ticketDir, `${t.ticketId}.${USE_PDF ? "pdf" : "png"}`)
//         }))
//     });
// };


// src/services/ticket.service.js
const QRCode = require("qrcode");
const nodeHtmlToImage = require("node-html-to-image");
const path = require("path");
const fs = require("fs");
const TicketBooking = require("../models/TicketBooking");
const { GarbaGalaTemplate } = require("../emailTemplates/ticketTemplate");
const sendMail = require("../utils/sendMail");
const { thanksMailToUser } = require("../emailTemplates/thanksMailTemplate");
const { v4: uuidv4 } = require("uuid");

const USE_PDF = false;
const TICKETS_DIR = path.resolve(process.cwd(), "uploads", "tickets");

async function generateTicketId(eventCode) {
    const year = new Date().getFullYear();
    const uniqueId = uuidv4().split("-")[0];
    return `${eventCode.toUpperCase()}-${year}-${uniqueId}`;
}

exports.generateTicketsForBooking = async (bookingId) => {
    const booking = await TicketBooking.findById(bookingId)
        .populate("event")
        .populate("eventSession")
        .populate("user");

    if (!booking) throw new Error("Booking not found");

    // Idempotency guard
    if (booking.ticketStatus === "confirmed" && booking.tickets?.length === booking.quantity) {
        return { success: true, skipped: true, reason: "already_confirmed" };
    }

    const eventData = booking.event;
    const sessionData = booking.eventSession;
    const user = booking.user;

    if (!fs.existsSync(TICKETS_DIR)) fs.mkdirSync(TICKETS_DIR, { recursive: true });

    const tickets = [];
    const perTicketErrors = [];

    for (const attendee of booking.attendeeDetails) {
        const ticketId = await generateTicketId("TAAL");
        let status = "generated";

        try {
            const qrPayload = {
                ticketId,
                attendeeName: attendee.name,
                eventName: eventData?.title || eventData?.name || "Event",
                dateTime: `${sessionData.date} | ${sessionData.startTime}-${sessionData.endTime}`
            };

            const qrImage = await QRCode.toDataURL(JSON.stringify(qrPayload));

            const htmlContent = GarbaGalaTemplate({
                headline: eventData?.title || eventData?.name || "Event",
                dateText: sessionData.date,
                timeText: `${sessionData.startTime}-${sessionData.endTime}`,
                venueText: eventData?.venueName || "",
                noteText: "Show this ticket at entry",
                tagline: eventData?.description || "",
                qrCodeLink: qrImage,
                attendeeName: attendee.name,
                ticketId
            });

            const fileName = `${ticketId}.${USE_PDF ? "pdf" : "png"}`;
            const absPath = path.join(TICKETS_DIR, fileName);
            const serverPath = `/uploads/tickets/${fileName}`; // store in DB if you serve /uploads statically

            if (USE_PDF) {
                const puppeteer = require("puppeteer");
                // const browser = await puppeteer.launch({ headless: "new" });
                const browser = await puppeteer.launch({
                    executablePath: '/usr/bin/google-chrome', // your Chrome path
                    headless: "new",
                    args: ['--no-sandbox', '--disable-setuid-sandbox']
                });
                const page = await browser.newPage();
                await page.setContent(htmlContent, { waitUntil: "networkidle0" });
                await page.pdf({ path: absPath, format: "A4", printBackground: true });
                await browser.close();
            } else {
                await nodeHtmlToImage({ output: absPath, html: htmlContent });
            }

            tickets.push({
                ticketId,
                qrImage,
                qrData: JSON.stringify(qrPayload),
                pdfPath: serverPath,
                attendeeName: attendee.name,
                status
            });
        } catch (err) {
            status = "failed";
            perTicketErrors.push({ ticketId, attendee: attendee.name, error: err.message });
            tickets.push({
                ticketId,
                attendeeName: attendee.name,
                status,
                error: err.message
            });
        }
    }

    const allGenerated = tickets.every(t => t.status === "generated");
    booking.tickets = tickets;
    booking.ticketStatus = allGenerated ? "confirmed" : "failed";
    await booking.save();

    // Only send email if we have at least one generated ticket file
    const generatedTickets = tickets.filter(t => t.status === "generated");
    if (generatedTickets.length > 0) {
        const emailTemplate = thanksMailToUser({
            name: user?.name || "Guest",
            eventName: eventData?.title || eventData?.name || "Event",
            eventDate: sessionData.date,
            eventTime: `${sessionData.startTime}-${sessionData.endTime}`,
            venue: eventData?.venueName || "",
            ticketIds: generatedTickets.map(t => t.ticketId)
        });

        await sendMail({
            to: user.email,
            subject: "Your Event Tickets",
            text: "Your ticket booking details",
            template: emailTemplate,
            attachments: generatedTickets.map(t => ({
                filename: `${t.ticketId}.${USE_PDF ? "pdf" : "png"}`,
                path: path.join(TICKETS_DIR, `${t.ticketId}.${USE_PDF ? "pdf" : "png"}`)
            }))
        });
    }

    // Signal to the worker whether to retry
    return {
        success: allGenerated,
        errors: perTicketErrors
    };
};
