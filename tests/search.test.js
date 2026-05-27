const request = require("supertest");
const app = require("../src/app");
const { SearchIndex, resetDefaultIndex } = require("../src/services/search");

afterEach(() => {
  resetDefaultIndex();
});

// --- SearchIndex unit tests ---

describe("SearchIndex", () => {
  const sampleData = [
    { word: "apple", category: "fruit" },
    { word: "application", category: "software" },
    { word: "banana", category: "fruit" },
    { word: "pineapple", category: "fruit" },
    { word: "app", category: "software" },
  ];

  function createLoaded(items = sampleData, options = {}) {
    return new SearchIndex(options).loadFromArray(items);
  }

  it("searches and ranks: exact > prefix > contains", () => {
    const idx = createLoaded();
    const { results } = idx.search("app");

    expect(results[0].word).toBe("app");
    expect(results[1].word).toBe("apple");
    expect(results[2].word).toBe("application");
    expect(results.some((r) => r.word === "pineapple")).toBe(true);
  });

  it("is case-insensitive", () => {
    const idx = createLoaded();
    const { results } = idx.search("APPLE");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].word).toBe("apple");
  });

  it("searches across all string fields by default", () => {
    const idx = createLoaded();
    const { results } = idx.search("fruit");
    expect(results.length).toBe(3);
  });

  it("restricts search to configured fields", () => {
    const idx = createLoaded(sampleData, { fields: ["word"] });
    const { results } = idx.search("fruit");
    expect(results.length).toBe(0);
  });

  it("respects limit option", () => {
    const idx = createLoaded();
    const { results, total } = idx.search("app", { limit: 2 });
    expect(results.length).toBe(2);
    expect(total).toBe(4);
  });

  it("returns empty results for empty query", () => {
    const idx = createLoaded();
    expect(idx.search("").results).toEqual([]);
    expect(idx.search(null).results).toEqual([]);
    expect(idx.search(undefined).results).toEqual([]);
  });

  it("returns empty results when nothing matches", () => {
    const idx = createLoaded();
    const { results, total } = idx.search("zzzzz");
    expect(results).toEqual([]);
    expect(total).toBe(0);
  });

  it("handles plain string arrays", () => {
    const idx = createLoaded(["hello", "world", "help"]);
    const { results } = idx.search("hel");
    expect(results).toEqual(["hello", "help"]);
  });

  it("handles items with array-valued fields", () => {
    const idx = createLoaded([
      { name: "recipe", tags: ["healthy", "quick"] },
      { name: "snack", tags: ["unhealthy"] },
    ]);
    const { results } = idx.search("healthy");
    expect(results.length).toBe(2);
  });

  it("reports status correctly", () => {
    const idx = createLoaded();
    const status = idx.getStatus();
    expect(status.loaded).toBe(true);
    expect(status.itemCount).toBe(5);
    expect(status.error).toBeNull();
  });

  it("handles missing data file gracefully", () => {
    const idx = new SearchIndex({ dataPath: "/nonexistent/words.json" });
    idx.load();
    expect(idx.loaded).toBe(false);
    expect(idx.error).toMatch(/not found/i);
    expect(idx.search("test").results).toEqual([]);
  });
});

// --- API endpoint tests ---

describe("GET /api/search", () => {
  it("returns ranked results from words.json", async () => {
    const res = await request(app).get("/api/search?q=app");
    expect(res.status).toBe(200);
    expect(res.body.results.length).toBeGreaterThan(0);
    expect(res.body.query).toBe("app");
    expect(res.body.total).toBeGreaterThanOrEqual(res.body.results.length);
  });

  it("returns 400 when q is missing", async () => {
    const res = await request(app).get("/api/search");
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/required/i);
  });

  it("respects limit parameter", async () => {
    const res = await request(app).get("/api/search?q=a&limit=3");
    expect(res.status).toBe(200);
    expect(res.body.results.length).toBeLessThanOrEqual(3);
  });
});

describe("GET /api/search/status", () => {
  it("returns search index status", async () => {
    const res = await request(app).get("/api/search/status");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("loaded");
    expect(res.body).toHaveProperty("itemCount");
    expect(res.body).toHaveProperty("dataPath");
  });
});

describe("POST /api/search/reload", () => {
  it("attempts reload and returns status", async () => {
    const res = await request(app).post("/api/search/reload");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("message");
    expect(res.body).toHaveProperty("loaded");
  });
});
