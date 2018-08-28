/*
LOOMA javascript file
Filename: looma-maps-asianCapitals.js
Description:

Programmer name:
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2017 07
Revision: Looma 3.0
 */

'use strict';

window.onload = function () {
    var map = L.map('map').setView([85.6055, 21.2894], 5);
    L.tileLayer('../maps/asianCapitals/{z}/{x}/{y}.png', {
        minZoom: 4,
        maxZoom: 9
    }).addTo(map);
    
    var southWest = L.latLng(28.2893, 84.0471);
    var northEast = L.latLng(28.1841, 83.8938);
    var bounds = L.latLngBounds(southWest, northEast);
    map.setMaxBounds(bounds);
    map.on('drag', function () {
        map.panInsideBounds(bounds, {animate: false});
    });
    
    var greenIcon = L.icon({
        iconUrl: "../maps/asianCapitals/images/marker-icon.png",
        iconSize: [20, 30], // size of the icon
        iconAnchor: [10, 10], // point of the icon which will correspond to marker's location
        popupAnchor: [10, 10] // point from which the popup should open relative to the iconAnchor
    });
    
};

