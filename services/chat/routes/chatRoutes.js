const express = require("express");
const router = express.Router();
const ChatMessage = require("../models/ChatMessage");
const multer = require("multer");
const path = require("path");

// GET all messages (optionally filter by chatRoom)
router.get("/", async (req, res) => {
  const { chatRoom } = req.query;
  const filter = chatRoom ? { chatRoom } : {};
  const messages = await ChatMessage.find(filter).sort({ timestamp: 1 });
  res.json(messages);
});

// SEARCH messages by text (case-insensitive)
router.get("/search", async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: "Missing search query" });
  const messages = await ChatMessage.find({ text: { $regex: q, $options: "i" } });
  res.json(messages);
});

// POST a new message (with optional replyTo)
router.post("/", async (req, res) => {
  const { user, text, chatRoom, attachments, replyTo } = req.body;
  const message = new ChatMessage({ user, text, chatRoom, attachments, replyTo });
  await message.save();
  res.status(201).json(message);
});

// PATCH to edit a message
router.patch("/:id", async (req, res) => {
  const { text, attachments } = req.body;
  const message = await ChatMessage.findByIdAndUpdate(
    req.params.id,
    { text, attachments, edited: true },
    { new: true }
  );
  res.json(message);
});

// DELETE a message
router.delete("/:id", async (req, res) => {
  await ChatMessage.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// PATCH to pin/unpin a message
router.patch("/:id/pin", async (req, res) => {
  const { pin } = req.body;
  const message = await ChatMessage.findByIdAndUpdate(
    req.params.id,
    { pinned: !!pin },
    { new: true }
  );
  res.json(message);
});

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    // Unique filename with original extension, spaces replaced
    const unique = Date.now() + '-' + file.originalname.replace(/\s+/g, '_');
    cb(null, unique);
  }
});
const upload = multer({ storage });

// File upload endpoint
router.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  const fileUrl = `${process.env.SERVER_URL || "http://localhost:4001"}/uploads/${req.file.filename}`;
  res.json({
    url: fileUrl,
    name: req.file.filename, // Use this for download!
    type: req.file.mimetype
  });
});

module.exports = router;