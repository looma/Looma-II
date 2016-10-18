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



    var worldMap = L.map('worldMap',
            { center : [28.2, 84.2],
                zoom : 2 , minZoom: 2, maxZoom: 9,
                //maxBounds: L.latLngBounds(L.latLng(24,77.5), L.latLng(32,91.5)),
                fullscreenControl: true,
                fullscreenControlOptions: {position: 'topleft'}});
L.tileLayer('../content/maps/en-worldmap/tile/{z}/{x}/{y}.jpg').addTo(worldMap);

});
