const express = require("express");
const router = express.Router();
const meetingController = require("../controllers/meetingController");

// GET all meetings
router.get("/", meetingController.getAllMeetings);

// GET single meeting
router.get("/:id", meetingController.getMeetingById);

// POST new meeting
router.post("/", meetingController.createMeeting);

// PUT update meeting
router.put("/:id", meetingController.updateMeeting);

// DELETE meeting
router.delete("/:id", meetingController.deleteMeeting);

// AI summary and action items
router.post("/:id/ai-summary", meetingController.generateAISummaryAndActions);

// Update action item (status, dueDate)
router.put("/:id/action-item/:actionItemId", meetingController.updateActionItem);
// Add comment to action item
router.post('/:id/action-item/:actionItemId/comment', meetingController.addActionItemComment);
router.put('/:id/action-item/:actionItemId/comment/:commentId', meetingController.editActionItemComment);
router.delete('/:id/action-item/:actionItemId/comment/:commentId', meetingController.deleteActionItemComment);

module.exports = router;