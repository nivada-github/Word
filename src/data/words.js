const words = [
  "serendipity", "ephemeral", "luminous", "cascade", "whisper",
  "nebula", "aurora", "zenith", "quartz", "velvet",
  "crimson", "sapphire", "ember", "solstice", "zephyr",
  "mosaic", "prism", "labyrinth", "echo", "mirage",
  "silhouette", "gossamer", "iridescent", "mellifluous", "petrichor",
  "euphoria", "wanderlust", "sonder", "halcyon", "reverie",
  "sonorous", "incandescent", "effervescent", "resplendent", "ethereal",
  "eloquence", "tranquil", "celestial", "vivacious", "beguile",
  "whimsical", "enigma", "oblivion", "paradox", "quintessence",
  "rhapsody", "symphony", "tempest", "umbra", "vortex",
  "alchemy", "bliss", "catalyst", "dusk", "elixir",
  "flicker", "glimpse", "horizon", "infinity", "journey",
  "kaleidoscope", "lullaby", "momentum", "nirvana", "opulent",
  "pinnacle", "quest", "radiance", "stellar", "twilight",
  "utopia", "verdant", "whimsy", "xenial", "yearning"
];

function getRandomWord() {
  return words[Math.floor(Math.random() * words.length)];
}

function getRandomWords(count) {
  const n = Math.min(Math.max(1, count), words.length);
  const shuffled = [...words].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function getWordOfTheDay() {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000
  );
  return words[dayOfYear % words.length];
}

function searchWords(query) {
  const lower = query.toLowerCase();
  return words.filter((w) => w.includes(lower));
}

module.exports = { words, getRandomWord, getRandomWords, getWordOfTheDay, searchWords };
