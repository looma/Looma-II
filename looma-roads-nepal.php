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
    // Search index. Road entries group ALL segments that share the same name
    // — the road network geojson breaks a single named road into many line
    // features, so "Prithvi Highway" is really ~40 segments that must all
    // highlight together when the user selects it. Provinces are 1:1.
    // Shape: [{ name, kind: 'province', layer } | { name, kind: 'road', layers[] }]
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
            // roadIndexByName: name.toLowerCase() -> { name, kind:'road', layers[] }
            // The same object is stored in searchIndex so the search widget
            // sees all segments together.
            var roadIndexByName = {};
            roadsLayer = L.geoJSON(roadsGeo, {
                style: function (feature) {
                    var cls = (feature.properties && feature.properties.highway) || 'secondary';
                    return styles[cls] || styles.secondary;
                },
                onEachFeature: function (feature, layer) {
                    var p = feature.properties || {};
                    var label = [p.name, p.ref].filter(Boolean).join(' — ');
                    if (label) layer.bindTooltip(label, { sticky: true, direction: 'auto' });
                    if (p.name) {
                        var key = p.name.toLowerCase();
                        if (!roadIndexByName[key]) {
                            roadIndexByName[key] = { name: p.name, kind: 'road', layers: [] };
                            searchIndex.push(roadIndexByName[key]);
                        }
                        roadIndexByName[key].layers.push(layer);
                    }
                    // Clicking any single road segment selects the whole road.
                    layer.on('click', function (e) {
                        L.DomEvent.stopPropagation(e);
                        if (p.name) {
                            focusMatch(roadIndexByName[p.name.toLowerCase()]);
                        } else {
                            // Unnamed road — just flash this segment.
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

        // Persistent-highlight state. For both provinces AND roads we
        // mutate the layer's style directly and rely on resetStyle to
        // restore — this is safe because the roadsLayer's style function
        // is deterministic (uses feature.properties.highway), so resetStyle
        // always brings a segment back to its original trunk/primary/
        // secondary color. Same for provinces.
        var lastHighlightLayers = [];   // provinces or road segments
        var lastHighlightKind = null;   // 'province' | 'road'
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
                    rec.layer.setStyle({ weight: 4, color: '#ffb400', fillColor: '#ffe680', fillOpacity: 0.6 });
                    lastHighlightLayers = [rec.layer];
                    lastHighlightKind = 'province';
                } catch(_) {}
                if (rec.layer.openTooltip) try { rec.layer.openTooltip(); } catch(_) {}
            } else if (rec.kind === 'road' && rec.layers && rec.layers.length) {
                // Recolor EVERY segment sharing this name to bright yellow.
                // resetStyle on cleanup brings each segment back to its
                // trunk/primary/secondary color via the roads style function.
                rec.layers.forEach(function (lyr) {
                    try {
                        lyr.setStyle({
                            color: '#ffea00',
                            weight: 8,
                            opacity: 1
                        });
                        if (typeof lyr.bringToFront === 'function') lyr.bringToFront();
                    } catch(_) {}
                });
                lastHighlightLayers = rec.layers.slice();
                lastHighlightKind = 'road';
                showRoadInfoPanel(rec.name, rec.layers.length);
            }
        }

        // Small top-right info panel showing the selected road's name.
        // Same DOM pattern the country info panel uses on other maps.
        var roadInfoControl = L.control({ position: 'topright' });
        var roadInfoDiv = null;
        roadInfoControl.onAdd = function () {
            var div = L.DomUtil.create('div', 'roads-info-panel leaflet-control');
            L.DomEvent.disableClickPropagation(div);
            div.style.display = 'none';
            div.innerHTML =
                '<div class="roads-info-close" title="Close">×</div>' +
                '<div class="roads-info-label">Selected road</div>' +
                '<div class="roads-info-name"></div>' +
                '<div class="roads-info-segments"></div>';
            div.querySelector('.roads-info-close').addEventListener('click', function () {
                clearHighlight();
            });
            roadInfoDiv = div;
            return div;
        };
        roadInfoControl.addTo(map);
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

        // Clicking empty map clears the highlight and closes the panel.
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
