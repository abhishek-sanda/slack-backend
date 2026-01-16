const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { createProxyMiddleware } = require("http-proxy-middleware");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Helper to create proxy with error handling and logging
function setupProxy(path, target, opts = {}) {
  app.use(
    path,
    createProxyMiddleware({
      target,
      changeOrigin: true,
      ws: !!opts.ws,
      onError: (err, req, res) => {
        console.error(`Error proxying ${req.method} ${req.originalUrl} to ${target}:`, err.message);
        if (!res.headersSent) {
          res.status(502).json({ error: "Service unavailable" });
        }
      },
      onProxyReq: (_proxyReq, req, res) => {
        console.log(`[Proxy] ${req.method} ${req.originalUrl} -> ${target}`);
      },
    })
  );
}

// Proxy routes (use env vars or default values)
setupProxy("/api/chat", process.env.CHAT_SERVICE_URL || "http://chat:4001", { ws: true });
 setupProxy("/api/meetings", process.env.MEETING_SERVICE_URL || "http://meeting:4002");
setupProxy("/api/media", process.env.MEDIA_SERVICE_URL || "http://media:4003");
setupProxy("/api/ai", process.env.AI_SERVICE_URL || "http://ai:4004");
setupProxy("/api/user", process.env.USER_SERVICE_URL || "http://user:4005");
setupProxy("/api/meetings", process.env.MEETING_URL || "http://meeting:4007");

// Health check endpoint
app.get("/health", (req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Gateway running on port ${PORT}`);
});