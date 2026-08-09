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
        background: #091F48; /* Looma blue — consistent with the other maps */
    }
    /* Legend enlarged 2x for classroom projection. */
    .roads-legend {
        background: rgba(255, 255, 255, 0.94);
        padding: 16px 24px;
        border-radius: 10px;
        font-size: 26px;
        line-height: 1.6;
        box-shadow: 0 2px 6px rgba(0,0,0,0.28);
        color: #1a1a1a;
    }
    .roads-legend b { color: #b0281c; font-size: 30px; }
    .roads-legend .swatch {
        display: inline-block; width: 44px; height: 6px;
        vertical-align: middle; margin-right: 12px;
    }
    .looma-country-tooltip {
        font-weight: bold;
        font-size: 18px;
    }
    /* Search widget (top-left). Same size as the /maps search widget so
       it doesn't cover the map. Row = magnifier button + text input. */
    .roads-search {
        background: rgba(255,255,255,0.98);
        padding: 4px;
        border-radius: 6px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.25);
        max-width: 300px;
    }
    .roads-search-row {
        display: flex;
        align-items: center;
        gap: 4px;
    }
    .roads-search-btn {
        width: 34px;
        height: 34px;
        flex: 0 0 auto;
        border: 1px solid #ccc;
        border-radius: 4px;
        background-color: rgba(255,255,255,0.9);
        background-repeat: no-repeat;
        background-position: center center;
        background-size: 70% 70%;
        cursor: pointer;
        padding: 0;
        background-image: url("images/looma-search2.png");
    }
    .roads-search-btn:hover {
        background-color: #f4f6fa;
        border-color: #b0281c;
    }
    .roads-search-input {
        flex: 1 1 auto;
        width: 220px; height: 34px;
        padding: 4px 10px;
        font-size: 15px;
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
        max-height: 260px;
        overflow-y: auto;
        background: #fff;
        border: 1px solid #ddd;
        border-radius: 4px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.15);
        color: #1a1a1a;
        font-size: 14px;
    }
    .roads-search-results li {
        padding: 6px 10px;
        cursor: pointer;
        border-bottom: 1px solid #f0f0f0;
    }
    .roads-search-results li:last-child { border-bottom: none; }
    .roads-search-results li:hover { background: #f4f6fa; color: #b0281c; }
    .roads-search-results .kind {
        font-size: 12px;
        color: #888;
        margin-left: 8px;
    }
    /* Top-right info panel showing the selected road name. Positioned by
       Leaflet's control container; we just style it. */
    .roads-info-panel {
        background: rgba(255,255,255,0.98);
        padding: 10px 14px 8px 14px;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.28);
        max-width: 300px;
        color: #1a1a1a;
        font-size: 14px;
        line-height: 1.35;
        position: relative;
    }
    .roads-info-close {
        position: absolute;
        top: 4px;
        right: 8px;
        width: 20px;
        height: 20px;
        font-size: 18px;
        line-height: 18px;
        text-align: center;
        color: #888;
        cursor: pointer;
        font-weight: bold;
    }
    .roads-info-close:hover { color: #b0281c; }
    .roads-info-label {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: #888;
        margin-bottom: 2px;
    }
    .roads-info-name {
        font-size: 17px;
        font-weight: bold;
        color: #b0281c;
        padding-right: 20px;
    }
    .roads-info-segments {
        font-size: 12px;
        color: #666;
        margin-top: 4px;
    }
    /* 2x zoom controls, matching the rest of the maps. */
    .leaflet-control-zoom a {
        width: 88px !important;
        height: 88px !important;
        line-height: 88px !important;
        font-size: 52px !important;
        font-weight: bold;
    }
    .leaflet-control-zoom { border-radius: 8px !important; }
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
        wheelPxPerZoomLevel: 120,
        // Classroom touchscreens routinely register a firm tap as a double-tap;
        // Leaflet's default double-click-to-zoom then jumps to max zoom and
        // strands the user. All zooming should go through the +/- buttons.
        doubleClickZoom: false
    });
    map.setMaxBounds(L.latLngBounds(L.latLng(25.5, 78), L.latLng(31.5, 91.5)));

    // Load the two local GeoJSON files in parallel, then draw provinces first
    // (as the land fill) and roads on top.
    var provincesPromise = fetch('data/nepal-provinces.min.json').then(function (r) { return r.json(); });
    var roadsPromise     = fetch('data/nepal-roads.geojson').then(function (r) { return r.json(); });

    // Layer refs kept in scope so the search widget can jump to matches.
    var provincesLayer = null;
    var roadsLayer = null;
    // Search index. Road entries group ALL segments that share the same name
    // — the road network geojson breaks a single named road into many line
    // features, so "Prithvi Highway" is really ~40 segments that must all
    // highlight together when the user selects it. Provinces are 1:1.
    // Shape: [{ name, kind: 'province', layer } | { name, kind: 'road', layers[] }]
    var searchIndex = [];

    // Base weights per road class. Fattened for classroom projection
    // (Skip Aug 2026 review). Weights scale with zoom via zoomScale() so
    // roads stay readable when zoomed in AND when the map is small.
    var baseWeights = { trunk: 6, primary: 4.4, secondary: 3 };
    var roadColors  = { trunk: '#c02020', primary: '#e05a1a', secondary: '#b8894f' };
    // Selection color: bright red. On the previous pale-blue-ish background
    // the yellow highlight didn't read well when projected in a classroom,
    // so Skip asked for white background + red highlighting instead.
    var HIGHLIGHT_COLOR = '#ff0000';
    var HIGHLIGHT_WEIGHT_BASE = 14; // also scales with zoom
    function zoomScale() {
        // At default zoom (7) scale = 1. Each level up adds 25%, each level down loses 25%.
        var z = map.getZoom();
        return Math.max(0.6, 1 + (z - 7) * 0.25);
    }
    function baseStyleFor(feature) {
        var cls = (feature.properties && feature.properties.highway) || 'secondary';
        var scale = zoomScale();
        return {
            color: roadColors[cls] || roadColors.secondary,
            weight: (baseWeights[cls] || baseWeights.secondary) * scale,
            opacity: 0.95
        };
    }
    function highlightStyle() {
        return {
            color: HIGHLIGHT_COLOR,
            weight: HIGHLIGHT_WEIGHT_BASE * zoomScale(),
            opacity: 1
        };
    }

    // Persistent-highlight state — shared between the search widget, the
    // road-click handler, and the zoomend re-styler. Kept at module scope
    // so all three code paths see the same values.
    var lastHighlightLayers = [];   // provinces or road segments
    var lastHighlightKind = null;   // 'province' | 'road'
    var roadInfoDiv = null;         // populated when the info-panel control mounts

    function showRoadInfoPanel(name, segCount) {
        if (!roadInfoDiv) return;
        roadInfoDiv.querySelector('.roads-info-name').textContent = name;
        roadInfoDiv.querySelector('.roads-info-segments').textContent =
            segCount > 1 ? segCount + ' segments' : '';
        roadInfoDiv.style.display = 'block';
    }
    function hideRoadInfoPanel() {
        if (!roadInfoDiv) return;
        roadInfoDiv.style.display = 'none';
    }
    function clearHighlight() {
        if (lastHighlightLayers.length) {
            var parent = lastHighlightKind === 'province' ? provincesLayer : roadsLayer;
            lastHighlightLayers.forEach(function (lyr) {
                try { if (parent && parent.resetStyle) parent.resetStyle(lyr); } catch (_) {}
            });
            lastHighlightLayers = [];
        }
        lastHighlightKind = null;
        hideRoadInfoPanel();
    }
    function focusMatch(rec) {
        if (!rec) return;
        // No map view change per Skip's review — highlight in place.
        clearHighlight();
        if (rec.kind === 'province' && rec.layer) {
            try {
                rec.layer.setStyle({ weight: 4, color: HIGHLIGHT_COLOR, fillColor: '#ffd6d6', fillOpacity: 0.55 });
                lastHighlightLayers = [rec.layer];
                lastHighlightKind = 'province';
            } catch (_) {}
            if (rec.layer.openTooltip) try { rec.layer.openTooltip(); } catch (_) {}
        } else if (rec.kind === 'road' && rec.layers && rec.layers.length) {
            // Recolor every segment sharing this name to bright red.
            // resetStyle on cleanup brings each segment back to its
            // trunk/primary/secondary color via baseStyleFor.
            var hs = highlightStyle();
            rec.layers.forEach(function (lyr) {
                try {
                    lyr.setStyle(hs);
                    if (typeof lyr.bringToFront === 'function') lyr.bringToFront();
                } catch (_) {}
            });
            lastHighlightLayers = rec.layers.slice();
            lastHighlightKind = 'road';
            showRoadInfoPanel(rec.name, rec.layers.length);
        }
    }

    // Top-right info panel showing the selected road's name. Mounted eagerly
    // (before the road data loads) so the reference is stable.
    var roadInfoControl = L.control({ position: 'topright' });
    roadInfoControl.onAdd = function () {
        var div = L.DomUtil.create('div', 'roads-info-panel leaflet-control');
        L.DomEvent.disableClickPropagation(div);
        div.style.display = 'none';
        div.innerHTML =
            '<div class="roads-info-close" title="Close">×</div>' +
            '<div class="roads-info-label">Selected road</div>' +
            '<div class="roads-info-name"></div>' +
            '<div class="roads-info-segments"></div>';
        div.querySelector('.roads-info-close').addEventListener('click', clearHighlight);
        roadInfoDiv = div;
        return div;
    };
    roadInfoControl.addTo(map);

    // Re-apply road styles when the zoom level changes so weights scale.
    // Highlighted segments keep their (also-scaled) red style.
    map.on('zoomend', function () {
        if (roadsLayer) {
            try { roadsLayer.setStyle(baseStyleFor); } catch (_) {}
        }
        if (lastHighlightKind === 'road' && lastHighlightLayers.length) {
            var hs = highlightStyle();
            lastHighlightLayers.forEach(function (lyr) {
                try {
                    lyr.setStyle(hs);
                    if (typeof lyr.bringToFront === 'function') lyr.bringToFront();
                } catch (_) {}
            });
        }
    });

    // Clicking empty map clears the highlight and closes the panel.
    map.on('click', clearHighlight);

    provincesPromise.then(function (provincesGeo) {
        // Tan/beige land shapes over the Looma-blue map background so the
        // country reads clearly against the surrounding "sea".
        var provinceHover   = { fillColor: '#f2ead0', color: '#8a5a2a', weight: 2,   fillOpacity: 1 };
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
            // Road segments are indexed under two shapes so search finds
            // them regardless of what the user types:
            //  - by name (e.g. "Prithvi Highway") — primary entry
            //  - by ref  (e.g. "H01", "F26")     — for ref-only OSM roads
            //    AND as an alias for named roads that carry a route number
            // Alias entries share the same `layers[]` array as their primary,
            // so highlighting one highlights all segments of the road.
            //
            // Coverage in the shipped geojson (8,318 segments):
            //   4,276 with a name, 3,221 with only a ref, 821 with neither.
            // Previously only the 4,276 named ones were searchable.
            var roadIndex = {};  // lookup key -> record
            roadsLayer = L.geoJSON(roadsGeo, {
                style: baseStyleFor,
                onEachFeature: function (feature, layer) {
                    var p = feature.properties || {};
                    var label = [p.name, p.ref].filter(Boolean).join(' — ');
                    if (label) layer.bindTooltip(label, { sticky: true, direction: 'auto' });

                    var primaryKey = (p.name || p.ref || '').toLowerCase();
                    if (primaryKey) {
                        if (!roadIndex[primaryKey]) {
                            roadIndex[primaryKey] = {
                                name: p.name || p.ref,
                                kind: 'road',
                                layers: []
                            };
                            searchIndex.push(roadIndex[primaryKey]);
                        }
                        roadIndex[primaryKey].layers.push(layer);

                        // Alias entry so users searching by route number find
                        // the same road (and vice-versa for named roads).
                        if (p.name && p.ref) {
                            var refKey = p.ref.toLowerCase();
                            if (refKey !== primaryKey && !roadIndex[refKey]) {
                                roadIndex[refKey] = {
                                    name: p.ref + ' — ' + p.name,
                                    kind: 'road',
                                    layers: roadIndex[primaryKey].layers   // shared reference
                                };
                                searchIndex.push(roadIndex[refKey]);
                            }
                        }
                    }
                    // Clicking any single road segment selects the whole road.
                    layer.on('click', function (e) {
                        L.DomEvent.stopPropagation(e);
                        if (primaryKey && roadIndex[primaryKey]) {
                            focusMatch(roadIndex[primaryKey]);
                        } else {
                            // Unnamed and unnumbered — flash just this segment.
                            focusMatch({ name: '(unnamed road)', kind: 'road', layers: [layer] });
                        }
                    });
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

    // Legend. Swatch heights match the base road weights (defined above).
    var legend = L.control({ position: 'bottomright' });
    legend.onAdd = function () {
        var div = L.DomUtil.create('div', 'roads-legend');
        div.innerHTML =
            '<b>Roads of Nepal</b><br>' +
            '<span class="swatch" style="background:#c02020;height:6px;"></span> Trunk<br>' +
            '<span class="swatch" style="background:#e05a1a;height:5px;"></span> Primary<br>' +
            '<span class="swatch" style="background:#b8894f;height:3px;"></span> Secondary';
        return div;
    };
    legend.addTo(map);

    // Search widget — top-left. Indexes 7 provinces + ~874 unique road
    // names. Matches by substring, prefix ranks higher. Uses the shared
    // outer-scope focusMatch so click, search, and zoomend all agree on
    // the current selection.
    var searchControl = L.control({ position: 'topleft' });
    searchControl.onAdd = function () {
        var wrap = L.DomUtil.create('div', 'roads-search leaflet-bar');
        wrap.innerHTML =
            '<div class="roads-search-row">' +
                '<button type="button" class="roads-search-btn" title="Search"></button>' +
                '<input type="text" class="roads-search-input" placeholder="Search provinces / roads…" autocomplete="off" spellcheck="false" />' +
            '</div>' +
            '<ul class="roads-search-results" hidden></ul>';
        L.DomEvent.disableClickPropagation(wrap);
        L.DomEvent.disableScrollPropagation(wrap);
        var input     = wrap.querySelector('input');
        var list      = wrap.querySelector('ul');
        var searchBtn = wrap.querySelector('.roads-search-btn');

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

        // Magnifying-glass button: same as pressing Enter — jump to top match.
        L.DomEvent.on(searchBtn, 'click', function () {
            var top = runSearch();
            if (top) {
                list.hidden = true;
                input.value = top.name;
                input.blur();
                focusMatch(top);
            } else {
                input.focus();
            }
        });

        return wrap;
    };
    searchControl.addTo(map);

    if (typeof toolbar_button_activate === 'function') toolbar_button_activate('maps');
});
</script>

</body>
</html>
