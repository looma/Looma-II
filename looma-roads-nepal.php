<!doctype html>
<!--
Filename: looma-roads-nepal.php
Description: "Roads of Nepal" map. Fully offline. Renders Nepal's major road
             network (trunk / primary / secondary) as red lines on top of a
             filled Nepal outline built from the province polygons. No tile
             layer, no external requests — data lives in /data/ alongside the
             app and is served by the same Apache instance.
             Uses Leaflet 1.7.1.
-->

<?php
    $page_title = 'Roads of Nepal';
    include('includes/header.php');
    logPageHit('map');
?>

<link rel="stylesheet" href="js/leafletjs1.7.1/leaflet.css">
<link rel="stylesheet" href="css/looma.css">

<style>
    #main-container-horizontal { position: relative; overflow: hidden; }
    #map {
        width: 100%;
        height: calc(90vh - 90px);   /* container is 9/10 of viewport; subtract the title rows */
        min-height: 350px;
        background: #cfe6f0; /* pale blue "beyond Nepal" so land vs ocean reads clearly */
    }
    .roads-legend {
        background: rgba(255, 255, 255, 0.92);
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 13px;
        line-height: 1.6;
        box-shadow: 0 1px 3px rgba(0,0,0,0.25);
        color: #1a1a1a;
    }
    .roads-legend b { color: #b0281c; }
    .roads-legend .swatch {
        display: inline-block; width: 22px; height: 3px;
        vertical-align: middle; margin-right: 6px;
    }
    .looma-country-tooltip {
        font-weight: bold;
    }
    /* Small in-map search widget (top-left). Searches provinces + named roads. */
    .roads-search {
        background: rgba(255,255,255,0.98);
        padding: 4px;
        border-radius: 6px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.25);
        max-width: 260px;
    }
    .roads-search-input {
        width: 200px; height: 32px;
        padding: 4px 10px;
        font-size: 14px;
        border: 1px solid #ccc;
        border-radius: 4px;
        color: #1a1a1a;
        background: #fff;
        box-sizing: border-box;
        outline: none;
    }
    .roads-search-input:focus {
        border-color: #b0281c;
        box-shadow: 0 0 0 2px rgba(176, 40, 28, 0.15);
    }
    .roads-search-results {
        list-style: none;
        margin: 4px 0 0 0;
        padding: 0;
        max-height: 240px;
        overflow-y: auto;
        background: #fff;
        border: 1px solid #ddd;
        border-radius: 4px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.15);
        color: #1a1a1a;
        font-size: 13px;
    }
    .roads-search-results li {
        padding: 5px 10px;
        cursor: pointer;
        border-bottom: 1px solid #f0f0f0;
    }
    .roads-search-results li:last-child { border-bottom: none; }
    .roads-search-results li:hover { background: #f4f6fa; color: #b0281c; }
    .roads-search-results .kind {
        font-size: 11px;
        color: #888;
        margin-left: 6px;
    }
</style>

</head>
<body>
<div id="main-container-horizontal">
    <h1 class="title">Roads of Nepal</h1>
    <h1 class="credit">Road data © OpenStreetMap contributors</h1>
    <div id="map"></div>
</div>

<?php include('includes/toolbar.php'); ?>
<?php include('includes/js-includes.php'); ?>
<script src="js/leafletjs1.7.1/leaflet.js"></script>

<script>
window.addEventListener('load', function () {
    var map = L.map('map', {
        center: [28.4, 84.1],
        zoom: 7,
        minZoom: 6,
        maxZoom: 12,
        zoomSnap: 0.25,
        zoomDelta: 0.5,
        wheelPxPerZoomLevel: 120
    });
    map.setMaxBounds(L.latLngBounds(L.latLng(25.5, 78), L.latLng(31.5, 91.5)));

    // Load the two local GeoJSON files in parallel, then draw provinces first
    // (as the land fill) and roads on top.
    var provincesPromise = fetch('data/nepal-provinces.min.json').then(function (r) { return r.json(); });
    var roadsPromise     = fetch('data/nepal-roads.geojson').then(function (r) { return r.json(); });

    // Layer refs kept in scope so the search widget can jump to matches.
    var provincesLayer = null;
    var roadsLayer = null;
    // Search index: [{name, kind: 'province'|'road', layer}]. Named roads
    // are deduped — 8k line features boil down to ~874 unique names, so
    // clicking a result jumps to the first segment with that name.
    var searchIndex = [];

    provincesPromise.then(function (provincesGeo) {
        var provinceHover = { fillColor: '#f2ead0', color: '#8a5a2a', weight: 2, fillOpacity: 1 };
        var provinceDefault = { fillColor: '#f7efd7', color: '#b8964b', weight: 1.5, fillOpacity: 1 };
        provincesLayer = L.geoJSON(provincesGeo, {
            style: function () { return provinceDefault; },
            onEachFeature: function (feature, layer) {
                var props = feature.properties || {};
                // The shipped GeoJSON stores the province name in `title`
                // (e.g. "Koshi Pradesh", "Bagmati Pradesh"). Nepali script is in `Nepali`.
                var english = props.title || props.PROVINCE_1 || props.province || props.name || props.NAME || 'Province';
                var nepali = props.Nepali || '';
                var label = nepali ? english + ' — ' + nepali : english;
                layer.bindTooltip(label, { sticky: true, direction: 'auto', className: 'looma-country-tooltip' });
                layer.on({
                    mouseover: function (e) { e.target.setStyle(provinceHover); },
                    mouseout:  function (e) { provincesLayer.resetStyle(e.target); }
                });
                if (english) searchIndex.push({ name: english, kind: 'province', layer: layer });
            }
        }).addTo(map);

        // Once provinces are down, roads on top.
        return roadsPromise.then(function (roadsGeo) {
            // Different visual weights per road class — trunk is thickest.
            var styles = {
                trunk:     {color: '#c02020', weight: 3.0, opacity: 0.95},
                primary:   {color: '#e05a1a', weight: 2.2, opacity: 0.9},
                secondary: {color: '#b8894f', weight: 1.4, opacity: 0.85}
            };
            var seenRoadNames = {};
            roadsLayer = L.geoJSON(roadsGeo, {
                style: function (feature) {
                    var cls = (feature.properties && feature.properties.highway) || 'secondary';
                    return styles[cls] || styles.secondary;
                },
                onEachFeature: function (feature, layer) {
                    var p = feature.properties || {};
                    var label = [p.name, p.ref].filter(Boolean).join(' — ');
                    if (label) layer.bindTooltip(label, { sticky: true, direction: 'auto' });
                    if (p.name && !seenRoadNames[p.name.toLowerCase()]) {
                        seenRoadNames[p.name.toLowerCase()] = true;
                        searchIndex.push({ name: p.name, kind: 'road', layer: layer });
                    }
                }
            }).addTo(map);
        });
    }).catch(function (err) {
        console.error('[roads-nepal] failed to load data:', err);
        document.getElementById('map').innerHTML =
            '<div style="padding:20px;color:#b00;">Could not load Nepal roads data. ' +
            'Expected files at <code>data/nepal-roads.geojson</code> and ' +
            '<code>data/nepal-provinces.min.json</code>.</div>';
    });

    // Legend.
    var legend = L.control({ position: 'bottomright' });
    legend.onAdd = function () {
        var div = L.DomUtil.create('div', 'roads-legend');
        div.innerHTML =
            '<b>Roads of Nepal</b><br>' +
            '<span class="swatch" style="background:#c02020;height:3px;"></span> Trunk<br>' +
            '<span class="swatch" style="background:#e05a1a;height:2px;"></span> Primary<br>' +
            '<span class="swatch" style="background:#b8894f;height:1.5px;"></span> Secondary';
        return div;
    };
    legend.addTo(map);

    // Search widget — top-left, small. Indexes 7 provinces + ~874 unique
    // road names. Matches by substring, prefix ranks higher.
    var searchControl = L.control({ position: 'topleft' });
    searchControl.onAdd = function () {
        var wrap = L.DomUtil.create('div', 'roads-search leaflet-bar');
        wrap.innerHTML =
            '<input type="text" class="roads-search-input" placeholder="Search provinces / roads…" autocomplete="off" spellcheck="false" />' +
            '<ul class="roads-search-results" hidden></ul>';
        L.DomEvent.disableClickPropagation(wrap);
        L.DomEvent.disableScrollPropagation(wrap);
        var input = wrap.querySelector('input');
        var list  = wrap.querySelector('ul');

        // Persistent-highlight state, so a fresh search clears the last one
        // instead of stacking styles.
        var lastHighlight = null;
        var lastHighlightPrior = null;
        var lastHighlightLayer = null; // 'provinces' or 'roads' — for resetStyle
        function clearHighlight() {
            if (!lastHighlight) return;
            try {
                var parentLayer = lastHighlightLayer === 'provinces' ? provincesLayer : roadsLayer;
                if (parentLayer && parentLayer.resetStyle) parentLayer.resetStyle(lastHighlight);
                else if (lastHighlightPrior) lastHighlight.setStyle(lastHighlightPrior);
            } catch(_) {}
            lastHighlight = null; lastHighlightPrior = null; lastHighlightLayer = null;
        }

        function focusMatch(rec) {
            if (!rec || !rec.layer) return;
            // Per Skip's review: do NOT change the map view. Just highlight
            // the matched feature in place so students can find it visually.
            clearHighlight();
            if (rec.kind === 'province') {
                try {
                    lastHighlightPrior = {
                        weight: (rec.layer.options && rec.layer.options.weight),
                        color: (rec.layer.options && rec.layer.options.color),
                        fillColor: (rec.layer.options && rec.layer.options.fillColor),
                        fillOpacity: (rec.layer.options && rec.layer.options.fillOpacity)
                    };
                } catch(_) { lastHighlightPrior = null; }
                try {
                    rec.layer.setStyle({ weight: 4, color: '#ffb400', fillColor: '#ffe680', fillOpacity: 0.6 });
                    lastHighlight = rec.layer;
                    lastHighlightLayer = 'provinces';
                } catch(_) {}
                if (rec.layer.openTooltip) try { rec.layer.openTooltip(); } catch(_) {}
            } else { // road
                try {
                    lastHighlightPrior = {
                        weight: (rec.layer.options && rec.layer.options.weight),
                        color: (rec.layer.options && rec.layer.options.color),
                        opacity: (rec.layer.options && rec.layer.options.opacity)
                    };
                } catch(_) { lastHighlightPrior = null; }
                try {
                    rec.layer.setStyle({ weight: 6, color: '#ffb400', opacity: 1 });
                    lastHighlight = rec.layer;
                    lastHighlightLayer = 'roads';
                } catch(_) {}
                if (rec.layer.openTooltip) try { rec.layer.openTooltip(); } catch(_) {}
            }
        }

        // Clear the highlight when the user clicks the empty map.
        map.on('click', clearHighlight);

        function runSearch() {
            var q = input.value.trim().toLowerCase();
            if (!q) { list.hidden = true; return null; }
            var matches = searchIndex.filter(function (r) {
                return r.name.toLowerCase().indexOf(q) !== -1;
            });
            matches.sort(function (a, b) {
                var ai = a.name.toLowerCase().indexOf(q);
                var bi = b.name.toLowerCase().indexOf(q);
                if (ai !== bi) return ai - bi;
                // Provinces before roads if same prefix.
                if (a.kind !== b.kind) return a.kind === 'province' ? -1 : 1;
                return a.name.length - b.name.length;
            });
            list.innerHTML = '';
            if (!matches.length) { list.hidden = true; return null; }
            matches.slice(0, 8).forEach(function (rec) {
                var li = L.DomUtil.create('li', '', list);
                li.innerHTML = rec.name + '<span class="kind">' + rec.kind + '</span>';
                L.DomEvent.on(li, 'click', function () {
                    list.hidden = true;
                    input.value = rec.name;
                    input.blur();
                    focusMatch(rec);
                });
            });
            list.hidden = false;
            return matches[0];
        }

        L.DomEvent.on(input, 'input', runSearch);
        L.DomEvent.on(input, 'keydown', function (e) {
            if (e.keyCode === 13) {
                var top = runSearch();
                if (top) { list.hidden = true; input.value = top.name; input.blur(); focusMatch(top); }
            } else if (e.keyCode === 27) {
                input.value = ''; list.hidden = true; input.blur();
            }
        });
        L.DomEvent.on(input, 'focus', function () { if (input.value.trim()) runSearch(); });
        return wrap;
    };
    searchControl.addTo(map);

    if (typeof toolbar_button_activate === 'function') toolbar_button_activate('maps');
});
</script>

</body>
</html>
