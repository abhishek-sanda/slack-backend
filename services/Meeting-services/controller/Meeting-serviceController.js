// Host starts the meeting (sets started=true)
const Meeting = require("../models/Meeting-service");
const { v4: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken");



exports.startMeeting = async (req, res) => {
  const { meetingId } = req.params;
  // Verify host token
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.isHost) throw new Error("Host privileges required");
    const meeting = await Meeting.findOne({ meetingId });
    if (!meeting) return res.status(404).json({ error: "Meeting not found" });
    meeting.started = true;
    await meeting.save();
    // Optionally, notify all attendees via socket.io here
    res.json({ status: "started" });
  } catch (err) {
    return res.status(403).json({ error: err.message });
  }
};



// Helper function to generate JWT
const generateToken = (userData) => {
  return jwt.sign(userData, process.env.JWT_SECRET, { expiresIn: "1h" });
};

// Create a new meeting
exports.createMeeting = async (req, res) => {
  const { host, title, requiresApproval = true } = req.body;
  const meetingId = uuidv4();
  const meeting = new Meeting({
    meetingId,
    host,
    title,
    requiresApproval,
    attendees: [{ name: host, isHost: true }],
    started: false
  });
  await meeting.save();

  const token = generateToken({
    meetingId,
    isHost: true,
    name: host
  });

  // Provide both a join link and a start link for the host
  const joinLink = `/joinmeeting/${meetingId}`;
  const startLink = `/hostmeeting/${meetingId}`;
  // Optionally, auto-start the meeting (like Zoom's instant meeting)
  meeting.started = true;
  await meeting.save();

  res.json({
    meetingId,
    joinLink, // for attendees
    startLink, // for host to manage the meeting
    token,
    started: true // indicate the meeting is already started
  });
};

// Join meeting (add to waiting room)
exports.joinMeeting = async (req, res) => {
  const { meetingId } = req.params;
  const { name ,email} = req.body;
  const meeting = await Meeting.findOne({ meetingId });
  if (!meeting) return res.status(404).json({ error: "Meeting not found" });

   const token = generateToken({
    meetingId,
    isHost: false,
    name,
    email
  });

  if (!meeting.requiresApproval) {
    meeting.attendees.push({ name, email });
    await meeting.save();
    return res.json({ 
      status: "admitted", 
      meetingId,
      token 
    });
  }

   res.json({ 
    status: "waiting", 
    meetingId,
    token,
    requiresApproval: true
  });
};

//   meeting.waitingRoom.push({ name });
//   await meeting.save();
//   res.json({ status: "waiting", meetingId });
// };

// Admit guest from waiting room
exports.admitGuest = async (req, res) => {
  const { meetingId } = req.params;
  const { name } = req.body;

  // Verify host token
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.isHost) throw new Error("Host privileges required");
  } catch (err) {
    return res.status(403).json({ error: "Invalid token" });
  }

  const meeting = await Meeting.findOne({ meetingId });
  if (!meeting) return res.status(404).json({ error: "Meeting not found" });
  const guestIndex = meeting.waitingRoom.findIndex(g => g.name === name);
  if (guestIndex === -1) return res.status(404).json({ error: "Guest not found" });
  const guest = meeting.waitingRoom.splice(guestIndex, 1)[0];
  meeting.attendees.push(guest);
  await meeting.save();

  // Get the io instance from app
  const io = req.app.get("io");
  io.to(meetingId).emit("attendeeAdmitted", {
    attendee: guest,
    attendees: meeting.attendees,
    waitingRoom: meeting.waitingRoom
  });
  // Notify the admitted attendee
// const io = req.app.get("io");
io.to(guest.socketId).emit("admissionApproved");
  res.json({ status: "admitted", meetingId });
};

// Add chat message
exports.addChat = async (req, res) => {
  const { meetingId } = req.params;
  const { user, message } = req.body;
  const meeting = await Meeting.findOne({ meetingId });
  if (!meeting) return res.status(404).json({ error: "Meeting not found" });
  // meeting.chat.push({user, message});
   meeting.chat.push({ user, message , createdAt: new Date().toISOString() });
  await meeting.save();
  res.json({ status: "ok" });
};

// Add note
exports.addNote = async (req, res) => {
  const { meetingId } = req.params;
  const { author, text } = req.body;
  const meeting = await Meeting.findOne({ meetingId });
  if (!meeting) return res.status(404).json({ error: "Meeting not found" });
  // meeting.notes.push({ author, text });
   meeting.notes.push({ author, text, createdAt: new Date().toISOString() });
  await meeting.save();
  res.json({ status: "ok" });
};

// Upload recording (assume file upload handled elsewhere)
exports.addRecording = async (req, res) => {
  const { meetingId } = req.params;
  const file = req.file;
  if (!file) return res.status(400).json({ error: "No file uploaded" });

  const meeting = await Meeting.findOne({ meetingId });
  if (!meeting) return res.status(404).json({ error: "Meeting not found" });

  // Construct the URL to the uploaded file
  const url = `/uploads/recordings/${file.filename}`;
  meeting.recordings.push({ url, uploadedAt: new Date(), by: req.body.by || "Unknown" });
  await meeting.save();

  // Optionally, construct a full shareable link
  const shareableLink = `${process.env.SERVER_URL || "http://localhost:4007"}${url}`;
  res.json({ status: "ok", shareableLink });
};

// GET /api/meetings/:meetingId
exports.getMeeting = async (req, res) => {
  const { meetingId } = req.params;
  const meeting = await Meeting.findOne({ meetingId });
  if (!meeting) return res.status(404).json({ error: "Meeting not found" });
  res.json(meeting);
};