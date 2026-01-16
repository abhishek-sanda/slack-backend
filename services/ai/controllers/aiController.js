const axios = require("axios");

exports.getSmartReplies = async (req, res) => {
  const { lastMessage, context } = req.body;
  // context: array of previous messages (for better suggestions)
  try {
    // Call OpenAI or your AI provider
    const prompt = `Given the conversation:\n${context.map(m => m.user + ": " + m.text).join("\n")}\nReply to: "${lastMessage}"\nSuggest 3 smart replies.`;
    const aiRes = await axios.post("https://api.openai.com/v1/chat/completions", {
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }]
    }, {
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }
    });
    // Parse AI response
    const replies = aiRes.data.choices[0].message.content.split("\n").filter(Boolean);
    res.json({ replies });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.generateMeetingMinutes = async (req, res) => {
  const { transcript } = req.body;
  try {
    const prompt = `Summarize the following meeting transcript. List key decisions and action items:\n${transcript}`;
    const aiRes = await axios.post("https://api.openai.com/v1/chat/completions", {
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }]
    }, {
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }
    });
    res.json({ minutes: aiRes.data.choices[0].message.content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.analyzeSentiment = async (req, res) => {
  const { transcript } = req.body;
  try {
    const prompt = `Analyze the sentiment (positive, negative, neutral) of this transcript and explain why:\n${transcript}`;
    const aiRes = await axios.post("https://api.openai.com/v1/chat/completions", {
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }]
    }, {
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }
    });
    res.json({ sentiment: aiRes.data.choices[0].message.content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};