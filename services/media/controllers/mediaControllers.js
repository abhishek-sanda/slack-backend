// const fs = require("fs");
// const axios = require("axios");
// const path = require("path");
// const { Media, mediaStore } = require("../models/media");

// // POST /api/media/upload
// exports.uploadMedia = async (req, res) => {
//     let filePath;
//   try {
//     if (!req.file) return res.status(400).json({ error: "No file uploaded" });

//     // Save metadata to in-memory store
//     const media = new Media({
//       filename: req.file.filename,
//       originalname: req.file.originalname,
//       mimetype: req.file.mimetype,
//       size: req.file.size,
//     });
//     mediaStore.push(media);
// await media.save();
//     // Read file
//     filePath = req.file.path;
//     const fileData = fs.readFileSync(filePath);

//     // Simulate AI microservice call (comment out if AI service is not running)
//     let aiSummary = null;
// try {
//   const aiRes= await axios.post( process.env.AI_SERVICE_URL || "http://localhost:4004/summarize", {
//     filename: req.file.originalname,
//     file: fileData.toString("base64"),
//   }, { timeout: 10000 }
// ); 
//  aiSummary = aiRes.data.summary || null;
//   media.summary = aiSummary; // <--- Add this line!
//  media.summaryStatus = "ready";
//     await media.save();
//   } catch (err) {
//     media.summaryStatus = "failed";
//     await media.save();
//     // log error, don't send error to client
//   }

//    res.json({ 
//     status: "uploaded", 
//     file: media , 
//     recordingId: media.id, // For summary polling
//     aiSummary: aiSummary ||  null,
//     summaryStatus: aiSummary ? "ready" : "processing",
//   });
//   } catch (err) {
//      if (!res.headersSent) {
//     res.status(500).json({ error: err.message });
//      }
//   }finally {
//     // Remove temp file if it exists
//     if (filePath && fs.existsSync(filePath)) {
//       fs.unlinkSync(filePath);
//     }
//   }
// };

// // GET /api/media/list
// exports.listMedia = (req, res) => {
//   res.json(mediaStore);
// };

// // GET /api/summary/:recordingId
// exports.getSummary = (req, res) => {
//   const media = mediaStore.find(m => m.id === req.params.recordingId);
//   if (!media) return res.status(404).json({ error: "Recording not found" });
//   res.json({
//     summary: media.summary || null,
//     status: media.summary ? "ready" : "processing"
//   });
// };

const fs = require("fs");
const axios = require("axios");
const path = require("path");
const Media = require("../models/media");
const  OpenAI  = require("openai");

// POST /api/media/upload
exports.uploadMedia = async (req, res) => {
  let filePath;
  let media;
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    // Save metadata to database
    media = new Media({
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      summaryStatus: "processing"
    });
    await media.save(); // This must succeed!
    console.log("Saved media:", media._id); // Add this line

    filePath = req.file.path;
    const fileData = fs.readFileSync(filePath);

    let aiSummary = null;
    try {
      // Call AI microservice to get summary
      const aiRes = await axios.post(
        process.env.AI_SERVICE_URL || "http://localhost:4004/summarize",
        {
          filename: req.file.originalname,
          file: fileData.toString("base64"),
        },
        { timeout: 10000 }
      );
      aiSummary = aiRes.data.summary || null;
      media.summary = aiSummary;
      media.summaryStatus = "ready";
    } catch (err) {
      media.summaryStatus = "failed";
      media.summary = null;
      console.error("AI service failed:", err.message, err.response?.data || "");
    }
    await media.save();

    res.json({
      status: "uploaded",
      file: media,
      recordingId: media._id, // This must match MongoDB _id
      aiSummary: aiSummary,
      summaryStatus: media.summaryStatus,
    });
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ error: err.message });
    }
  } finally {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
};

// GET /api/media/list
exports.listMedia = async (req, res) => {
  try{
  const mediaList = await Media.find().sort({ uploadedAt: -1 });
  res.json(mediaList);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/summary/:recordingId
exports.getSummary = async (req, res) => {
  try {             
    const media = await Media.findById(req.params.recordingId);
    if (!media) return res.status(404).json({ error: "Recording not found" });
    res.json({
      summary: media.summary || null,
      status: media.summaryStatus || (media.summary ? "ready" : "processing"),
      error: media.summaryStatus === "failed" ? "AI summary failed" : undefined
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

async function summarizeWithOpenAI(transcript) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: 30000, // 30 seconds
  });
  const prompt = `Summarize this meeting transcript:\n${transcript}`;
  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 256,
  });
  return  response.choices[0].message.content.trim();
}

exports.summarizeText = async (req, res) => {
  try {
    const { transcript } = req.body;
    if (!transcript) {
      return res.status(400).json({ error: "Transcript is required" });
    }
    const summary = await summarizeWithOpenAI(transcript);
    res.json({ summary });
  } catch (err) {
    console.error('Summarize error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.downloadMedia = async (req, res) => {
  try {
    const media = await Media.findById(req.params.recordingId);
    if (!media) return res.status(404).json({ error: "Recording not found" });

    // The file is stored in /tmp or /uploads depending on your multer config
    // Adjust the path as needed
    const filePath = path.join(__dirname, "../tmp", media.filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found on server" });
    }

    res.download(filePath, media.originalname);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};