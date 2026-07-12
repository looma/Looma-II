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

    provincesPromise.then(function (provincesGeo) {
        var provinceHover = { fillColor: '#f2ead0', color: '#8a5a2a', weight: 2, fillOpacity: 1 };
        var provinceDefault = { fillColor: '#f7efd7', color: '#b8964b', weight: 1.5, fillOpacity: 1 };
        var provinces = L.geoJSON(provincesGeo, {
            style: function () { return provinceDefault; },
            onEachFeature: function (feature, layer) {
                var props = feature.properties || {};
                var name = props.PROVINCE_1 || props.province || props.name || props.NAME || 'Province';
                layer.bindTooltip('' + name, { sticky: true, direction: 'auto', className: 'looma-country-tooltip' });
                layer.on({
                    mouseover: function (e) { e.target.setStyle(provinceHover); },
                    mouseout:  function (e) { provinces.resetStyle(e.target); }
                });
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
            L.geoJSON(roadsGeo, {
                style: function (feature) {
                    var cls = (feature.properties && feature.properties.highway) || 'secondary';
                    return styles[cls] || styles.secondary;
                },
                onEachFeature: function (feature, layer) {
                    var p = feature.properties || {};
                    var label = [p.name, p.ref].filter(Boolean).join(' — ');
                    if (label) layer.bindTooltip(label, { sticky: true, direction: 'auto' });
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

    if (typeof toolbar_button_activate === 'function') toolbar_button_activate('maps');
});
</script>

</body>
</html>
