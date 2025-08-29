// seedAdmin.js
const mongoose = require("mongoose");
const User = require("../models/User");
const ENVIRONMENT = require("../config/env");
require("dotenv").config();

async function seedAdmin() {
    try {
        await mongoose.connect(ENVIRONMENT.MONGO_URI);

        const adminEmail = ENVIRONMENT.ADMIN_EMAIL || "admin@yopmail.com";
        const adminPassword = ENVIRONMENT.ADMIN_PASSWORD || "Developer123#";

        let admin = await User.findOne({ email: adminEmail });

        if (admin) {
            console.log("✅ Superadmin already exists");
        } else {
            admin = await User.create({
                name: "Super Admin",
                email: adminEmail,
                passwordHash: adminPassword, // plain password — model will hash
                role: "superadmin",
                isVerified: true
            });

            console.log(`🎉 Superadmin created successfully`);
            console.log(`Email: ${adminEmail}`);
            console.log(`Password: ${adminPassword}`);
        }

        mongoose.connection.close();
    } catch (error) {
        console.error("❌ Error creating superadmin:", error);
        mongoose.connection.close();
    }
}

seedAdmin();
