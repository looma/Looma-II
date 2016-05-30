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

var width = 2400,
    height = 720;

$(document).ready(function() {
//Leaflet demonstration



    var topoMap = L.map('topoMap',
            { center : [28.4, 83.9],
                zoom : 7, minZoom : 7, maxZoom: 12,
                maxBounds: L.latLngBounds(L.latLng(25.7,80), L.latLng(31.1846,88.2642)),
                fullscreenControl: true,
                fullscreenControlOptions: {position: 'topleft'}});

    L.tileLayer('../content/maps/topoMap/{z}/{x}/{y}.png').addTo(topoMap);

    var topLegend = L.control({position: 'bottomright'});

    topLegend.onAdd = function (topoMap) {
        var element = L.DomUtil.create('div', 'topLegend info legend');

        element.innerHTML =  '<span style="color:#fe2e2e">\u25cf</span>' + "Mountain Peaks" + '<br />' +
    '<span style="color:#000000">\u2501</span>' + "State lines" + '<br />' +
    '<span style="color:#FE2E2E">\u2501</span>' + "Contour lines" + '<br />' +
    '<span style="color:#168">\u2501</span>' + "Rivers" + '<br />' +
    '<span style="color:#d8f6ce">\u2589</span>' + "Forests" + '<br />';

        return element;

    };
    topLegend.addTo(topoMap);



    //Inserting Peak markers w/ pictures

    var markerSize = 50; //size of markers for all peaks (irrelevant bc we imported map w/ markers with radius that corresponds to peak height

    var MeraPeak = L.circle([27.7, 86.8683], markerSize, {
    color: 'red', fillOpacity: 0, lineOpacity: 0} ).addTo(topoMap);
    MeraPeak.bindPopup('<p>Mera Peak - 21,247 feet<br/><img src="../content/peaks/MeraPeak.jpg" width="300" height="240"/></p>');


    var Chamlang = L.circle([27.7756, 86.9797], markerSize, {
    color: 'red', fillOpacity: 0, lineOpacity: 0} ).addTo(topoMap);
    Chamlang.bindPopup('<p>Chamlang - 24,012 feet<br/><img src="../content/peaks/Chamlang.jpg" width="300" height="240"/></p>');


    var KusumKanguru = L.circle([27.7306, 86.7908], markerSize, {
    color: 'red', fillOpacity: 0, lineOpacity: 0} ).addTo(topoMap);
    KusumKanguru.bindPopup('Kusum Kanguru - 20,889 feet<br/><img src="../content/peaks/KusumKanguru.jpg" width="300" height="240"/></p>');

    var KongdeRi = L.circle([27.8, 86.6167], markerSize, {
    color: 'red', fillOpacity: 0, lineOpacity: 0} ).addTo(topoMap);
    KongdeRi.bindPopup('Kongde Ri - 20,299 feet<br/><img src="../content/peaks/KongdeRi.jpg" width="300" height="240"/></p>');

    var Kangtega = L.circle([27.7833, 86.8167], markerSize, {
    color: 'red', fillOpacity: 0, lineOpacity: 0} ).addTo(topoMap);
    Kangtega.bindPopup('Kangtega - 22,251 feet<br/><img src="../content/peaks/Kangtega.jpg" width="300" height="240"/></p>');

    var Thamserku = L.circle([27.7903, 86.7875], markerSize, {
    color: 'red', fillOpacity: 0, lineOpacity: 0} ).addTo(topoMap);
    Thamserku.bindPopup('Thamserku - 21,729 feet<br/><img src="../content/peaks/Thamserku.jpg" width="300" height="240"/></p>');

    var MountKhumbila = L.circle([27.8505, 86.7], markerSize, {
    color: 'red', fillOpacity: 0, lineOpacity: 0} ).addTo(topoMap);
    MountKhumbila.bindPopup('Mount Khumbila - 18,901 feet<br/><img src="../content/peaks/MountKhumbila.jpg" width="300" height="240"/></p>');

    var AmaDablam = L.circle([27.8611, 86.8611], markerSize, {
    color: 'red', fillOpacity: 0, lineOpacity: 0} ).addTo(topoMap);
    AmaDablam.bindPopup('Ama Dablam - 22,349 feet<br/><img src="../content/peaks/AmaDablam.jpg" width="300" height="240"/></p>');

    var Taboche = L.circle([27.8967, 86.7775], markerSize, {
    color: 'red', fillOpacity: 0, lineOpacity: 0} ).addTo(topoMap);
    Taboche.bindPopup('Taboche - 21,463 feet<br/><img src="../content/peaks/Taboche.jpg" width="300" height="240"/></p>');

    var Cholatse = L.circle([27.9181, 86.7667], markerSize, {
    color: 'red', fillOpacity: 0, lineOpacity: 0} ).addTo(topoMap);
    Cholatse.bindPopup('Cholatse - 21,129 feet<br/><img src="../content/peaks/Cholatse.jpg" width="300" height="240"/></p>');

    var Pokalde = L.circle([27.925, 86.8333], markerSize, {
    color: 'red', fillOpacity: 0, lineOpacity: 0} ).addTo(topoMap);
    Pokalde.bindPopup('Pokalde - 19,049 feet<br/><img src="../content/peaks/Pokalde.jpg" width="300" height="240"/></p>');

    var GokyoRi = L.circle([27.9611, 86.6833], markerSize, {
    color: 'red', fillOpacity: 0, lineOpacity: 0} ).addTo(topoMap);
    GokyoRi.bindPopup('Gokyo Ri - 17,575 feet<br/><img src="../content/peaks/GokyoRi.jpg" width="300" height="240"/></p>');

    var Lobuche = L.circle([27.9481, 86.8103], markerSize, {
    color: 'red', fillOpacity: 0, lineOpacity: 0} ).addTo(topoMap);
    Lobuche.bindPopup('Lobuche - 20,075 feet<br/><img src="../content/peaks/Lobuche.jpg" width="300" height="240"/></p>');

    var KalaPatthar = L.circle([27.9958, 86.8284], markerSize, {
    color: 'red', fillOpacity: 0, lineOpacity: 0} ).addTo(topoMap);
    KalaPatthar.bindPopup('Kala Patthar - 18,514 feet<br/><img src="../content/peaks/KalaPatthar.jpg" width="300" height="240"/></p>');

    var Pumori = L.circle([28.0147, 86.8281], markerSize, {
    color: 'red', fillOpacity: 0, lineOpacity: 0} ).addTo(topoMap);
    Pumori.bindPopup('Pumori - 23,494 feet<br/><img src="../content/peaks/Pumori.jpg" width="300" height="240"/></p>');

    var Nuptse = L.circle([27.9664, 86.89], markerSize, {
    color: 'red', fillOpacity: 0, lineOpacity: 0} ).addTo(topoMap);
    Nuptse.bindPopup('Nuptse - 25,791 feet<br/><img src="../content/peaks/Nuptse.jpg" width="300" height="240"/></p>');

    var HillaryPeak = L.circle([27.9586, 86.9094], markerSize, {
    color: 'red', fillOpacity: 0, lineOpacity: 0} ).addTo(topoMap);
    HillaryPeak.bindPopup('Hillary Peak - 25,200 feet<br/><img src="../content/peaks/HillaryPeak.jpg" width="300" height="240"/></p>');

    var Lhotse = L.circle([27.9617, 86.9333], markerSize, {
    color: 'red', fillOpacity: 0, lineOpacity: 0} ).addTo(topoMap);
    Lhotse.bindPopup('Lhotse - 27,940 feet<br/><img src="../content/peaks/Lhotse.jpg" width="300" height="240"/></p>');

    var Everest = L.circle([27.9881, 86.9253], markerSize, {
    color: 'red', fillOpacity: 0, lineOpacity: 0} ).addTo(topoMap);
    Everest.bindPopup('Mount Everest - 29,029 feet<br/><img src="../content/peaks/MountEverest.jpg" width="300" height="240"/></p>');

    var ImjaTse = L.circle([27.9225, 86.9361], markerSize, {
    color: 'red', fillOpacity: 0, lineOpacity: 0} ).addTo(topoMap);
    ImjaTse.bindPopup('Imja Tse - 20,305 feet<br/><img src="../content/peaks/ImjaTse.jpg" width="300" height="240"/></p>');

    var NumRi = L.circle([27.8947, 86.9708], markerSize, {
    color: 'red', fillOpacity: 0, lineOpacity: 0} ).addTo(topoMap);
    NumRi.bindPopup('Num Ri - 21,906 feet<br/><img src="../content/peaks/NumRi.jpg" width="300" height="240"/></p>');

    var Baruntse = L.circle([27.8716, 86.9801], markerSize, {
    color: 'red', fillOpacity: 0, lineOpacity: 0} ).addTo(topoMap);
    Baruntse.bindPopup('Baruntse - 23,389 feet<br/><img src="../content/peaks/Baruntse.jpg" width="300" height="240"/></p>');

    var GyachungKang = L.circle([28.0981, 86.7422], markerSize, {
    color: 'red', fillOpacity: 0, lineOpacity: 0} ).addTo(topoMap);
    GyachungKang.bindPopup('Gyachung Kang - 26,089 feet<br/><img src="../content/peaks/GyachungKang.jpg" width="300" height="240"/></p>');

    var ChoOyu = L.circle([28.0942, 86.6608], markerSize, {
    color: 'red', fillOpacity: 0, lineOpacity: 0} ).addTo(topoMap);
    ChoOyu.bindPopup('Cho Oyu - 26,906 feet<br/><img src="../content/peaks/ChoOyu.jpg" width="300" height="240"/></p>');

    var Guarishankar = L.circle([27.9533, 86.3358], markerSize, {
    color: 'red', fillOpacity: 0, lineOpacity: 0} ).addTo(topoMap);
    Guarishankar.bindPopup('Guarishankar - 23,406 feet<br/><img src="../content/peaks/Guarishankar.jpg" width="300" height="240"/></p>');

    var DorjeLhakpa = L.circle([28.1739, 85.7792], markerSize, {
    color: 'red', fillOpacity: 0, lineOpacity: 0} ).addTo(topoMap);
    DorjeLhakpa.bindPopup('Dorje Lhakpa - 22,854 feet<br/><img src="../content/peaks/DorjeLhakpa.png" width="300" height="240"/></p>');

    var YalaPeak = L.circle([28.2286, 85.628], markerSize, {
    color: 'red', fillOpacity: 0, lineOpacity: 0} ).addTo(topoMap);
    YalaPeak.bindPopup('Yala Peak - 18,110 feet<br/><img src="../content/peaks/YalaPeak.jpg" width="300" height="240"/></p>');

    var DragmarpoRi = L.circle([28.2964, 85.6667], markerSize, {
    color: 'red', fillOpacity: 0, lineOpacity: 0} ).addTo(topoMap);
    DragmarpoRi.bindPopup('Dragmarpo Ri - 21,581 feet<br/><img src="../content/peaks/DragmarpoRi.jpg" width="300" height="240"/></p>');

    var BadenPowellPeak = L.circle([28.1664, 85.5336], markerSize, {
    color: 'red', fillOpacity: 0, lineOpacity: 0} ).addTo(topoMap);
    BadenPowellPeak.bindPopup('Baden-Powell Peak - 19,111 feet<br/><img src="../content/peaks/BadenPowellPeak.jpg" width="300" height="240"/></p>');

    var LangtangLirung = L.circle([28.2575, 85.5158], markerSize, {
    color: 'red', fillOpacity: 0, lineOpacity: 0} ).addTo(topoMap);
    LangtangLirung.bindPopup('Langtang Lirung - 23,7111 feet<br/><img src="../content/peaks/LangtangLirung.jpg" width="300" height="240"/></p>');

    var Salasungo = L.circle([28.335, 85.1217], markerSize, {
    color: 'red', fillOpacity: 0, lineOpacity: 0} ).addTo(topoMap);
    Salasungo.bindPopup('Salasungo - 23,107 feet<br/><img src="../content/peaks/Salasungo.jpg" width="300" height="240"/></p>');

    var GaneshNW = L.circle([28.3792, 85.0567], markerSize, {
    color: 'red', fillOpacity: 0, lineOpacity: 0} ).addTo(topoMap);
    GaneshNW.bindPopup('Ganesh NW - 23,353 feet<br/><img src="../content/peaks/GaneshNW.jpg" width="300" height="240"/></p>');

    var Himalchuli = L.circle([28.4342, 84.6375], markerSize, {
    color: 'red', fillOpacity: 0, lineOpacity: 0} ).addTo(topoMap);
    Himalchuli.bindPopup('Himalchuli - 25,896 feet<br/><img src="../content/peaks/Himalchuli.jpg" width="300" height="240"/></p>');

    var NgadiChuli = L.circle([28.5033, 84.5675], markerSize, {
    color: 'red', fillOpacity: 0, lineOpacity: 0} ).addTo(topoMap);
    NgadiChuli.bindPopup('Ngadi Chuli - 25,823 feet<br/><img src="../content/peaks/NgadiChuli.jpg" width="300" height="240"/></p>');

    var Manaslu = L.circle([28.55, 84.5575], markerSize, {
    color: 'red', fillOpacity: 0, lineOpacity: 0} ).addTo(topoMap);
    Manaslu.bindPopup('Manaslu - 26,759 feet<br/><img src="../content/peaks/Manaslu.jpg" width="300" height="240"/></p>');

    var Nemjung = L.circle([28.735, 84.4167], markerSize, {
    color: 'red', fillOpacity: 0, lineOpacity: 0} ).addTo(topoMap);
    Nemjung.bindPopup('Nemjung - 23,425 feet<br/><img src="../content/peaks/Nemjung.jpg" width="300" height="240"/></p>');

    var MountMachhapuchchhre = L.circle([28.495, 83.9492], markerSize, {
    color: 'red', fillOpacity: 0, lineOpacity: 0} ).addTo(topoMap);
    MountMachhapuchchhre.bindPopup('Mount Machhapuchchhre - 22,943 feet<br/><img src="../content/peaks/MountMachhapuchchhre.jpg" width="300" height="240"/></p>');

    var Hiunchuli = L.circle([28.5167, 83.8833], markerSize, {
    color: 'red', fillOpacity: 0, lineOpacity: 0} ).addTo(topoMap);
    Hiunchuli.bindPopup('Hiunchuli - 21,132 feet<br/><img src="../content/peaks/Hiunchuli.jpg" width="300" height="240"/></p>');

    var SinguChuli = L.circle([28.5833, 83.9], markerSize, {
    color: 'red', fillOpacity: 0, lineOpacity: 0} ).addTo(topoMap);
    SinguChuli.bindPopup('Singu Chuli - 21,329 feet<br/><img src="../content/peaks/SinguChuli.jpg" width="300" height="240"/></p>');

    var TilchoPeak = L.circle([28.6844, 83.8044], markerSize, {
    color: 'red', fillOpacity: 0, lineOpacity: 0} ).addTo(topoMap);
    TilchoPeak.bindPopup('Tilcho Peak - 23,406 feet<br/><img src="../content/peaks/TilchoPeak.jpg" width="300" height="240"/></p>');

    var Saipal = L.circle([29.8908, 81.495], markerSize, {
    color: 'red', fillOpacity: 0, lineOpacity: 0} ).addTo(topoMap);
    Saipal.bindPopup('Saipal - 23,068 feet<br/><img src="../content/peaks/Saipal.jpg" width="300" height="240"/></p>');

    var Makalu = L.circle([27.74, 87.15], markerSize, {
    color: 'red', fillOpacity: 0, lineOpacity: 0} ).addTo(topoMap);
    Makalu.bindPopup('Makalu - 27,825 feet<br/><img src="../content/peaks/Makalu.jpg" width="300" height="240"/></p>');

    var Kabru = L.circle([27.635, 88.1183], markerSize, {
    color: 'red', fillOpacity: 0, lineOpacity: 0} ).addTo(topoMap);
    Kabru.bindPopup('Kabru - 24,318 feet<br/><img src="../content/peaks/Kabru.jpg" width="300" height="240"/></p>');

    var Jannu = L.circle([27.6828, 88.0458], markerSize, {
    color: 'red', fillOpacity: 0, lineOpacity: 0} ).addTo(topoMap);
    Jannu.bindPopup('Jannu - 25,295 feet<br/><img src="../content/peaks/Jannu.jpg" width="300" height="240"/></p>');

    var Kanchenjunga = L.circle([27.7025, 88.1467], markerSize, {
    color: 'red', fillOpacity: 0, lineOpacity: 0} ).addTo(topoMap);
    Kanchenjunga.bindPopup('Kanchenjunga - 28,169 feet<br/><img src="../content/peaks/Kanchenjunga.jpg" width="300" height="240"/></p>');

    var JongsongPeak = L.circle([27.8833, 88.1333], markerSize, {
    color: 'red', fillOpacity: 0, lineOpacity: 0} ).addTo(topoMap);
    JongsongPeak.bindPopup('Jongsong Peak - 24,482 feet<br/><img src="../content/peaks/JongsongPeak.jpg" width="300" height="240"/></p>');

});
