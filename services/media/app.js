// const express = require("express");
// const multer = require("multer");
// const cors = require("cors");
// // const axios = require("axios");
// // const path = require("path");
// // const fs = require("fs");
// // const app = express();
// // require('dotenv').config();

// // const upload = multer({ dest: "/tmp/" });

// // app.use(cors());
// // app.use(express.json());

// // app.post("/upload", upload.single("file"), async (req, res) => {
// //   // Here, you would upload the file to S3/minio, then call AI microservice.
// //   const filePath = req.file.path;
// //   const fileData = fs.readFileSync(filePath);
// //   // (For demo: just send file buffer/content to AI summarization service)
// //   await axios.post("http://ai:4004/summarize", {
// //     filename: req.file.originalname,
// //     file: fileData.toString("base64")
// //   });
// //   fs.unlinkSync(filePath);
// //   res.json({ status: "uploaded" });
// // });

// // const PORT = process.env.PORT || 4003;
// // app.listen(PORT, () => {
// //   console.log(`Media service running on port ${PORT}`);
// // });


const express = require("express");
const cors = require("cors");
const path = require("path");
const mongoose =require('mongoose');
const fs = require("fs");
const mediaRoutes = require("./routes/media");
require("dotenv").config();

const app = express();


mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('MongoDB Connected'))
.catch((err) => console.error('MongoDB connection error:', err));

app.use(cors({
  origin: "http://localhost:5173", // allow your frontend's origin
  credentials: true                // if you use cookies/auth
}));
app.use(express.json());

// Ensure tmp directory exists (works for all OS)
const tmpDir = path.join(__dirname, "tmp");
if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir);
}

// API routes
app.use("/api/media", mediaRoutes);

// Health check
app.get("/", (req, res) => res.send("Media service running"));

// Start server
const PORT = process.env.PORT || 4003;
app.listen(PORT, () => {
  console.log(`Media service running on port ${PORT}`);
});