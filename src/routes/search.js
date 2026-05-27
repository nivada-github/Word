const express = require("express");
const { getDefaultIndex } = require("../services/search");

const router = express.Router();

router.get("/search", (req, res) => {
  const { q, limit } = req.query;

  const index = getDefaultIndex();
  const status = index.getStatus();

  if (!status.loaded) {
    return res.status(503).json({
      error: "Search data not available yet",
      detail: status.error,
    });
  }

  if (!q) {
    return res.status(400).json({ error: "Query parameter 'q' is required" });
  }

  const parsedLimit = limit ? Math.min(Math.max(parseInt(limit, 10) || 10, 1), 50) : undefined;
  const result = index.search(q, { limit: parsedLimit });

  res.json(result);
});

router.get("/search/status", (_req, res) => {
  const index = getDefaultIndex();
  res.json(index.getStatus());
});

router.post("/search/reload", (_req, res) => {
  const index = getDefaultIndex();
  index.reload();
  res.json({ message: "Data reloaded", ...index.getStatus() });
});

module.exports = router;
