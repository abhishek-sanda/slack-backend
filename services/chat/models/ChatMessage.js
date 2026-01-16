const mongoose = require("mongoose");

const ReactionSchema = new mongoose.Schema({
  user: { type: String, required: true },
  emoji: String,
}, { _id: false });

const AttachmentSchema = new mongoose.Schema({
  url: String,
  type: String, // e.g., 'image', 'file', 'video'
  name: String,
}, { _id: false });

const ChatMessageSchema = new mongoose.Schema({
  user: { type: String, required: true },
  text: { type: String, default: "" },
  timestamp: { type: Date, default: Date.now },
  chatRoom: { type: mongoose.Schema.Types.ObjectId, ref: "ChatRoom" },
  attachments: [AttachmentSchema],
  status: { type: String, enum: ["sent", "delivered", "read"], default: "sent" },
  reactions: [ReactionSchema],
  edited: { type: Boolean, default: false },
  originalTimestamp: { type: Date },
  replyTo: { type: mongoose.Schema.Types.ObjectId, ref: "ChatMessage", default: null }, // <-- Threaded replies
  pinned: { type: Boolean, default: false }, // <-- Add this line
}, { timestamps: true });

module.exports = mongoose.model("ChatMessage", ChatMessageSchema);