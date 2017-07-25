      window.onload = function(){
      var map = L.map('map').setView([28.2076, 83.9903], 14);
      L.tileLayer('../maps/PokharaCity/{z}/{x}/{y}.png', {
        minZoom:14,
        maxZoom: 17,

      }).addTo(map);
      var legend = L.control({position: 'bottomright'});

      legend.onAdd = function (map) {
          var element = L.DomUtil.create('div', 'street-legend info legend');

          element.innerHTML = '<span style="color:#31881e">\u2589</span>' + "Forest"+ '<br />' +
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

      var southWest = L.latLng(28.184, 83.8938),
      northEast = L.latLng(28.2893, 84.0471);
      var bounds = L.latLngBounds(southWest, northEast);
      map.setMaxBounds(bounds);
      map.on('drag', function() {
        map.panInsideBounds(bounds, { animate: false });
      });

      var airport = L.marker([28.199549, 83.978849]).addTo(map);//
      var airportPopup = ('<p>Pokhara Airport<br/><img src="../content/PokharaCityImages/PokharaAirport.jpg" width="300" height="240"/></p>');
      airport.bindPopup(airportPopup).openPopup();
      var setiRiver = L.marker([28.214910, 83.993729]).addTo(map);//
      var setiRiverPopUp = ('<p>Seti River<br/><img src="../content/PokharaCityImages/SetiRiver.jpg" width="300" height="240"/></p>');
      setiRiver.bindPopup(setiRiverPopUp).openPopup();
      var devisFalls = L.marker([28.189944, 83.959052]).addTo(map);//
      var desvisFallsPopUp = ('<p>Devi Falls<br/><img src="../content/PokharaCityImages/DevisFall.jpg" width="300" height="240"/></p>');
      devisFalls.bindPopup(desvisFallsPopUp).openPopup();
      var internationalMountainMuseum = L.marker([28.189946, 83.982829]).addTo(map);//
      var internationalMountainMuseumPopUp = ('<p>International Mountain Museum<br/><img src="../content/PokharaCityImages/MountainMuseum.jpg" width="300" height="240"/></p>');
      internationalMountainMuseum.bindPopup(internationalMountainMuseumPopUp).openPopup();
      var gurkhaMuseum = L.marker([28.246273, 83.988590]).addTo(map);//
      var gurkhaMuseumPopUp = ('<p>Gurkha Museum<br/><img src="../content/PokharaCityImages/GurkhaMuseum.jpg" width="300" height="240"/></p>');
      gurkhaMuseum.bindPopup(gurkhaMuseumPopUp).openPopup();
      var batCave = L.marker([28.267456, 83.975921]).addTo(map);//
      var batCavePopUp = ('<p>Bat Cave<br/><img src="../content/PokharaCityImages/BatCave.jpg" width="300" height="240"/></p>');
      batCave.bindPopup(batCavePopUp).openPopup();
      var worldPeacePagoda = L.marker([28.201072, 83.945068]).addTo(map);//
      var worldPeacePagodaPopUp = ('<p>World Peace Pagoda<br/><img src="../content/PokharaCityImages/worldPeacePagoda.jpg" width="300" height="240"/></p>');
      worldPeacePagoda.bindPopup(worldPeacePagodaPopUp).openPopup();
      var gupteshworMahadevCave = L.marker([28.189491, 83.958052]).addTo(map);
      var gupteshworMahadevCavePopUp = ('<p>Gupteshwor Mahadev Cave<br/><img src="../content/PokharaCityImages/GupteshworMahadevCave.jpg" width="300" height="240"/></p>');
      gupteshworMahadevCave.bindPopup(gupteshworMahadevCavePopUp).openPopup();
      var chachawheeFunPark = L.marker([28.196172, 83.981643]).addTo(map);//
      var chachawheeFunParkPopUp = ('<p>Chachawhee Fun Park<br/><img src="../content/PokharaCityImages/AmusmentPark.jpg" width="300" height="240"/></p>');
      chachawheeFunPark.bindPopup(chachawheeFunParkPopUp).openPopup();
      var talBarahiTemple = L.marker([28.207453, 83.953515]).addTo(map);//
      var talBarahiTemplePopUp = ('<p>Tal Barahi Temple<br/><img src="../content/PokharaCityImages/TalBarahiTemple.jpg" width="300" height="240"/></p>');
      talBarahiTemple.bindPopup(talBarahiTemplePopUp).openPopup();
      var regionalMuseum= L.marker([28.217124, 83.991024]).addTo(map);//
      var regionalMuseumPopUp = ('<p>Regional Museum<br/><img src="../content/PokharaCityImages/RegionalMuseum.jpg" width="300" height="240"/></p>');
      regionalMuseum.bindPopup(regionalMuseumPopUp).openPopup();//
      var miteriPark = L.marker([28.201288, 83.966340]).addTo(map);
      var miteriParkPopUp = ('<p>Miteri Park<br/><img src="../content/PokharaCityImages/MiteriPark.jpg" width="300" height="240"/></p>');
      miteriPark.bindPopup(miteriParkPopUp).openPopup();
      var bindhyabasiniTemple = L.marker([28.237660, 83.984184]).addTo(map);
      var bindhyabasiniTemplePopUp = ('<p>Bindhyabasini Temple<br/><img src="../content/PokharaCityImages/BindhyabasiniTemple.jpg" width="300" height="240"/></p>');
      bindhyabasiniTemple.bindPopup(bindhyabasiniTemplePopUp).openPopup();
      var phewaLake = L.marker([28.215184, 83.947690]).addTo(map);//
      var phewaLakePopUp = ('<p>Phewa Lake<br/><img src="../content/PokharaCityImages/PhewaLake.jpg" width="300" height="240"/></p>');
      phewaLake.bindPopup(phewaLakePopUp).openPopup();


    };
