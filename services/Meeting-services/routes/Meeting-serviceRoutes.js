const express = require("express");
const router = express.Router();
const multer = require("multer");
const meetingController = require("../controller/Meeting-serviceController");


// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/recordings/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });


router.post("/create", meetingController.createMeeting);
// Host starts the meeting
router.post("/:meetingId/start", meetingController.startMeeting);
router.post("/:meetingId/join", meetingController.joinMeeting);
router.post("/:meetingId/admit", meetingController.admitGuest);
router.post("/:meetingId/chat", meetingController.addChat);
router.post("/:meetingId/note", meetingController.addNote);
router.post("/:meetingId/recording",upload.single("file"), meetingController.addRecording);
router.get("/:meetingId", meetingController.getMeeting);

module.exports = router;