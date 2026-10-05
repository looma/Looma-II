#!/usr/bin/env python3
"""
Build data/nepal-rivers.geojson for the Nepal Map "Rivers" toggle.

Run once, on a machine with internet, to (re)generate the file. Looma itself
never goes online: the map only reads the generated local file.

Input: OpenStreetMap rivers in Nepal, saved from the Overpass API:
    [out:json][timeout:300];
    area["ISO3166-1"="NP"][admin_level=2]->.np;
    way["waterway"="river"](area.np);
    out tags geom;
  e.g. curl -A "Looma" --data-urlencode data@query.txt \
         https://overpass-api.de/api/interpreter -o osm-rivers.json

Usage: python3 build-nepal-rivers.py osm-rivers.json ../data/nepal-rivers.geojson

Output: one Feature per river (MultiLineString), properties:
    name, name_ne (Nepali, if known), length_km, rank (1 = major, 2, 3 = minor)
Data (c) OpenStreetMap contributors, ODbL.
"""
import json, math, re, sys

TOLERANCE = 0.0008   # Douglas-Peucker tolerance in degrees (~80 m)
DECIMALS = 4         # ~11 m precision
MIN_KM = 3           # drop tiny named fragments
JOIN_KM = 3          # join same-name pieces whose ends are this close

# The big river systems of Nepal always draw as rank 1, whatever their length.
MAJOR = re.compile(r'\b(koshi|kosi|arun|tamor|gandaki|narayani|trishuli|marsyangdi|seti|karnali|'
                   r'bheri|mahakali|kali|rapti|bagmati|kamala|babai|budhi|tamakoshi|dudh)\b', re.I)
DEVANAGARI = re.compile(r'[ऀ-ॿ]')


def km(a, b):
    lat = math.radians((a[1] + b[1]) / 2)
    return math.hypot((b[0] - a[0]) * math.cos(lat), b[1] - a[1]) * 111.32


def simplify(pts):
    if len(pts) < 3:
        return pts
    keep = [False] * len(pts)
    keep[0] = keep[-1] = True
    stack = [(0, len(pts) - 1)]
    while stack:
        s, e = stack.pop()
        (x1, y1), (x2, y2) = pts[s], pts[e]
        dx, dy = x2 - x1, y2 - y1
        norm = math.hypot(dx, dy) or 1e-12
        best, idx = 0, -1
        for i in range(s + 1, e):
            d = abs(dy * pts[i][0] - dx * pts[i][1] + x2 * y1 - y2 * x1) / norm
            if d > best:
                best, idx = d, i
        if best > TOLERANCE:
            keep[idx] = True
            stack += [(s, idx), (idx, e)]
    return [p for p, k in zip(pts, keep) if k]


def names(tags):
    en = tags.get('name:en') or ''
    raw = tags.get('name') or ''
    ne = tags.get('name:ne') or (raw if DEVANAGARI.search(raw) else '')
    if not en:
        en = raw if raw and not DEVANAGARI.search(raw) else ''
    return en.strip(), ne.strip()


def name_key(en):
    # "Kali Gandaki River" / "Kali Gandaki" / "Kali Gandaki Nadi" -> "kali gandaki"
    return re.sub(r'\s+(river|nadi|nadee|khola)$', '', en.lower().strip())


def line_km(pts):
    return sum(km(a, b) for a, b in zip(pts, pts[1:]))


def main(src, dst):
    ways = json.load(open(src))['elements']
    # Group ways by (normalized) name, then split each name into connected
    # pieces so two different "Seti Khola"s far apart don't highlight together.
    by_name = {}
    for w in ways:
        en, ne = names(w.get('tags', {}))
        if not en or not w.get('geometry'):
            continue
        pts = [(g['lon'], g['lat']) for g in w['geometry']]
        by_name.setdefault(name_key(en), []).append((pts, ne, en))

    features = []
    for items in by_name.values():
        parent = list(range(len(items)))

        def find(i):
            while parent[i] != i:
                parent[i] = parent[parent[i]]
                i = parent[i]
            return i
        # Two ways belong to the same river if an end of one comes within
        # ~JOIN_KM of any point of the other (shared nodes, small gaps, or a
        # braided channel rejoining mid-river).
        cell = 0.01
        grid = {}
        for i, (pts, _, _) in enumerate(items):
            for p in pts:
                grid.setdefault((int(p[0] // cell), int(p[1] // cell)), set()).add(i)
        for i, (pts, _, _) in enumerate(items):
            for p in (pts[0], pts[-1]):
                cx, cy = int(p[0] // cell), int(p[1] // cell)
                for dx in (-1, 0, 1):
                    for dy in (-1, 0, 1):
                        for j in grid.get((cx + dx, cy + dy), ()):
                            if j != i and find(i) != find(j) and \
                                    min(km(p, q) for q in items[j][0]) <= JOIN_KM:
                                parent[find(i)] = find(j)
        groups = {}
        for i in range(len(items)):
            groups.setdefault(find(i), []).append(items[i])

        for group in groups.values():
            length = sum(line_km(pts) for pts, _, _ in group)
            if length < MIN_KM:
                continue
            # Display name: the spelling used by the most kilometres of river.
            spellings = {}
            for pts, _, n in group:
                spellings[n] = spellings.get(n, 0) + line_km(pts)
            en = max(spellings, key=spellings.get)
            lines = []
            for pts, _, _ in group:
                s = [[round(x, DECIMALS), round(y, DECIMALS)] for x, y in simplify(pts)]
                s = [p for i, p in enumerate(s) if i == 0 or p != s[i - 1]]
                if len(s) >= 2:
                    lines.append(s)
            if not lines:
                continue
            ne = next((n for _, n, _ in group if n), "")
            rank = 1 if (MAJOR.search(en) and length >= 40) or length >= 150 else (2 if length >= 40 else 3)
            props = {'name': en, 'length_km': round(length), 'rank': rank}
            if ne:
                props['name_ne'] = ne
            features.append({'type': 'Feature', 'properties': props,
                             'geometry': {'type': 'MultiLineString', 'coordinates': lines}})

    # Minor rivers first so major rivers draw on top.
    features.sort(key=lambda f: (-f['properties']['rank'], f['properties']['length_km']))
    out = {'type': 'FeatureCollection',
           'attribution': 'River data (c) OpenStreetMap contributors, ODbL',
           'features': features}
    with open(dst, 'w') as f:
        json.dump(out, f, ensure_ascii=False, separators=(',', ':'))
    ranks = [f['properties']['rank'] for f in features]
    print('%d rivers (rank1 %d, rank2 %d, rank3 %d) -> %s' %
          (len(features), ranks.count(1), ranks.count(2), ranks.count(3), dst))


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
