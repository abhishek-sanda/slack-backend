// // This example uses a simple in-memory model. Replace with a database as needed.
// const { randomUUID } = require("crypto");

// class Media {
//   constructor({ filename, originalname, mimetype, size }) {
//     this.id = randomUUID(); // Unique identifier for polling
//     this.filename = filename;
//     this.originalname = originalname;
//     this.mimetype = mimetype;
//     this.size = size;
//     this.uploadedAt = new Date();
//     this.summary = null; // For AI-generated summary
//   }
// }

// // In-memory "database"
// const mediaStore = [];

// module.exports = { Media, mediaStore };

const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
  filename: String,
  originalname: String,
  mimetype: String,
  size: Number,
  uploadedAt: { type: Date, default: Date.now },
  summary: String,
  summaryStatus: { type: String, enum: ['processing', 'ready', 'failed'], default: 'processing' }
});

module.exports = mongoose.model('Media', mediaSchema);