const fs = require("fs");
const path = require("path");
const request = require("supertest");
const app = require("../src/app");
const { load, OUTPUT_FILE, DATA_DIR } = require("../src/words");

const FIXTURE_PATH = path.join(DATA_DIR, "words.json");

function ensureFixture() {
  if (!fs.existsSync(FIXTURE_PATH)) {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    const payload = {
      source: "test",
      count: 5,
      words: ["apple", "banana", "cherry", "date", "elderberry"],
    };
    fs.writeFileSync(FIXTURE_PATH, JSON.stringify(payload));
  }
}

beforeAll(() => ensureFixture());

describe("words module", () => {
  it("load() returns parsed word data", () => {
    const data = load();
    expect(data).toBeDefined();
    expect(data.words).toBeInstanceOf(Array);
    expect(data.count).toBeGreaterThan(0);
    expect(data.source).toBeDefined();
  });
});

describe("GET /api/words", () => {
  it("returns word count and source", async () => {
    const res = await request(app).get("/api/words");
    expect(res.status).toBe(200);
    expect(res.body.count).toBeGreaterThan(0);
    expect(res.body.source).toBeDefined();
    expect(res.body.words).toBeUndefined();
  });

  it("returns full word list when ?include=words", async () => {
    const res = await request(app).get("/api/words?include=words");
    expect(res.status).toBe(200);
    expect(res.body.words).toBeInstanceOf(Array);
    expect(res.body.words.length).toBe(res.body.count);
  });
});

describe("GET /api/words/search", () => {
  it("returns 400 without query", async () => {
    const res = await request(app).get("/api/words/search");
    expect(res.status).toBe(400);
  });

  it("finds words by prefix", async () => {
    const res = await request(app).get("/api/words/search?q=app");
    expect(res.status).toBe(200);
    expect(res.body.words).toBeInstanceOf(Array);
    expect(res.body.words.every((w) => w.startsWith("app"))).toBe(true);
  });
});

describe("GET /api/words/random", () => {
  it("returns a random word", async () => {
    const res = await request(app).get("/api/words/random");
    expect(res.status).toBe(200);
    expect(res.body.words).toHaveLength(1);
  });

  it("returns multiple random words", async () => {
    const res = await request(app).get("/api/words/random?count=3");
    expect(res.status).toBe(200);
    expect(res.body.words).toHaveLength(3);
  });
});
