const path = require("path");
const express = require("express");
const cors = require("cors");
const searchRoutes = require("./routes/search");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/api", (_req, res) => {
  res.json({
    name: "Word Vortex",
    version: "0.1.0",
    endpoints: {
      "GET /": "The web app",
      "GET /api": "This endpoint list",
      "GET /health": "Health check",
      "GET /api/search?q=&limit=": "Search through data (autofill-ready)",
      "GET /api/search/status": "Search index status",
      "POST /api/search/reload": "Reload search data from disk",
    },
  });
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

app.use("/api", searchRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: "Not found. Hit GET /api for available endpoints." });
});

module.exports = app;
