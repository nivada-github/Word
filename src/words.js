const fs = require("fs");
const path = require("path");
const https = require("https");

const SOURCES = [
  {
    name: "dwyl/english-words",
    url: "https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt",
    parse: (text) => text.split(/\r?\n/).map((w) => w.trim().toLowerCase()).filter(Boolean),
  },
];

const DATA_DIR = path.join(__dirname, "..", "data");
const OUTPUT_FILE = path.join(DATA_DIR, "words.json");

function fetch(url) {
  return new Promise((resolve, reject) => {
    const request = (href) => {
      https.get(href, { headers: { "User-Agent": "word-vortex" } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          request(res.headers.location);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} from ${href}`));
          return;
        }
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
        res.on("error", reject);
      }).on("error", reject);
    };
    request(url);
  });
}

async function download() {
  const source = SOURCES[0];
  console.log(`Downloading English words from ${source.name}...`);

  const text = await fetch(source.url);
  const words = source.parse(text);

  const unique = [...new Set(words)].sort();
  console.log(`Parsed ${unique.length} unique words.`);

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const payload = { source: source.name, count: unique.length, words: unique };
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(payload, null, 2));
  console.log(`Saved to ${OUTPUT_FILE}`);

  return payload;
}

function load() {
  if (!fs.existsSync(OUTPUT_FILE)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(OUTPUT_FILE, "utf-8"));
}

module.exports = { download, load, OUTPUT_FILE, DATA_DIR };

if (require.main === module) {
  download().catch((err) => {
    console.error("Download failed:", err.message);
    process.exit(1);
  });
}
