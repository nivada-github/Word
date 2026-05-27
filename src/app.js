const path = require("path");
const express = require("express");
const cors = require("cors");
const wordRoutes = require("./routes/words");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/api", (_req, res) => {
  res.json({
    name: "Word API",
    version: "1.0.0",
    description: "A fun API for word games and utilities",
    endpoints: {
      "GET /":                          "The web app (open in a browser)",
      "GET /api":                       "This endpoint list (JSON)",
      "GET /words/random":              "Get a random word with its definition",
      "GET /words/random/:count":       "Get multiple random words",
      "GET /words/today":               "Get the word of the day",
      "GET /words/search?q=term":       "Search for words containing a term",
      "GET /words/define/:word":        "Get the definition of a word",
      "GET /words/stats/:word":         "Get letter statistics for any word",
      "GET /words/anagram/:w1/:w2":     "Check if two words are anagrams",
      "GET /words/count":               "Get the total number of words",
      "GET /words/all":                 "List all available words",
      "GET /health":                    "Health check",
    },
  });
});

app.use("/words", wordRoutes);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

app.use((_req, res) => {
  res.status(404).json({ error: "Not found. Hit GET /api for available endpoints." });
});

module.exports = app;
