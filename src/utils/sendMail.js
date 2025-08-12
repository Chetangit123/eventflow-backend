const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for 587
    auth: {
        user: process.env.SMTP_USER || "pchetan839@gmail.com",
        pass: process.env.SMTP_PASS || "zjeisdinaljgbhez",
    },
});


async function sendMail({ to, subject, template, attachments }) {
    try {
        // Replace placeholders in template
        const htmlContent = template;

        const mailOptions = {
            from: `"Tal Events" <${process.env.SMTP_USER || "pchetan839@gmail.com"}>`,
            to,
            subject,
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

