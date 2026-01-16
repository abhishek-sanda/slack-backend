const axios = require("axios");

// Summarize meeting transcript using OpenAI API
exports.summarizeTranscript = async (req, res) => {
  try {
    // Validate request body
    const { file: transcriptText, filename } = req.body;
    if (!transcriptText || !filename) {
      return res.status(400).json({ error: "Missing file or filename", status: "failed" });
    }
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "Missing OpenAI API key in environment", status: "failed" });
    }

    let summary = null;
    let aiError = null;

    try {
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "Summarize the meeting transcript and extract action items as a bullet list." },
            { role: "user", content: transcriptText }
          ]
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            "Content-Type": "application/json"
          }
        }
      );

      // Validate OpenAI response
      if (
        response.data?.choices?.[0]?.message?.content
      ) {
        summary = response.data.choices[0].message.content;
      } else {
        aiError = "Invalid response from OpenAI";
        console.error("OpenAI API invalid response:", response.data);
      }
    } catch (err) {
      aiError = err.response?.data?.error?.message || err.message || "OpenAI request failed";
      console.error("OpenAI API error:", err.response?.data || err.message || err);
    }

    if (summary) {
      // Optionally: update Meeting DB with summary here
      return res.json({ summary, status: "ready" });
    } else {
      return res.status(200).json({
        summary: null,
        status: "failed",
        error: aiError || "AI summary failed"
      });
    }
  } catch (err) {
    console.error("summarizeTranscript controller error:", err);
    res.status(500).json({ error: err.message || "Internal server error", status: "failed" });
  }
};