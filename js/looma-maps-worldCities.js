window.onload = function(){
var map = L.map('map').setView([0,0], 3);
L.tileLayer('../maps/WorldCities/{z}/{x}/{y}.png', {
  minZoom:3,
  maxZoom: 5,
}).addTo(map);

var southWest = L.latLng(-85.0511, -180)
northEast = L.latLng(85.0511, 180);
var bounds = L.latLngBounds(southWest, northEast);
map.setMaxBounds(bounds);
map.on('drag', function() {
map.panInsideBounds(bounds, { animate: false });
});

var greenIcon = L.icon({
  iconUrl: "../content/WorldCitiesImages/building.png",
  iconSize:     [20, 20], // size of the icon
  iconAnchor:   [5, 5], // point of the icon which will correspond to marker's location
  popupAnchor:  [5, 5] // point from which the popup should open relative to the iconAnchor
});


var SanFrancisco = L.marker([37.7400077505,	-122.459977663],{icon: greenIcon}).addTo(map);
SanFrancisco.bindPopup('<b><font size="3">San Francisco:<br/><b><font size="2">Population: 6,455,000<br/><b><font size="2">Area: 2,865 sq km<br/><b><font size="2">Country: United States<br/><img src="../content/WorldCitiesImages/SanFrancisco.jpg" width="300" height="240"/></p>').openPopup();
var Houston = L.marker([29.8199743846,	-95.3399792905], {icon: greenIcon}).addTo(map);
Houston.bindPopup('<b><font size="3">Houston:<br/><b><font size="2">Population: 6,155,000<br/><b><font size="2">Area: 4,841 sq km<br/><b><font size="2">Country: United States<br/><img src="../content/WorldCitiesImages/Houston.jpg" width="300" height="240"/></p>').openPopup();
var Chicago = L.marker([41.8299906607,	-87.7500549741], {icon: greenIcon}).addTo(map);
Chicago.bindPopup('<b><font size="3">Chicago:<br/><b><font size="2">Population: 9,140,000<br/><b><font size="2">Area: 6,856 sq km<br/><b><font size="2">Country: United States<br/><img src="../content/WorldCitiesImages/Chicago.jpg" width="300" height="240"/></p>').openPopup();
var Denver = L.marker([39.7391880484, -104.984015952], {icon: greenIcon}).addTo(map);
Denver.bindPopup('<b><font size="3">Denver:<br/><b><font size="2">Population: 2,705,000<br/><b><font size="2">Area: 1,730 sq km<br/><b><font size="2">Country: United States<br/><img src="../content/WorldCitiesImages/Denver.jpg" width="300" height="240"/></p>').openPopup();
var Miami = L.marker([25.7876106964,	-80.2241060808], {icon: greenIcon}).addTo(map);
Miami.bindPopup('<b><font size="3">Miami:<br/><b><font size="2">Population: 6,105,000<br/><b><font size="2">Area: 3,209 sq km<br/><b><font size="2">Country: United States<br/><img src="../content/WorldCitiesImages/Miami.jpg" width="300" height="240"/></p>').openPopup();
var Atlanta = L.marker([33.830013854,	-84.3999493833], {icon: greenIcon}).addTo(map);
Atlanta.bindPopup('<b><font size="3">Atlanta:<br/><b><font size="2">Population: 5,240,000<br/><b><font size="2">Area: 7,296 sq km<br/><b><font size="2">Country: United States<br/><img src="../content/WorldCitiesImages/Atlanta.jpg" width="300" height="200"/></p>').openPopup();
var Caracas = L.marker([10.5009985544,	-66.9170371924	], {icon: greenIcon}).addTo(map);
Caracas.bindPopup('<b><font size="3">Caracas:<br/><b><font size="2">Population: 2,880,000<br/><b><font size="2">Area: 295 sq km<br/><b><font size="2">Country: Venezuela<br/><img src="../content/WorldCitiesImages/Caracas.jpg" width="300" height="240"/></p>').openPopup();
var Kiev = L.marker([50.433367329,	30.5166279691], {icon: greenIcon}).addTo(map);
Kiev.bindPopup('<b><font size="3">Kiev:<br/><b><font size="2">Population: 2,900,920<br/><b><font size="2">Area: 839 sq km<br/><b><font size="2">Country: Ukraine<br/><img src="../content/WorldCitiesImages/Kiev.jpg" width="300" height="240"/></p>').openPopup();
var Dubai = L.marker([25.2299961538,	55.2799743234], {icon: greenIcon}).addTo(map);
Dubai.bindPopup('<b><font size="3">Dubai:<br/><b><font size="2">Population: 3,805,000<br/><b><font size="2">Area: 1,502 sq km<br/><b><font size="2">Country: United Arab Emirates<br/><b><font size="2">Population: 2,788,929<br/><b><font size="2">Area: 1,287.4km2  (497.1 sq mi)<br/><b><font size="2">Country: United Arab Emirates<br/><img src="../content/WorldCitiesImages/Dubai.jpg" width="300" height="240"/></p>').openPopup();
var Tashkent = L.marker([41.311701883,	69.2949328195	], {icon: greenIcon}).addTo(map);
Tashkent.bindPopup('<b><font size="3">Tashkent:<br/><b><font size="2">Population: 2,280,000<br/><b><font size="2">Area: 1,075 sq km<br/><b><font size="2">Country: Uzbekistan<br/><img src="../content/WorldCitiesImages/Tashkent.jpg" width="300" height="240"/></p>').openPopup();
var Madrid = L.marker([40.4000262645,	-3.683351686], {icon: greenIcon}).addTo(map);
Madrid.bindPopup('<b><font size="3">Madrid:<br/><b><font size="2">Population: 6,310,000<br/><b><font size="2">Area: 1,321 sq km<br/><b><font size="2">Country: Spain<br/><img src="../content/WorldCitiesImages/Madrid.jpg" width="300" height="240"/></p>').openPopup();
var Geneva = L.marker([46.2100075471,	6.14002803409], {icon: greenIcon}).addTo(map);
Geneva.bindPopup('<b><font size="3">Geneva:<br/><b><font size="2">Population: 198,072<br/><b><font size="2">Area: 15.93 sq km<br/><b><font size="2">Country: Canada<br/><img src="../content/WorldCitiesImages/Geneva.jpg" width="300" height="240"/></p>').openPopup();
var Stockholm	 = L.marker([59.3507599543,	18.0973347328], {icon: greenIcon}).addTo(map);
Stockholm.bindPopup('<b><font size="3">Stockholm:<br/><b><font size="2">Population: 1,565,000<br/><b><font size="2">Area: 414 sq km<br/><b><font size="2">Country: Sweden<br/><img src="../content/WorldCitiesImages/Stockholm.jpg" width="300" height="240"/></p>').openPopup();
var Bangkok	 = L.marker([13.7499992055,	100.516644652], {icon: greenIcon}).addTo(map);
Bangkok.bindPopup('<b><font size="3">Bangkok:<br/><b><font size="2">Population: 15,645,000<br/><b><font size="2">Area: 3,043 sq km<br/><b><font size="2">Country: Thailand<br/><img src="../content/WorldCitiesImages/Bangkok.jpg" width="300" height="240"/></p>').openPopup();
var Lima	 = L.marker([-12.0480126761,	-77.0500620948], {icon: greenIcon}).addTo(map);
Lima.bindPopup('<b><font size="3">Lima:<br/><b><font size="2">Population: 11,150,000<br/><b><font size="2">Area: 894 sq km<br/><b><font size="2">Country: Peru<br/><img src="../content/WorldCitiesImages/Lima.jpg" width="300" height="200"/></p>').openPopup();
var Dakar = L.marker([14.715831725,	-17.4731301284], {icon: greenIcon}).addTo(map);
Dakar.bindPopup('<b><font size="3">Dakar:<br/><b><font size="2">Population: 3,320,000<br/><b><font size="2">Area: 194 sq km<br/><b><font size="2">Country: Senegal<br/><img src="../content/WorldCitiesImages/Dakar.jpg" width="300" height="240"/></p>').openPopup();
var Johannesburg = L.marker([-26.17004474,	28.0300097236], {icon: greenIcon}).addTo(map);
Johannesburg.bindPopup('<b><font size="3">Johannesburg:<br/><b><font size="2">Population: 8,880,000<br/><b><font size="2">Area: 2,590 sq km<br/><b><font size="2">Country: South Africa<br/><img src="../content/WorldCitiesImages/Johannesburg.jpg" width="300" height="240"/></p>').openPopup();
var Amsterdam = L.marker([52.3499686881,	4.91664017601], {icon: greenIcon}).addTo(map);
Amsterdam.bindPopup('<b><font size="3">Amsterdam:<br/><b><font size="2">Population: 1,650,000<br/><b><font size="2">Area: 505 sq km<br/><b><font size="2">Country: Netherlands<br/><img src="../content/WorldCitiesImages/Amsterdam.jpg" width="300" height="240"/></p>').openPopup();
var Casablanca = L.marker([33.5999762156,	-7.61636743309], {icon: greenIcon}).addTo(map);
Casablanca.bindPopup('<b><font size="3">Casablanca:<br/><b><font size="2">Population: 4,370,000<br/><b><font size="2">Area: 272 sq km<br/><b><font size="2">Country: Morocco<br/><img src="../content/WorldCitiesImages/Casablanca.jpg" width="300" height="240"/></p>').openPopup();
var Seoul = L.marker([37.5663490998, 126.999730997], {icon: greenIcon}).addTo(map);
Seoul.bindPopup('<b><font size="3">Seoul:<br/><b><font size="2">Population: 24,105,000<br/><b><font size="2">Area: 2,745 sq km<br/><b><font size="2">Country: South Korea<br/><img src="../content/WorldCitiesImages/Seoul.jpg" width="300" height="240"/></p>').openPopup();
var Manila = L.marker([14.6041589548,	120.982217162], {icon: greenIcon}).addTo(map);
Manila.bindPopup('<b><font size="3">Manila:<br/><b><font size="2">Population: 24,245,000<br/><b><font size="2">Area: 1,787 sq km<br/><b><font size="2">Country: Philippines<br/><img src="../content/WorldCitiesImages/Manila.jpg" width="300" height="240"/></p>').openPopup();
var Monterrey = L.marker([25.6699951365,	-100.329984784], {icon: greenIcon}).addTo(map);
Monterrey.bindPopup('<b><font size="3">Monterrey:<br/><b><font size="2">Population: 4,225,000<br/><b><font size="2">Area: 958 sq km<br/><b><font size="2">Country: Mexico<br/><img src="../content/WorldCitiesImages/Monterrey.jpg" width="300" height="240"/></p>').openPopup();
var Auckland = L.marker([-36.8500130018, 174.764980834], {icon: greenIcon}).addTo(map);
Auckland.bindPopup('<b><font size="3">Auckland:<br/><b><font size="2">Population: 1,377,000<br/><b><font size="2">Area: 1085 sq km<br/><b><font size="2">Country: New Zealand<br/><img src="../content/WorldCitiesImages/Auckland.jpg" width="300" height="240"/></p>').openPopup();
var Berlin = L.marker([52.5218186636,	13.4015486233], {icon: greenIcon}).addTo(map);
Berlin.bindPopup('<b><font size="3">Berlin:<br/><b><font size="2">Population: 4,105,000<br/><b><font size="2">Area: 1,347 sq km<br/><b><font size="2">Country: Germany<br/><img src="../content/WorldCitiesImages/Berlin.jpg" width="300" height="240"/></p>').openPopup();
var Urumqi = L.marker([43.8050122264,	87.5750056549], {icon: greenIcon}).addTo(map);
Urumqi.bindPopup('<b><font size="3">Urumqi:<br/><b><font size="2">Population: 3,440,000<br/><b><font size="2">Area: 583 sq km<br/><b><font size="2">Country: China<br/><img src="../content/WorldCitiesImages/Urumqi.jpg" width="300" height="240"/></p>').openPopup();
var Chengdu	 = L.marker([30.6700000193,	104.07001949], {icon: greenIcon}).addTo(map);
Chengdu.bindPopup('<b><font size="3">Chengdu:<br/><b><font size="2">Population: 11,050,000<br/><b><font size="2">Area: 1,735 sq km<br/><b><font size="2">Country: China<br/><img src="../content/WorldCitiesImages/Chengdu.jpg" width="300" height="240"/></p>').openPopup();
var Osaka	 = L.marker([34.7500352163,	135.460144815], {icon: greenIcon}).addTo(map);
Osaka.bindPopup('<b><font size="3">Osaka:<br/><b><font size="2">Population: 17,075,000<br/><b><font size="2">Area: 3,212 sq km<br/><b><font size="2">Country: Japan<br/><img src="../content/WorldCitiesImages/Osaka.jpg" width="300" height="240"/></p>').openPopup();
var Kinshasa	= L.marker([-4.32972410189,	15.3149718818], {icon: greenIcon}).addTo(map);
Kinshasa.bindPopup('<b><font size="3">Kinshasa:<br/><b><font size="2">Population: 11,855,000<br/><b><font size="2">Area: 583 sq km<br/><b><font size="2">Country: Congo<br/><img src="../content/WorldCitiesImages/Kinshasa.jpg" width="300" height="240"/></p>').openPopup();
var NewDelhi	 = L.marker([28.6000230092,	77.1999800201], {icon: greenIcon}).addTo(map);
NewDelhi.bindPopup('<b><font size="3">New Delhi:<br/><b><font size="2">Population: 21,750,000<br/><b><font size="2">Area: 42.7 sq km<br/><b><font size="2">Country: India<br/><img src="../content/WorldCitiesImages/NewDelhi.jpg" width="300" height="240"/></p>').openPopup();
var Bangalore	 = L.marker([12.9699951365,	77.5600097238], {icon: greenIcon}).addTo(map);
Bangalore.bindPopup('<b><font size="3">Bangalore:<br/><b><font size="2">Population: 10,535,000<br/><b><font size="2">Area: 1,166 sq km<br/><b><font size="2">Country: India<br/><img src="../content/WorldCitiesImages/Bangalore.jpg" width="300" height="240"/></p>').openPopup();
var Athens	 = L.marker([37.9833262319,	23.7333210843], {icon: greenIcon}).addTo(map);
Athens.bindPopup('<b><font size="3">Athens:<br/><b><font size="2">Population: 3,475,000<br/><b><font size="2">Area: 583 sq km<br/><b><font size="2">Country: Greece<br/><img src="../content/WorldCitiesImages/Athens.jpg" width="300" height="220"/></p>').openPopup();
var Baghdad	 = L.marker([33.3386484975,	44.3938687732], {icon: greenIcon}).addTo(map);
Baghdad.bindPopup('<b><font size="3">Baghdad:<br/><b><font size="2">Population: 6,960,000<br/><b><font size="2">Area: 673 sq km<br/><b><font size="2">Country: Iraq<br/><img src="../content/WorldCitiesImages/Baghdad.jpg" width="300" height="240"/></p>').openPopup();
var AddisAbaba		 = L.marker([9.03331036268,	38.700004434], {icon: greenIcon}).addTo(map);
AddisAbaba.bindPopup('<b><font size="3">Addis Ababa:<br/><b><font size="2">Population: 3,555,000<br/><b><font size="2">Area: 474 sq km<br/><b><font size="2">Country: Ethiopia<br/><img src="../content/WorldCitiesImages/AddisAbaba.jpg" width="300" height="240"/></p>').openPopup();
var Tehran	 = L.marker([35.6719427684,	51.4243440336], {icon: greenIcon}).addTo(map);
Tehran.bindPopup('<b><font size="3">Tehran:<br/><b><font size="2">Population: 13,805,000<br/><b><font size="2">Area: 1,748 sq km<br/><b><font size="2">Country: Iran<br/><img src="../content/WorldCitiesImages/Tehran.jpg" width="300" height="240"/></p>').openPopup();
var Vancouver	 = L.marker([49.2734165841,	-123.121644218], {icon: greenIcon}).addTo(map);
Vancouver.bindPopup('<b><font size="3">Vancouver:<br/><b><font size="2">Population: 2,300,000<br/><b><font size="2">Area: 876 sq km<br/><b><font size="2">Country: Canada<br/><img src="../content/WorldCitiesImages/Vancouver.jpg" width="300" height="240"/></p>').openPopup();
var Toronto	 = L.marker([43.6999798778,	-79.4200207944], {icon: greenIcon}).addTo(map);
Toronto.bindPopup('<b><font size="3">Toronto:<br/><b><font size="2">Population: 6,530,000<br/><b><font size="2">Area: 2,300 sq km<br/><b><font size="2">Country: Canada<br/><img src="../content/WorldCitiesImages/Toronto.jpg" width="300" height="240"/></p>').openPopup();
var BuenosAires		 = L.marker([-34.6025016085,	-58.3975313737], {icon: greenIcon}).addTo(map);
BuenosAires.bindPopup('<b><font size="3">Buenos Aires:<br/><b><font size="2">Population: 15,355,000<br/><b><font size="2">Area: 3,212 sq km<br/><b><font size="2">Country: 3,212<br/><img src="../content/WorldCitiesImages/BuenosAires.jpg" width="300" height="240"/></p>').openPopup();
var Kabul	 = L.marker([34.5166902863,	69.1832600493], {icon: greenIcon}).addTo(map);
Kabul.bindPopup('<b><font size="3">Kabul:<br/><b><font size="2">Population: 3,810,000<br/><b><font size="2">Area: 259 sq km<br/><b><font size="2">Country: Afghanistan<br/><img src="../content/WorldCitiesImages/Kabul.jpg" width="300" height="240"/></p>').openPopup();
var Vienna	 = L.marker([48.2000152782,	16.3666389554], {icon: greenIcon}).addTo(map);
Vienna.bindPopup('<b><font size="3">Vienna:<br/><b><font size="2">Population: 1,785,000<br/><b><font size="2">Area: 453 sq km<br/><b><font size="2">Country: Austria<br/><img src="../content/WorldCitiesImages/Vienna.jpg" width="300" height="240"/></p>').openPopup();
var Melbourne		 = L.marker([-37.8200313123,	144.975016235], {icon: greenIcon}).addTo(map);
Melbourne.bindPopup('<b><font size="3">Melbourne:<br/><b><font size="2">Population: 4,010,000<br/><b><font size="2">Area: 2,543 sq km<br/><b><font size="2">Country: Australia<br/><img src="../content/WorldCitiesImages/Melbourne.jpg" width="300" height="240"/></p>').openPopup();
var Taipei	 = L.marker([25.03583333333,	121.56833333333], {icon: greenIcon}).addTo(map);
Taipei.bindPopup('<b><font size="3">Taipei:<br/><b><font size="2">Population: 8,550,000<br/><b><font size="2">Area: 1,140 sq km<br/><b><font size="2">Country: Taiwan<br/><img src="../content/WorldCitiesImages/Taipei.jpg" width="300" height="240"/></p>').openPopup();
var LosAngeles	 = L.marker([33.9899782502,	-118.179980511], {icon: greenIcon}).addTo(map);
LosAngeles.bindPopup('<b><font size="3">LosAngeles:<br/><b><font size="2">Population: 15,500,000<br/><b><font size="2">Area: 6,299 sq km<br/><b><font size="2">Country: United States<br/><img src="../content/WorldCitiesImages/LosAngeles.jpg" width="300" height="240"/></p>').openPopup();
var WashingtonDC	 = L.marker([38.8995493765,	-77.0094185808], {icon: greenIcon}).addTo(map);
WashingtonDC.bindPopup('<b><font size="3">Washington D.C.:<br/><b><font size="2">Population: 5,100,000<br/><b><font size="2">Area: 3,424 sq km<br/><b><font size="2">Country: United States<br/><img src="../content/WorldCitiesImages/WashingtonDC.jpg" width="300" height="240"/></p>').openPopup();
var NewYork	 = L.marker([40.749979064,	-73.9800169288], {icon: greenIcon}).addTo(map);
NewYork.bindPopup('<b><font size="3">New York:<br/><b><font size="2">Population: 21,445,000<br/><b><font size="2">Area: 11,875 sq km<br/><b><font size="2">Country: United States<br/><img src="../content/WorldCitiesImages/NewYork.jpg" width="300" height="210"/></p>').openPopup();
var London = L.marker([51.4999947297,	-0.11672184386], {icon: greenIcon}).addTo(map);
London.bindPopup('<b><font size="3">London:<br/><b><font size="2">Population: 10,470,000<br/><b><font size="2">Area: 1,738 sq km<br/><b><font size="2">Country: United Kingdom<br/><img src="../content/WorldCitiesImages/London.jpg" width="300" height="240"/></p>').openPopup();
var Istanbul = L.marker([41.1049961538,	29.0100015856], {icon: greenIcon}).addTo(map);
Istanbul.bindPopup('<b><font size="3">Istanbul:<br/><b><font size="2">Population: 13,755,000<br/><b><font size="2">Area: 1,360 sq km<br/><b><font size="2">Country: Turkey<br/><img src="../content/WorldCitiesImages/Istanbul.jpg" width="300" height="240"/></p>').openPopup();
var Riyadh	= L.marker([24.6408331492,	46.7727416573], {icon: greenIcon}).addTo(map);
Riyadh.bindPopup('<b><font size="3">Riyadh:<br/><b><font size="2">Population: 6,030,000<br/><b><font size="2">Area: 1,658 sq km<br/><b><font size="2">Country: Saudi Arabia	<br/><img src="../content/WorldCitiesImages/Riyadh.jpg" width="300" height="240"/></p>').openPopup();
var CapeTown	 = L.marker([-33.9200109672,	18.4349881578], {icon: greenIcon}).addTo(map);
CapeTown.bindPopup('<b><font size="3">Cape Town:<br/><b><font size="2">Population: 3,925,000<br/><b><font size="2">Area:816 sq km<br/><b><font size="2">Country: South Africa<br/><img src="../content/WorldCitiesImages/CapeTown.jpg" width="300" height="240"/></p>').openPopup();
var Moscow	 = L.marker([55.7521641226,	37.6155228259], {icon: greenIcon}).addTo(map);
Moscow.bindPopup('<b><font size="3">Moscow:<br/><b><font size="2">Population: 16,710,000<br/><b><font size="2">Area: 5,698 sq km<br/><b><font size="2">Country: Russia<br/><img src="../content/WorldCitiesImages/Moscow.jpg" width="300" height="240"/></p>').openPopup();
var MexicoCity	 = L.marker([19.4424424428,	-99.1309882017], {icon: greenIcon}).addTo(map);
MexicoCity.bindPopup('<b><font size="3">MexicoCity:<br/><b><font size="2">Population: 20,400,000<br/><b><font size="2">Area: 2,370 sq km<br/><b><font size="2">Country: Mexico<br/><img src="../content/WorldCitiesImages/MexicoCity.jpg" width="300" height="240"/></p>').openPopup();
var Lagos	 = L.marker([6.44326165348,	3.39153107121], {icon: greenIcon}).addTo(map);
Lagos.bindPopup('<b><font size="3">Lagos:<br/><b><font size="2">Population: 13,360,000<br/><b><font size="2">Area: 1,425 sq km<br/><b><font size="2">Country: Nigeria<br/><img src="../content/WorldCitiesImages/Lagos.jpg" width="300" height="240"/></p>').openPopup();
var Rome	 = L.marker([41.8959556265,	12.4832584215], {icon: greenIcon}).addTo(map);
Rome.bindPopup('<b><font size="3">Rome:<br/><b><font size="2">Population: 3,950,000<br/><b><font size="2">Area: 1,114 sq km<br/><b><font size="2">Country: Italy<br/><img src="../content/WorldCitiesImages/Rome.jpg" width="300" height="170"/></p>').openPopup();
var Beijing	 = L.marker([39.9288922313,	116.388285684], {icon: greenIcon}).addTo(map);
Beijing.bindPopup('<b><font size="3">Beijing:<br/><b><font size="2">Population: 20,415,000<br/><b><font size="2">Area: 4,144 sq km<br/><b><font size="2">Country: China<br/><img src="../content/WorldCitiesImages/Beijing.jpg" width="300" height="240"/></p>').openPopup();
var Nairobi	 = L.marker([-1.28334674185,	36.8166568591], {icon: greenIcon}).addTo(map);
Nairobi.bindPopup('<b><font size="3">Nairobi:<br/><b><font size="2">Population: 5,545,000<br/><b><font size="2">Area: 829 sq km<br/><b><font size="2">Country: Kenya<br/><img src="../content/WorldCitiesImages/Nairobi.jpg" width="300" height="240"/></p>').openPopup();
var Jakarta	 = L.marker([-6.17441770541,	106.829437621	], {icon: greenIcon}).addTo(map);
Jakarta.bindPopup('<b><font size="3">Jakarta:<br/><b><font size="2">Population: 31,760,000<br/><b><font size="2">Area: 3,302 sq km <br/><b><font size="2">Country: Indonesia<br/><img src="../content/WorldCitiesImages/Jakarta.jpg" width="300" height="240"/></p>').openPopup();
var Bogota	= L.marker([4.59642356253,	-74.0833439552], {icon: greenIcon}).addTo(map);
Bogota.bindPopup('<b><font size="3">Bogota:<br/><b><font size="2">Population: 9,740,000<br/><b><font size="2">Area: 562 sq km<br/><b><font size="2">Country: Colombia<br/><img src="../content/WorldCitiesImages/Bogota.jpg" width="300" height="240"/></p>').openPopup();
var Cairo	 = L.marker([30.0499603465,	31.2499682197], {icon: greenIcon}).addTo(map);
Cairo.bindPopup('<b><font size="3">Cairo:<br/><b><font size="2">Population: 16,225,000<br/><b><font size="2">Area: 1,917 sq km<br/><b><font size="2">Country: Egypt<br/><img src="../content/WorldCitiesImages/Cairo.jpg" width="300" height="240"/></p>').openPopup();
var Shanghai	 = L.marker([31.2164524526,	121.436504678], {icon: greenIcon}).addTo(map);
Shanghai.bindPopup('<b><font size="3">Shanghai:<br/><b><font size="2">Population: 23,390,000<br/><b><font size="2">Area: 3,885 sq km<br/><b><font size="2">Country: India<br/><img src="../content/WorldCitiesImages/Shanghai.jpg" width="300" height="240"/></p>').openPopup();
var Tokyo	 = L.marker([35.6850169058,	139.751407429	], {icon: greenIcon}).addTo(map);
Tokyo.bindPopup('<b><font size="3">Tokyo:<br/><b><font size="2">Population: 37,900,000<br/><b><font size="2">Area: 8,547 sq km<br/><b><font size="2">Country: Japan<br/><img src="../content/WorldCitiesImages/Tokyo.jpg" width="300" height="240"/></p>').openPopup();
var Mumbai	 = L.marker([19.0169903757,	72.8569892974	], {icon: greenIcon}).addTo(map);
Mumbai.bindPopup('<b><font size="3">Mumbai:<br/><b><font size="2">Population: 22,885,000<br/><b><font size="2">Area: 881 sq km<br/><b><font size="2">Country: India<br/><img src="../content/WorldCitiesImages/Mumbai.jpg" width="300" height="240"/></p>').openPopup();
var Paris	 = L.marker([48.8666929312,	2.33333532574	], {icon: greenIcon}).addTo(map);
Paris.bindPopup('<b><font size="3">Paris:<br/><b><font size="2">Population: 10,950,000<br/><b><font size="2">Area: 2,845 sq km<br/><b><font size="2">Country: France<br/><img src="../content/WorldCitiesImages/Paris.jpg" width="300" height="240"/></p>').openPopup();
var Santiago	= L.marker([-33.4500138155,	-70.6670408546], {icon: greenIcon}).addTo(map);
Santiago.bindPopup('<b><font size="3">Santiago:<br/><b><font size="2">Population: 6,310,000<br/><b><font size="2">Area: 1,140 sq km<br/><b><font size="2">Country: Chile<br/><img src="../content/WorldCitiesImages/Santiago.jpg" width="300" height="240"/></p>').openPopup();
var Kolkata	 = L.marker([22.4949692983,	88.3246756581	], {icon: greenIcon}).addTo(map);
Kolkata.bindPopup('<b><font size="3">Kolkata:<br/><b><font size="2">Population: 14,950,000<br/><b><font size="2">Area: 1,347 sq km<br/><b><font size="2">Country: India<br/><img src="../content/WorldCitiesImages/Kolkata.jpg" width="300" height="240"/></p>').openPopup();
var RiodeJaneiro	 = L.marker([-22.9250231742,	-43.2250207942], {icon: greenIcon}).addTo(map);
RiodeJaneiro.bindPopup('<b><font size="3">Rio De Janeiro:<br/><b><font size="2">Population: 11,900,000<br/><b><font size="2">Area: 2,020 sq km<br/><b><font size="2">Country: Brazil<br/><img src="../content/WorldCitiesImages/RiodeJaneiro.jpg" width="300" height="240"/></p>').openPopup();
var SaoPaulo	= L.marker([-23.558679587,	-46.6250199804], {icon: greenIcon}).addTo(map);
SaoPaulo.bindPopup('<b><font size="3">Sao Paulo:<br/><b><font size="2">Population: 21,242,939<br/><b><font size="2">Area: 3,043	sq km<br/><b><font size="2">Country: Brazil<br/><img src="../content/WorldCitiesImages/SaoPaulo.jpg" width="300" height="240"/></p>').openPopup();
var Sydney = L.marker([-33.9200109672,	151.185179809	], {icon: greenIcon}).addTo(map);
Sydney.bindPopup('<b><font size="3">Sydney:<br/><b><font size="2">Population: 4,100,000<br/><b><font size="2">Area: 2,037 sq km <br/><b><font size="2">Country: Australia<br/><img src="../content/WorldCitiesImages/Sydney.jpg" width="300" height="240"/></p>').openPopup();
var Singapore = L.marker([1.29303346649,	103.855820678], {icon: greenIcon}).addTo(map);
Singapore.bindPopup('<b><font size="3">Singapore:<br/><b><font size="2">Population: 5,825,000<br/><b><font size="2">Area: 518 sq km<br/><b><font size="2">Country: Republic of Singapore<br/><img src="../content/WorldCitiesImages/Singapore.jpg" width="300" height="240"/></p>').openPopup();
var HongKong	 = L.marker([22.304980895,	114.185009317	], {icon: greenIcon}).addTo(map);
HongKong	.bindPopup('<b><font size="3">Hong Kong:<br/><b><font size="2">Population: 7,330,000<br/><b><font size="2">Area: 285 sq km<br/><b><font size="2">Country: China<br/><img src="../content/WorldCitiesImages/HongKong.jpg" width="300" height="240"/></p>').openPopup();


}
