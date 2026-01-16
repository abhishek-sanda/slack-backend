const Meeting = require("../models/Meeting");

// Get all meetings
exports.getAllMeetings = async (req, res) => {
  try {
    const meetings = await Meeting.find().sort({ time: -1 });
    res.json(meetings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get single meeting by ID
exports.getMeetingById = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) return res.status(404).json({ error: "Meeting not found" });
    res.json(meeting);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create a new meeting
exports.createMeeting = async (req, res) => {
  try {
    const { title, time, participants, summary } = req.body;
    if (!title || !time || !Array.isArray(participants)) {
      return res.status(400).json({ error: "title, time, and participants are required" });
    }
    const meeting = await Meeting.create({
      title,
      time,
      participants,
      summary: summary || ""
    });
    res.status(201).json(meeting);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update a meeting
exports.updateMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    const update = req.body;
    const meeting = await Meeting.findByIdAndUpdate(id, update, { new: true });
    if (!meeting) return res.status(404).json({ error: "Meeting not found" });
    res.json(meeting);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete a meeting
exports.deleteMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    const meeting = await Meeting.findByIdAndDelete(id);
    if (!meeting) return res.status(404).json({ error: "Meeting not found" });
    res.json({ message: "Meeting deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// AI-powered summary and action items extraction
exports.generateAISummaryAndActions = async (req, res) => {
  try {
    const { id } = req.params;
    const { transcript } = req.body;
    if (!transcript) return res.status(400).json({ error: "Transcript is required" });

    // TODO: Replace this with a real AI service call
    // Simulate AI summary and action items extraction
    const summary = "[AI GENERATED SUMMARY] " + transcript.slice(0, 100) + "...";
    const actionItems = [
      {
        description: "Follow up with client",
        assignee: "alice@example.com",
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        status: "pending"
      },
      {
        description: "Prepare project report",
        assignee: "bob@example.com",
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        status: "pending"
      }
    ];

    const meeting = await Meeting.findByIdAndUpdate(
      id,
      { summary, actionItems },
      { new: true }
    );
    if (!meeting) return res.status(404).json({ error: "Meeting not found" });
    res.json(meeting);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update a single action item (status, dueDate)
exports.updateActionItem = async (req, res) => {
  try {
    const { id, actionItemId } = req.params;
    const { status, dueDate } = req.body;
    const meeting = await Meeting.findById(id);
    if (!meeting) return res.status(404).json({ error: "Meeting not found" });
    const item = meeting.actionItems.id(actionItemId);
    if (!item) return res.status(404).json({ error: "Action item not found" });
    if (status) item.status = status;
    if (dueDate) item.dueDate = dueDate;
    await meeting.save();
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add a comment to an action item
exports.addActionItemComment = async (req, res) => {
  const { id, actionItemId } = req.params;
  const { user, text } = req.body;
  const meeting = await Meeting.findById(id);
  if (!meeting) return res.status(404).json({ error: "Meeting not found" });
  const item = meeting.actionItems.id(actionItemId);
  if (!item) return res.status(404).json({ error: "Action item not found" });
  item.comments.push({ user, text });
  await meeting.save();
  res.json(item.comments);
};

// Edit a comment on an action item
exports.editActionItemComment = async (req, res) => {
  const { id, actionItemId, commentId } = req.params;
  const { text } = req.body;
  const meeting = await Meeting.findById(id);
  if (!meeting) return res.status(404).json({ error: "Meeting not found" });
  const item = meeting.actionItems.id(actionItemId);
  if (!item) return res.status(404).json({ error: "Action item not found" });
  const comment = item.comments.id(commentId);
  if (!comment) return res.status(404).json({ error: "Comment not found" });
  comment.text = text;
  await meeting.save();
  res.json(comment);
};

// Delete a comment from an action item
exports.deleteActionItemComment = async (req, res) => {
  const { id, actionItemId, commentId } = req.params;
  const meeting = await Meeting.findById(id);
  if (!meeting) return res.status(404).json({ error: "Meeting not found" });
  const item = meeting.actionItems.id(actionItemId);
  if (!item) return res.status(404).json({ error: "Action item not found" });
  item.comments.id(commentId).remove();
  await meeting.save();
  res.json({ success: true });
};