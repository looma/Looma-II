/*
 * Name: Skip
Email: skip@stritter.com
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2015 03
Revision: Looma 2.0.0

filename: modifier.js
         (previously looma-map-leaflet.js)
Description:
 */

'use strict';

var width = 1200,
    height = 720;

$(document).ready(function() {
//Leaflet demonstration


    var streetMap = L.map('streetMap',
            { center : [27.7, 85.3],
                zoom : 12, minZoom: 12, maxZoom: 18,
                maxBounds: L.latLngBounds(L.latLng(27.5545,85.1247), L.latLng(27.8372,85.5154)),
                fullscreenControl: true,
                fullscreenControlOptions: {position: 'topleft'}});
L.tileLayer('../content/maps/streetMap/{z}/{x}/{y}.png').addTo(streetMap);


    var legend = L.control({position: 'bottomright'});

    legend.onAdd = function (streetMap) {
        var element = L.DomUtil.create('div', 'street-legend info legend');

        element.innerHTML = '<span style="color:#BFB">\u2589</span>' + "Park"+ '<br />' +
    '<span style="color:#B8ED9B">\u2589</span>' + "Farm" + '<br />' +
    '<span style="color:#E6CCB6">\u2589</span>' + "Residential" + '<br />' +
    '<span style="color:#B6E6D1">\u2589</span>' + "Sport" + '<br />' +
    '<span style="color:#BECEC7">\u2589</span>' + "Industrial" + '<br />' +
    '<span style="color:#4e75c3">\u2589</span>' + "Water" + '<br/>' +

    '<span style="color:#ff7d88">\u2501</span>' + "Main roads" + '<br />' +
    '<span style="color:#ffa27c">\u2501</span>' + "Secondary roads" + '<br />' +
    '<span style="color:#ca8eff">\u2509</span>' + "Railways" + '<br />' ;

        return element;

    };
    legend.addTo(streetMap);
});
