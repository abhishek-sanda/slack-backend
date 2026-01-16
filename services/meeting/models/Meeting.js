const mongoose = require("mongoose");

const MeetingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  time: {
    type: Date,
    required: true,
  },
  participants: {
    type: [String],
    required: true,
    default: [],
  },
  summary: {
    type: String,
    default: "",
  },
  actionItems: [
    {
      description: String,
      assignee: String,
      dueDate: Date,
      status: { type: String, enum: ["pending", "completed"], default: "pending" },
      comments: [
        {
          user: String,
          text: String,
          createdAt: { type: Date, default: Date.now }
        }
      ]
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model("Meeting", MeetingSchema);