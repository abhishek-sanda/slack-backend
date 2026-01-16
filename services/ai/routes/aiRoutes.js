const express = require("express");
const router = express.Router();
const aiController = require("../controllers/aiController");

router.post("/suggest-replies", aiController.getSmartReplies);
router.post("/meeting-minutes", aiController.generateMeetingMinutes);
router.post("/sentiment", aiController.analyzeSentiment);
router.post('/summarize-text', async (req, res) => {
  try {
    const { transcript } = req.body;
    if (!transcript) {
      return res.status(400).json({ error: "Transcript is required" });
    }
    // Call your AI summarizer here (e.g., OpenAI)
    const summary = await summarizeWithOpenAI(transcript); // your function
    res.json({ summary });
  } catch (err) {
    console.error('Summarize error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;