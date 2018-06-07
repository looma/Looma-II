/*
LOOMA javascript file
Filename: looma-maps-worldCities.js
Description:

Programmer name:
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2017 07
Revision: Looma 3.0
 */

window.onload = function () {
    var map = L.map('map').setView([20, 60], 3);
    L.tileLayer('../maps/WorldCities/{z}/{x}/{y}.png', {
        minZoom: 2,
        maxZoom: 5,
    }).addTo(map);
    
    var southWest = L.latLng(-85.0511, -180)
    northEast = L.latLng(85.0511, 180);
    var bounds = L.latLngBounds(southWest, northEast);
    map.setMaxBounds(bounds);
    map.on('drag', function () {
        map.panInsideBounds(bounds, {animate: false});
    });
    
    var greenIcon = L.icon({
        iconUrl: "../maps/WorldCities/images/marker-icon.png",
        iconSize: [20, 30], // size of the icon
        iconAnchor: [10, 40], // point of the icon which will correspond to marker's location
        popupAnchor: [5, -10] // point from which the popup should open relative to the iconAnchor
    });
    
    var SanFrancisco = L.marker([37.7400077505, -122.459977663], {icon: greenIcon}).addTo(map);
    SanFrancisco.bindPopup('<b><font size="3">San Francisco:<br/><b><font size="2">Population: 6,455,000<br/><b><font size="2">Area: 2,865 sq km<br/><b><font size="2">Country: United States<br/><img src="../maps/WorldCities/images/SanFrancisco.jpg" width="500" height="350"/></p>', {minWidth: "auto"});
    var Houston = L.marker([29.8199743846, -95.3399792905], {icon: greenIcon}).addTo(map);
    Houston.bindPopup('<b><font size="3">Houston:<br/><b><font size="2">Population: 6,155,000<br/><b><font size="2">Area: 4,841 sq km<br/><b><font size="2">Country: United States<br/><img src="../maps/WorldCities/images/Houston.jpg" width="500" height="350"/></p>', {minWidth: "auto"});
    var Chicago = L.marker([41.8299906607, -87.7500549741], {icon: greenIcon}).addTo(map);
    Chicago.bindPopup('<b><font size="3">Chicago:<br/><b><font size="2">Population: 9,140,000<br/><b><font size="2">Area: 6,856 sq km<br/><b><font size="2">Country: United States<br/><img src="../maps/WorldCities/images/Chicago.jpg" width="500" height="350"/></p>', {minWidth: "auto"});
    var Denver = L.marker([39.7391880484, -104.984015952], {icon: greenIcon}).addTo(map);
    Denver.bindPopup('<b><font size="3">Denver:<br/><b><font size="2">Population: 2,705,000<br/><b><font size="2">Area: 1,730 sq km<br/><b><font size="2">Country: United States<br/><img src="../maps/WorldCities/images/Denver.jpg" width="500" height="350"/></p>', {minWidth: "auto"});
    var Miami = L.marker([25.7876106964, -80.2241060808], {icon: greenIcon}).addTo(map);
    Miami.bindPopup('<b><font size="3">Miami:<br/><b><font size="2">Population: 6,105,000<br/><b><font size="2">Area: 3,209 sq km<br/><b><font size="2">Country: United States<br/><img src="../maps/WorldCities/images/Miami.jpg" width="500" height="350"/></p>', {minWidth: "auto"});
    var Atlanta = L.marker([33.830013854, -84.3999493833], {icon: greenIcon}).addTo(map);
    Atlanta.bindPopup('<b><font size="3">Atlanta:<br/><b><font size="2">Population: 5,240,000<br/><b><font size="2">Area: 7,296 sq km<br/><b><font size="2">Country: United States<br/><img src="../maps/WorldCities/images/Atlanta.jpg" width="500" height="350"/></p>', {minWidth: "auto"});
    var Caracas = L.marker([10.5009985544, -66.9170371924], {icon: greenIcon}).addTo(map);
    Caracas.bindPopup('<b><font size="3">Caracas:<br/><b><font size="2">Population: 2,880,000<br/><b><font size="2">Area: 295 sq km<br/><b><font size="2">Country: Venezuela<br/><img src="../maps/WorldCities/images/Caracas.jpg" width="500" height="350"/></p>', {minWidth: "auto"});
    var Kiev = L.marker([50.433367329, 30.5166279691], {icon: greenIcon}).addTo(map);
    Kiev.bindPopup('<b><font size="3">Kiev:<br/><b><font size="2">Population: 2,900,920<br/><b><font size="2">Area: 839 sq km<br/><b><font size="2">Country: Ukraine<br/><img src="../maps/WorldCities/images/Kiev.jpg" width="500" height="350"/></p>', {minWidth: "auto"});
    var Dubai = L.marker([25.2299961538, 55.2799743234], {icon: greenIcon}).addTo(map);
    Dubai.bindPopup('<b><font size="3">Dubai:<br/><b><font size="2">Population: 3,805,000<br/><b><font size="2">Area: 1,502 sq km<br/><b><font size="2">Country: United Arab Emirates<br/><img src="../maps/WorldCities/images/Dubai.jpg" width="500" height="350"/></p>', {minWidth: "auto"});
    var Tashkent = L.marker([41.311701883, 69.2949328195], {icon: greenIcon}).addTo(map);
    Tashkent.bindPopup('<b><font size="3">Tashkent:<br/><b><font size="2">Population: 2,280,000<br/><b><font size="2">Area: 1,075 sq km<br/><b><font size="2">Country: Uzbekistan<br/><img src="../maps/WorldCities/images/Tashkent.jpg" width="500" height="350"/></p>', {minWidth: "auto"});
    var Madrid = L.marker([40.4000262645, -3.683351686], {icon: greenIcon}).addTo(map);
    Madrid.bindPopup('<b><font size="3">Madrid:<br/><b><font size="2">Population: 6,310,000<br/><b><font size="2">Area: 1,321 sq km<br/><b><font size="2">Country: Spain<br/><img src="../maps/WorldCities/images/Madrid.jpg" width="500" height="350"/></p>', {minWidth: "auto"});
    var Geneva = L.marker([46.2100075471, 6.14002803409], {icon: greenIcon}).addTo(map);
    Geneva.bindPopup('<b><font size="3">Geneva:<br/><b><font size="2">Population: 198,072<br/><b><font size="2">Area: 15.93 sq km<br/><b><font size="2">Country: Canada<br/><img src="../maps/WorldCities/images/Geneva.jpg" width="500" height="350"/></p>', {minWidth: "auto"});
    var Stockholm = L.marker([59.3507599543, 18.0973347328], {icon: greenIcon}).addTo(map);
    Stockholm.bindPopup('<b><font size="3">Stockholm:<br/><b><font size="2">Population: 1,565,000<br/><b><font size="2">Area: 414 sq km<br/><b><font size="2">Country: Sweden<br/><img src="../maps/WorldCities/images/Stockholm.jpg" width="500" height="350"/></p>', {minWidth: "auto"});
    var Bangkok = L.marker([13.7499992055, 100.516644652], {icon: greenIcon}).addTo(map);
    Bangkok.bindPopup('<b><font size="3">Bangkok:<br/><b><font size="2">Population: 15,645,000<br/><b><font size="2">Area: 3,043 sq km<br/><b><font size="2">Country: Thailand<br/><img src="../maps/WorldCities/images/Bangkok.jpg" width="500" height="350"/></p>', {minWidth: "auto"});
    var Lima = L.marker([-12.0480126761, -77.0500620948], {icon: greenIcon}).addTo(map);
    Lima.bindPopup('<b><font size="3">Lima:<br/><b><font size="2">Population: 11,150,000<br/><b><font size="2">Area: 894 sq km<br/><b><font size="2">Country: Peru<br/><img src="../maps/WorldCities/images/Lima.jpg" width="500" height="350"/></p>', {minWidth: "auto"});
    var Dakar = L.marker([14.715831725, -17.4731301284], {icon: greenIcon}).addTo(map);
    Dakar.bindPopup('<b><font size="3">Dakar:<br/><b><font size="2">Population: 3,320,000<br/><b><font size="2">Area: 194 sq km<br/><b><font size="2">Country: Senegal<br/><img src="../maps/WorldCities/images/Dakar.jpg" width="500" height="350"/></p>', {minWidth: "auto"});
    var Johannesburg = L.marker([-26.17004474, 28.0300097236], {icon: greenIcon}).addTo(map);
    Johannesburg.bindPopup('<b><font size="3">Johannesburg:<br/><b><font size="2">Population: 8,880,000<br/><b><font size="2">Area: 2,590 sq km<br/><b><font size="2">Country: South Africa<br/><img src="../maps/WorldCities/images/Johannesburg.jpg" width="500" height="350"/></p>', {minWidth: "auto"});
    var Amsterdam = L.marker([52.3499686881, 4.91664017601], {icon: greenIcon}).addTo(map);
    Amsterdam.bindPopup('<b><font size="3">Amsterdam:<br/><b><font size="2">Population: 1,650,000<br/><b><font size="2">Area: 505 sq km<br/><b><font size="2">Country: Netherlands<br/><img src="../maps/WorldCities/images/Amsterdam.jpg" width="500" height="350"/></p>', {minWidth: "auto"});
    var Casablanca = L.marker([33.5999762156, -7.61636743309], {icon: greenIcon}).addTo(map);
    Casablanca.bindPopup('<b><font size="3">Casablanca:<br/><b><font size="2">Population: 4,370,000<br/><b><font size="2">Area: 272 sq km<br/><b><font size="2">Country: Morocco<br/><img src="../maps/WorldCities/images/Casablanca.jpg" width="500" height="350"/></p>', {minWidth: "auto"});
    var Seoul = L.marker([37.5663490998, 126.999730997], {icon: greenIcon}).addTo(map);
    Seoul.bindPopup('<b><font size="3">Seoul:<br/><b><font size="2">Population: 24,105,000<br/><b><font size="2">Area: 2,745 sq km<br/><b><font size="2">Country: South Korea<br/><img src="../maps/WorldCities/images/Seoul.jpg" width="500" height="350"/></p>', {minWidth: "auto"});
    var Manila = L.marker([14.6041589548, 120.982217162], {icon: greenIcon}).addTo(map);
    Manila.bindPopup('<b><font size="3">Manila:<br/><b><font size="2">Population: 24,245,000<br/><b><font size="2">Area: 1,787 sq km<br/><b><font size="2">Country: Philippines<br/><img src="../maps/WorldCities/images/Manila.jpg" width="500" height="350"/></p>', {minWidth: "auto"});
    var Monterrey = L.marker([25.6699951365, -100.329984784], {icon: greenIcon}).addTo(map);
    Monterrey.bindPopup('<b><font size="3">Monterrey:<br/><b><font size="2">Population: 4,225,000<br/><b><font size="2">Area: 958 sq km<br/><b><font size="2">Country: Mexico<br/><img src="../maps/WorldCities/images/Monterrey.jpg" width="500" height="350"/></p>', {minWidth: "auto"});
    var Auckland = L.marker([-36.8500130018, 174.764980834], {icon: greenIcon}).addTo(map);
    Auckland.bindPopup('<b><font size="3">Auckland:<br/><b><font size="2">Population: 1,377,000<br/><b><font size="2">Area: 1085 sq km<br/><b><font size="2">Country: New Zealand<br/><img src="../maps/WorldCities/images/Auckland.jpg" width="500" height="350"/></p>', {minWidth: "auto"});
    var Berlin = L.marker([52.5218186636, 13.4015486233], {icon: greenIcon}).addTo(map);
    Berlin.bindPopup('<b><font size="3">Berlin:<br/><b><font size="2">Population: 4,105,000<br/><b><font size="2">Area: 1,347 sq km<br/><b><font size="2">Country: Germany<br/><img src="../maps/WorldCities/images/Berlin.jpg" width="500" height="350"/></p>', {minWidth: "auto"});
    var Urumqi = L.marker([43.8050122264, 87.5750056549], {icon: greenIcon}).addTo(map);
    Urumqi.bindPopup('<b><font size="3">Urumqi:<br/><b><font size="2">Population: 3,440,000<br/><b><font size="2">Area: 583 sq km<br/><b><font size="2">Country: China<br/><img src="../maps/WorldCities/images/Urumqi.jpg" width="500" height="350"/></p>', {minWidth: "auto"});
    var Chengdu = L.marker([30.6700000193, 104.07001949], {icon: greenIcon}).addTo(map);
    Chengdu.bindPopup('<b><font size="3">Chengdu:<br/><b><font size="2">Population: 11,050,000<br/><b><font size="2">Area: 1,735 sq km<br/><b><font size="2">Country: China<br/><img src="../maps/WorldCities/images/Chengdu.jpg" width="500" height="350"/></p>', {minWidth: "auto"});
    var Osaka = L.marker([34.7500352163, 135.460144815], {icon: greenIcon}).addTo(map);
    Osaka.bindPopup('<b><font size="3">Osaka:<br/><b><font size="2">Population: 17,075,000<br/><b><font size="2">Area: 3,212 sq km<br/><b><font size="2">Country: Japan<br/><img src="../maps/WorldCities/images/Osaka.jpg" width="500" height="350"/></p>', {minWidth: "auto"});
    var Kinshasa = L.marker([-4.32972410189, 15.3149718818], {icon: greenIcon}).addTo(map);
    Kinshasa.bindPopup('<b><font size="3">Kinshasa:<br/><b><font size="2">Population: 11,855,000<br/><b><font size="2">Area: 583 sq km<br/><b><font size="2">Country: Congo<br/><img src="../maps/WorldCities/images/Kinshasa.jpg" width="500" height="350"/></p>', {minWidth: "auto"});
    var NewDelhi = L.marker([28.6000230092, 77.1999800201], {icon: greenIcon}).addTo(map);
    NewDelhi.bindPopup('<b><font size="3">New Delhi:<br/><b><font size="2">Population: 21,750,000<br/><b><font size="2">Area: 42.7 sq km<br/><b><font size="2">Country: India<br/><img src="../maps/WorldCities/images/NewDelhi.jpg" width="500" height="350"/></p>', {minWidth: "auto"});
    var Bangalore = L.marker([12.9699951365, 77.5600097238], {icon: greenIcon}).addTo(map);
    Bangalore.bindPopup('<b><font size="3">Bangalore:<br/><b><font size="2">Population: 10,535,000<br/><b><font size="2">Area: 1,166 sq km<br/><b><font size="2">Country: India<br/><img src="../maps/WorldCities/images/Bangalore.jpg" width="500" height="350"/></p>', {minWidth: "auto"});
    var Athens = L.marker([37.9833262319, 23.7333210843], {icon: greenIcon}).addTo(map);
    Athens.bindPopup('<b><font size="3">Athens:<br/><b><font size="2">Population: 3,475,000<br/><b><font size="2">Area: 583 sq km<br/><b><font size="2">Country: Greece<br/><img src="../maps/WorldCities/images/Athens.jpg" width="500" height="350"/></p>', {minWidth: "auto"});
    var Baghdad = L.marker([33.3386484975, 44.3938687732], {icon: greenIcon}).addTo(map);
    Baghdad.bindPopup('<b><font size="3">Baghdad:<br/><b><font size="2">Population: 6,960,000<br/><b><font size="2">Area: 673 sq km<br/><b><font size="2">Country: Iraq<br/><img src="../maps/WorldCities/images/Baghdad.jpg" width="500" height="350"/></p>', {minWidth: "auto"});
    var AddisAbaba = L.marker([9.03331036268, 38.700004434], {icon: greenIcon}).addTo(map);
    AddisAbaba.bindPopup('<b><font size="3">Addis Ababa:<br/><b><font size="2">Population: 3,555,000<br/><b><font size="2">Area: 474 sq km<br/><b><font size="2">Country: Ethiopia<br/><img src="../maps/WorldCities/images/AddisAbaba.jpg" width="500" height="350"/></p>', {minWidth: "auto"});
    var Tehran = L.marker([35.6719427684, 51.4243440336], {icon: greenIcon}).addTo(map);
    Tehran.bindPopup('<b><font size="3">Tehran:<br/><b><font size="2">Population: 13,805,000<br/><b><font size="2">Area: 1,748 sq km<br/><b><font size="2">Country: Iran<br/><img src="../maps/WorldCities/images/Tehran.jpg" width="500" height="350"/></p>', {minWidth: "auto"});
    var Vancouver = L.marker([49.2734165841, -123.121644218], {icon: greenIcon}).addTo(map);
    Vancouver.bindPopup('<b><font size="3">Vancouver:<br/><b><font size="2">Population: 2,300,000<br/><b><font size="2">Area: 876 sq km<br/><b><font size="2">Country: Canada<br/><img src="../maps/WorldCities/images/Vancouver.jpg" width="500" height="350"/></p>', {minWidth: "auto"});
    var Toronto = L.marker([43.6999798778, -79.4200207944], {icon: greenIcon}).addTo(map);
    Toronto.bindPopup('<b><font size="3">Toronto:<br/><b><font size="2">Population: 6,530,000<br/><b><font size="2">Area: 2,300 sq km<br/><b><font size="2">Country: Canada<br/><img src="../maps/WorldCities/images/Toronto.jpg" width="500" height="350"/></p>', {minWidth: "auto"});
    var BuenosAires = L.marker([-34.6025016085, -58.3975313737], {icon: greenIcon}).addTo(map);
    BuenosAires.bindPopup('<b><font size="3">Buenos Aires:<br/><b><font size="2">Population: 15,355,000<br/><b><font size="2">Area: 3,212 sq km<br/><b><font size="2">Country: 3,212<br/><img src="../maps/WorldCities/images/BuenosAires.jpg" width="500" height="350"/></p>', {minWidth: "auto"});
    var Kabul = L.marker([34.5166902863, 69.1832600493], {icon: greenIcon}).addTo(map);
    Kabul.bindPopup('<b><font size="3">Kabul:<br/><b><font size="2">Population: 3,810,000<br/><b><font size="2">Area: 259 sq km<br/><b><font size="2">Country: Afghanistan<br/><img src="../maps/WorldCities/images/Kabul.jpg" width="500" height="350"/></p>', {minWidth: "auto"});
    var Vienna = L.marker([48.2000152782, 16.3666389554], {icon: greenIcon}).addTo(map);
    Vienna.bindPopup('<b><font size="3">Vienna:<br/><b><font size="2">Population: 1,785,000<br/><b><font size="2">Area: 453 sq km<br/><b><font size="2">Country: Austria<br/><img src="../maps/WorldCities/images/Vienna.jpg" width="500" height="350"/></p>', {minWidth: "auto"});
    var Melbourne = L.marker([-37.8200313123, 144.975016235], {icon: greenIcon}).addTo(map);
    Melbourne.bindPopup('<b><font size="3">Melbourne:<br/><b><font size="2">Population: 4,010,000<br/><b><font size="2">Area: 2,543 sq km<br/><b><font size="2">Country: Australia<br/><img src="../maps/WorldCities/images/Melbourne.jpg" width="500" height="350"/></p>', {minWidth: "auto"});
    var Taipei = L.marker([25.03583333333, 121.56833333333], {icon: greenIcon}).addTo(map);
    Taipei.bindPopup('<b><font size="3">Taipei:<br/><b><font size="2">Population: 8,550,000<br/><b><font size="2">Area: 1,140 sq km<br/><b><font size="2">Country: Taiwan<br/><img src="../maps/WorldCities/images/Taipei.jpg" width="500" height="350"/></p>', {minWidth: "auto"});
    var LosAngeles = L.marker([33.9899782502, -118.179980511], {icon: greenIcon}).addTo(map);
    LosAngeles.bindPopup('<b><font size="3">Los Angeles:<br/><b><font size="2">Population: 15,500,000<br/><b><font size="2">Area: 6,299 sq km<br/><b><font size="2">Country: United States<br/><img src="../maps/WorldCities/images/LosAngeles.jpg" width="500" height="350"/></p>', {minWidth: "auto"});
    var WashingtonDC = L.marker([38.8995493765, -77.0094185808], {icon: greenIcon}).addTo(map);
    WashingtonDC.bindPopup('<b><font size="3">Washington D.C.:<br/><b><font size="2">Population: 5,100,000<br/><b><font size="2">Area: 3,424 sq km<br/><b><font size="2">Country: United States<br/><img src="../maps/WorldCities/images/WashingtonDC.jpg" width="500" height="350"/></p>', {minWidth: "auto"});
    var NewYork = L.marker([40.749979064, -73.9800169288], {icon: greenIcon}).addTo(map);
    NewYork.bindPopup('<b><font size="3">New York:<br/><b><font size="2">Population: 21,445,000<br/><b><font size="2">Area: 11,875 sq km<br/><b><font size="2">Country: United States<br/><img src="../maps/WorldCities/images/NewYork.jpg" width="500" height="350"/></p>', {minWidth: "auto"});
    var London = L.marker([51.4999947297, -0.11672184386], {icon: greenIcon}).addTo(map);
    London.bindPopup('<b><font size="3">London:<br/><b><font size="2">Population: 10,470,000<br/><b><font size="2">Area: 1,738 sq km<br/><b><font size="2">Country: United Kingdom<br/><img src="../maps/WorldCities/images/London.jpg" width="500" height="350"/></p>', {minWidth: "auto"});
    var Istanbul = L.marker([41.1049961538, 29.0100015856], {icon: greenIcon}).addTo(map);
    Istanbul.bindPopup('<b><font size="3">Istanbul:<br/><b><font size="2">Population: 13,755,000<br/><b><font size="2">Area: 1,360 sq km<br/><b><font size="2">Country: Turkey<br/><img src="../maps/WorldCities/images/Istanbul.jpg" width="500" height="350"/></p>', {minWidth: "auto"});
    var Riyadh = L.marker([24.6408331492, 46.7727416573], {icon: greenIcon}).addTo(map);
    Riyadh.bindPopup('<b><font size="3">Riyadh:<br/><b><font size="2">Population: 6,030,000<br/><b><font size="2">Area: 1,658 sq km<br/><b><font size="2">Country: Saudi Arabia	<br/><img src="../maps/WorldCities/images/Riyadh.jpg" width="500" height="350"/></p>', {minWidth: "auto"});
    var CapeTown = L.marker([-33.9200109672, 18.4349881578], {icon: greenIcon}).addTo(map);
    CapeTown.bindPopup('<b><font size="3">Cape Town:<br/><b><font size="2">Population: 3,925,000<br/><b><font size="2">Area:816 sq km<br/><b><font size="2">Country: South Africa<br/><img src="../maps/WorldCities/images/CapeTown.jpg" width="500" height="350"/></p>', {minWidth: "auto"});
    var Moscow = L.marker([55.7521641226, 37.6155228259], {icon: greenIcon}).addTo(map);
    Moscow.bindPopup('<b><font size="3">Moscow:<br/><b><font size="2">Population: 16,710,000<br/><b><font size="2">Area: 5,698 sq km<br/><b><font size="2">Country: Russia<br/><img src="../maps/WorldCities/images/Moscow.jpg" width="500" height="350"/></p>', {minWidth: "auto"});
    var MexicoCity = L.marker([19.4424424428, -99.1309882017], {icon: greenIcon}).addTo(map);
    MexicoCity.bindPopup('<b><font size="3">MexicoCity:<br/><b><font size="2">Population: 20,400,000<br/><b><font size="2">Area: 2,370 sq km<br/><b><font size="2">Country: Mexico<br/><img src="../maps/WorldCities/images/MexicoCity.jpg" width="500" height="350"/></p>', {minWidth: "auto"});
    var Lagos = L.marker([6.44326165348, 3.39153107121], {icon: greenIcon}).addTo(map);
    Lagos.bindPopup('<b><font size="3">Lagos:<br/><b><font size="2">Population: 13,360,000<br/><b><font size="2">Area: 1,425 sq km<br/><b><font size="2">Country: Nigeria<br/><img src="../maps/WorldCities/images/Lagos.jpg" width="500" height="350"/></p>', {minWidth: "auto"});
    var Rome = L.marker([41.8959556265, 12.4832584215], {icon: greenIcon}).addTo(map);
    Rome.bindPopup('<b><font size="3">Rome:<br/><b><font size="2">Population: 3,950,000<br/><b><font size="2">Area: 1,114 sq km<br/><b><font size="2">Country: Italy<br/><img src="../maps/WorldCities/images/Rome.jpg" width="500" height="350"/></p>', {minWidth: "auto"});
    var Beijing = L.marker([39.9288922313, 116.388285684], {icon: greenIcon}).addTo(map);
    Beijing.bindPopup('<b><font size="3">Beijing:<br/><b><font size="2">Population: 20,415,000<br/><b><font size="2">Area: 4,144 sq km<br/><b><font size="2">Country: China<br/><img src="../maps/WorldCities/images/Beijing.jpg" width="500" height="350"/></p>', {minWidth: "auto"});
    var Nairobi = L.marker([-1.28334674185, 36.8166568591], {icon: greenIcon}).addTo(map);
    Nairobi.bindPopup('<b><font size="3">Nairobi:<br/><b><font size="2">Population: 5,545,000<br/><b><font size="2">Area: 829 sq km<br/><b><font size="2">Country: Kenya<br/><img src="../maps/WorldCities/images/Nairobi.jpg" width="500" height="350"/></p>', {minWidth: "auto"});
    var Jakarta = L.marker([-6.17441770541, 106.829437621], {icon: greenIcon}).addTo(map);
    Jakarta.bindPopup('<b><font size="3">Jakarta:<br/><b><font size="2">Population: 31,760,000<br/><b><font size="2">Area: 3,302 sq km <br/><b><font size="2">Country: Indonesia<br/><img src="../maps/WorldCities/images/Jakarta.jpg" width="500" height="350"/></p>', {minWidth: "auto"});
    var Bogota = L.marker([4.59642356253, -74.0833439552], {icon: greenIcon}).addTo(map);
    Bogota.bindPopup('<b><font size="3">Bogota:<br/><b><font size="2">Population: 9,740,000<br/><b><font size="2">Area: 562 sq km<br/><b><font size="2">Country: Colombia<br/><img src="../maps/WorldCities/images/Bogota.jpg" width="500" height="350"/></p>', {minWidth: "auto"});
    var Cairo = L.marker([30.0499603465, 31.2499682197], {icon: greenIcon}).addTo(map);
    Cairo.bindPopup('<b><font size="3">Cairo:<br/><b><font size="2">Population: 16,225,000<br/><b><font size="2">Area: 1,917 sq km<br/><b><font size="2">Country: Egypt<br/><img src="../maps/WorldCities/images/Cairo.jpg" width="500" height="350"/></p>', {minWidth: "auto"});
    var Shanghai = L.marker([31.2164524526, 121.436504678], {icon: greenIcon}).addTo(map);
    Shanghai.bindPopup('<b><font size="3">Shanghai:<br/><b><font size="2">Population: 23,390,000<br/><b><font size="2">Area: 3,885 sq km<br/><b><font size="2">Country: India<br/><img src="../maps/WorldCities/images/Shanghai.jpg" width="500" height="350"/></p>', {minWidth: "auto"});
    var Tokyo = L.marker([35.6850169058, 139.751407429], {icon: greenIcon}).addTo(map);
    Tokyo.bindPopup('<b><font size="3">Tokyo:<br/><b><font size="2">Population: 37,900,000<br/><b><font size="2">Area: 8,547 sq km<br/><b><font size="2">Country: Japan<br/><img src="../maps/WorldCities/images/Tokyo.jpg" width="500" height="350"/></p>', {minWidth: "auto"});
    var Mumbai = L.marker([19.0169903757, 72.8569892974], {icon: greenIcon}).addTo(map);
    Mumbai.bindPopup('<b><font size="3">Mumbai:<br/><b><font size="2">Population: 22,885,000<br/><b><font size="2">Area: 881 sq km<br/><b><font size="2">Country: India<br/><img src="../maps/WorldCities/images/Mumbai.jpg" width="500" height="350"/></p>', {minWidth: "auto"});
    var Paris = L.marker([48.8666929312, 2.33333532574], {icon: greenIcon}).addTo(map);
    Paris.bindPopup('<b><font size="3">Paris:<br/><b><font size="2">Population: 10,950,000<br/><b><font size="2">Area: 2,845 sq km<br/><b><font size="2">Country: France<br/><img src="../maps/WorldCities/images/Paris.jpg" width="500" height="350"/></p>', {minWidth: "auto"});
    var Santiago = L.marker([-33.4500138155, -70.6670408546], {icon: greenIcon}).addTo(map);
    Santiago.bindPopup('<b><font size="3">Santiago:<br/><b><font size="2">Population: 6,310,000<br/><b><font size="2">Area: 1,140 sq km<br/><b><font size="2">Country: Chile<br/><img src="../maps/WorldCities/images/Santiago.jpg" width="500" height="350"/></p>', {minWidth: "auto"});
    var Kolkata = L.marker([22.4949692983, 88.3246756581], {icon: greenIcon}).addTo(map);
    Kolkata.bindPopup('<b><font size="3">Kolkata:<br/><b><font size="2">Population: 14,950,000<br/><b><font size="2">Area: 1,347 sq km<br/><b><font size="2">Country: India<br/><img src="../maps/WorldCities/images/Kolkata.jpg" width="500" height="350"/></p>', {minWidth: "auto"});
    var RiodeJaneiro = L.marker([-22.9250231742, -43.2250207942], {icon: greenIcon}).addTo(map);
    RiodeJaneiro.bindPopup('<b><font size="3">Rio De Janeiro:<br/><b><font size="2">Population: 11,900,000<br/><b><font size="2">Area: 2,020 sq km<br/><b><font size="2">Country: Brazil<br/><img src="../maps/WorldCities/images/RiodeJaneiro.jpg" width="500" height="350"/></p>', {minWidth: "auto"});
    var SaoPaulo = L.marker([-23.558679587, -46.6250199804], {icon: greenIcon}).addTo(map);
    SaoPaulo.bindPopup('<b><font size="3">Sao Paulo:<br/><b><font size="2">Population: 21,242,939<br/><b><font size="2">Area: 3,043	sq km<br/><b><font size="2">Country: Brazil<br/><img src="../maps/WorldCities/images/SaoPaulo.jpg" width="500" height="350"/></p>', {minWidth: "auto"});
    var Sydney = L.marker([-33.9200109672, 151.185179809], {icon: greenIcon}).addTo(map);
    Sydney.bindPopup('<b><font size="3">Sydney:<br/><b><font size="2">Population: 4,100,000<br/><b><font size="2">Area: 2,037 sq km <br/><b><font size="2">Country: Australia<br/><img src="../maps/WorldCities/images/Sydney.jpg" width="500" height="350"/></p>', {minWidth: "auto"});
    var Singapore = L.marker([1.29303346649, 103.855820678], {icon: greenIcon}).addTo(map);
    Singapore.bindPopup('<b><font size="3">Singapore:<br/><b><font size="2">Population: 5,825,000<br/><b><font size="2">Area: 518 sq km<br/><b><font size="2">Country: Republic of Singapore<br/><img src="../maps/WorldCities/images/Singapore.jpg" width="500" height="350"/></p>', {minWidth: "auto"});
    var HongKong = L.marker([22.304980895, 114.185009317], {icon: greenIcon}).addTo(map);
    HongKong.bindPopup('<b><font size="3">Hong Kong:<br/><b><font size="2">Population: 7,330,000<br/><b><font size="2">Area: 285 sq km<br/><b><font size="2">Country: China<br/><img src="../maps/WorldCities/images/HongKong.jpg" width="500" height="350"/></p>', {minWidth: "auto"});
    
    
};
