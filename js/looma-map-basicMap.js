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
    var basicMap = L.map('basicMap',
            { center: [28.2, 84],
                  zoom: 7, minZoom: 7, maxZoom: 10,
                maxBounds: L.latLngBounds(L.latLng(24,77), L.latLng(33, 91.5)),
                fullscreenControl: true,
                fullscreenControlOptions: {position: 'topleft'}});
L.tileLayer('../content/maps/basicMap/{z}/{x}/{y}.png').addTo(basicMap);


    var basLegend = L.control({position: 'bottomright'});

    basLegend.onAdd = function (basicMap) {
        var element = L.DomUtil.create('div', 'basLegend info legend');

        element.innerHTML = '<span style="color:rgba(130, 139, 139, .8)">\u2589</span>' + "Commercial" + '<br />' +
    '<span style="color:rgba(85, 122, 86, .8)">\u2589</span>' + "Farm" + '<br />' +
    '<span style="color:rgba(141, 171, 184, .8)">\u2589</span>' + "Military" + '<br />' +
    '<span style="color:rgba(161, 145, 129, .8)">\u2589</span>' + "Residential" + '<br />';


        return element;

    };
    basLegend.addTo(basicMap);


});
