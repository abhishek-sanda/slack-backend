const express = require("express");
const cors = require("cors");
const { summarizeTranscript } = require("./controllers/summarizeController");
const aiRoutes = require("./routes/aiRoutes");
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

app.post("/summarize", summarizeTranscript);
app.get("/", (req, res) => res.send("AI service running"));
app.use("/api/ai", aiRoutes);

const PORT = process.env.PORT || 4004;
app.listen(PORT, () => {
  console.log(`AI service running on port ${PORT}`);
});