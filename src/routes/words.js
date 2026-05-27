const { Router } = require("express");
const { getRandomWord, getRandomWords, getWordOfTheDay, searchWords, words } = require("../data/words");
const { getDefinition } = require("../data/definitions");

const router = Router();

router.get("/random", (_req, res) => {
  const word = getRandomWord();
  const definition = getDefinition(word);
  res.json({ word, definition });
});

router.get("/random/:count", (req, res) => {
  const count = parseInt(req.params.count, 10);
  if (isNaN(count) || count < 1) {
    return res.status(400).json({ error: "count must be a positive integer" });
  }
  const selected = getRandomWords(count);
  res.json({ count: selected.length, words: selected });
});

router.get("/today", (_req, res) => {
  const word = getWordOfTheDay();
  const definition = getDefinition(word);
  res.json({ word, definition, date: new Date().toISOString().split("T")[0] });
});

router.get("/search", (req, res) => {
  const { q } = req.query;
  if (!q || q.length === 0) {
    return res.status(400).json({ error: "query parameter 'q' is required" });
  }
  const results = searchWords(q);
  res.json({ query: q, count: results.length, results });
});

router.get("/define/:word", (req, res) => {
  const word = req.params.word.toLowerCase();
  const definition = getDefinition(word);
  if (!definition) {
    return res.status(404).json({ error: `no definition found for '${word}'` });
  }
  res.json({ word, definition });
});

router.get("/stats/:word", (req, res) => {
  const word = req.params.word.toLowerCase();
  const letters = word.split("");
  const frequency = {};
  for (const ch of letters) {
    frequency[ch] = (frequency[ch] || 0) + 1;
  }
  const vowels = letters.filter((ch) => "aeiou".includes(ch)).length;
  const consonants = letters.filter((ch) => /[a-z]/.test(ch) && !"aeiou".includes(ch)).length;

  res.json({
    word,
    length: word.length,
    vowels,
    consonants,
    unique_letters: new Set(letters).size,
    frequency,
    reversed: letters.reverse().join(""),
    is_palindrome: word === letters.join(""),
  });
});

router.get("/anagram/:word1/:word2", (req, res) => {
  const a = req.params.word1.toLowerCase().split("").sort().join("");
  const b = req.params.word2.toLowerCase().split("").sort().join("");
  res.json({
    word1: req.params.word1.toLowerCase(),
    word2: req.params.word2.toLowerCase(),
    are_anagrams: a === b,
  });
});

router.get("/count", (_req, res) => {
  res.json({ total_words: words.length });
});

router.get("/all", (_req, res) => {
  res.json({ count: words.length, words: [...words].sort() });
});

module.exports = router;
