#!/usr/bin/env python3
"""
Morphological root-word mapper.

Reads words.json (370K English words), identifies root/base words,
and builds two output files:
  - data/root words.json   — the set of identified root words
  - data/word-to-root.json — maps every word to its morphological root chain
"""

import json, sys
from nltk.stem import WordNetLemmatizer

wnl = WordNetLemmatizer()

# Each rule: (suffix, min_stem_len, replacements)
# replacements: list of strings to try appending after stripping the suffix
SUFFIX_RULES = [
    # ── long suffixes (5+) ────────────────────────────────────────────
    ("izations", 4, ["ize", ""]),
    ("isations", 4, ["ise", ""]),
    ("fulness", 3, ["ful", ""]),
    ("ingness", 3, ["ing", ""]),
    ("lessly", 3, ["less", ""]),
    ("iously", 3, ["ious", ""]),
    ("eously", 3, ["eous", ""]),
    ("ously", 3, ["ous", ""]),
    ("ively", 3, ["ive", ""]),
    ("ately", 3, ["ate", ""]),
    ("ments", 3, [""]),
    ("izers", 3, ["ize", ""]),
    ("isers", 3, ["ise", ""]),
    ("lings", 3, ["le", ""]),
    ("wards", 3, [""]),
    ("ships", 3, [""]),
    ("ences", 3, ["ence", ""]),
    ("ances", 3, ["ance", ""]),
    ("esses", 3, ["ess", ""]),
    ("tions", 3, ["tion", ""]),
    ("sions", 3, ["sion", ""]),
    ("ators", 3, ["ate", ""]),
    ("fully", 3, ["ful", ""]),

    # ── 5-char suffixes ────────────────────────────────────────────────
    ("ility", 3, ["le", "ble"]),
    ("ilities", 3, ["le", "ble"]),

    # ── 4-char suffixes ───────────────────────────────────────────────
    ("ness", 3, [""]),
    ("ment", 3, [""]),
    ("ment", 3, ["e"]),
    ("able", 3, ["", "e", "ate"]),
    ("ible", 3, ["", "e"]),
    ("tion", 3, ["t", "te", ""]),
    ("sion", 3, ["d", "de", "se", "s", ""]),
    ("ical", 3, ["ic", ""]),
    ("ally", 3, ["al", ""]),
    ("ence", 3, ["ent", "e", ""]),
    ("ance", 3, ["ant", "e", ""]),
    ("ency", 3, ["ent", ""]),
    ("ancy", 3, ["ant", ""]),
    ("ship", 3, [""]),
    ("ward", 3, [""]),
    ("wise", 3, [""]),
    ("like", 3, [""]),
    ("ular", 3, ["ule", ""]),
    ("ator", 3, ["ate", ""]),
    ("izer", 3, ["ize", ""]),
    ("iser", 3, ["ise", ""]),
    ("ling", 3, ["", "le"]),
    ("iest", 3, [""]),
    ("less", 3, [""]),
    ("ings", 3, [""]),
    ("ists", 3, ["ist", ""]),
    ("isms", 3, ["ism", ""]),
    ("ites", 3, ["ite", ""]),
    ("ives", 3, ["ive", ""]),
    ("izes", 3, ["ize", ""]),
    ("ises", 3, ["ise", ""]),
    ("ants", 3, ["ant", ""]),
    ("ents", 3, ["ent", ""]),
    ("ates", 3, ["ate", ""]),

    # ── 3-char suffixes ───────────────────────────────────────────────
    ("ful", 3, [""]),
    ("ous", 3, ["", "e"]),
    ("ive", 3, ["", "e"]),
    ("ise", 3, [""]),
    ("ize", 3, [""]),
    ("ism", 3, [""]),
    ("ist", 3, [""]),
    ("ant", 4, [""]),
    ("ent", 4, [""]),
    ("ary", 3, [""]),
    ("ory", 3, ["", "e"]),
    ("age", 3, [""]),
    ("dom", 3, [""]),
    ("ure", 3, [""]),
    ("eer", 3, [""]),
    ("ier", 3, [""]),
    ("ing", 2, ["", "e"]),
    ("ers", 2, ["er", "", "e"]),
    ("ors", 3, [""]),
    ("ees", 3, ["ee", ""]),
    ("ied", 2, [""]),
    ("ies", 2, [""]),
    ("ion", 4, ["e", ""]),
    ("est", 2, ["", "e"]),
    ("ess", 3, [""]),
    ("ate", 3, [""]),
    ("ite", 3, [""]),
    ("ity", 3, ["", "e"]),
    ("ily", 2, [""]),

    # ── 2-char suffixes ───────────────────────────────────────────────
    ("al", 4, [""]),
    ("ed", 2, ["", "e"]),
    ("en", 3, ["", "e"]),
    ("er", 2, ["", "e"]),
    ("ly", 2, ["", "le"]),
    ("or", 3, [""]),
    ("ee", 3, [""]),
    ("ic", 3, [""]),
    ("th", 5, [""]),
    ("es", 2, ["", "e"]),
    ("'s", 1, [""]),

    # ── 1-char suffixes ──────────────────────────────────────────────
    ("s", 3, [""]),
    ("d", 5, ["", "e"]),
    ("y", 4, [""]),
]

PREFIX_RULES = [
    ("un", 3),
    ("re", 3),
    ("dis", 3),
    ("mis", 3),
    ("pre", 3),
    ("non", 3),
    ("over", 3),
    ("out", 3),
    ("sub", 3),
    ("super", 3),
    ("anti", 3),
    ("counter", 3),
    ("de", 3),
    ("fore", 3),
    ("inter", 3),
    ("semi", 3),
    ("under", 3),
    ("co", 3),
    ("extra", 3),
    ("macro", 3),
    ("mega", 3),
    ("micro", 3),
    ("mono", 3),
    ("multi", 3),
    ("neo", 3),
    ("poly", 3),
    ("post", 3),
    ("proto", 3),
    ("trans", 3),
    ("ultra", 3),
    ("im", 3),
    ("il", 3),
    ("ir", 3),
    ("in", 3),
    ("bi", 3),
]


def stem_variants(stem):
    """
    Given a raw stem (suffix stripped), yield (variant, quality_delta) pairs.
    Lower quality_delta = better.

    Priority:
      0 — i→y transform (e.g. "happi" → "happy"): almost always the true base
      0 — raw stem when no transform needed
      1 — undoubled consonant (e.g. "runn" → "run"): real but is a transform
      2 — raw stem ending in "i" or doubled consonant (spelling artifacts)
    """
    has_iy = stem.endswith("i") and len(stem) >= 2
    has_double = (len(stem) >= 3 and stem[-1] == stem[-2]
                  and stem[-1] not in "aeiou")

    results = []

    if has_iy:
        results.append((stem[:-1] + "y", 0))
        results.append((stem, 2))
    elif has_double:
        results.append((stem[:-1], 1))
        results.append((stem, 2))
    else:
        results.append((stem, 0))

    if has_iy and has_double:
        results.append((stem[:-2] + "y", 0))

    return results


def find_suffix_candidates(word, word_set):
    """Return list of (candidate, quality) tuples from suffix stripping.
    quality = replacement_cost + stem_variant_delta
    """
    results = []
    for suffix, min_stem, replacements in SUFFIX_RULES:
        if not word.endswith(suffix):
            continue
        raw_stem = word[:-len(suffix)]
        if len(raw_stem) < min_stem:
            continue
        variants = stem_variants(raw_stem)
        for repl in replacements:
            repl_cost = 0 if repl == "" else 2
            for stem, qdelta in variants:
                quality = repl_cost + qdelta
                candidate = stem + repl
                if candidate in word_set and candidate != word and len(candidate) < len(word):
                    results.append((candidate, quality))
    return results


def find_prefix_candidates(word, word_set):
    results = []
    for prefix, min_remaining in PREFIX_RULES:
        if word.startswith(prefix) and len(word) - len(prefix) >= min_remaining:
            base = word[len(prefix):]
            if base in word_set and base != word:
                results.append((base, 0))
    return results


def lemmatize_candidates(word, word_set):
    results = []
    for pos in ("n", "v", "a", "r", "s"):
        lemma = wnl.lemmatize(word, pos)
        if lemma != word and lemma in word_set:
            results.append((lemma, 0))
    return results


def pick_best(candidates, word):
    """
    Pick the best parent from candidates list of (candidate, quality).
    Strategy: lowest quality wins; ties broken by longest candidate
    (most conservative derivation), then by longest shared subsequence.
    """
    if not candidates:
        return None

    def overlap(a, b):
        """Count of characters in common (unordered)."""
        from collections import Counter
        ca, cb = Counter(a), Counter(b)
        return sum((ca & cb).values())

    def sort_key(item):
        cand, quality = item
        return (quality, -len(cand), -overlap(cand, word))

    candidates.sort(key=sort_key)
    return candidates[0][0]


def main():
    print("Loading words.json …")
    with open("data/words.json") as f:
        data = json.load(f)
    words = data["words"]
    word_set = set(words)
    print(f"  Loaded {len(words):,} words.")

    # ── Phase 1: build immediate-parent map ──────────────────────────
    print("Phase 1 – finding immediate parents …")
    parent = {}
    count = 0
    for w in words:
        if len(w) <= 1:
            parent[w] = w
            continue

        candidates = []
        candidates.extend(lemmatize_candidates(w, word_set))
        candidates.extend(find_suffix_candidates(w, word_set))
        candidates.extend(find_prefix_candidates(w, word_set))

        chosen = pick_best(candidates, w)
        parent[w] = chosen if chosen else w

        count += 1
        if count % 50000 == 0:
            print(f"  … processed {count:,} / {len(words):,}")

    derived_count = sum(1 for w in words if parent.get(w, w) != w)
    print(f"  Phase 1 complete. {derived_count:,} words have a parent.")

    # ── Phase 2: chase parent chains to ultimate root ────────────────
    print("Phase 2 – resolving root chains …")
    root_cache = {}
    sys.setrecursionlimit(10000)

    def get_root(w, visited=None):
        if w in root_cache:
            return root_cache[w]
        if visited is None:
            visited = set()
        if w in visited:
            root_cache[w] = w
            return w
        visited.add(w)
        p = parent.get(w, w)
        if p == w:
            root_cache[w] = w
            return w
        r = get_root(p, visited)
        root_cache[w] = r
        return r

    for w in words:
        get_root(w)

    # ── Phase 3: build lineage chains ────────────────────────────────
    print("Phase 3 – building lineage chains …")

    def get_chain(w):
        chain = [w]
        seen = {w}
        current = w
        while parent.get(current, current) != current:
            current = parent[current]
            if current in seen:
                break
            seen.add(current)
            chain.append(current)
        return chain

    word_to_root = {}
    root_words_set = set()

    for w in words:
        chain = get_chain(w)
        root = chain[-1]
        root_words_set.add(root)
        word_to_root[w] = {
            "root": root,
            "chain": chain,
        }

    print(f"  Identified {len(root_words_set):,} root words.")

    # ── Phase 4: write output files ──────────────────────────────────
    print("Writing root words.json …")
    root_words_list = sorted(root_words_set)
    root_words_data = {
        "source": "derived from dwyl/english-words via morphological analysis",
        "count": len(root_words_list),
        "words": root_words_list,
    }
    with open("data/root words.json", "w") as f:
        json.dump(root_words_data, f, indent=2)
    print(f"  Wrote {len(root_words_list):,} root words.")

    print("Writing word-to-root.json …")
    word_to_root_data = {
        "source": "morphological mapping of dwyl/english-words to root words",
        "total_words": len(words),
        "total_roots": len(root_words_list),
        "mappings": word_to_root,
    }
    with open("data/word-to-root.json", "w") as f:
        json.dump(word_to_root_data, f, indent=2)
    print(f"  Wrote mappings for {len(word_to_root):,} words.")

    # ── Summary ──────────────────────────────────────────────────────
    chain_lengths = [len(v["chain"]) for v in word_to_root.values()]
    max_chain = max(chain_lengths)
    avg_chain = sum(chain_lengths) / len(chain_lengths)
    self_rooted = sum(1 for v in word_to_root.values() if len(v["chain"]) == 1)
    print(f"\n  Summary:")
    print(f"    Total words:     {len(words):,}")
    print(f"    Root words:      {len(root_words_list):,}")
    print(f"    Self-rooted:     {self_rooted:,}")
    print(f"    Max chain depth: {max_chain}")
    print(f"    Avg chain depth: {avg_chain:.2f}")

    # Spot-check important words
    print("\n  Spot checks:")
    checks = [
        "running", "runner", "runners", "happiness", "unhappily",
        "beautiful", "beautifully", "walking", "walked", "walker", "walkers",
        "unbreakable", "misunderstanding", "predetermined", "overreaction",
        "disconnected", "playfulness", "adventurous", "nationalize",
        "democratically", "environmentalism", "abandonment",
        "abased", "abasement", "stand", "nation", "advent",
        "lovingly", "rewriting", "impossibility", "strengthened",
        "understanding", "singer", "singing", "kindness",
        "thoughtfully", "fearlessness", "irregularity",
    ]
    for w in checks:
        if w in word_to_root:
            info = word_to_root[w]
            print(f"    {' -> '.join(info['chain'])}")

    print("\n  Example chains (depth > 2):")
    examples = [w for w in words if len(word_to_root[w]["chain"]) > 2][:20]
    for w in examples:
        print(f"    {' -> '.join(word_to_root[w]['chain'])}")

    print("\nDone.")


if __name__ == "__main__":
    main()
