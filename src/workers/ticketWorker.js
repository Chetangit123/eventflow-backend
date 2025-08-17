const { Worker } = require('bullmq');
const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');
const nodeHtmlToImage = require('node-html-to-image');
const puppeteer = require('puppeteer');

const TicketBooking = require('../models/TicketBooking');
const User = require('../models/User');
const Event = require('../models/Event');
const EventSession = require('../models/EventSession');
const GarbaGalaTemplate = require('../templates/garbaGalaTemplate');
const { ticketQueue, connection } = require('../queues/ticketQueue');
const generateTicketId = require('../utils/helper');
const sendMail = require('../utils/sendMail');
const USE_PDF = false; // true => PDF, false => PNG

const worker = new Worker('ticket-generation', async job => {
    const { bookingId } = job.data;

    const booking = await TicketBooking.findById(bookingId)
        .populate('event')
        .populate('eventSession')
        .populate('user');

    if (!booking) throw new Error(`Booking not found: ${bookingId}`);

    const { attendeeDetails, user, event, eventSession } = booking;

    const ticketDir = path.join(__dirname, "../../Uploads/tickets");
    if (!fs.existsSync(ticketDir)) fs.mkdirSync(ticketDir, { recursive: true });

    const tickets = [];

    for (const attendee of attendeeDetails) {
        const ticketId = generateTicketId("TAAL-EVENT");
        const qrPayload = {
            ticketId,
            attendeeName: attendee.name,
            eventName: event.name,
            dateTime: `${eventSession.date} | ${eventSession.startTime}-${eventSession.endTime}`
        };
        const qrData = JSON.stringify(qrPayload);
        const qrImage = await QRCode.toDataURL(qrData);

        const htmlContent = GarbaGalaTemplate({
            headline: event.title,
            mainLogo: 'https://ondseller.co/uploads/deliveryPartnerProfile/1755266790483.jpeg',
            dateText: eventSession.date.toLocaleDateString(),
            timeText: `${eventSession.startTime} - ${eventSession.endTime}`,
            venueText: event?.venueName,
            noteText: "Show this ticket at entry",
            tagline: event.description,
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
        } catch (err) {
            console.error(`Ticket generation failed for attendee ${attendee.name}:`, err);
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

    const allSuccess = tickets.every(t => t.status === "generated");
    const someFailed = tickets.some(t => t.status === "failed");

    booking.ticketStatus = allSuccess ? "confirmed" : someFailed ? "failed" : "pending";
    await booking.save();

    // Email user
    const emailTemplate = require('../templates/thanksMailToUser')({
        name: user.name,
        eventName: event.title,
        eventDate: eventSession.date,
        eventTime: eventSession.startTime,
        venue: event.venueName,
        ticketIds: tickets.map(t => t.ticketId)
    });

    await sendMail({
        to: user.email,
        subject: "Your Event Tickets",
        text: "Your ticket booking details",
        template: emailTemplate
    });

    // Admin alert if any ticket failed
    if (someFailed) {
        await sendMail({
            to: "superadmin@yopmail.com",
            subject: `Ticket Generation Failed for Booking ${booking._id}`,
            text: `Some tickets failed for booking ${booking._id}. Please check logs.`
        });
    }

}, { connection, concurrency: 5 }); // concurrency optional

module.exports = worker;
