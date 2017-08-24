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

    var mapDir = "../maps/";

    var zoneMap = L.map('zoneMap',
            { center : [28.2, 84.2],
                zoom : 8 , minZoom: 7, maxZoom: 10,
                maxBounds: L.latLngBounds(L.latLng(24,77.5), L.latLng(32,91.5)),
                fullscreenControl: true,
                fullscreenControlOptions: {position: 'topleft'}});
L.tileLayer(mapDir + 'zoneMap/{z}/{x}/{y}.png').addTo(zoneMap);
    
    var southWest = L.latLng(25.78, 78);
    var northEast = L.latLng(30.75, 89);
    var bounds = L.latLngBounds(southWest, northEast);
    zoneMap.setMaxBounds(bounds);
    zoneMap.on('drag', function () {
        zoneMap.panInsideBounds(bounds, {animate: false});
    });

});
