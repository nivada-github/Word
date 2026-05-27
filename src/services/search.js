const fs = require("fs");
const path = require("path");

const DEFAULT_DATA_PATH = path.join(__dirname, "..", "..", "data", "words.json");
const DEFAULT_LIMIT = 10;

class SearchIndex {
  constructor(options = {}) {
    this.dataPath = options.dataPath || DEFAULT_DATA_PATH;
    this.fields = options.fields || null; // null = search all string fields
    this.items = [];
    this.loaded = false;
    this.error = null;
  }

  load() {
    try {
      const raw = fs.readFileSync(this.dataPath, "utf-8");
      const parsed = JSON.parse(raw);
      this.items = Array.isArray(parsed) ? parsed : [];
      this.loaded = true;
      this.error = null;
    } catch (err) {
      this.items = [];
      this.loaded = false;
      this.error =
        err.code === "ENOENT"
          ? `Data file not found: ${this.dataPath}`
          : `Failed to parse data file: ${err.message}`;
    }
    return this;
  }

  reload() {
    return this.load();
  }

  loadFromArray(items) {
    this.items = Array.isArray(items) ? items : [];
    this.loaded = true;
    this.error = null;
    return this;
  }

  _getSearchableValues(item) {
    if (typeof item === "string") return [item];

    if (typeof item !== "object" || item === null) return [];

    const fields = this.fields || Object.keys(item);
    const values = [];

    for (const field of fields) {
      const val = item[field];
      if (typeof val === "string") {
        values.push(val);
      } else if (Array.isArray(val)) {
        for (const v of val) {
          if (typeof v === "string") values.push(v);
        }
      }
    }

    return values;
  }

  search(query, options = {}) {
    const limit = options.limit || DEFAULT_LIMIT;

    if (!query || typeof query !== "string") {
      return { results: [], total: 0, query: query || "" };
    }

    const q = query.toLowerCase().trim();
    if (q.length === 0) {
      return { results: [], total: 0, query };
    }

    const exact = [];
    const prefix = [];
    const contains = [];

    for (const item of this.items) {
      const values = this._getSearchableValues(item);
      let bestRank = -1;

      for (const val of values) {
        const lower = val.toLowerCase();
        if (lower === q) {
          bestRank = 2;
          break;
        } else if (lower.startsWith(q) && bestRank < 1) {
          bestRank = 1;
        } else if (lower.includes(q) && bestRank < 0) {
          bestRank = 0;
        }
      }

      if (bestRank === 2) exact.push(item);
      else if (bestRank === 1) prefix.push(item);
      else if (bestRank === 0) contains.push(item);
    }

    const all = [...exact, ...prefix, ...contains];
    return {
      results: all.slice(0, limit),
      total: all.length,
      query,
    };
  }

  getStatus() {
    return {
      loaded: this.loaded,
      itemCount: this.items.length,
      dataPath: this.dataPath,
      fields: this.fields,
      error: this.error,
    };
  }
}

let defaultIndex = null;

function getDefaultIndex() {
  if (!defaultIndex) {
    defaultIndex = new SearchIndex();
    defaultIndex.load();
  }
  return defaultIndex;
}

function resetDefaultIndex() {
  defaultIndex = null;
}

module.exports = { SearchIndex, getDefaultIndex, resetDefaultIndex };
