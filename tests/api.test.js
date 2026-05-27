const request = require("supertest");
const app = require("../src/app");

describe("GET /", () => {
  it("returns API info and endpoint list", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Word API");
    expect(res.body.endpoints).toBeDefined();
  });
});

describe("GET /health", () => {
  it("returns ok status", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(typeof res.body.uptime).toBe("number");
  });
});

describe("GET /words/random", () => {
  it("returns a word and definition", async () => {
    const res = await request(app).get("/words/random");
    expect(res.status).toBe(200);
    expect(typeof res.body.word).toBe("string");
    expect(res.body.word.length).toBeGreaterThan(0);
  });
});

describe("GET /words/random/:count", () => {
  it("returns the requested number of words", async () => {
    const res = await request(app).get("/words/random/5");
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(5);
    expect(res.body.words).toHaveLength(5);
  });

  it("rejects non-numeric count", async () => {
    const res = await request(app).get("/words/random/abc");
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it("rejects negative count", async () => {
    const res = await request(app).get("/words/random/-3");
    expect(res.status).toBe(400);
  });
});

describe("GET /words/today", () => {
  it("returns word of the day with date", async () => {
    const res = await request(app).get("/words/today");
    expect(res.status).toBe(200);
    expect(typeof res.body.word).toBe("string");
    expect(res.body.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("returns the same word on repeated calls", async () => {
    const res1 = await request(app).get("/words/today");
    const res2 = await request(app).get("/words/today");
    expect(res1.body.word).toBe(res2.body.word);
  });
});

describe("GET /words/search", () => {
  it("finds words containing the query", async () => {
    const res = await request(app).get("/words/search?q=light");
    expect(res.status).toBe(200);
    expect(res.body.query).toBe("light");
    res.body.results.forEach((w) => {
      expect(w).toContain("light");
    });
  });

  it("returns 400 when q is missing", async () => {
    const res = await request(app).get("/words/search");
    expect(res.status).toBe(400);
  });
});

describe("GET /words/define/:word", () => {
  it("returns a definition for a known word", async () => {
    const res = await request(app).get("/words/define/nebula");
    expect(res.status).toBe(200);
    expect(res.body.word).toBe("nebula");
    expect(typeof res.body.definition).toBe("string");
  });

  it("returns 404 for unknown word", async () => {
    const res = await request(app).get("/words/define/xyzzyplugh");
    expect(res.status).toBe(404);
  });
});

describe("GET /words/stats/:word", () => {
  it("returns letter statistics", async () => {
    const res = await request(app).get("/words/stats/hello");
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(5);
    expect(res.body.vowels).toBe(2);
    expect(res.body.consonants).toBe(3);
    expect(res.body.reversed).toBe("olleh");
    expect(res.body.is_palindrome).toBe(false);
  });

  it("detects palindromes", async () => {
    const res = await request(app).get("/words/stats/racecar");
    expect(res.status).toBe(200);
    expect(res.body.is_palindrome).toBe(true);
  });
});

describe("GET /words/anagram/:word1/:word2", () => {
  it("detects valid anagrams", async () => {
    const res = await request(app).get("/words/anagram/listen/silent");
    expect(res.status).toBe(200);
    expect(res.body.are_anagrams).toBe(true);
  });

  it("detects non-anagrams", async () => {
    const res = await request(app).get("/words/anagram/hello/world");
    expect(res.status).toBe(200);
    expect(res.body.are_anagrams).toBe(false);
  });
});

describe("GET /words/count", () => {
  it("returns total word count", async () => {
    const res = await request(app).get("/words/count");
    expect(res.status).toBe(200);
    expect(typeof res.body.total_words).toBe("number");
    expect(res.body.total_words).toBeGreaterThan(0);
  });
});

describe("GET /words/all", () => {
  it("returns all words sorted", async () => {
    const res = await request(app).get("/words/all");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.words)).toBe(true);
    const sorted = [...res.body.words].sort();
    expect(res.body.words).toEqual(sorted);
  });
});

describe("404 handler", () => {
  it("returns 404 for unknown routes", async () => {
    const res = await request(app).get("/nope");
    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });
});
