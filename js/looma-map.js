/*
LOOMA javascript file
Filename: looma-map.js
Description: Reads in data from a mongo document and from geojson documents to create a map

Programmer name: Morgan, Sophie, Henry, Kendall
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2018 07
Revision: Looma 3.0
 */

"use strict";

// Create the layers for the map and the arrays that hold them
var baseLayers; // Array storing the base layers
var addOnLayers; // Array storing add-on layers
var popUpsOn; // Array storing true/false values for if each add-on layer is on/off
var info; // Represents the information box
var currentBase; //represents the current selected base layer (the number of it)
var addOnData; // The add on layers in the database
var priorityOn; // If layers are brought to the front by priorities in database
var infoBoxOn; //If the infoBox is on
var map, southWest, northEast;

window.onload = function () {

    var mapid = $("#map").data()['id'];
    var collection = 'maps';

    $.post("looma-database-utilities.php",
        {cmd: 'openByID', collection: collection, id: mapid},
        function(data) {

            /*
                **Note** : The if(data.x) statements evaluate as true if the field exists
                           and false if nothing exists, so it will skip a function without making any errors
                           if the mongo has nothing for that field (e.g., has no add-on layers).
                           When creating a new mongo, try to fill out as many as you can
                           The most important piece of data is a baselayer
             */

            L.Circle.prototype._checkIfEmpty = function () { return false; }; //Fixes a Leaflet glitch that the cirlce markers
            //would disappear on pan or zoom

            //Sets title of map
            if (data.title)
            {
                //document.getElementById('title').innerHTML = data.title;
            }
            else
            {
                //document.getElementById('title').innerHTML = "Map";
            }

            //Base layers
            if (data.baseLayers)
            {
                baseLayers = new Array(data.baseLayers.length); // array of feature layers
            }

            //Add on layers
            if (data.addOnLayers)
            {
                addOnData = data.addOnLayers;
                addOnLayers = new Array(data.addOnLayers.length);
                popUpsOn = new Array(data.addOnLayers.length); // array of booleans for if each button is on

                if (addOnData[0].priority)
                {
                    priorityOn = true;
                }
                else
                {
                    //priorityOn = false;
                    priorityOn = true;
                }
            }

            //Starting map view
            if (data.info.start)
            {
                map = L.map('map').setView([data.info.start.startLat, data.info.start.startLong], data.info.start.startZoom);
            }
            else
            {
                map = L.map('map').setView([20, 60], 3);
            }

            // If a background color is set in mongo, use it
            if (data.info.backgroundColor)
            {
                var bColor = data.info.backgroundColor;
                var el = document.getElementsByClassName('leaflet-container');
                for (var i = 0; i < el.length; i++)
                {
                    el[i].style.backgroundColor = bColor;
                }
            }

            //Zoom levels
            var minZoom;
            var maxZoom;
            if (data.info.zoom)
            {
                minZoom = data.info.zoom.minZoom;
                maxZoom = data.info.zoom.maxZoom;
            }
            else
            {
                //Default numbers for if they are not set in mongo
                minZoom = 2.5;
                maxZoom = 7;
            }
            map.options.minZoom = minZoom;
            map.options.maxZoom = maxZoom;

            //If the map has tiles, add them as a background for the map
            if (data.tileLayer && data.tileExtension)
            {
                var link = '../maps2018/tiles/' + data.tileLayer + '/{z}/{x}/{y}.' + data.tileExtension;
                L.tileLayer(link, {
                    minZoom: minZoom,
                    maxZoom: maxZoom,
                }).addTo(map);
            }

            //Sets boundaries for the distance the user can span in pixels
            var southWest, northEast;
            if (data.info.mapBounds)
            {
                southWest = L.latLng(data.info.mapBounds.SWLat, data.info.mapBounds.SWLong);
                northEast = L.latLng(data.info.mapBounds.NELat, data.info.mapBounds.NELong);
            }
            else
            {
                //Default
                southWest = L.latLng(-85.0511, -180);
                northEast = L.latLng(85.0511, 180);
            }
            var bounds = L.latLngBounds(southWest, northEast);
            map.setMaxBounds(bounds);
            map.on('drag', function () {
                map.panInsideBounds(bounds, {animate: false});
            });


            // Call the layer-adding functions, if those layers exist
            if (data.baseLayers)
            {
                loadBaseLayers(data.baseLayers);
            }
            if (data.addOnLayers)
            {
                loadAddOnLayers(data.addOnLayers, data.info);
            }

            // Creates the checkboxes to toggle add-on layers on and off if add-on layers exist
            if (data.addOnLayers)
            {
                addOnButtons(data.addOnLayers);
            }

            // Creates the buttons to toggle between alternate base layers if there are multiple bases
            if (data.baseLayers && data.baseLayers.length > 1)
            {
                baseLayerButtons(data.baseLayers);
            }

            // Creates the info control box that displays information about a location when the user hovers over it
            if (data.info.hasInfoBox && data.info.hasInfoBox == true)
            {
                loadInfoBox(data); //this data.info thing is weird
                infoBoxOn = true;
            }
            else
            {
                infoBoxOn = false;
            }

            // If the mongo has a legend, create one
            if (data.legend)
            {
                loadLegend(data.legend);
            }

        }, // end of data function
        'json'
    );

}; // End of window.onload()


////////////////////////
// Creates the Layers //
////////////////////////

////////////////////////
// If baselayers exist (which at least one definitely should), add them to map
function loadBaseLayers (layerData) {
    var currentStyle = 0;
    var arrayIndex = 0; //a counter for the array
    currentBase = 0;
    for (var i = 0; i < layerData.length; i++)     // Loads the base layers onto the map by reading geojson in
    {
        var link = '../maps2018/json/' + layerData[i].geojson;
        var baseLayer = "";


        $.getJSON(link, function (result)
        {
            baseLayer = L.geoJson(result, {
                style: styleLayer,
                onEachFeature: onEachFeature
            });
            baseLayers[arrayIndex] = baseLayer;
            arrayIndex ++;
            currentBase ++;
            currentBase = currentBase % baseLayers.length; //Will never go over, fixes a glitch
            baseLayers[0].addTo(map);

            // Sets the look of each country
            function styleLayer(feature)
            {
                return {
                    fillColor: getColor(feature, layerData[currentBase].style),
                    weight: layerData[currentBase].style.weight,
                    opacity: layerData[currentBase].style.opacity,
                    color: layerData[currentBase].style.color,
                    fillOpacity: layerData[currentBase].style.fillOpacity
                };
            }

            // Assigns a color to a country/region/area
            function getColor(feature, style)
            {
                try
                {
                    var index;
                    var random = style.random, cutoffs = style.cutoffs, colors = style.colors;
                    var featureUsedValue = feature.properties[style.colorFeature]; //the numerical feature used to determine the color
                    if (random)
                    {
                        index = featureUsedValue % (cutoffs.length);
                    }
                    else
                    {
                        index = featureUsedValue;
                    }

                    for (var i = 0; i < colors.length - 1; i++)
                    {
                        if (index < cutoffs[i])
                        {
                            return colors[i];
                        }
                    }
                    return colors [colors.length - 1];
                }
                catch(err)
                {  //if any data is missing, just make them all blue so that the map still loads
                    return 'blue';
                }
            }

            // Hovering listener. Calls highight/resethighlight functions
            function onEachFeature(feature, layer)
            {
                layer.on({
                    mouseover: highlightFeature,
                    mouseout: resetHighlight,
                });
            }

            // Highlights the area that the mouse is hovering over in gray
            function highlightFeature(e)
            {
                var style = layerData[currentStyle].style;
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
                        color: '#666',
                        fillOpacity: 0.7
                    });
                }

                if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge)
                {
                    layer.bringToFront();
                    featureLayers();
                }

                if (infoBoxOn)
                {
                    info.update(layer.feature.properties);
                }
            }   //End of highlight function

            // Makes sure that once the country is deselected the gray is gone
            function resetHighlight(e)
            {
                var layer = e.target;
                baseLayer.resetStyle(e.target);
                layer.bringToBack(e.target);
                //info.update(); //Comment this out to avoid glitches when the mouse goes over the info box
            }
        });

    }
} // end loadBaseLayers()

////////////////////////
// Loads the add-on layers onto the map by reading geojson in if they exist
function loadAddOnLayers (layerData, information) {
    var arrIndex = 0; // a counter for the array
    for (var i = 0; i < layerData.length; i++)
    {
        var link = '../maps2018/json/' + layerData[i].geojson;
        var addOnLayer = "";
        $.getJSON((link), function (data) {
            addOnLayer = L.geoJson(data, {
                pointToLayer: function (feature, latlng) {
                    var marker = L.circleMarker(latlng, {
                        radius: layerData[arrIndex].style.radius,
                        color : layerData[arrIndex].style.color,
                        weight : layerData[arrIndex].style.weight,
                        opacity : layerData[arrIndex].style.opacity,
                        fillOpacity : layerData[arrIndex].style.fillOpacity,
                        fillColor : layerData[arrIndex].style.fillColor,
                    });

                    var popText = "";
                    var counter = 0;
                    var imageKey = "";
                    var imageData = "";
                    if(layerData[arrIndex].image)
                    {
                        imageKey = layerData[arrIndex].image;
                    }


                    Object.keys(feature.properties).forEach(function(key)
                    {
                        if(layerData[arrIndex].inPop)
                        {
                            var inPop = layerData[arrIndex].inPop;
                            if (counter == 0) //the first feature is the name, and we don't need context for that
                            {
                                if (inPop.indexOf(key) != -1)
                                {
                                    popText += feature.properties[key].bold();
                                    popText += '<br>';
                                    counter++;
                                }
                            }
                            else
                            {
                                if (inPop.indexOf(key) != -1)
                                {
                                    popText += capitalize(key).bold() + ": " + toCommas(feature.properties[key]);
                                    popText += '<br>';
                                }
                            }
                        }
                        else //if they have not specified which features to include, include all of them
                        {
                            if (counter == 0) //the first feature is the name, and we don't need context for that
                            {
                                popText += feature.properties[key].bold();
                                popText += '<br>';
                                counter++;

                            }
                            else
                            {
                                popText += capitalize(key).bold() + ": " + toCommas(feature.properties[key]);
                                popText += '<br>';
                            }
                        }
                        if(imageKey == key)
                        {
                            imageData = feature.properties[key];
                        }
                    });

                    if(imageData.indexOf(' ') != -1)
                    {
                        imageData = spaceToUnderscore(imageData);
                    }

                    if (layerData[arrIndex].image && information.popExtension)
                    {
                        try {
                            var imageLink = getPhotoLink(imageData, information.popExtension);
                            popText += "<img class='pop-image' src = " + imageLink + " alt = ''>" + '<br>';
                        }
                        catch (err) {
                            console.log("error caught!");
                        }
                    }
                    popText+="Wikipedia : <a href='../content/W4S/wp/1/"+imageData+".htm'>" + imageData +"</a><br>";

                    marker
                        .bindPopup(popText,{className:'capital-popup', keepInView:true, width:600, minWidth:600, maxWidth:600})
                    /*  //NOTE: following code (popupopen and popupclose not needed with option keepInView
                        .on('popupopen', function(popup) {
                            //if the popup will go off the screen, extend the max bounds so that we can see the popup
                            if(information.mapBounds) {
                                var coords = marker.getLatLng();
                                var southWest = L.latLng(information.mapBounds.SWLat, information.mapBounds.SWLong);
                                var northEast = L.latLng(information.mapBounds.NELat, information.mapBounds.NELong);
                                if (coords.lng > information.mapBounds.NELong - 25) {
                                    //console.log("IN IF");
                                    northEast = L.latLng(information.mapBounds.NELat, information.mapBounds.NELong + 25);
                                }
                                else if (coords.lng < information.mapBounds.SWLong + 25) {
                                    console.log("in if");
                                    southWest = L.latLng(information.mapBounds.SWLat, information.mapBounds.SWLong - 25);
                                }

                                var bounds = L.latLngBounds(southWest, northEast);
                                map.setMaxBounds(bounds);
                            }
                        })
                    .on('popupclose',function(popup)
                    {
                        if(information.mapBounds) {
                            //set the bounds back to normal
                            southWest = L.latLng(information.mapBounds.SWLat, information.mapBounds.SWLong);
                            northEast = L.latLng(information.mapBounds.NELat, information.mapBounds.NELong);
                            var bounds = L.latLngBounds(southWest, northEast);
                            map.setMaxBounds(bounds);
                        }
                    }

                    )*/
                    ;
                    return marker;
                }
            });
            addOnLayers[arrIndex] = addOnLayer;
            arrIndex ++;
        });
    }
} // end loadAddOnLayers()

///////////////////////////////////////////////////
// Creating Toggle Buttons, Info Box, and Legend //
///////////////////////////////////////////////////

////////////////////////
// Creates the checkboxes to toggle add-on layers on and off if add-on layers exist
function addOnButtons (layerData)
{
    var addOns = addOnLayers.length;
    var layers = L.control({position: 'bottomleft'});
    layers.onAdd = function(map) {
        var div = L.DomUtil.create("div", "info");
        var boxes = new Array(addOnLayers.length);
        var labels = new Array(addOnLayers.length);
        for (var i = 0; i < addOns; i++)
        {
            boxes[i] = document.createElement('input'); // Create the box
            boxes[i].type = "checkbox";
            boxes[i].id = "id" + i;

            labels[i] = document.createElement('text'); // Create the label
            labels[i].appendChild(document.createTextNode(' ' + layerData[i].name + ' '));

            div.appendChild(boxes[i]); // Add to map
            div.appendChild(labels[i]);

        }
        for (var x = 0; x < addOns; x++)
        {
            boxes[x].addEventListener('change', function () {

                var numChecked = this.id.charAt(2);
                if (this.checked)
                {
                    popUpsOn[numChecked] = true;
                    map.addLayer(addOnLayers[numChecked]);
                }
                else
                {
                    map.removeLayer(addOnLayers[numChecked]);
                    popUpsOn[numChecked] = false;
                }
                featureLayers();
            });
        }
        return div;
    }
    layers.addTo(map);
} // end addOnButtons()

////////////////////////
// Creates the buttons to toggle between alternate base layers if there are multiple bases
function baseLayerButtons (layerData)
{
    var bases = baseLayers.length;
    var choice = L.control({position: 'bottomleft'});
    choice.onAdd = function(map)
    {
        var div = L.DomUtil.create("div", "info");
        var baseBoxes = new Array(baseLayers.length);
        var baseLabels = new Array(baseLayers.length);
        for (var i = 0; i < bases; i++)
        {
            baseBoxes[i] = document.createElement('input'); // Create button
            baseBoxes[i].type= "radio";
            baseBoxes[i].name = "choice";
            baseBoxes[i].id = "id" + i;

            baseLabels[i] = document.createElement('text');  // Create label
            baseLabels[i].htmlFor = "id";
            baseLabels[i].appendChild(document.createTextNode(' ' + layerData[i].name + ' '));

            div.appendChild(baseBoxes[i]);
            div.appendChild(baseLabels[i]);


            // Brings the base layer to the front if its button is checked
            baseBoxes[i].addEventListener('change', function()
            {
                var checked = this.id.charAt(2);
                if(this.checked)
                {

                    for (var x = 0; x < bases; x++)
                    {
                        map.removeLayer(baseLayers[x]);
                    }
                    baseLayers[checked].addTo(map);
                    baseLayers[checked].bringToFront();
                    currentBase = checked;
                    featureLayers();
                }
            });
        }
        baseBoxes[0].checked = true; // Makes the box of the layer that is visible at the beginning checked
        return div;
    }
    choice.addTo(map);
} // end baseLayerButtons()

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
                if (popUpsOn[indexOfPriority] == true)
                {
                    addOnLayers[indexOfPriority].bringToFront();
                }
            }
            else
            {
                //For maps with no specified priorities
                if (popUpsOn[x] == true)
                {
                    addOnLayers[x].bringToFront();
                }
            }
        }
    }
} // end featureLayers()

////////////////////////
//Finds the correct layer that has the given priority, if none matching returns value
function findPriority(value)
{
    var i;
    for (i = 0; i < addOnData.length; i++)
    {
        if (addOnData[i].priority == value)
        {
            return i;
        }
    }
    return value;
} // end findPriority()

////////////////////////
// Gets the flag link based on the country (photo link is (country id).png)
function getPhotoLink(iso, extension)
{
    return ('../maps2018/photos/' + iso + "." + extension).toString();
} // end getPhotoLink()


//////////////////////
// Number functions //
//////////////////////

// Inserts commas to long numbers to improve readability
function toCommas(numRaw)
{
    if(isNaN(numRaw))
    {
        //if it's not a number, don't add commas
        return numRaw;
    }
    else
    {
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
function toWords(numRaw)
{
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
function toDate(dateRaw)
{
    if (dateRaw < 0)
    {
        return Math.abs(dateRaw) + ' BCE';
    }
    else if (dateRaw < 1000)
    {
        return dateRaw + ' CE';
    }
    return dateRaw;
} // end toDate()

//Correctly capitalizes a word by capitalizing first letter
function capitalize(wordRaw)
{
    return wordRaw.charAt(0).toUpperCase() + wordRaw.substring(1);
} // end capitalize()

//turns spaces into underscores for the names of images (so that we can use more generic names to  call the image)
function spaceToUnderscore(wordRaw)
{
    var toReturn = "";
    while(true) {
        toReturn += wordRaw.substring(0, wordRaw.indexOf(' '));
        toReturn += "_";
        wordRaw = wordRaw.substring(wordRaw.indexOf(' ') + 1);

        if(wordRaw.indexOf(' ') == -1)
        {
            toReturn += wordRaw;
            return toReturn;
        }
    }
    return toReturn;

} // end spaceToUnderscore()
