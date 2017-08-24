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

    var mapDir = "../maps/";

    var topoMap = L.map('topoMap',
            { center : [28.4, 83.9],
                zoom : 8, minZoom : 7, maxZoom: 12,
                maxBounds: L.latLngBounds(L.latLng(25.7,80), L.latLng(31.1846,88.2642)),
                fullscreenControl: true,
                fullscreenControlOptions: {position: 'topleft'}});
    
    var southWest = L.latLng(25.78, 78);
    var northEast = L.latLng(30.75, 89);
    var bounds = L.latLngBounds(southWest, northEast);
    topoMap.setMaxBounds(bounds);
    topoMap.on('drag', function () {
        topoMap.panInsideBounds(bounds, {animate: false});
    });
    
    L.tileLayer(mapDir + 'topoMap/{z}/{x}/{y}.png').addTo(topoMap);

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

    var greenIcon = L.icon({
      iconUrl: (mapDir + "topoMap/images/marker-icon.png"),
      iconSize:     [20, 30], // size of the icon
      iconAnchor:   [10, 40], // point of the icon which will correspond to marker's location
      popupAnchor:  [5, 80] // point from which the popup should open relative to the iconAnchor
    });

    //Inserting Peak markers w/ pictures

    var markerSize = 50; //size of markers for all peaks (irrelevant bc we imported map w/ markers with radius that corresponds to peak height

    var MeraPeak = L.marker([27.7, 86.8683],{icon: greenIcon}).addTo(topoMap);
    MeraPeak.bindPopup('<p>Mera Peak - 21,247 feet<br/><img src="../content/peaks/MeraPeak.jpg" width="300px" height="240px"/></p>');


    var Chamlang = L.marker([27.7756, 86.9797],{icon: greenIcon}).addTo(topoMap);
    Chamlang.bindPopup('<p>Chamlang - 24,012 feet<br/><img src="../content/peaks/Chamlang.jpg" width="300px" height="240px"/></p>');


    var KusumKanguru = L.marker([27.7306, 86.7908],{icon: greenIcon}).addTo(topoMap);
    KusumKanguru.bindPopup('Kusum Kanguru - 20,889 feet<br/><img src="../content/peaks/KusumKanguru.jpg" width="300px" height="240px"/></p>');

    var KongdeRi = L.marker([27.8, 86.6167],{icon: greenIcon}).addTo(topoMap);
    KongdeRi.bindPopup('Kongde Ri - 20,299 feet<br/><img src="../content/peaks/KongdeRi.jpg" width="300px" height="240px"/></p>');

    var Kangtega = L.marker([27.7833, 86.8167],{icon: greenIcon}).addTo(topoMap);
    Kangtega.bindPopup('Kangtega - 22,251 feet<br/><img src="../content/peaks/Kangtega.jpg" width="300px" height="240px"/></p>');

    var Thamserku = L.marker([27.7903, 86.7875],{icon: greenIcon}).addTo(topoMap);
    Thamserku.bindPopup('Thamserku - 21,729 feet<br/><img src="../content/peaks/Thamserku.jpg" width="300px" height="240px"/></p>');

    var MountKhumbila = L.marker([27.8505, 86.7],{icon: greenIcon}).addTo(topoMap);
    MountKhumbila.bindPopup('Mount Khumbila - 18,901 feet<br/><img src="../content/peaks/MountKhumbila.jpg" width="300px" height="240px"/></p>');

    var AmaDablam = L.marker([27.8611, 86.8611],{icon: greenIcon}).addTo(topoMap);
    AmaDablam.bindPopup('Ama Dablam - 22,349 feet<br/><img src="../content/peaks/AmaDablam.jpg" width="300px" height="240px"/></p>');

    var Taboche = L.marker([27.8967, 86.7775],{icon: greenIcon}).addTo(topoMap);
    Taboche.bindPopup('Taboche - 21,463 feet<br/><img src="../content/peaks/Taboche.jpg" width="300px" height="240px"/></p>');

    var Cholatse = L.marker([27.9181, 86.7667],{icon: greenIcon}).addTo(topoMap);
    Cholatse.bindPopup('Cholatse - 21,129 feet<br/><img src="../content/peaks/Cholatse.jpg" width="300px" height="240px"/></p>');

    var Pokalde = L.marker([27.925, 86.8333],{icon: greenIcon}).addTo(topoMap);
    Pokalde.bindPopup('Pokalde - 19,049 feet<br/><img src="../content/peaks/Pokalde.jpg" width="300px" height="240px"/></p>');

    var GokyoRi = L.marker([27.9611, 86.6833],{icon: greenIcon}).addTo(topoMap);
    GokyoRi.bindPopup('Gokyo Ri - 17,575 feet<br/><img src="../content/peaks/GokyoRi.jpg" width="300px" height="240px"/></p>');

    var Lobuche = L.marker([27.9481, 86.8103],{icon: greenIcon}).addTo(topoMap);
    Lobuche.bindPopup('Lobuche - 20,075 feet<br/><img src="../content/peaks/Lobuche.jpg" width="300px" height="240px"/></p>');

    var KalaPatthar = L.marker([27.9958, 86.8284],{icon: greenIcon}).addTo(topoMap);
    KalaPatthar.bindPopup('Kala Patthar - 18,514 feet<br/><img src="../content/peaks/KalaPatthar.jpg" width="300px" height="240px"/></p>');

    var Pumori = L.marker([28.0147, 86.8281],{icon: greenIcon}).addTo(topoMap);
    Pumori.bindPopup('Pumori - 23,494 feet<br/><img src="../content/peaks/Pumori.jpg" width="300px" height="240px"/></p>');

    var Nuptse = L.marker([27.9664, 86.89],{icon: greenIcon}).addTo(topoMap);
    Nuptse.bindPopup('Nuptse - 25,791 feet<br/><img src="../content/peaks/Nuptse.jpg" width="300px" height="240px"/></p>');

    var HillaryPeak = L.marker([27.9586, 86.9094],{icon: greenIcon}).addTo(topoMap);
    HillaryPeak.bindPopup('Hillary Peak - 25,200 feet<br/><img src="../content/peaks/HillaryPeak.jpg" width="300px" height="240px"/></p>');

    var Lhotse = L.marker([27.9617, 86.9333],{icon: greenIcon}).addTo(topoMap);
    Lhotse.bindPopup('Lhotse - 27,940 feet<br/><img src="../content/peaks/Lhotse.jpg" width="300px" height="240px"/></p>');

    var Everest = L.marker([27.9881, 86.9253],{icon: greenIcon}).addTo(topoMap);
    Everest.bindPopup('Mount Everest - 29,029 feet<br/><img src="../content/peaks/MountEverest.jpg" width="300px" height="240px"/></p>');

    var ImjaTse = L.marker([27.9225, 86.9361],{icon: greenIcon}).addTo(topoMap);
    ImjaTse.bindPopup('Imja Tse - 20,305 feet<br/><img src="../content/peaks/ImjaTse.jpg" width="300px" height="240px"/></p>');

    var NumRi = L.marker([27.8947, 86.9708],{icon: greenIcon}).addTo(topoMap);
    NumRi.bindPopup('Num Ri - 21,906 feet<br/><img src="../content/peaks/NumRi.jpg" width="300px" height="240px"/></p>');

    var Baruntse = L.marker([27.8716, 86.9801],{icon: greenIcon}).addTo(topoMap);
    Baruntse.bindPopup('Baruntse - 23,389 feet<br/><img src="../content/peaks/Baruntse.jpg" width="300px" height="240px"/></p>');

    var GyachungKang = L.marker([28.0981, 86.7422],{icon: greenIcon}).addTo(topoMap);
    GyachungKang.bindPopup('Gyachung Kang - 26,089 feet<br/><img src="../content/peaks/GyachungKang.jpg" width="300px" height="240px"/></p>');

    var ChoOyu = L.marker([28.0942, 86.6608],{icon: greenIcon}).addTo(topoMap);
    ChoOyu.bindPopup('Cho Oyu - 26,906 feet<br/><img src="../content/peaks/ChoOyu.jpg" width="300px" height="240px"/></p>');

    var Guarishankar = L.marker([27.9533, 86.3358],{icon: greenIcon}).addTo(topoMap);
    Guarishankar.bindPopup('Guarishankar - 23,406 feet<br/><img src="../content/peaks/Guarishankar.jpg" width="300px" height="240px"/></p>');

    var DorjeLhakpa = L.marker([28.1739, 85.7792],{icon: greenIcon}).addTo(topoMap);
    DorjeLhakpa.bindPopup('Dorje Lhakpa - 22,854 feet<br/><img src="../content/peaks/DorjeLhakpa.png" width="300px" height="240px"/></p>');

    var YalaPeak = L.marker([28.2286, 85.628],{icon: greenIcon}).addTo(topoMap);
    YalaPeak.bindPopup('Yala Peak - 18,110 feet<br/><img src="../content/peaks/YalaPeak.jpg" width="300px" height="240px"/></p>');

    var DragmarpoRi = L.marker([28.2964, 85.6667],{icon: greenIcon}).addTo(topoMap);
    DragmarpoRi.bindPopup('Dragmarpo Ri - 21,581 feet<br/><img src="../content/peaks/DragmarpoRi.jpg" width="300px" height="240px"/></p>');

    var BadenPowellPeak = L.marker([28.1664, 85.5336],{icon: greenIcon}).addTo(topoMap);
    BadenPowellPeak.bindPopup('Baden-Powell Peak - 19,111 feet<br/><img src="../content/peaks/BadenPowellPeak.jpg" width="300px" height="240px"/></p>');

    var LangtangLirung = L.marker([28.2575, 85.5158],{icon: greenIcon}).addTo(topoMap);
    LangtangLirung.bindPopup('Langtang Lirung - 23,7111 feet<br/><img src="../content/peaks/LangtangLirung.jpg" width="300px" height="240px"/></p>');

    var Salasungo = L.marker([28.335, 85.1217],{icon: greenIcon}).addTo(topoMap);
    Salasungo.bindPopup('Salasungo - 23,107 feet<br/><img src="../content/peaks/Salasungo.jpg" width="300px" height="240px"/></p>');

    var GaneshNW = L.marker([28.3792, 85.0567],{icon: greenIcon}).addTo(topoMap);
    GaneshNW.bindPopup('Ganesh NW - 23,353 feet<br/><img src="../content/peaks/GaneshNW.jpg" width="300px" height="240px"/></p>');

    var Himalchuli = L.marker([28.4342, 84.6375],{icon: greenIcon}).addTo(topoMap);
    Himalchuli.bindPopup('Himalchuli - 25,896 feet<br/><img src="../content/peaks/Himalchuli.jpg" width="300px" height="240px"/></p>');

    var NgadiChuli = L.marker([28.5033, 84.5675],{icon: greenIcon}).addTo(topoMap);
    NgadiChuli.bindPopup('Ngadi Chuli - 25,823 feet<br/><img src="../content/peaks/NgadiChuli.jpg" width="300px" height="240px"/></p>');

    var Manaslu = L.marker([28.55, 84.5575],{icon: greenIcon}).addTo(topoMap);
    Manaslu.bindPopup('Manaslu - 26,759 feet<br/><img src="../content/peaks/Manaslu.jpg" width="300px" height="240px"/></p>');

    var Nemjung = L.marker([28.735, 84.4167],{icon: greenIcon}).addTo(topoMap);
    Nemjung.bindPopup('Nemjung - 23,425 feet<br/><img src="../content/peaks/Nemjung.jpg" width="300px" height="240px"/></p>');

    var MountMachhapuchchhre = L.marker([28.495, 83.9492],{icon: greenIcon}).addTo(topoMap);
    MountMachhapuchchhre.bindPopup('Mount Machhapuchchhre - 22,943 feet<br/><img src="../content/peaks/MountMachhapuchchhre.jpg" width="300px" height="240px"/></p>');

    var Hiunchuli = L.marker([28.5167, 83.8833],{icon: greenIcon}).addTo(topoMap);
    Hiunchuli.bindPopup('Hiunchuli - 21,132 feet<br/><img src="../content/peaks/Hiunchuli.jpg" width="300px" height="240px"/></p>');

    var SinguChuli = L.marker([28.5833, 83.9],{icon: greenIcon}).addTo(topoMap);
    SinguChuli.bindPopup('Singu Chuli - 21,329 feet<br/><img src="../content/peaks/SinguChuli.jpg" width="300px" height="240px"/></p>');

    var TilchoPeak = L.marker([28.6844, 83.8044],{icon: greenIcon}).addTo(topoMap);
    TilchoPeak.bindPopup('Tilcho Peak - 23,406 feet<br/><img src="../content/peaks/TilchoPeak.jpg" width="300px" height="240px"/></p>');

    var Saipal = L.marker([29.8908, 81.495],{icon: greenIcon}).addTo(topoMap);
    Saipal.bindPopup('Saipal - 23,068 feet<br/><img src="../content/peaks/Saipal.jpg" width="300px" height="240px"/></p>');

    var Makalu = L.marker([27.74, 87.15],{icon: greenIcon}).addTo(topoMap);
    Makalu.bindPopup('Makalu - 27,825 feet<br/><img src="../content/peaks/Makalu.jpg" width="300px" height="240px"/></p>');

    var Kabru = L.marker([27.635, 88.1183],{icon: greenIcon}).addTo(topoMap);
    Kabru.bindPopup('Kabru - 24,318 feet<br/><img src="../content/peaks/Kabru.jpg" width="300px" height="240px"/></p>');

    var Jannu = L.marker([27.6828, 88.0458],{icon: greenIcon}).addTo(topoMap);
    Jannu.bindPopup('Jannu - 25,295 feet<br/><img src="../content/peaks/Jannu.jpg" width="300px" height="240px"/></p>');

    var Kanchenjunga = L.marker([27.7025, 88.1467],{icon: greenIcon}).addTo(topoMap);
    Kanchenjunga.bindPopup('Kanchenjunga - 28,169 feet<br/><img src="../content/peaks/Kanchenjunga.jpg" width="300px" height="240px"/></p>');

    var JongsongPeak = L.marker([27.8833, 88.1333],{icon: greenIcon}).addTo(topoMap);
    JongsongPeak.bindPopup('Jongsong Peak - 24,482 feet<br/><img src="../content/peaks/JongsongPeak.jpg" width="300px" height="240px"/></p>');

});
