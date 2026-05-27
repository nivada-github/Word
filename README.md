# Word API

A fun Node.js REST API for word games and utilities. Get random words, check anagrams, look up definitions, analyze letter stats, and more.

## Quick Start

```bash
npm install
npm start
```

The server starts on `http://localhost:3000` (override with `PORT` env var).

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | API info and endpoint list |
| GET | `/health` | Health check with uptime |
| GET | `/words/random` | Random word with definition |
| GET | `/words/random/:count` | Multiple random words |
| GET | `/words/today` | Word of the day |
| GET | `/words/search?q=term` | Search words containing a term |
| GET | `/words/define/:word` | Look up a word's definition |
| GET | `/words/stats/:word` | Letter stats for any word |
| GET | `/words/anagram/:w1/:w2` | Check if two words are anagrams |
| GET | `/words/count` | Total words in the collection |
| GET | `/words/all` | List all words (sorted) |

## Example Responses

**Random word:**
```json
{
  "word": "nebula",
  "definition": "A cloud of gas and dust in outer space"
}
```

**Word stats:**
```json
{
  "word": "racecar",
  "length": 7,
  "vowels": 3,
  "consonants": 4,
  "unique_letters": 4,
  "frequency": { "r": 2, "a": 2, "c": 2, "e": 1 },
  "reversed": "racecar",
  "is_palindrome": true
}
```

**Anagram check:**
```json
{
  "word1": "listen",
  "word2": "silent",
  "are_anagrams": true
}
```

## Development

```bash
npm run dev    # start with --watch (auto-restart on changes)
npm test       # run tests
```

## Tech Stack

- **Express** - web framework
- **cors** - cross-origin support
- **Jest + Supertest** - testing
