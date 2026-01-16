const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const meetingRoutes = require("./routes/Meeting-serviceRoutes");
const socketHandlers = require("./controller/socketHandlers");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

// Configure Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  },
  path: "/socket.io"
});

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.error("MongoDB connection error:", err));

// Ensure uploads/recordings directory exists
const recordingsDir = path.join(__dirname, "uploads", "recordings");
if (!fs.existsSync(recordingsDir)) {
  fs.mkdirSync(recordingsDir, { recursive: true });
}

// Serve static files from the uploads directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Socket.IO connection handler
io.on("connection", (socket) => {
  console.log(`New connection: ${socket.id}`);

  const { meetingId, token } = socket.handshake.query;
  if (!meetingId || !token) {
    socket.disconnect();
    return;
  }

  // Join the meeting room
  socket.join(meetingId);

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
    socket.leave(meetingId);
  });
});

// Attach io instance to app for use in controllers
app.set("io", io);
socketHandlers(io);

app.use("/api/meetings", meetingRoutes);

const PORT = process.env.PORT || 4007;
server.listen(PORT, () => console.log(`Meeting-Service running on port ${PORT}`));