const nodemailer = require("nodemailer");
const ENVIRONMENT = require("../config/env");

const transporter = nodemailer.createTransport({
    host: ENVIRONMENT.SMTP_HOST || "smtp.gmail.com",
    port: ENVIRONMENT.SMTP_PORT || 587,
    secure: false, // true for 465, false for 587
    auth: {
        user: ENVIRONMENT.SMTP_USER || "taaleventslife@gmail.com",
        pass: ENVIRONMENT.SMTP_PASS || "wluodqpwdupipmky",
    },
});


async function sendMail({ to, subject, text, template, attachments }) {
    try {
        // Replace placeholders in template
        const htmlContent = template;

        const mailOptions = {
            from: `"Tal Events" <${ENVIRONMENT.SMTP_USER || "taaleventslife@gmail.com"}>`,
            to,
            subject,
            text,
            html: htmlContent,
            attachments, // optional: for PDFs, images, etc.
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent:", info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error("Error sending email:", error);
        return { success: false, error };
    }
}

module.exports = sendMail;

