const http = require("http");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const app = require("./app");
const { setupSocket } = require("./src/socket/socketHandler");

dotenv.config();
const server = http.createServer(app);
setupSocket(server); // Attach socket to server

const PORT = process.env.PORT || 8000;
const DB = process.env.MONGO_URI;

mongoose
    .connect(DB)
    .then(() => {
        console.log("MongoDB connected");
        server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch((err) => console.error("MongoDB Error:", err));
