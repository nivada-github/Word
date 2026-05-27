const path = require("path");
const express = require("express");
const cors = require("cors");
const { download, load } = require("./words");

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
      "GET /api/words": "All English words (returns count + metadata, use ?include=words for full list)",
      "GET /api/words/search?q=term": "Search words by prefix",
      "GET /api/words/random": "Get a random word",
      "POST /api/words/download": "Download / refresh English words from the internet",
    },
  });
});

app.get("/api/words", (_req, res) => {
  const data = load();
  if (!data) {
    return res.status(404).json({ error: "Words not downloaded yet. POST /api/words/download first." });
  }
  if (_req.query.include === "words") {
    return res.json(data);
  }
  return res.json({ source: data.source, count: data.count });
});

app.get("/api/words/search", (req, res) => {
  const data = load();
  if (!data) {
    return res.status(404).json({ error: "Words not downloaded yet." });
  }
  const q = (req.query.q || "").toLowerCase().trim();
  if (!q) {
    return res.status(400).json({ error: "Query parameter ?q= is required." });
  }
  const matches = data.words.filter((w) => w.startsWith(q));
  res.json({ query: q, count: matches.length, words: matches.slice(0, 100) });
});

app.get("/api/words/random", (_req, res) => {
  const data = load();
  if (!data) {
    return res.status(404).json({ error: "Words not downloaded yet." });
  }
  const count = parseInt(_req.query.count, 10) || 1;
  const words = [];
  for (let i = 0; i < Math.min(count, 50); i++) {
    words.push(data.words[Math.floor(Math.random() * data.words.length)]);
  }
  res.json({ words });
});

app.post("/api/words/download", async (_req, res) => {
  try {
    const result = await download();
    res.json({ status: "ok", source: result.source, count: result.count });
  } catch (err) {
    res.status(500).json({ error: "Download failed", message: err.message });
  }
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

app.use((_req, res) => {
  res.status(404).json({ error: "Not found. Hit GET /api for available endpoints." });
});

module.exports = app;
