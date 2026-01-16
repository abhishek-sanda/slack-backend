const express = require("express");
const http = require('http');
const cors = require("cors");
const mongoose = require("mongoose");
const session = require("express-session");
const RedisStore = require("connect-redis").default;
const { createClient } = require('redis');
const { Server } = require("socket.io");
const chatRoutes = require("./routes/chatRoutes");
const ChatMessage = require("./models/ChatMessage"); // <-- Move require to top
require('dotenv').config();


const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

mongoose.connect(process.env.MONGO_URI )
.then(() => console.log('MongoDB Connected'))
.catch((err) => console.error('MongoDB connection error:', err));

const redisClient = createClient({ url: process.env.REDIS_URL });
redisClient.connect().catch(console.error);

app.use(cors(
  {
    origin: process.env.CLIENT_URL,
    credentials: true
  }
));

app.use(express.json());
app.use("/uploads", express.static("uploads"));

// Redis Store Setup
let redisStore = new RedisStore({
  client: redisClient,
  prefix: "myapp:"
});

// Session Configuration
app.use(session({
  store: redisStore,
  secret: process.env.SESSION_SECRET || "session-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 // 24 hours
  }
}));

app.use("/api/chat", chatRoutes);

// File download route
app.get('/download/:filename', (req, res) => {
  const file = `${__dirname}/uploads/${req.params.filename}`;
  res.download(file); // Sets Content-Disposition: attachment
});

// Real-time chat with Socket.IO
io.on("connection", (socket) => {
  // New message
  socket.on("chat-message", async (msg) => {
    try {
      const savedMsg = await ChatMessage.create(msg);
      io.emit("chat-message", savedMsg);
    } catch (err) {
      socket.emit("error", { type: "chat-message", error: err.message });
    }
  });

  // Edit message
  socket.on("edit-message", async ({ id, text, attachments }) => {
    try {
      const updated = await ChatMessage.findByIdAndUpdate(
        id,
        { text, attachments, edited: true },
        { new: true }
      );
      io.emit("edit-message", updated);
    } catch (err) {
      socket.emit("error", { type: "edit-message", error: err.message });
    }
  });

  // Delete message
  socket.on("delete-message", async (id) => {
    try {
      await ChatMessage.findByIdAndDelete(id);
      io.emit("delete-message", id);
    } catch (err) {
      socket.emit("error", { type: "delete-message", error: err.message });
    }
  });

  // Pin/unpin message
  socket.on("pin-message", async ({ id, pin }) => {
    try {
      const updated = await ChatMessage.findByIdAndUpdate(
        id,
        { pinned: !!pin },
        { new: true }
      );
      io.emit("pin-message", updated);
    } catch (err) {
      socket.emit("error", { type: "pin-message", error: err.message });
    }
  });

  // Add reaction
  socket.on("react-message", async ({ id, user, emoji }) => {
    try {
      const updated = await ChatMessage.findByIdAndUpdate(
        id,
        { $push: { reactions: { user, emoji } } },
        { new: true }
      );
      io.emit("react-message", updated);
    } catch (err) {
      socket.emit("error", { type: "react-message", error: err.message });
    }
  });
});

const PORT = process.env.PORT || 4001;
server.listen(PORT, () => {
  console.log(`Chat service running on port ${PORT}`);
});