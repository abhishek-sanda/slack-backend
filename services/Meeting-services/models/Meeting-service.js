const mongoose = require("mongoose");

const AttendeeSchema = new mongoose.Schema({
  name: String,
  email: String,
  socketId: String,
  isHost: { type: Boolean, default: false },
  joinedAt: { type: Date, default: Date.now },
  raisedHand: { type: Boolean, default: false },
}, { _id: true });  // Ensure _id is created for each attendee
 
const MeetingSchema = new mongoose.Schema({
  meetingId: { type: String, unique: true },
  host: String,
   status: { 
    type: String, 
    enum: ['pending', 'accepted', 'rejected'], 
    default: 'pending'
  },
  title: String,
  requiresApproval: { type: Boolean, default: true },
  started: { type: Boolean, default: false }, // Indicates if the meeting has started
  attendees: [AttendeeSchema],
  waitingRoom: [AttendeeSchema],
  notes: [{
     author: String,
     text: String, 
     createdAt: { type: Date, default: Date.now }
     }],
  chat: [{ 
    user: String,
     message: String, 
     createdAt: { type: Date, default: Date.now } 
    }],
  recordings: [{ 
    url: String, 
    uploadedAt: Date, by: String 
  }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Meeting", MeetingSchema);