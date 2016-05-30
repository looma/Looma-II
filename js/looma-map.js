/*
 * Name: Skip
Email: skip@stritter.com
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2015 03
Revision: Looma 2.0.0

filename: looma-map.js
Description:
 */

'use strict';

var width = 1200,
    height = 720;

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);

//Mapbox demo

//end Mapbox

//Leaflet demonstration
    var map = L.map('map',
            { center: [28.2, 84],
          zoom: 7
        });
L.tileLayer('resources/maps/mbtiles/{z}/{x}/{y}.png').addTo(map);
// end Leaflet demo

//call d3.json to load map
d3.json("resources/maps/np.json", function(error, np) {
    if (error) return console.error(error);

    var subunits = topojson.feature(np, np.objects.subunits);
    var places = topojson.feature(np, np.objects.places);

    var projection = d3.geo.mercator()
     .center([84, 28.2])
     .scale(6000)
     .translate([width / 2, height / 2]);

    var path = d3.geo.path()
        .projection(projection);

  svg.selectAll(".subunit")
    .data(subunits.features)
    .enter()
    .append("path")
    .attr("d", path)
    .style("fill", d3.rgb(255, 255, 153))
    .style("stroke", "red")
    ;

/*
   svg.selectAll(".places")
    .data(topojson.feature(np, np.objects.places).features)
    .enter()
    .append("circle")
    .attr("d", path)
  //DEBUG  .attr("test", d)
    .attr("r", 7)
    .attr("cx", function(d) {return projection([d.geometry.coordinates[0],d.geometry.coordinates[1]])[0] ;})
    .attr("cy", function(d) {return projection([d.geometry.coordinates[0],d.geometry.coordinates[1]])[1] ;})
    .style("fill", "blue");


   svg.selectAll("text")
    .data(topojson.feature(np, np.objects.places).features)
    .enter()
    .append("text")
    .text(function(d) { return ("  " + d.properties.name);})
    .attr("x", function(d) {return projection([d.geometry.coordinates[0],d.geometry.coordinates[1]])[0] + 15 ;})
    .attr("y", function(d) {return projection([d.geometry.coordinates[0],d.geometry.coordinates[1]])[1] + 15;})
    .attr("font-size", 15) ;
*/




   d3.csv("resources/maps/nepal-cities.csv", function(error, cities) {
           if (error) return console.error(error);

         var projection = d3.geo.mercator()
         .center([84, 28.2])
         .scale(6000)
         .translate([width / 2, height / 2]);

           svg.selectAll(".cities")
             .data(cities)
             .enter()
             .append("circle")
             .attr("r", function(d) { return Math.min(16, Math.sqrt(parseInt(d.population)));})
       //      .attr("r",function(d) {return Math.sqrt(parseInt(d.population));})
             .attr("cx", function(d) {return projection([d.lon, d.lat])[0];})
             .attr("cy", function(d) {return projection([d.lon, d.lat])[1];})
             .style("fill", "blue")
             .style("opacity", 0.5)
             .append("title")
             .text(function(d) { return d.name;})
            ;
   });
 });