const express = require("express");
const rootWords = require("../root_words");

const router = express.Router();

router.get("/", (_req, res) => {
  const data = rootWords.load();
  if (!data) {
    return res.status(404).json({ error: "Root words data not found." });
  }
  if (_req.query.include === "words") {
    return res.json(data);
  }
  return res.json({
    source: data.source,
    description: data.description,
    count: data.count,
  });
});

router.get("/search", (req, res) => {
  const q = (req.query.q || "").trim();
  if (!q) {
    return res.status(400).json({ error: "Query parameter ?q= is required." });
  }
  const matches = rootWords.search(q);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 50);
  res.json({ query: q, count: matches.length, results: matches.slice(0, limit) });
});

router.get("/random", (req, res) => {
  const count = parseInt(req.query.count, 10) || 1;
  const results = rootWords.random(Math.min(count, 20));
  if (results.length === 0) {
    return res.status(404).json({ error: "Root words data not found." });
  }
  res.json({ words: results });
});

router.get("/:root", (req, res) => {
  const entry = rootWords.findByRoot(req.params.root.toLowerCase());
  if (!entry) {
    return res.status(404).json({ error: `Root word '${req.params.root}' not found.` });
  }
  res.json(entry);
});

router.get("/:root/descendants", (req, res) => {
  const entry = rootWords.findByRoot(req.params.root.toLowerCase());
  if (!entry) {
    return res.status(404).json({ error: `Root word '${req.params.root}' not found.` });
  }
  res.json({ root: entry.root, descendants: entry.descendants || [] });
});

module.exports = router;
