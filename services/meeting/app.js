const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const meetingRoutes = require("./routes/meetingRoutes");
require('dotenv').config();
const app = express();

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('MongoDB Connected'))
.catch((err) => console.error('MongoDB connection error:', err));

app.use(cors());
app.use(express.json());
app.use("/api/meetings", meetingRoutes);

const PORT = process.env.PORT || 4002;
app.listen(PORT, () => {
  console.log(`Meeting service running on port ${PORT}`);
});