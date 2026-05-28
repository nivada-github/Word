const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");
const OUTPUT_FILE = path.join(DATA_DIR, "root_words.json");

function load() {
  if (!fs.existsSync(OUTPUT_FILE)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(OUTPUT_FILE, "utf-8"));
}

function getRoots() {
  const data = load();
  if (!data) return [];
  return data.words;
}

function search(query) {
  const roots = getRoots();
  if (!query || typeof query !== "string") return [];

  const q = query.toLowerCase().trim();
  if (q.length === 0) return [];

  return roots.filter((entry) => {
    if (typeof entry === "string") return entry.includes(q);

    const searchable = [
      entry.root,
      entry.meaning,
      entry.origin,
      entry.nature_pattern,
      entry.psyche_pattern,
      entry.network_pattern,
      ...(entry.descendants || []),
    ];

    return searchable.some(
      (field) => typeof field === "string" && field.toLowerCase().includes(q)
    );
  });
}

function findByRoot(name) {
  const roots = getRoots();
  return roots.find(
    (entry) =>
      (typeof entry === "string" && entry === name) ||
      (typeof entry === "object" && entry.root === name)
  ) || null;
}

function getDescendants(rootName) {
  const entry = findByRoot(rootName);
  if (!entry || typeof entry === "string") return [];
  return entry.descendants || [];
}

function random(count = 1) {
  const roots = getRoots();
  if (roots.length === 0) return [];
  const results = [];
  const n = Math.min(count, roots.length);
  for (let i = 0; i < n; i++) {
    results.push(roots[Math.floor(Math.random() * roots.length)]);
  }
  return results;
}

module.exports = { load, getRoots, search, findByRoot, getDescendants, random, OUTPUT_FILE, DATA_DIR };
