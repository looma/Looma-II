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
L.tileLayer('resources/maps/lauren-lauren/basicMap/{z}/{x}/{y}.png').addTo(basicMap);


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






    var NepalZones = L.map('NepalZones',
            { center : [28.2, 84.2],
                zoom : 7 , minZoom: 7, maxZoom: 11,
                maxBounds: L.latLngBounds(L.latLng(24,77.5), L.latLng(32,91.5)),
                fullscreenControl: true,
                fullscreenControlOptions: {position: 'topleft'}});
L.tileLayer('resources/maps/lauren-lauren/NepalZones/{z}/{x}/{y}.png').addTo(NepalZones);



    var streetMap = L.map('streetMap',
            { center : [27.7, 85.3],
                zoom : 12, minZoom: 11, maxZoom: 18,
                maxBounds: L.latLngBounds(L.latLng(27.5545,85.1247), L.latLng(27.8372,85.5154)),
                fullscreenControl: true,
                fullscreenControlOptions: {position: 'topleft'}});
L.tileLayer('resources/maps/lauren-lauren/streetMap/{z}/{x}/{y}.png').addTo(streetMap);


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



    var topography = L.map('topography',
            { center : [28.4, 83.9],
                zoom : 7, minZoom : 7, maxZoom: 12,
                maxBounds: L.latLngBounds(L.latLng(25.7,80), L.latLng(31.1846,88.2642)),
                fullscreenControl: true,
                fullscreenControlOptions: {position: 'topleft'}});
L.tileLayer('resources/maps/lauren-lauren/topography/{z}/{x}/{y}.png').addTo(topography);

    var topLegend = L.control({position: 'bottomright'});

    topLegend.onAdd = function (topography) {
        var element = L.DomUtil.create('div', 'topLegend info legend');

        element.innerHTML =  '<span style="color:#fe2e2e">\u25cf</span>' + "Mountain Peaks" + '<br />' +
    '<span style="color:#000000">\u2501</span>' + "State lines" + '<br />' +
    '<span style="color:#FE2E2E">\u2501</span>' + "Contour lines" + '<br />' +
    '<span style="color:#168">\u2501</span>' + "Rivers" + '<br />' +
    '<span style="color:#d8f6ce">\u2589</span>' + "Forests" + '<br />';

        return element;

    };
    topLegend.addTo(topography);



    //Inserting Peak markers w/ pictures

    var markerSize = 5; //size of markers for all peaks (irrelevant bc we imported map w/ markers with radius that corresponds to peak height

    var MeraPeak = L.circle([27.7, 86.8683], markerSize, {
    color: 'red', fillOpacity: 0, lineOpacity: 0} ).addTo(topography);
    MeraPeak.bindPopup('<p>Mera Peak - 21,247 feet<br/><img src="resources/peaks/MeraPeak.jpg" width="170" height="120"/></p>');


    var Chamlang = L.circle([27.7756, 86.9797], markerSize, {
    color: 'red', fillOpacity: 0, lineOpacity: 0} ).addTo(topography);
    Chamlang.bindPopup('<p>Chamlang - 24,012 feet<br/><img src="resources/peaks/Chamlang.jpg" width="170" height="120"/></p>');


    var KusumKanguru = L.circle([27.7306, 86.7908], markerSize, {
    color: 'red', fillOpacity: 0, lineOpacity: 0} ).addTo(topography);
    KusumKanguru.bindPopup('Kusum Kanguru - 20,889 feet<br/><img src="resources/peaks/KusumKanguru.jpg" width="170" height="120"/></p>');

    var KongdeRi = L.circle([27.8, 86.6167], markerSize, {
    color: 'red', fillOpacity: 0, lineOpacity: 0} ).addTo(topography);
    KongdeRi.bindPopup('Kongde Ri - 20,299 feet<br/><img src="resources/peaks/KongdeRi.jpg" width="170" height="120"/></p>');

    var Kangtega = L.circle([27.7833, 86.8167], markerSize, {
    color: 'red', fillOpacity: 0, lineOpacity: 0} ).addTo(topography);
    Kangtega.bindPopup('Kangtega - 22,251 feet<br/><img src="resources/peaks/Kangtega.jpg" width="170" height="120"/></p>');

    var Thamserku = L.circle([27.7903, 86.7875], markerSize, {
    color: 'red', fillOpacity: 0, lineOpacity: 0} ).addTo(topography);
    Thamserku.bindPopup('Thamserku - 21,729 feet<br/><img src="resources/peaks/Thamserku.jpg" width="170" height="120"/></p>');

    var MountKhumbila = L.circle([27.8505, 86.7], markerSize, {
    color: 'red', fillOpacity: 0, lineOpacity: 0} ).addTo(topography);
    MountKhumbila.bindPopup('Mount Khumbila - 18,901 feet<br/><img src="resources/peaks/MountKhumbila.jpg" width="170" height="120"/></p>');

    var AmaDablam = L.circle([27.8611, 86.8611], markerSize, {
    color: 'red', fillOpacity: 0, lineOpacity: 0} ).addTo(topography);
    AmaDablam.bindPopup('Ama Dablam - 22,349 feet<br/><img src="resources/peaks/AmaDablam.jpg" width="170" height="120"/></p>');

    var Taboche = L.circle([27.8967, 86.7775], markerSize, {
    color: 'red', fillOpacity: 0, lineOpacity: 0} ).addTo(topography);
    Taboche.bindPopup('Taboche - 21,463 feet<br/><img src="resources/peaks/Taboche.jpg" width="170" height="120"/></p>');

    var Cholatse = L.circle([27.9181, 86.7667], markerSize, {
    color: 'red', fillOpacity: 0, lineOpacity: 0} ).addTo(topography);
    Cholatse.bindPopup('Cholatse - 21,129 feet<br/><img src="resources/peaks/Cholatse.jpg" width="170" height="120"/></p>');

    var Pokalde = L.circle([27.925, 86.8333], markerSize, {
    color: 'red', fillOpacity: 0, lineOpacity: 0} ).addTo(topography);
    Pokalde.bindPopup('Pokalde - 19,049 feet<br/><img src="resources/peaks/Pokalde.jpg" width="170" height="120"/></p>');

    var GokyoRi = L.circle([27.9611, 86.6833], markerSize, {
    color: 'red', fillOpacity: 0, lineOpacity: 0} ).addTo(topography);
    GokyoRi.bindPopup('Gokyo Ri - 17,575 feet<br/><img src="resources/peaks/GokyoRi.jpg" width="170" height="120"/></p>');

    var Lobuche = L.circle([27.9481, 86.8103], markerSize, {
    color: 'red', fillOpacity: 0, lineOpacity: 0} ).addTo(topography);
    Lobuche.bindPopup('Lobuche - 20,075 feet<br/><img src="resources/peaks/Lobuche.jpg" width="170" height="120"/></p>');

    var KalaPatthar = L.circle([27.9958, 86.8284], markerSize, {
    color: 'red', fillOpacity: 0, lineOpacity: 0} ).addTo(topography);
    KalaPatthar.bindPopup('Kala Patthar - 18,514 feet<br/><img src="resources/peaks/KalaPatthar.jpg" width="170" height="120"/></p>');

    var Pumori = L.circle([28.0147, 86.8281], markerSize, {
    color: 'red', fillOpacity: 0, lineOpacity: 0} ).addTo(topography);
    Pumori.bindPopup('Pumori - 23,494 feet<br/><img src="resources/peaks/Pumori.jpg" width="170" height="120"/></p>');

    var Nuptse = L.circle([27.9664, 86.89], markerSize, {
    color: 'red', fillOpacity: 0, lineOpacity: 0} ).addTo(topography);
    Nuptse.bindPopup('Nuptse - 25,791 feet<br/><img src="resources/peaks/Nuptse.jpg" width="170" height="120"/></p>');

    var HillaryPeak = L.circle([27.9586, 86.9094], markerSize, {
    color: 'red', fillOpacity: 0, lineOpacity: 0} ).addTo(topography);
    HillaryPeak.bindPopup('Hillary Peak - 25,200 feet<br/><img src="resources/peaks/HillaryPeak.jpg" width="170" height="120"/></p>');

    var Lhotse = L.circle([27.9617, 86.9333], markerSize, {
    color: 'red', fillOpacity: 0, lineOpacity: 0} ).addTo(topography);
    Lhotse.bindPopup('Lhotse - 27,940 feet<br/><img src="resources/peaks/Lhotse.jpg" width="170" height="120"/></p>');

    var Everest = L.circle([27.9881, 86.9253], markerSize, {
    color: 'red', fillOpacity: 0, lineOpacity: 0} ).addTo(topography);
    Everest.bindPopup('Mount Everest - 29,029 feet<br/><img src="resources/peaks/MountEverest.jpg" width="170" height="120"/></p>');

    var ImjaTse = L.circle([27.9225, 86.9361], markerSize, {
    color: 'red', fillOpacity: 0, lineOpacity: 0} ).addTo(topography);
    ImjaTse.bindPopup('Imja Tse - 20,305 feet<br/><img src="resources/peaks/ImjaTse.jpg" width="170" height="120"/></p>');

    var NumRi = L.circle([27.8947, 86.9708], markerSize, {
    color: 'red', fillOpacity: 0, lineOpacity: 0} ).addTo(topography);
    NumRi.bindPopup('Num Ri - 21,906 feet<br/><img src="resources/peaks/NumRi.jpg" width="170" height="120"/></p>');

    var Baruntse = L.circle([27.8716, 86.9801], markerSize, {
    color: 'red', fillOpacity: 0, lineOpacity: 0} ).addTo(topography);
    Baruntse.bindPopup('Baruntse - 23,389 feet<br/><img src="resources/peaks/Baruntse.jpg" width="170" height="120"/></p>');

    var GyachungKang = L.circle([28.0981, 86.7422], markerSize, {
    color: 'red', fillOpacity: 0, lineOpacity: 0} ).addTo(topography);
    GyachungKang.bindPopup('Gyachung Kang - 26,089 feet<br/><img src="resources/peaks/GyachungKang.jpg" width="170" height="120"/></p>');

    var ChoOyu = L.circle([28.0942, 86.6608], markerSize, {
    color: 'red', fillOpacity: 0, lineOpacity: 0} ).addTo(topography);
    ChoOyu.bindPopup('Cho Oyu - 26,906 feet<br/><img src="resources/peaks/ChoOyu.jpg" width="170" height="120"/></p>');

    var Guarishankar = L.circle([27.9533, 86.3358], markerSize, {
    color: 'red', fillOpacity: 0, lineOpacity: 0} ).addTo(topography);
    Guarishankar.bindPopup('Guarishankar - 23,406 feet<br/><img src="resources/peaks/Guarishankar.jpg" width="170" height="120"/></p>');

    var DorjeLhakpa = L.circle([28.1739, 85.7792], markerSize, {
    color: 'red', fillOpacity: 0, lineOpacity: 0} ).addTo(topography);
    DorjeLhakpa.bindPopup('Dorje Lhakpa - 22,854 feet<br/><img src="resources/peaks/DorjeLhakpa.png" width="170" height="120"/></p>');

    var YalaPeak = L.circle([28.2286, 85.628], markerSize, {
    color: 'red', fillOpacity: 0, lineOpacity: 0} ).addTo(topography);
    YalaPeak.bindPopup('Yala Peak - 18,110 feet<br/><img src="resources/peaks/YalaPeak.jpg" width="170" height="120"/></p>');

    var DragmarpoRi = L.circle([28.2964, 85.6667], markerSize, {
    color: 'red', fillOpacity: 0, lineOpacity: 0} ).addTo(topography);
    DragmarpoRi.bindPopup('Dragmarpo Ri - 21,581 feet<br/><img src="resources/peaks/DragmarpoRi.jpg" width="170" height="120"/></p>');

    var BadenPowellPeak = L.circle([28.1664, 85.5336], markerSize, {
    color: 'red', fillOpacity: 0, lineOpacity: 0} ).addTo(topography);
    BadenPowellPeak.bindPopup('Baden-Powell Peak - 19,111 feet<br/><img src="resources/peaks/BadenPowellPeak.jpg" width="170" height="120"/></p>');

    var LangtangLirung = L.circle([28.2575, 85.5158], markerSize, {
    color: 'red', fillOpacity: 0, lineOpacity: 0} ).addTo(topography);
    LangtangLirung.bindPopup('Langtang Lirung - 23,7111 feet<br/><img src="resources/peaks/LangtangLirung.jpg" width="170" height="120"/></p>');

    var Salasungo = L.circle([28.335, 85.1217], markerSize, {
    color: 'red', fillOpacity: 0, lineOpacity: 0} ).addTo(topography);
    Salasungo.bindPopup('Salasungo - 23,107 feet<br/><img src="resources/peaks/Salasungo.jpg" width="170" height="120"/></p>');

    var GaneshNW = L.circle([28.3792, 85.0567], markerSize, {
    color: 'red', fillOpacity: 0, lineOpacity: 0} ).addTo(topography);
    GaneshNW.bindPopup('Ganesh NW - 23,353 feet<br/><img src="resources/peaks/GaneshNW.jpg" width="170" height="120"/></p>');

    var Himalchuli = L.circle([28.4342, 84.6375], markerSize, {
    color: 'red', fillOpacity: 0, lineOpacity: 0} ).addTo(topography);
    Himalchuli.bindPopup('Himalchuli - 25,896 feet<br/><img src="resources/peaks/Himalchuli.jpg" width="170" height="120"/></p>');

    var NgadiChuli = L.circle([28.5033, 84.5675], markerSize, {
    color: 'red', fillOpacity: 0, lineOpacity: 0} ).addTo(topography);
    NgadiChuli.bindPopup('Ngadi Chuli - 25,823 feet<br/><img src="resources/peaks/NgadiChuli.jpg" width="170" height="120"/></p>');

    var Manaslu = L.circle([28.55, 84.5575], markerSize, {
    color: 'red', fillOpacity: 0, lineOpacity: 0} ).addTo(topography);
    Manaslu.bindPopup('Manaslu - 26,759 feet<br/><img src="resources/peaks/Manaslu.jpg" width="170" height="120"/></p>');

    var Nemjung = L.circle([28.735, 84.4167], markerSize, {
    color: 'red', fillOpacity: 0, lineOpacity: 0} ).addTo(topography);
    Nemjung.bindPopup('Nemjung - 23,425 feet<br/><img src="resources/peaks/Nemjung.jpg" width="170" height="120"/></p>');

    var MountMachhapuchchhre = L.circle([28.495, 83.9492], markerSize, {
    color: 'red', fillOpacity: 0, lineOpacity: 0} ).addTo(topography);
    MountMachhapuchchhre.bindPopup('Mount Machhapuchchhre - 22,943 feet<br/><img src="resources/peaks/MountMachhapuchchhre.jpg" width="170" height="120"/></p>');

    var Hiunchuli = L.circle([28.5167, 83.8833], markerSize, {
    color: 'red', fillOpacity: 0, lineOpacity: 0} ).addTo(topography);
    Hiunchuli.bindPopup('Hiunchuli - 21,132 feet<br/><img src="resources/peaks/Hiunchuli.jpg" width="170" height="120"/></p>');

    var SinguChuli = L.circle([28.5833, 83.9], markerSize, {
    color: 'red', fillOpacity: 0, lineOpacity: 0} ).addTo(topography);
    SinguChuli.bindPopup('Singu Chuli - 21,329 feet<br/><img src="resources/peaks/SinguChuli.jpg" width="170" height="120"/></p>');

    var TilchoPeak = L.circle([28.6844, 83.8044], markerSize, {
    color: 'red', fillOpacity: 0, lineOpacity: 0} ).addTo(topography);
    TilchoPeak.bindPopup('Tilcho Peak - 23,406 feet<br/><img src="resources/peaks/TilchoPeak.jpg" width="170" height="120"/></p>');

    var Saipal = L.circle([29.8908, 81.495], markerSize, {
    color: 'red', fillOpacity: 0, lineOpacity: 0} ).addTo(topography);
    Saipal.bindPopup('Saipal - 23,068 feet<br/><img src="resources/peaks/Saipal.jpg" width="170" height="120"/></p>');

    var Makalu = L.circle([27.74, 87.15], markerSize, {
    color: 'red', fillOpacity: 0, lineOpacity: 0} ).addTo(topography);
    Makalu.bindPopup('Makalu - 27,825 feet<br/><img src="resources/peaks/Makalu.jpg" width="170" height="120"/></p>');

    var Kabru = L.circle([27.635, 88.1183], markerSize, {
    color: 'red', fillOpacity: 0, lineOpacity: 0} ).addTo(topography);
    Kabru.bindPopup('Kabru - 24,318 feet<br/><img src="resources/peaks/Kabru.jpg" width="170" height="120"/></p>');

    var Jannu = L.circle([27.6828, 88.0458], markerSize, {
    color: 'red', fillOpacity: 0, lineOpacity: 0} ).addTo(topography);
    Jannu.bindPopup('Jannu - 25,295 feet<br/><img src="resources/peaks/Jannu.jpg" width="170" height="120"/></p>');

    var Kanchenjunga = L.circle([27.7025, 88.1467], markerSize, {
    color: 'red', fillOpacity: 0, lineOpacity: 0} ).addTo(topography);
    Kanchenjunga.bindPopup('Kanchenjunga - 28,169 feet<br/><img src="resources/peaks/Kanchenjunga.jpg" width="170" height="120"/></p>');

    var JongsongPeak = L.circle([27.8833, 88.1333], markerSize, {
    color: 'red', fillOpacity: 0, lineOpacity: 0} ).addTo(topography);
    JongsongPeak.bindPopup('Jongsong Peak - 24,482 feet<br/><img src="resources/peaks/JongsongPeak.jpg" width="170" height="120"/></p>');


});






