/*
Filename: looma-map.js
Description: Reads in data from a mongo document and from geojson documents to create a map

Programmer name: Morgan, Sophie, Henry, Kendall
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2018 07, NOV 2020 [skip]
Revision: Looma 3.0
 */

"use strict";

// Create the layers for the map and the arrays that hold them
var data;        // the mongo DB description for this map
var baseLayers;  // Array storing the base layers
var currentBase =0; //index of the current selected base layer
var addOnLayers; // Array storing add-on layers
var popUpShowing; // Array storing true/false values for if each add-on layer is on/off
var info;       // Represents the information box
var addOnData;  // data describing the add-on layers from the database
var priorityOn; // If layers are brought to the front by priorities in database
var infoBoxOn;  //If the infoBox is on
var map, southWest, northEast;
var mapTitle;
////////////////////////
// Create the Layers //
////////////////////////

// Sets the look of each map area
    function styleLayer(feature)
    {   var layerData = data.baseLayers;
        return {
            fillColor: getColor(feature, layerData[currentBase].style),
            weight:      layerData[currentBase].style.weight,
            opacity:     layerData[currentBase].style.opacity,
            color:       layerData[currentBase].style.color,
            fillOpacity: layerData[currentBase].style.fillOpacity
        };
    }
    
    function lookUpColor (feature) {
        return feature.properties.fillColor || "red";  //default color in case fillColor not specified
    }  //end lookUpColor
    
    // Assigns a color to a country/region/area
    function getColor(feature, style) {
        try {
            if (feature.properties.fillColor) return lookUpColor(feature); //some geoJSON has colors embedded in properties.fillColor
            
            var random = style.random, cutoffs = style.cutoffs, colors = style.colors;
            var featureUsedValue = feature.properties[style.colorFeature]; //the numerical feature used to determine the color
            var index = random?featureUsedValue % (cutoffs.length):featureUsedValue;
            
            for (var k = 0; k < colors.length - 1; k++) {
                if (index < cutoffs[k]) return colors[k];
            }
            return colors [colors.length - 1];
        }
        catch(err)
        {  //if any data is missing, just make them all blue so that the map still loads
            return 'blue';
        }
    }

////////////////////////
function loadBaseLayers (layerData) {
    
    var currentStyle = 0;
    //var arrayIndex = 0; //a counter for the array
    var nextBase = 0;
    var promises = [];
    for (var i = 0; i < layerData.length; i++) {    // Loads the base layers onto the map by reading geojson in
        //var baseLayer;
        var link = '/content/maps/json/' + layerData[i].geojson;
        promises[i] = getMapJSON(link, i);
    }
    
    Promise.all(promises).then(function(){
            console.log('In baselayer, promises has ' + promises.length + ' entries');
            for (var j=0; j<Math.min(baseLayers.length, 2); j++)  baseLayers[j].addTo(map);
           // for (var layer of baseLayers) layer.addTo(map);
            baseLayers[0].bringToFront();
            currentBase = 0;
            baseLayerButtons(layerData);}
        );
    
    
    async function getMapJSON(url, index) {
        var baseLayer;
        await $.getJSON(url, null, function(result) {
            baseLayer = L.geoJson(result, {
                style: styleLayer,
                onEachFeature: onEachFeature
            });
            baseLayers[index] = baseLayer;
        });
    }
    
    // Hovering listener. Calls highight/resethighlight functions
    function onEachFeature(feature, layer) {
        layer.on({
            mouseover: highlightFeature,
            mouseout:  resetHighlight
        });
    }
    
    // Highlights the area that the mouse is hovering over in gray
    function highlightFeature(e) {
        var style = layerData[currentBase].style;
        map.closePopup();
        var layer = e.target;
        
        if (style.onHover)
        {
            layer.setStyle({
                weight: style.onHover.weight,
                color: style.onHover.color,
                fillOpacity: style.onHover.fillOpacity
            });
        }
        else
        {
            //Default
            layer.setStyle({
                weight: 5,
                color: 'yellow',
                fillOpacity: 0.3
            });
        }
        
        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge)
        {
            //layer.bringToFront();
            featureLayers();
        }
        
        if (infoBoxOn) info.update(layer.feature.properties);
        
    }   //End of highlight function
    
    // Makes sure that once the country is deselected the gray is gone
    function resetHighlight(e)
    {
        var layer = e.target;
        //layer.resetStyle();
        baseLayers[currentBase].resetStyle(e.target);
        //baseLayers[currentBase].resetStyle();
        // layer.bringToBack(e.target);
        //info.update(); //Comment this out to avoid glitches when the mouse goes over the info box
    }
    
    
} // end loadBaseLayers()

////////////////////////
// Creates the buttons to toggle between alternate base layers if there are multiple bases
function baseLayerButtons (layerData)
{
    var bases = baseLayers.length;
    var choice = L.control({position: 'bottomleft'});
    choice.onAdd = function(map)
    {
        var div = L.DomUtil.create("div", "info");
        var baseBoxes = new Array(bases);
        var baseLabels = new Array(bases);
        for (var i = 0; i < bases; i++)
        {
            baseBoxes[i] = document.createElement('input'); // Create button
            baseBoxes[i].type= "radio";
            baseBoxes[i].name = "choice";
            baseBoxes[i].id = "id" + i;
            
            baseLabels[i] = document.createElement('text');  // Create label
            baseLabels[i].htmlFor = "id";     //   ??? should this be ... = "id" + i;
            baseLabels[i].appendChild(document.createTextNode(' ' + layerData[i].name + ' '));
            
            div.appendChild(baseBoxes[i]);
            div.appendChild(baseLabels[i]);
            
            
            // Brings the base layer to the front if its button is checked
            baseBoxes[i].addEventListener('change', function()
            {
                var checked = parseInt(this.id.charAt(2));
                
                if (data.info.threeLayer === "true") {
                    //special handling for 3-level map (province, district, municipality
                    if (checked === 0) {
                        map.removeLayer(baseLayers[2]);
                        baseLayers[0].bringToFront();
                        currentBase = 0;
                    } else if(checked=== 1){
                        map.addLayer(baseLayers[2]);
                        baseLayers[2].bringToFront();
                        baseLayers[1].bringToFront();
                        currentBase = 1;
                    } else {
                        map.addLayer(baseLayers[2]);
                        baseLayers[2].bringToFront();
                        currentBase = 2;
                    }
                    
               } else
                    if(this.checked) {
                    //for (var x = 0; x < bases; x++) map.removeLayer(baseLayers[x]);
                    
                    //baseLayers[checked].addTo(map);
    
                    baseLayers[(checked + 1) % bases].bringToFront();
                    baseLayers[checked].bringToFront();
                    currentBase = checked;
                   featureLayers();
                }
            });
        }
        // checks the box of the initial visible layer
        baseBoxes[0].checked = true;
        
        // //baseLayers[0].bringToFront();
        return div;
    }; // end choice.onAdd function
    
    choice.addTo(map);
} // end baseLayerButtons()


function makeGeoJson(data) {
        var geoJson =
        {   "type": "FeatureCollection",
            "features": []
        };
        
        var feature = {"type": "Feature",
            "properties" : {"ip": "<IP>",
                "country": "<country>",
                "province": "<province>",
                "city":    "<city>",
                "lat":     "<lat>",
                "long":    "<long>",
                "visits":  "<visits>" },
            "geometry":{"coordinates":[],
                        "type":"Point"}
                    };
        
        data.forEach(function(datum) {
            //TO CLONE an OBJECT: let cloneObj = JSON.parse(JSON.stringify(obj));
            var temp =  JSON.parse(JSON.stringify(feature));
            temp['properties']['ip'] = datum['ip'];
            temp['properties']['country'] = "Nepal";
            temp['properties']['province'] = datum['province'];
            temp['properties']['city'] = datum['city'];
            temp['properties']['lat'] = datum['lat'];
            temp['properties']['long'] = datum['long'];
            temp['properties']['visits'] = datum['visits'];
            temp['geometry']['coordinates'].push( datum['long'], datum['lat'] );
            
            geoJson['features'].push(temp);
        });
        return geoJson;
};  // end makeGeoJson

////////////////////////
// Loads the add-on layers onto the map by reading geojson in if they exist
function loadAddOnLayers (layerData, information) {
    
            ///////////////////
            function createAddOnLayer (data) {
                var addOnLayer = L.geoJson(data, {
                    
                    //onEachFeature: function (feature, latlng) {};
                    
                    pointToLayer: function (feature, latlng) {
                        
                       if (mapTitle === "Looma Schools Map" || mapTitle === "Looma User Locations") {
                            var rand = Math.floor((Math.random() * 10) + 1);
                            var blinking_circle = L.divIcon({className: 'blinking blinking' + rand})
                            marker = L.marker(latlng, {icon: blinking_circle});
                            //marker._icon.style = "animation-duration:5s;";
                        }
                        else
                    
                        marker = L.circleMarker(latlng, {
                            radius: layerData[arrIndex].style.radius,
                            color : layerData[arrIndex].style.color,
                            weight : layerData[arrIndex].style.weight,
                            opacity : layerData[arrIndex].style.opacity,
                            fillOpacity : layerData[arrIndex].style.fillOpacity,
                            fillColor : layerData[arrIndex].style.fillColor
                        });
                 
                        var popText = "";
                        var counter = 0;
                        var imageKey = "";
                        var imageData = "";
                        if (layerData[arrIndex].image) imageKey = layerData[arrIndex].image;
                        
                        Object.keys(feature.properties).forEach(function(key)
                        {
                            if(layerData[arrIndex].inPop) {
                                var inPop = layerData[arrIndex].inPop;
                                if (counter == 0) //the first feature is the name, and we don't need context for that
                                {
                                    if (inPop.indexOf(key) != -1)
                                    {
                                        popText += feature.properties[key].bold();
                                        popText += '<br>';
                                        counter++;
                                    }
                                } else {
                                    if (inPop.indexOf(key) != -1) {
                                        popText += capitalize(key).bold() + ": " + toCommas(feature.properties[key]);
                                        popText += '<br>';
                                    }
                                }
                            } else { //if they have not specified which features to include, include all of them
                                if (counter == 0) { //the first feature is the name, and we don't need context for that
                                    popText += feature.properties[key].bold();
                                    popText += '<br>';
                                    counter++;
                                } else {
                                    popText += capitalize(key).bold() + ": " + toCommas(feature.properties[key]);
                                    popText += '<br>';
                                }
                            }
                            if(imageKey == key) imageData = feature.properties[key];
                        });
                        
                        if(imageData.indexOf(' ') !== -1) imageData = imageData.replace(/ /gi, "_")
                        
                        if (layerData[arrIndex].image && information.popExtension) {
                            try {
                                var imageLink = getPhotoLink(imageData, information.popExtension);
                                popText += "<img class='pop-image' src = " + imageLink + " alt = ''>" + '<br>';
                            }
                            catch (err) {
                                console.log("error caught!");
                            }
                        }
                        
                        //DIKSHA       popText+="Wikipedia : <a href='/content/W4S/wp/1/"+imageData+".htm'>" + imageData +"</a><br>";
                        
                        
                        marker.bindPopup(popText,{className:'capital-popup', keepInView:true, width:600, minWidth:600, maxWidth:600});
                        
                        // markers.addLayer(marker);
                        
                        return marker;
                    }
                });
                addOnLayers[arrIndex++] = addOnLayer;
                // addOnLayers[arrIndex] = markers;
                //arrIndex ++;
            }; // end createAddOnlayer()
    
            function createMarkerClusterAddOnLayer(data) {
                var markers = L.markerClusterGroup();
                var geojson = L.geoJson(data,
                    {
                        onEachFeature:function(feature, layer) {
                        var popupText = feature.properties.ip + '<br>' + feature.properties.city;
                        layer.bindPopup(popupText);
                        }
                    }
                );
                markers.addLayer(geojson);
                
                addOnLayers[arrIndex++] = markers;
            }; // end createMarkerClusterAddOnLayer()
    
    //// start of loadAddOnLayers()  ////
    var arrIndex = 0; // a counter for the array
    var promises = [];
    var marker;
    //var markers = new L.MarkerClusterGroup();
    
    if (mapTitle === 'Looma User Locations') {
        promises[0] = $.post("looma-database-utilities.php",
            {cmd: 'getLogLocations'},
            function(data) {
                var geojson = makeGeoJson(JSON.parse(data));
                createMarkerClusterAddOnLayer(geojson);}
        ).fail(function(){console.log('getLogLocations failed');});
    }
    else for (var i = 0; i < layerData.length; i++)
        { var link = '/content/maps/json/' + layerData[i].geojson;
                // var addOnLayer = "";
                promises[i] = $.getJSON(
                    link,
                    function (data) {createAddOnLayer(data);}
                );
        }  // end for (i)
    
    
    Promise.all(promises).then(function() {
        console.log('In addonlayer, promises has ' + promises.length + ' entries');
        //for (var layer of addOnLayers) layer.addTo(map); //not needed. checking the box will do addTo()
        
        //if (mapTitle === "Looma Schools") {
        if (addOnLayers[0].pre_check) {
            addOnLayers[0].addTo(map).bringToFront();
        }
        addOnButtons(layerData);}
    );
} // end loadAddOnLayers()

///////////////////////////////////////////////////
// Creating Toggle Buttons, Info Box, and Legend //
///////////////////////////////////////////////////

////////////////////////
// Creates the checkboxes to toggle add-on layers on and off if add-on layers exist
function addOnButtons (layerData)
{
    var addOnCount = addOnLayers.length;
    var layers = L.control({position: 'bottomleft'});
    layers.onAdd = function(map) {
        var div = L.DomUtil.create("div", "info");
        var boxes = new Array(addOnLayers.length);
        var labels = new Array(addOnLayers.length);
        for (var i = 0; i < addOnCount; i++)
        {
            boxes[i] = document.createElement('input'); // Create the box
            boxes[i].type = "checkbox";
            boxes[i].id = "id" + i;
            labels[i] = document.createElement('text'); // Create the label
            labels[i].appendChild(document.createTextNode(' ' + layerData[i].name + ' '));

            div.appendChild(boxes[i]); // Add to map
            div.appendChild(labels[i]);
            
            boxes[i].addEventListener('change', function () {
                var numChecked = this.id.charAt(2);
                if (this.checked) {
                    popUpShowing[numChecked] = true;
                    map.addLayer(addOnLayers[numChecked]);
                } else {
                    map.removeLayer(addOnLayers[numChecked]);
                    popUpShowing[numChecked] = false;
                }
                featureLayers();
            });
        }
        
                    /*
                    for (var x = 0; x < addOnCount; x++)
                    {
                        boxes[x].addEventListener('change', function () {
            
                            var numChecked = this.id.charAt(2);
                            if (this.checked)  {
                                popUpShowing[numChecked] = true;
                                map.addLayer(addOnLayers[numChecked]);
                            } else {
                                map.removeLayer(addOnLayers[numChecked]);
                                popUpShowing[numChecked] = false;
                            }
                            featureLayers();
                        });
                    }
                    */
    /* */
        if (addOnCount > 0 && layerData[0].pre_check) {
            $(boxes[0]).prop( "checked", true );
            popUpShowing[0] = true;
            map.addLayer(addOnLayers[0]);
            addOnLayers[0].bringToFront();
        }
    /* */
        
        return div;
    };
    layers.addTo(map);
 
} // end addOnButtons()

////////////////////////
// Creates the legend for the map
function loadLegend (legendData)
{
    var legend = L.control({position: 'bottomleft'});   //Where it is
    legend.onAdd = function (map) {                     //Adds the legend
        var div = L.DomUtil.create('div', 'info legend')
        div.innerHTML += '<b>' + legendData.title + '<br></b>';//Title
        for(var i = 0; i < legendData.labels.length; i++){
            div.innerHTML += '<i style="background:' + legendData.colors[i] + '"></i> '
                + legendData.labels[i] + '<br>';
        }
        return div;
    };
    legend.addTo(map);
} // end loadLegend()

////////////////////////
// Creates the information control box in the top right
function loadInfoBox(data)
{
    // Creates the info box (Upper Right)
    info = L.control(); //Custom info for each country
    info.onAdd = function (map) {
        this._div = L.DomUtil.create('div', 'info'); //Creates a div with class "info"
        this.update();
        return this._div;
    };

    info.update = function (props)
    {
        this._div.innerHTML = ""; // Clear the div
        if (props) // If a feature is passed in, evaluate what properties has and then display them
        {
            var imageKey = "";
            var counter = 0;
            var imageData = "";
            var s = "";

            if(data.baseLayers[currentBase].image)
            {//get the key for the image, if it exists
                imageKey = data.baseLayers[currentBase].image;
            }

            if(data.baseLayers[currentBase].inInfo)
            { //if we have a list of the information to include, only use that info
                var inInfo = data.baseLayers[currentBase].inInfo;
                Object.keys(props).forEach(function (key) {
                    if (counter == 0)
                    {//if its the first one, no key and bold
                        if (inInfo.indexOf(key) != -1)
                        {
                            s += toCommas(props[key]).bold();
                            s += '<br>'
                            counter++;
                        }
                    }
                    else if (inInfo.indexOf(key) != -1)
                    {
                        s += capitalize(key).bold() + ": " + toCommas(props[key]);
                        s += '<br>';
                    }

                    if(key == imageKey) //can't use else if in case the image key is first
                    { //the name of the image is in the image key, getting it
                        imageData = props[key];
                    }
                });
            }
            else //if there is nothing selected in the mongo to include, print everything
            {
                Object.keys(props).forEach(function (key) {
                    if (counter == 0) {//if its the first one, no key and bold
                        s += toCommas(props[key]).bold();
                        s += '<br>'
                        counter++;
                    }
                    else
                    {
                        s += capitalize(key).bold() + ": " + toCommas(props[key]);
                        s += '<br>';
                    }
                    if(key == imageKey)
                    { //the name of the image is in the image key, getting it
                        imageData = props[key];
                    }
                });
            }

            if (data.baseLayers[currentBase].image && data.info.infoExtension)
            {//get the image if there is an image and an extension
                var imageLink = getPhotoLink(imageData, data.info.infoExtension);
                s += "<img class='info-image' src = " + imageLink + " alt = ''>" + '<br>';
            }

            this._div.innerHTML = s; //assigning the innerHTML to s
        }

        else // If no feature is passed in (undefined at the beginning) tell the user to hover over an area
        {
            this._div.innerHTML = 'Hover over an area'
        }


    }; // Used to update the control based on feature properties passed
    info.addTo(map);
} // end loadInfoBox()


//////////////////////////////
// Layer and Info Functions //
//////////////////////////////

////////////////////////
//Loops through all addOnLayers and their priorities starting with the lowest priority to highest, and brings them to the front
function featureLayers()
{
    if(addOnData)
    {
        for (var x = addOnData.length - 1; x >= 0; x--)
        {
            if (priorityOn)
            {
                var indexOfPriority = findPriority(x); //Index of the layer with the matching priority to x in the array of addOnLayers
                if (popUpShowing[indexOfPriority] == true)
                {
                    addOnLayers[indexOfPriority].bringToFront();
                }
            }
            else
            {
                //For maps with no specified priorities
                if (popUpShowing[x] == true)
                {
                    addOnLayers[x].bringToFront();
                }
            }
        }
    }
} // end featureLayers()

////////////////////////
//Finds the correct layer that has the given priority, if none matching returns value
function findPriority(value) {
    var i;
    for (i = 0; i < addOnData.length; i++)
        if (addOnData[i].priority == value) return i;
    return value;
} // end findPriority()

////////////////////////
// Gets the flag link based on the country (photo link is (country id).png)
function getPhotoLink(iso, extension) {
    return ('/content/maps/photos/' + iso + "." + extension).toString();
} // end getPhotoLink()


//////////////////////
// Number functions //
//////////////////////

    // Inserts commas to long numbers to improve readability
    function toCommas(numRaw) {
        if(isNaN(numRaw)) {
            //if it's not a number, don't add commas
            return numRaw;
        } else {
            var num = "";
            if (numRaw.length >= 10)
            { //Adds comma for 1 billion+, so on and so forth. Length of 10+ == billion
                num += numRaw.substring(0, numRaw.length - 9) + ",";
                numRaw = numRaw.substring(numRaw.length - 9, numRaw.length);
            }
            if (numRaw.length >= 7)
            {        // length of 7+ == million (1,000,000)
                num += numRaw.substring(0, numRaw.length - 6) + ",";
                numRaw = numRaw.substring(numRaw.length - 6, numRaw.length);
            }
            if (numRaw.length >= 4)
            {           // length of 4+ == thousand (1,000)
                num += numRaw.substring(0, numRaw.length - 3) + ",";
                numRaw = numRaw.substring(numRaw.length - 3, numRaw.length);
            }
            num += numRaw;
            return num;
        }
    } // end toCommas()
    
    // Instead of displaying full number, prints out "billion" or "million" for readability
    function toWords(numRaw) {
        if (numRaw >= 1000000000000)
            return (numRaw / 1000000000000 + ' trillion');
        else if (numRaw >= 1000000000)
            return (numRaw / 1000000000 + ' billion');
        else if (numRaw >= 1000000)
            return (numRaw / 1000000 + ' million');
        else if (numRaw >= 1000)
            return (numRaw / 1000 + ' thousand');
        return numRaw;
    } // end toWords()
    
    //Turns a number into date form with BCE/CE
    function toDate(dateRaw) {
        if (dateRaw < 0) return Math.abs(dateRaw) + ' BCE';
        else if (dateRaw < 1000) return dateRaw + ' CE';
        return dateRaw;
    } // end toDate()
    
    //Correctly capitalizes a word by capitalizing first letter
    function capitalize(wordRaw) {
    return wordRaw.charAt(0).toUpperCase() + wordRaw.substring(1);
    } // end capitalize()
    
    //turns spaces into underscores for the names of images (so that we can use more generic names to  call the image)
    function spaceToUnderscore(wordRaw) {
        var toReturn = "";
        while(true) {
            toReturn += wordRaw.substring(0, wordRaw.indexOf(' '));
            toReturn += "_";
            wordRaw = wordRaw.substring(wordRaw.indexOf(' ') + 1);
    
            if(wordRaw.indexOf(' ') == -1) {
                toReturn += wordRaw;
                return toReturn;
            }
        }
        return toReturn;
    } // end spaceToUnderscore()

//////////////////////////////////////////////

window.onload = function () {
    
    var mapid = $("#map").data()['id'];
    var collection = 'maps';
    
    $.post("looma-database-utilities.php",
        {cmd: 'openByID', collection: collection, id: mapid},
        function(mapdata) {
            data = mapdata;
            L.Circle.prototype._checkIfEmpty = function () { return false; };
            //Fixes a Leaflet glitch that the circle markers
            //would disappear on pan or zoom
            
            mapTitle = data.title;
            
            if (data.baseLayers) baseLayers = new Array(data.baseLayers.length); // array of feature layers
            
            if (data.addOnLayers)
            {
                addOnData = data.addOnLayers;
                addOnLayers = new Array(data.addOnLayers.length);
                popUpShowing = new Array(data.addOnLayers.length);
                
                if (addOnData[0].priority) priorityOn = true;
                else priorityOn = true;  //??? was false?
            }
            
            //Starting map view
            if (data.info.start)
                map = L.map('map').setView([data.info.start.startLat,
                        data.info.start.startLong],
                    data.info.start.startZoom);
            else
                map = L.map('map').setView([27, 85], 3);
            
            if (data.info.backgroundColor)
            {   var bColor = data.info.backgroundColor;
                var el = document.getElementsByClassName('leaflet-container');
                for (var i = 0; i < el.length; i++) el[i].style.backgroundColor = bColor;
            }
            
            //Zoom levels
            if (data.info.zoom) {
                map.options.minZoom = data.info.zoom.minZoom;
                map.options.maxZoom = data.info.zoom.maxZoom;
            } else {   //Default numbers for if they are not set in mongo
                map.options.minZoom = 2.5;
                map.options.maxZoom = 7;
            }
            
            //If the map has tiles, add them as a background for the map
            if (data.tileLayer && data.tileExtension)
            {
                var link = '/maps2018/tiles/' + data.tileLayer + '/{z}/{x}/{y}.' + data.tileExtension;
                L.tileLayer(link, {
                    minZoom: data.info.zoom.minZoom,
                    maxZoom: data.info.zoom.maxZoom,
                }).addTo(map);
            }
            
            //Sets boundaries for the distance the user can span in pixels
            var southWest, northEast;
            if (data.info.mapBounds) {
                southWest = L.latLng(data.info.mapBounds.SWLat, data.info.mapBounds.SWLong);
                northEast = L.latLng(data.info.mapBounds.NELat, data.info.mapBounds.NELong);
            }
            else {  //Default (whole globe, centered on Nepal)
                southWest = L.latLng(-85.0511, -180);
                northEast = L.latLng(85.0511, 180);
            }
            var bounds = L.latLngBounds(southWest, northEast);
            map.setMaxBounds(bounds);
            
            map.on('drag', function () {
                map.panInsideBounds(bounds, {animate: false});
            });
            
            if (data.baseLayers) loadBaseLayers(data.baseLayers);
            
            if (data.addOnLayers) loadAddOnLayers(data.addOnLayers, data.info);
     
            // Creates the info control box that displays information about a location when the user hovers over it
            if (data.info.hasInfoBox && data.info.hasInfoBox == true) {
                loadInfoBox(data);
                infoBoxOn = true;
            } else
                infoBoxOn = false;
            
            if (data.legend) loadLegend(data.legend);
            
        }, // end of getJSON function
        'json'
    );
}; // End of window.onload()