/*
LOOMA javascript file
Filename: looma-maps-asianCapitals.js
Description:

Programmer name:
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2017 07
Revision: Looma 3.0
 */

window.onload = function () {
    var map = L.map('map').setView([28.2076, 83.9903], 14);
    L.tileLayer('../maps/PokharaCity/{z}/{x}/{y}.png', {
        minZoom: 14,
        maxZoom: 17,
    }).addTo(map);
    
    var southWest = L.latLng(28.2893, 84.0471);
    var northEast = L.latLng(28.1841, 83.8938);
    var bounds = L.latLngBounds(southWest, northEast);
    map.setMaxBounds(bounds);
    map.on('drag', function () {
        map.panInsideBounds(bounds, {animate: false});
    });
    
    var legend = L.control({position: 'bottomright'});
    
    legend.onAdd = function (map) {
        var element = L.DomUtil.create('div', 'street-legend info legend');
        
        element.innerHTML = '<span style="color:#31881e">\u2589</span>' + "Forest" + '<br />' +
            '<span style="color:#c49464">\u2589</span>' + "Commercial/Industrial" + '<br />' +
            '<span style="color:#f1ff00">\u2589</span>' + "Recreation/Parks" + '<br />' +
            '<span style="color:#ae8">\u2589</span>' + "Farmland" + '<br />' +
            '<span style="color:#ff8585">\u2589</span>' + "Military" + '<br />' +
            '<span style="color:#5fc4d4">\u2589</span>' + "Water/Lake/River" + '<br/>' +
            '<span style="color:#a8845e">\u25DA</span>' + "Buildings" + '<br />' +
            
            '<span style="color:#000000">\u2501</span>' + "Roads" + '<br />';
        return element;
        
    };
    
    legend.addTo(map);
    
    var greenIcon = L.icon({
        iconUrl: "../maps/PokharaCity/images/marker-icon.png",
        iconSize: [20, 30], // size of the icon
        iconAnchor: [5, 5], // point of the icon which will correspond to marker's location
        popupAnchor: [5, 95] // point from which the popup should open relative to the iconAnchor
    });
    
    var airport = L.marker([28.199549, 83.978849], {icon: greenIcon}).addTo(map);//
    var airportPopup = ('<p>Pokhara Airport<br/><img src="../maps/PokharaCity/images/PokharaAirport.jpg" width="500" height="350"/><p>');
    airport.bindPopup(airportPopup, {minWidth: "auto"});
    var setiRiver = L.marker([28.214910, 83.993729], {icon: greenIcon}).addTo(map);//
    var setiRiverPopUp = ('<p>Seti River<br/><img src="../maps/PokharaCity/images/SetiRiver.jpg" width="500" height="350"/></p>');
    setiRiver.bindPopup(setiRiverPopUp, {minWidth: "auto"});
    var devisFalls = L.marker([28.189944, 83.959052], {icon: greenIcon}).addTo(map);//
    var desvisFallsPopUp = ('<p>Devi Falls<br/><img src="../maps/PokharaCity/images/DevisFall.jpg" width="500" height="350"/><p>');
    devisFalls.bindPopup(desvisFallsPopUp, {minWidth: "auto"});
    var internationalMountainMuseum = L.marker([28.189946, 83.982829], {icon: greenIcon}).addTo(map);//
    var internationalMountainMuseumPopUp = ('<p>International Mountain Museum<br/><img src="../maps/PokharaCity/images/MountainMuseum.jpg" width="500" height="350"/></p>');
    internationalMountainMuseum.bindPopup(internationalMountainMuseumPopUp, {minWidth: "auto"});
    var gurkhaMuseum = L.marker([28.246273, 83.988590], {icon: greenIcon}).addTo(map);//
    var gurkhaMuseumPopUp = ('<p>Gurkha Museum<br/><img src="../maps/PokharaCity/images/GurkhaMuseum.jpg" width="500" height="350"/></p>');
    gurkhaMuseum.bindPopup(gurkhaMuseumPopUp, {minWidth: "auto"});
    var batCave = L.marker([28.267456, 83.975921], {icon: greenIcon}).addTo(map);//
    var batCavePopUp = ('<p>Bat Cave<br/><img src="../maps/PokharaCity/images/BatCave.jpg" width="500" height="350"/></p>');
    batCave.bindPopup(batCavePopUp, {minWidth: "auto"});
    var worldPeacePagoda = L.marker([28.201072, 83.945068], {icon: greenIcon}).addTo(map);//
    var worldPeacePagodaPopUp = ('<p>World Peace Pagoda<br/><img src="../maps/PokharaCity/images/worldPeacePagoda.jpg" width="500" height="350"/></p>');
    worldPeacePagoda.bindPopup(worldPeacePagodaPopUp, {minWidth: "auto"});
    var gupteshworMahadevCave = L.marker([28.189491, 83.958052], {icon: greenIcon}).addTo(map);
    var gupteshworMahadevCavePopUp = ('<p>Gupteshwor Mahadev Cave<br/><img src="../maps/PokharaCity/images/GupteshworMahadevCave.jpg" width="500" height="350"/></p>');
    gupteshworMahadevCave.bindPopup(gupteshworMahadevCavePopUp, {minWidth: "auto"});
    var chachawheeFunPark = L.marker([28.196172, 83.981643], {icon: greenIcon}).addTo(map);//
    var chachawheeFunParkPopUp = ('<p>Chachawhee Fun Park<br/><img src="../maps/PokharaCity/images/AmusmentPark.jpg" width="500" height="350"/></p>');
    chachawheeFunPark.bindPopup(chachawheeFunParkPopUp, {minWidth: "auto"});
    var talBarahiTemple = L.marker([28.207453, 83.953515], {icon: greenIcon}).addTo(map);//
    var talBarahiTemplePopUp = ('<p>Tal Barahi Temple<br/><img src="../maps/PokharaCity/images/TalBarahiTemple.jpg" width="500" height="350"/></p>');
    talBarahiTemple.bindPopup(talBarahiTemplePopUp, {minWidth: "auto"});
    var regionalMuseum = L.marker([28.217124, 83.991024], {icon: greenIcon}).addTo(map);//
    var regionalMuseumPopUp = ('<p>Regional Museum<br/><img src="../maps/PokharaCity/images/RegionalMuseum.jpg" width="500" height="350"/></p>');
    regionalMuseum.bindPopup(regionalMuseumPopUp, {minWidth: "auto"});//
    var miteriPark = L.marker([28.201288, 83.966340], {icon: greenIcon}).addTo(map);
    var miteriParkPopUp = ('<p>Miteri Park<br/><img src="../maps/PokharaCity/images/MiteriPark.jpg" width="500" height="350"/></p>');
    miteriPark.bindPopup(miteriParkPopUp, {minWidth: "auto"});
    var bindhyabasiniTemple = L.marker([28.237660, 83.984184], {icon: greenIcon}).addTo(map);
    var bindhyabasiniTemplePopUp = ('<p>Bindhyabasini Temple<br/><img src="../maps/PokharaCity/images/BindhyabasiniTemple.jpg" width="500" height="350"/></p>');
    bindhyabasiniTemple.bindPopup(bindhyabasiniTemplePopUp, {minWidth: "auto"});
    var phewaLake = L.marker([28.215184, 83.947690], {icon: greenIcon}).addTo(map);//
    var phewaLakePopUp = ('<p>Phewa Lake<br/><img src="../maps/PokharaCity/images/PhewaLake.jpg" width="500" height="350"/></p>');
    phewaLake.bindPopup(phewaLakePopUp, {minWidth: "auto"});
};
