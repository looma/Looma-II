"""Preeti-family (legacy 8-bit Nepali) -> Unicode Devanagari.

The mapping tables are read straight out of Looma/js/looma.js (PreetiToUnicode)
rather than copied, so the build and the platform can never drift apart.

Note the JS map_to_unicode() applies its post-rules to the *unmapped* word and
then throws the result away, so they never actually run there. They are applied
properly here - without them the reordering rules (i-matra before its consonant,
"र्" handling, and so on) are lost and the output is wrong.
"""
import json
import os
import re

LOOMA_JS = r"d:\Vasco\Career\Projects\Looma\Looma\Looma\js\looma.js"

_TOKEN = re.compile(r"\s+|\S+")


def load_maps(path=LOOMA_JS):
    src = open(path, encoding="utf-8").read()
    m = re.search(r"var PreetiToUnicode = (\{.*?\});?\s*\n", src, re.S)
    if not m:
        raise RuntimeError("PreetiToUnicode table not found in %s" % path)
    raw = json.loads(m.group(1))
    out = {}
    for name, spec in raw.items():
        rules = spec["rules"]
        out[_key(name)] = {
            "cmap": rules["character-map"],
            "post": [(re.compile(a), b.replace("\\1", r"\1").replace("\\2", r"\2")
                      .replace("\\3", r"\3"))
                     for a, b in rules["post-rules"]],
        }
    return out


def _key(name):
    return re.sub(r"[^a-z]", "", (name or "").lower())


# PDF font names that mean "legacy 8-bit Nepali". Anything matching this but not
# resolvable to a table is text we must NOT render as characters.
LEGACY = re.compile(r"preeti|kantipur|himali|sagarmatha|pcs.?nepali|fontasy|"
                    r"ganes[hs]|sumod|aakriti|navjeevan", re.I)

# a few aliases so the PDF's font name finds the right table
ALIAS = {
    "preetibold": "preeti", "preetiblack": "preeti", "genpreeti": "preeti",
    "himalli": "fontasyhimalitt", "fontasyhimali": "fontasyhimalitt",
    "pcsnepali": "pcsnepali",
}


def resolve(font_name, maps):
    """-> (table or None, is_legacy). table None + legacy True means unmappable."""
    n = (font_name or "").split("+")[-1]
    if not LEGACY.search(n):
        return None, False
    k = _key(n)
    for suffix in ("bold", "italic", "regular", "black", "light", "mt", "ps"):
        k = k.removesuffix(suffix)
    k = ALIAS.get(k, k)
    if k in maps:
        return maps[k], True
    for cand in maps:
        if k.startswith(cand) or cand.startswith(k):
            return maps[cand], True
    return None, True


def convert(text, table):
    cmap, post = table["cmap"], table["post"]
    out = []
    for tok in _TOKEN.findall(text):
        if tok.isspace():
            out.append(tok)
            continue
        w = "".join(cmap.get(c, c) for c in tok)
        for pat, rep in post:
            w = pat.sub(rep, w)
        out.append(w)
    return "".join(out)


if __name__ == "__main__":
    maps = load_maps()
    t, _ = resolve("BLZDLW+Preeti", maps)
    for s in ("g]kfn", "sIff", "ljBfno"):
        print(s, "->", convert(s, t))
