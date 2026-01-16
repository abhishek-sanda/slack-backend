const express = require("express");
const multer = require("multer");
const path = require("path");
const mediaController = require("../controllers/mediaControllers");

const router = express.Router();

// Use a relative tmp directory for compatibility
const upload = multer({
    limits: { fileSize: 100 * 1024 * 1024 },
    dest: path.join(__dirname, "../tmp")
     
 });

// POST /api/media/upload
router.post("/upload", upload.single("file"),  mediaController.uploadMedia);

// GET /api/media/list
router.get("/list", mediaController.listMedia);

// GET /api/media/summary/:recordingId
router.get("/summary/:recordingId", mediaController.getSummary);

// POST /api/media/summarize-text
router.post("/summarize-text", mediaController.summarizeText);


router.post("/download/:recordingId", mediaController.downloadMedia);
router.get("/download/:recordingId", mediaController.downloadMedia);
module.exports = router;