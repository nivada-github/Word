# Word

A fun Node.js API + mobile web app for word games and utilities. Get random words, check anagrams, look up definitions, analyze letter stats, and more.

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/template/ZClinD?referralCode=xsbY2R)

## Deploy (free)

The fastest way to get this running with a public URL:

1. Tap the **Deploy on Railway** button above
2. Sign in with GitHub
3. Railway auto-builds and gives you a public URL
4. Open that URL on your phone, tap **Add to Home Screen** -- done

Every time you push to `main`, Railway auto-redeploys.

> If the button doesn't work, you can also deploy manually: go to [railway.com](https://railway.com), create a new project, pick "Deploy from GitHub repo", and select this repo.

## Run locally

```bash
npm install
npm start
```

The server starts on `http://localhost:3000` (override with `PORT` env var).

## The Web App

Open `/` in a browser to get the full mobile-friendly UI with:

- **Discover** -- word of the day + random word generator
- **Stats** -- letter frequency, palindrome detection, vowel/consonant counts
- **Anagram** -- check if two words are anagrams
- **Search** -- find words by substring
- **Browse** -- tap through all 75 words and their definitions

On your phone you can **Add to Home Screen** and it shows up like a real app (purple "W" icon, no browser bar).

## API Endpoints

All endpoints return JSON. Useful if you want to build your own frontend or use these from code.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api` | Endpoint list (JSON) |
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

**Random word** `GET /words/random`:
```json
{
  "word": "nebula",
  "definition": "A cloud of gas and dust in outer space"
}
```

**Word stats** `GET /words/stats/racecar`:
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

**Anagram check** `GET /words/anagram/listen/silent`:
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

- **Express** -- web framework
- **cors** -- cross-origin support
- **Jest + Supertest** -- testing
