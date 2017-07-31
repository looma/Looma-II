var background = L.tileLayer('../maps/layeredMap/Background/{z}/{x}/{y}.png', {
  minZoom: 7,
  maxZoom: 11
})
var Forests = L.tileLayer('../maps/layeredMap/Forests/{z}/{x}/{y}.png', {
  minZoom: 7,
  maxZoom: 11
})
var Farmland = L.tileLayer('../maps/layeredMap/NepalFarmland/{z}/{x}/{y}.png', {
  minZoom: 7,
  maxZoom: 11
})

var Lakes = L.tileLayer('../maps/layeredMap/NepalLakes/{z}/{x}/{y}.png', {
  minZoom: 7,
  maxZoom: 11
})

var Rivers = L.tileLayer('../maps/layeredMap/nepalrivers2/{z}/{x}/{y}.png', {
  minZoom: 7,
  maxZoom: 11
})

var lakePop = L.icon({
    iconUrl: '../maps/layeredMap/lakePopup.png',

    iconSize:     [25, 41], // size of the icon
    iconAnchor:   [10, 30], // point of the icon which will correspond to marker's location
    popupAnchor:  [0, 0] // point from which the popup should open relative to the iconAnchor
});
var PhewaLake = L.marker([28.216392, 83.94517], {icon: lakePop}).bindPopup('<p>Phewa Lake<br/><img src="../maps/layeredMap/LakeImages/Phewa_Lake.jpg" width="500" height="350"/></p>', {minWidth: "auto"}),
GhodaghodiTal = L.marker([28.688703, 80.949893], {icon: lakePop}).bindPopup('<p>Ghodaghodi Tal<br/><img src="../maps/layeredMap/LakeImages/Ghodaghodi_Lake1.jpg" width="500" height="350"/></p>', {minWidth: "auto"}),
RaraLake = L.marker([29.528063, 82.086829], {icon: lakePop}).bindPopup('<p>Rara Lake<br/><img src="../maps/layeredMap/LakeImages/500px-Rara.jpg" width="500" height="350"/></p>', {minWidth: "auto"}),
PhoksundoLake = L.marker([29.183304, 82.941622], {icon: lakePop}).bindPopup('<p>Phoksundo Lake<br/><img src="../maps/layeredMap/LakeImages/phoksundo-lake_2_640_480.jpg" width="500" height="350"/></p>', {minWidth: "auto"}),
TilichoLake = L.marker([28.683333, 83.85671], {icon: lakePop}).bindPopup('<p>Tilicho Lake<br/><img src="../maps/layeredMap/LakeImages/500px-Tilicho_Lake.jpg" width="500" height="350"/></p>', {minWidth: "auto"}),
BegnasLake = L.marker([28.174657, 84.097142], {icon: lakePop}).bindPopup('<p>Begnas Lake<br/><img src="../maps/layeredMap/LakeImages/LakeBegnas.jpg" width="500" height="350"/></p>', {minWidth: "auto"}),
RupaLake = L.marker([28.154516, 84.112884], {icon: lakePop}).bindPopup('<p>Rupa Lake<br/><img src="../maps/layeredMap/LakeImages/Rupa_lake.jpg" width="500" height="350"/></p>', {minWidth: "auto"}),
ImjaTsho = L.marker([27.898487, 86.920996], {icon: lakePop}).bindPopup('<p>Imja Tsho<br/><img src="../maps/layeredMap/LakeImages/Imja-Lake.jpg" width="500" height="350"/></p>', {minWidth: "auto"}),
Gosaikunda = L.marker([28.082093, 85.414984], {icon: lakePop}).bindPopup('<p>Gosaikunda<br/><img src="../maps/layeredMap/LakeImages/gosaikunda.jpg" width="500" height="350"/></p>', {minWidth: "auto"}),
TshoRolpa = L.marker([27.8611, 86.475325], {icon: lakePop}).bindPopup('<p>Tsho Rolpa<br/><img src="../maps/layeredMap/LakeImages/TshoRolpa.jpeg" width="500" height="350"/></p>', {minWidth: "auto"}),
GokyoLake = L.marker([27.975306, 86.680003], {icon: lakePop}).bindPopup('<p>Gokyo Lake<br/><img src="../maps/layeredMap/LakeImages/GokyoLake.jpg" width="500" height="350"/></p>', {minWidth: "auto"});

var riverPop = L.icon({
    iconUrl: '../maps/layeredMap/riverPopup.png',

    iconSize:     [25, 41], // size of the icon
    iconAnchor:   [10, 30], // point of the icon which will correspond to marker's location
    popupAnchor:  [0, 0] // point from which the popup should open relative to the iconAnchor
});
var trishuli = L.marker([27.81405, 84.797256], {icon: riverPop}).bindPopup('<p>Trishuli River<br/><img src="../maps/layeredMap/RiverImages/TrishuliRiver.jpg" width="500" height="350"/></p>', {minWidth: "auto"}),
gandaki = L.marker([28.42229,	83.931629], {icon: riverPop}).bindPopup('<p>Gandaki River<br/><img src="../maps/layeredMap/RiverImages/GandakiRiver.jpg" width="500" height="350"/></p>', {minWidth: "auto"}),
indrawati = L.marker([27.698641,	85.680134], {icon: riverPop}).bindPopup('<p>Indrawati River<br/><img src="../maps/layeredMap/RiverImages/IndrawatiRiver.jpg" width="500" height="350"/></p>', {minWidth: "auto"}),
bhoteKoshi = L.marker([27.835875,	85.769054], {icon: riverPop}).bindPopup('<p>Bhote Koshi River<br/><img src="../maps/layeredMap/RiverImages/BhoteKoshi.jpg" width="500" height="350"/></p>', {minWidth: "auto"}),
arun = L.marker([27.338194,	87.290469], {icon: riverPop}).bindPopup('<p>Arun River<br/><img src="../maps/layeredMap/RiverImages/ArunRiver.jpg" width="500" height="350"/></p>', {minWidth: "auto"}),
marshyangdi = L.marker([28.617602,	84.084415], {icon: riverPop}).bindPopup('<p>Marshyandi River<br/><img src="../maps/layeredMap/RiverImages/MarshyandiRiver.jpg" width="500" height="350"/></p>', {minWidth: "auto"}),
seti = L.marker([28.20431,	83.988035], {icon: riverPop}, {icon: riverPop}).bindPopup('<p>Seti River<br/><img src="../maps/layeredMap/RiverImages/SetiRiver.jpg" width="500" height="350"/></p>', {minWidth: "auto"}),
bheri = L.marker([28.604388,	82.004387], {icon: riverPop}).bindPopup('<p>Bheri River<br/><img src="../maps/layeredMap/RiverImages/BheriRiver.jpg" width="500" height="350"/></p>', {minWidth: "auto"}),
setiGandaki = L.marker([28.160879,	84.02125], {icon: riverPop}).bindPopup('<p>Seti Gandaki River<br/><img src="../maps/layeredMap/RiverImages/SetiGandakiRiver.jpg" width="500" height="350"/></p>', {minWidth: "auto"}),
bagmati = L.marker([27.434989,	85.332729], {icon: riverPop}).bindPopup('<p>Bagmati River<br/><img src="../maps/layeredMap/RiverImages/BagmatiRiver.jpg" width="500" height="350"/></p>', {minWidth: "auto"}),
koshi = L.marker([26.700605,	87.066548], {icon: riverPop}).bindPopup('<p>Koshi River<br/><img src="../maps/layeredMap/RiverImages/KoshiRiver.jpg" width="500" height="350"/></p>', {minWidth: "auto"});

var templePop = L.icon({
    iconUrl: '../maps/layeredMap/templePopup.png',

    iconSize:     [25, 41], // size of the icon
    iconAnchor:   [10, 30], // point of the icon which will correspond to marker's location
    popupAnchor:  [0, 0] // point from which the popup should open relative to the iconAnchor
});
var BoudhanathStupa = L.marker([27.721644, 85.361967], {icon: templePop}).bindPopup('<p>Boudhanath Stupa<br/><img src="../maps/layeredMap/TempleImages/BoudhanathStupa.jpg" width = "300" height = "240"/><br/>Boudhanath Stupa (or Bodnath Stupa) is the largest stupa in Nepal and the holiest Tibetan Buddhist temple outside Tibet. It is the center of Tibetan culture in Kathmandu and rich in Buddhist symbolism. The stupa is located in the town of Boudha, on the eastern outskirts of Kathmandu.</p>'),
SwayambhuMahachaitya = L.marker([27.715093, 85.290321], {icon: templePop}).bindPopup('<p>Swayambhu Mahachaitya<br/><img src="../maps/layeredMap/TempleImages/SwayambhuMahachaitya.jpg" width = "300" height= "240"/><br/>Perched atop a hill on the western edge of the Kathmandu Valley, the ancient Swayambunath Stupa (known to tourists as the Monkey Temple) is the most important Buddhist shrine in Kathmandu. The Tibetan name for the site means Sublime Trees because of the large variety of trees found near the temple. The sleepy, all-seeing Buddha eyes that stare out from the top have become the quintessential symbol of Nepal.</p>'),
Pashupatinath = L.marker([27.710754, 85.348682], {icon: templePop}).bindPopup('<p>Pashupatinath<br/><img src="../maps/layeredMap/TempleImages/Pashupatinath.jpg" width="300" height="240"/><br/>The Pashupatinath Temple is a famous Hindu temple in eastern Kathmandu, and serves as the seat of the national deity, Lord Pashupatinath. The temple complex consists of a collection of temples, ashrams, images, and inscriptions along the banks of the sacred Bagmati river. Pashupatinath Temple is a cultural heritage site of Kathmandu Valley.</p>'),
ChanguNarayan = L.marker([27.716519, 85.427758], {icon: templePop}).bindPopup('<p>Changu Narayan<br/><img src="../maps/layeredMap/TempleImages/ChanguNarayan.jpg" width="300" height="240"/><br/>Changu Narayan is an ancient Hindu temple located on a hill called Changu (or Dolagiri). The temple was surrounded by forest with champak tree and a small village, known as Changu Village. This shrine is dedicated to Lord Visnu and held in especial reverence by the Hindu people. This temple is considered as the oldest temple in the history of Nepal.</p>'),
Dakshinkali = L.marker([27.605372, 85.262923], {icon: templePop}).bindPopup('<p>Dakshinkali<br/><img src="../maps/layeredMap/TempleImages/Dakshinkali.jpg" width="300" height="240"/>Dakshinkali Temple or Dakshin Kali Temple,located 22 kilometres (14 mi) outside Kathmandu and about 1 kilometre (0.6 mi) outside the village of Pharping, is one of the main temples of Nepal dedicated to the goddess Kali. Animal sacrifices, particularly of cockerels and uncastrated male goats, are the main way that the goddess is worshipped, and this is especially seen during the Dashain festival.</p>'),
Bajrayogini = L.marker([27.743909, 85.467339], {icon: templePop}).bindPopup('<p>Bajrayogini<br/><img src="../maps/layeredMap/TempleImages/Bajrayogini.jpg" width="300" height="240"/><br/>Bajrayogini Temple is a Tantrik temple located at Sankhu in Kathmandu Valley. It is also well known as Bodhisattvas Temple. Bajrayogini is the Hindu goddess of wisdom of which Ugra Tara is the Buddhist equivalent. Thus the temple is sacred to both Hindus and Buddhists.</p>'),
Dantakali = L.marker([26.818845, 87.290898], {icon: templePop}).bindPopup('<p>Dantakali<br/><img src="../maps/layeredMap/TempleImages/Dantakali.jpg" width="300" height="240"/><br/>Legend says that a tooth of Sati Devi fell here when Shiva was carrying her death body and roaming in agony. Hence, it got its name Dantakali (Danta), meaning "teeth" and "Kali", a form of "Sati". Agonized by her death, lord Shiva carried her deceased body around his shoulder and wherever the parts of her body fell, today there stands some great temples. It is situated in the middle of Hilchowk of Vijaypur in Dharan.</p>'),
Budanilkantha = L.marker([27.778437, 85.3626], {icon: templePop}).bindPopup('<p>Budanilkantha<br/><img src="../maps/layeredMap/TempleImages/Budanilkantha.jpg" width="300" height="240"/><br/>Budhanilkantha Temple, located in Budhanilkantha, Nepal, is a Hindu open air temple dedicated to Lord Vishnu. Budhanilkantha Temple is situated below the Shivapuri Hill at the northern end of the Kathmandu Valley,  and can be identified by a large reclining statue of Lord Vishnu. The main statue of Budhanilkantha at the temple is considered the largest stone carving in Nepal.</p>'),
Manakamana = L.marker([27.904466, 84.58412], {icon: templePop}).bindPopup('<p>Manakamana<br/><img src="../maps/layeredMap/TempleImages/Manakamanaa.jpg" width="300" height="240"/><br/>The Manakamana Temple situated in the Gorkha district of Nepal is the sacred place of the Hindu Goddess Bhagwati, an incarnation of Parvati.[1] The name Manakamana originates from two words, “mana” meaning heart and “kamana” meaning wish. Venerated since the 17th century, it is believed that Goddess Manakamana grants the wishes of all those who make the pilgrimage to her shrine to worship her.</p>'),
Muktinath = L.marker([28.817, 83.871289], {icon: templePop}).bindPopup('<p>Muktinath<br/><img src="../maps/layeredMap/TempleImages/Muktinath.jpg" width="300" height="240"/><br/>Muktinath is one of the most ancient Hindu Temples of God Vishnu, located in the Muktinath Valley at an altitude of 3710 meters at the foot of the thorong La mountain pass in Mustang, Nepal. It is a sacred place for both Hindus and Buddhists.</p>'),
AmarNarayan = L.marker([28.126943, 83.536393], {icon: templePop}).bindPopup('<p>Amar Narayan<br/><img src="../maps/layeredMap/TempleImages/AmarNarayan.jpg" width="300" height="240"/><br/>Amar Narayan is pagoda style wooden temple, built in 1807. It is believed to be one of the most beautiful temples outside of Kathmandu. Devotees come here every evening to light lamps in honor of the Lord Vishnu.</p>'),
Bhairabsthan = L.marker([27.869915, 83.478764], {icon: templePop}).bindPopup('<p>Bhairabsthan<br/><img src="../maps/layeredMap/TempleImages/Bhairabsthan.jpg" width="300" height="240"/><br/>Bhairabsthan is a Hindu Temple in Nepal. At this temple, people sacrifice animals and offer grains and fruit to please the Hindu God Bhairab (Hindu god of destruction), whose figure is believed to be hidden under the floor of the temple.</p>'),
ChandannathMandir = L.marker([29.274501, 82.183501], {icon: templePop}).bindPopup('<p>Chandannath Mandir<br/><img src="../maps/layeredMap/TempleImages/ChandannathMandir.jpg" width="300" height="240"/><br/>Chandannath Mandir is a Hindu temple in Jumla, Nepal. It is located at Khalanga Bazar Jumla. It was built during the Kallala Dynasty, and hosted many Hindu festivals such as Shivaratri, Ghatasthapana, Dashain, and more.</p>'),
ShriRamJanakiMandir = L.marker([26.730614, 85.925696], {icon: templePop}).bindPopup('<p>Shri Ram Janaki Mandir<br/><img src="../maps/layeredMap/TempleImages/ShriRamJanakiMandir.jpg" width="300" height="240"/><br/>Janaki Mandir is a Hindu temple in Janakpur in the Mithila region of Nepal, dedicated to the Hindu goddess Sita. It is the primary temple of Maithali native indigenous to Nepal. It is an example of Hindu-Rajput Nepali architecture. It is often considered the most important model of Rajput architecture in Nepal.</p>'),
MaulaKalikaTemple = L.marker([27.738103, 84.407882], {icon: templePop}).bindPopup('<p>Maula Kalika<br/><img src="../maps/layeredMap/TempleImages/MaulaKalika.jpg" width="300" height="240"/><br/>Maula Kalika is a famous Hindu temple of Goddess Kalika in the town Gaindakot of Nawalparasi district in the Lumbini zone of Nepal. Maula Kalika is a very famous and growing tourist destination in Nepal.</p>'),
PathibharaDevi = L.marker([27.429008, 87.768233], {icon: templePop}).bindPopup('<p>PathibharaDevi<br/><img src="../maps/layeredMap/TempleImages/Pathibhara.jpg" width="300" height="240"/><br/>Pathibhara Devi is one of the most significant Hindu temples in Nepal, located on the hill of Taplejung. It is also considered one of the holy places for Kirat Limbu. Worshippers from different parts of Nepal and India flock to the temple during special occasions, as it is believed that a pilgrimage to the temple ensures fulfillment of the pilgrims desires.</p>');

var mountainPop = L.icon({
    iconUrl: '../maps/layeredMap/mountainPopup.png',

    iconSize:     [25, 41], // size of the icon
    iconAnchor:   [10, 30], // point of the icon which will correspond to marker's location
    popupAnchor:  [0, 0] // point from which the popup should open relative to the iconAnchor
});
var MountEverest = L.marker([27.987774, 86.924994], {icon: mountainPop}).bindPopup('<p>Mount Everest<br/>8,848 Meters<img src="../maps/layeredMap/MountainImages/MountEverest.jpg" width="500" height="350"/></p>', {minWidth: "auto"}),
Kanchenjunga = L.marker([27.702539, 88.147514], {icon: mountainPop}).bindPopup('<p>Kanchenjunga<br/>8,586 Meters<img src="../maps/layeredMap/MountainImages/Kanchenjunga.jpg" width="500" height="350"/></p>', {minWidth: "auto"}),
Lhotse = L.marker([27.962316, 86.932925], {icon: mountainPop}).bindPopup('<p>Lhotse<br/>8,516 Meters<img src="../maps/layeredMap/MountainImages/Lhotse.jpg" width="500" height="350"/></p>', {minWidth: "auto"}),
Makalu = L.marker([27.886098, 87.091135], {icon: mountainPop}).bindPopup('<p>Makalu<br/>8,485 Meters<img src="../maps/layeredMap/MountainImages/Makalu.jpg" width="500" height="350"/></p>', {minWidth: "auto"}),
Dhaulagiri = L.marker([28.698352, 83.487468], {icon: mountainPop}).bindPopup('<p>Dhaulagiri<br/>8,167 Meters<img src="../maps/layeredMap/MountainImages/Dhaulagiri.jpg" width="500" height="350"/></p>', {minWidth: "auto"}),
ChoOyu = L.marker([28.097317, 86.658529], {icon: mountainPop}).bindPopup('<p>Cho Oyo<br/>8,201 Meters<img src="../maps/layeredMap/MountainImages/ChoOyu.jpg" width="500" height="350"/></p>', {minWidth: "auto"}),
Manaslu = L.marker([28.549701, 84.559730], {icon: mountainPop}).bindPopup('<p>Manaslu<br/>8,163 Meters<img src="../maps/layeredMap/MountainImages/Manaslu.jpg" width="500" height="350"/></p>', {minWidth: "auto"}),
Annapurna = L.marker([28.5961, 83.8203], {icon: mountainPop}).bindPopup('<p>Annapurna<br/>8,091 Meters<img src="../maps/layeredMap/MountainImages/Annapurna.jpg" width="500" height="350"/></p>', {minWidth: "auto"}),
GyachungKang = L.marker([28.098075, 86.742179], {icon: mountainPop}).bindPopup('<p>Gyachung Kang<br/>7,952 Meters<img src="../maps/layeredMap/MountainImages/GyachungKang.jpg" width="500" height="350"/></p>', {minWidth: "auto"}),
AnnapurnaII = L.marker([28.5350, 84.1225], {icon: mountainPop}).bindPopup('<p>Annapurna II<br/>7,937 Meters<img src="../maps/layeredMap/MountainImages/AnnapurnaII.jpg" width="500" height="350"/></p>', {minWidth: "auto"}),
Himalchuli = L.marker([28.436535, 84.639946], {icon: mountainPop}).bindPopup('<p>Himalchuli<br/>7,893 Meters<img src="../maps/layeredMap/MountainImages/Himalchuli.jpg" width="500" height="350"/></p>', {minWidth: "auto"}),
NgadiChuli = L.marker([28.503258, 84.566699], {icon: mountainPop}).bindPopup('<p>Ngadi Chuli<br/>7,871 Meters<img src="../maps/layeredMap/MountainImages/NgadiChuli.jpg" width="500" height="350"/></p>', {minWidth: "auto"}),
Nuptse = L.marker([27.967257, 86.885528], {icon: mountainPop}).bindPopup('<p>Nuptse<br/>7,861 Meters<img src="../maps/layeredMap/MountainImages/Nuptse.jpg" width="500" height="350"/></p>', {minWidth: "auto"}),
ChomoLonzo = L.marker([27.931347, 87.107728], {icon: mountainPop}).bindPopup('<p>Chomo Lonzo<br/>7,804 Meters<img src="../maps/layeredMap/MountainImages/ChomoLonzo.jpg" width="500" height="350"/></p>', {minWidth: "auto"}),
Jannu = L.marker([27.681667, 88.044156], {icon: mountainPop}).bindPopup('<p>Jannu<br/>7,710 Meters<img src="../maps/layeredMap/MountainImages/Jannu.jpg" width="500" height="350"/></p>', {minWidth: "auto"}),
AnnapurnaIII = L.marker([28.5850, 83.9908], {icon: mountainPop}).bindPopup('<p>Annapurna III<br/>7,555 Meters<img src="../maps/layeredMap/MountainImages/AnnapurnaIII.jpg" width="500" height="350"/></p>', {minWidth: "auto"}),
AnnapurnaIV = L.marker([28.5375, 84.082778], {icon: mountainPop}).bindPopup('<p>Annapurna IV<br/>7,525 Meters<img src="../maps/layeredMap/MountainImages/AnnapurnaIV.jpg" width="500" height="350"/></p>', {minWidth: "auto"}),
Gangapurna = L.marker([28.604962, 83.963365], {icon: mountainPop}).bindPopup('<p>Gangapurna<br/>7,455 Meters<img src="../maps/layeredMap/MountainImages/Gangapurna.jpg" width="500" height="350"/></p>', {minWidth: "auto"}),
Kabru = L.marker([27.634081, 88.118355], {icon: mountainPop}).bindPopup('<p>Kabru<br/>7,394 Meters<img src="../maps/layeredMap/MountainImages/Kabru.jpg" width="500" height="350"/></p>', {minWidth: "auto"}),
LabucheKang = L.marker([28.304223, 86.350865], {icon: mountainPop}).bindPopup('<p>Labuche Kang<br/>7,367 Meters<img src="../maps/layeredMap/MountainImages/LabucheKang.jpg" width="500" height="350"/></p>', {minWidth: "auto"}),
KiratChuli = L.marker([27.788371, 88.195801], {icon: mountainPop}).bindPopup('<p>Kirat Chuli<br/>7,365 Meters<img src="../maps/layeredMap/MountainImages/KiratChuli.jpg" width="500" height="350"/></p>', {minWidth: "auto"}),
GimmigelaChuli = L.marker([27.733323, 88.150011], {icon: mountainPop}).bindPopup('<p>Gimmigela Chuli<br/>7,350 Meters<img src="../maps/layeredMap/MountainImages/GimmigelaChuli.jpg" width="500" height="350"/></p>', {minWidth: "auto"}),
Chamlang = L.marker([27.774953, 86.979188], {icon: mountainPop}).bindPopup('<p>Chamlang<br/>7,319 Meters<img src="../maps/layeredMap/MountainImages/Chamlang.jpg" width="500" height="350"/></p>', {minWidth: "auto"}),
LangtangLirung = L.marker([28.255824, 85.517500], {icon: mountainPop}).bindPopup('<p>Langtang Lirung<br/>7,227 Meters<img src="../maps/layeredMap/MountainImages/LangtangLirung.jpg" width="500" height="350"/></p>', {minWidth: "auto"}),
LangtangRi = L.marker([28.381625, 85.683329], {icon: mountainPop}).bindPopup('<p>Langtang Ri<br/>7,205 Meters<img src="../maps/layeredMap/MountainImages/LangtangRi.jpg" width="500" height="350"/></p>', {minWidth: "auto"}),
AnnapurnaSouth = L.marker([28.5183, 83.8058], {icon: mountainPop}).bindPopup('<p>Annapurna South<br/>7,219 Meters<img src="../maps/layeredMap/MountainImages/AnnapurnaSouth.jpg" width="500" height="350"/></p>', {minWidth: "auto"}),
Baruntse = L.marker([27.871944, 86.981966], {icon: mountainPop}).bindPopup('<p>Baruntse<br/>7,162 Meters<img src="../maps/layeredMap/MountainImages/Baruntse.jpg" width="500" height="350"/></p>', {minWidth: "auto"}),
Pumori = L.marker([28.008952, 86.825327], {icon: mountainPop}).bindPopup('<p>Pumori<br/>7,161 Meters<img src="../maps/layeredMap/MountainImages/Pumori.jpg" width="500" height="350"/></p>', {minWidth: "auto"}),
Nemjung = L.marker([28.736582, 84.417532], {icon: mountainPop}).bindPopup('<p>Nemjung<br/>7,140 Meters<img src="../maps/layeredMap/MountainImages/Nemjung.jpg" width="500" height="350"/></p>', {minWidth: "auto"}),
TilichoPeak = L.marker([28.684444, 83.804487], {icon: mountainPop}).bindPopup('<p>Tilicho Peak<br/>7,134 Meters<img src="../maps/layeredMap/MountainImages/TilichoPeak.jpg" width="500" height="350"/></p>', {minWidth: "auto"}),
GauriSankar = L.marker([27.950009, 86.333333], {icon: mountainPop}).bindPopup('<p>Gauri Sankar<br/>7,134 Meters<img src="../maps/layeredMap/MountainImages/GauriSankar.jpg" width="500" height="350"/></p>', {minWidth: "auto"}),
Api = L.marker([29.809809, 80.556947], {icon: mountainPop}).bindPopup('<p>Api<br/>7,132 Meters<img src="../maps/layeredMap/MountainImages/Api.jpg" width="500" height="350"/></p>', {minWidth: "auto"});

var citiesPop = L.icon({
    iconUrl: '../maps/layeredMap/citiesPopup.png',

    iconSize:     [25, 41], // size of the icon
    iconAnchor:   [10, 30], // point of the icon which will correspond to marker's location
    popupAnchor:  [0, 0] // point from which the popup should open relative to the iconAnchor
});
var Kathmandu = L.marker([27.710932, 85.325445], {icon: citiesPop}).bindPopup('<p>Kathmandu<br/>Population: 1,003,285<img src="../maps/layeredMap/CityImages/Kathmandu.jpg" width="500" height="350"/></p>', {minWidth: "auto"}),
Pokhara = L.marker([28.235096, 83.991281], {icon: citiesPop}).bindPopup('<p>Pokhara<br/>Population: 414,141<img src="../maps/layeredMap/CityImages/Pokhara.jpg" width="500" height="350"/></p>', {minWidth: "auto"}),
Patan = L.marker([27.665597, 85.318436], {icon: citiesPop}).bindPopup('<p>Patan<br/>Population: 260,324<img src="../maps/layeredMap/CityImages/Lalitpur.jpg" width="500" height="350"/></p>', {minWidth: "auto"}),
Bharatpur = L.marker([27.649486, 84.420887], {icon: citiesPop}).bindPopup('<p>Bharatpur<br/>Population: 280,502<img src="../maps/layeredMap/CityImages/Bharatpur.jpg" width="500" height="350"/></p>', {minWidth: "auto"}),
Biratnagar = L.marker([26.454343, 87.271804], {icon: citiesPop}).bindPopup('<p>Biratnagar<br/>Population: 242,548<img src="../maps/layeredMap/CityImages/Biratnagar.jpg" width="500" height="350"/></p>', {minWidth: "auto"}),
Birgunj = L.marker([27.048957, 84.870605], {icon: citiesPop}).bindPopup('<p>Birgunj<br/>Population: 204,816<img src="../maps/layeredMap/CityImages/Birgunj.jpg" width="500" height="350"/></p>', {minWidth: "auto"}),
Ghorahi = L.marker([28.057077, 82.483986], {icon: citiesPop}).bindPopup('<p>Ghorahi<br/>Population: 156,164<img src="../maps/layeredMap/CityImages/Ghorahi.jpg" width="500" height="350"/></p>', {minWidth: "auto"}),
Janakpur = L.marker([26.735233, 85.923741], {icon: citiesPop}).bindPopup('<p>Janakpur<br/>Population: 169,287<img src="../maps/layeredMap/CityImages/Janakpur.jpg" width="500" height="350"/></p>', {minWidth: "auto"}),
Hetauda = L.marker([27.429493, 85.005123], {icon: citiesPop}).bindPopup('<p>Hetauda<br/>Population: 152,875<img src="../maps/layeredMap/CityImages/Hetauda.jpg" width="500" height="350"/></p>', {minWidth: "auto"}),
Dhangadhi = L.marker([28.699926, 80.606042], {icon: citiesPop}).bindPopup('<p>Dhangadhi<br/>Population: 137,666<img src="../maps/layeredMap/CityImages/Dhangadhi.jpg" width="500" height="350"/></p>', {minWidth: "auto"}),
Tulsipur = L.marker([28.145592, 82.294880], {icon: citiesPop}).bindPopup('<p>Tulsipur<br/>Population: 141,528<img src="../maps/layeredMap/CityImages/Tulsipur.jpg" width="500" height="350"/></p>', {minWidth: "auto"}),
Itahari = L.marker([26.673281, 87.262450], {icon: citiesPop}).bindPopup('<p>Itahari<br/>Population: 140,517<img src="../maps/layeredMap/CityImages/Itahari.jpg" width="500" height="350"/></p>', {minWidth: "auto"}),
Nepalgunj = L.marker([28.058120, 81.624295], {icon: citiesPop}).bindPopup('<p>Nepalgunj<br/>Population: 138,951<img src="../maps/layeredMap/CityImages/Nepalgunj.jpg" width="500" height="350"/></p>', {minWidth: "auto"}),
Butwal = L.marker([27.691166, 83.431503], {icon: citiesPop}).bindPopup('<p>Butwal<br/>Population: 118,462<img src="../maps/layeredMap/CityImages/Butwal.jpg" width="500" height="350"/></p>', {minWidth: "auto"}),
Dharan = L.marker([26.798711, 87.274733], {icon: citiesPop}).bindPopup('<p>Dharan<br/>Population: 141,439<img src="../maps/layeredMap/CityImages/Dharan.jpg" width="500" height="350"/></p>', {minWidth: "auto"}),
Kalaiya = L.marker([27.030747, 85.003229], {icon: citiesPop}).bindPopup('<p>Kalaiya<br/>Population: 123,659<img src="../maps/layeredMap/CityImages/Kalaiya.jpg" width="500" height="350"/></p>', {minWidth: "auto"});



var WaterGlaciersWithPopups = L.layerGroup([Lakes, PhewaLake, GhodaghodiTal, RaraLake, PhoksundoLake, TilichoLake, BegnasLake, RupaLake, ImjaTsho, Gosaikunda, TshoRolpa, GokyoLake, Rivers, trishuli, gandaki, indrawati, bhoteKoshi, arun, marshyangdi, seti, bheri, setiGandaki, bagmati, koshi]);
var TemplesWithPopups = L.layerGroup([BoudhanathStupa, SwayambhuMahachaitya, Pashupatinath, ChanguNarayan, Dakshinkali, Bajrayogini, Dantakali, Budanilkantha, Manakamana, Muktinath, AmarNarayan, Bhairabsthan, ChandannathMandir, ShriRamJanakiMandir, MaulaKalikaTemple, PathibharaDevi]);
var MountainsWithPopups = L.layerGroup([MountEverest, Kanchenjunga, Lhotse, Makalu, Dhaulagiri, ChoOyu, Manaslu, Annapurna, GyachungKang, AnnapurnaII, Himalchuli, NgadiChuli, Nuptse, ChomoLonzo, Jannu, AnnapurnaIII, AnnapurnaIV, Gangapurna, Kabru, LabucheKang, KiratChuli, GimmigelaChuli, Chamlang, LangtangLirung, LangtangRi, AnnapurnaSouth, Baruntse, Pumori, Nemjung, TilichoPeak, GauriSankar, Api])
var CitiesWithPopups = L.layerGroup([Kathmandu, Pokhara, Patan, Bharatpur, Biratnagar, Birgunj, Ghorahi, Janakpur, Hetauda, Dhangadhi, Tulsipur, Itahari, Nepalgunj, Butwal, Dharan, Kalaiya]);

var map = L.map('map', {
center: [28.2366, 83.7927],
zoom: 7,
layers: [background, Forests, Farmland, WaterGlaciersWithPopups, TemplesWithPopups, MountainsWithPopups, CitiesWithPopups]
});

var legend = L.control({position: 'bottomright'});

legend.onAdd = function (map) {
    var element = L.DomUtil.create('div', 'street-legend info legend');

    element.innerHTML =  '<span style = "color: #FF4136">\u2589</span>' + "Temple" + '<br />' +
                      '<span style = "color: #7FDBFF">\u2589</span>' + "River" + '<br />' +
                      '<span style = "color: #0074D9">\u2589</span>' + "Lake" + '<br />' +
                      '<span style = "color: #5b4917">\u2589</span>' + "City" + '<br />' +
                      '<span style = "color: #26c689">\u2589</span>' + "Mountain" + '<br />';
    return element;

};
legend.addTo(map);



var baseMaps = {
"background": background
};

var overlayMaps = {
"Forests": Forests,
"Farmland": Farmland,
"Bodies of Water/Glaciers": WaterGlaciersWithPopups,
"Temples": TemplesWithPopups,
"Mountains": MountainsWithPopups,
"Cities": CitiesWithPopups,
};

L.control.layers(baseMaps, overlayMaps).addTo(map);
