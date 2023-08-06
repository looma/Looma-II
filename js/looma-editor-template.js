/*
LOOMA javascript file
Filename: looma-editor_template.js
Description: template for Looma editor tools, like Lesson Plan Editor, Slideshow Editor, etc

Programmer name: Skip
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 04 2018
Revision: Looma 3.0
 */

'use strict';

//var savedcheckpoint;   //savedTimeline is checkpoint of timeline for checking for modification
var savedSignature ='';   //savedSignature is checkpoint of timeline for checking for modification
var loginname, loginlevel;
var homedirectory = "../";
var $timeline;


////////////////////////////////////////////
//////   functions used by filecommands/////
////////////////////////////////////////////

///////// editor_clear  /////////
function editor_clear() {
    
    setname("");
    $timeline.empty();
    clearFilter();
    editor_checkpoint();
    
}

///////  editor_showsearchitems  /////////
function editor_showsearchitems() {
    $('#lesson-chk').show();
    // for TEXT EDIT, only show "text", clicked and disabled
    $('#lesson-chk input').attr('checked', true).css('opacity', 0.5);
    //$('#txt-chk input').prop('readonly'); //cant make 'readonly' work
    $('#lesson-chk input').click(function() {return false;});
    
}


///////// editor_checkpoint /////////
function editor_checkpoint()       {savedSignature = signature($timeline);}
//function editor_undocheckpoint() {}; //cant undo changes with signatures

///////// editor_modified /////////
function editor_modified() {return (
    signature($timeline) !== savedSignature);}

///////// signature  /////////
function signature(elem) { //param is jQ object of the timeline ($timeline)
    var sig = '';
    elem.find('.activityDiv').each(function(index, x){
    
        //possible BUG: 'each' may not happen in the same order every time
        
        sig += $(x).data('id');});
    
    return sig;
}

///////// editor_pack  /////////
function editor_pack (html) { // pack the timeline into an array of collection/id pairs for storage
    var packitem;
    var packarray = [];
    
    
    $(html).each(function() {
        packitem = {};  //make a new object, unlinking the references already pushed into packarray
        packitem.collection = $(this).data('collection');
        packitem.id         = $(this).data('id');
        packarray.push(packitem);
    });
    
    return packarray;
} //end editor_pack()

///////// unpack /////////
function unpack (response) {  //unpack the array of collection/id pairs into html to display on the timeline
    
    //var newDiv = null;  //reset newDiv so previous references to it are broken
    
    //for each element in data, call createActivityDiv, and attach the resturn value to #timelinediv
    // also set filename, [and collection??]
    
    //$('#timelineDisplay').empty();
    editor_clear();
    
    setname(response.dn);
    
    // need to record ID of newly opened LP so that later SAVEs can overwrite it
    
    var posts = [];  //we will push all the $.post() deferreds in the foreach below into posts[]
    
    $(response.order).each(function(index) {
        // retrieve each timeline element from mongo and add it to the current timeline
        //var newDiv = null;  //reset newDiv so previous references to it are broken
        posts.push($.post("looma-database-utilities.php",
            {cmd: "openByName", collection: 'activities', ft: 'image', fn:this.fn,fp:this.fp},
            function(result) {
                var newDiv = createActivityDiv(result);
                //add data-index to timeline element for later sorting
                //    (because the elements are delivered async, they may be out of order)
                $(newDiv.firstChild).attr('data-index', index);
                console.log('adding file :' + result.fn);
                insertTimelineElement(newDiv.firstChild);
            },
            'json'
        ));
    });
    
    //  when all the $.post are complete, then re-order the timeline to account for out-of-order elements from asynch $.post calls
    $.when.apply(null, posts).then(function(){orderTimeline();editor_checkpoint();});
    
    makesortable();
    
} //end unpack()

///////// editor_display  /////////
function editor_display (response) {clearFilter(); $timeline.html(unpack(response)); editor_checkpoint();}

/////////  editor_save  /////////
function editor_save(name) {
    savefile(name, currentcollection, currentfiletype, editor_pack($timeline.html()), "true",null);
    //note, the final param to 'savefile()' [to make an activity] set to 'true'
    //because lessons are recorded as  activities [for use in library-search, for instance]
} //end editor_save()

///////// editor_templatesave /////////
function editor_templatesave(name) {
    savefile(name, currentcollection, currentfiletype + '-template', editor_pack($timeline.html()), "false",null);
    //note, the final param to 'savefile()' [to make an activity] set to 'false'
    //because lessons templates are not recorded as  activities
} //end editor_templatesave()

// end FILE COMMANDS stuff



var clearFilter = function() {
    console.log('clearFilter');
    
    if ($('#collection').val() == 'activities') {
        $('#searchString').val("");
        $(".filter_dropdown").each(function() { this.selectedIndex = 0; });
        $(".filter_checkbox").each(function() { $(this).prop("checked", false); });
    } else //collection=='chapters'
    {
        $("#dropdown_grade").val("").change();
        $("#dropdown_subject").val("").change();
    }
    
    $("#innerResultsMenu").empty();
    $("#innerResultsDiv").empty();
    $("#previewpanel").empty();
}; //end clearFilter()


function clearResults() {
    $("#innerResultsMenu").empty();
    $("#innerResultsDiv" ).empty();
    $("#previewpanel"    ).empty();
    
} //end clearResults()

//////////////////////////////////
///////  displayResults    ///////
//////////////////////////////////
function displayResults(results) {
    var result_array = [];
    result_array['activities'] = [];  //array to store ACTIVITIES returned by SEARCH
    result_array['chapters']  = [];   //array to store CHAPTERS returned by SEARCH
    
    for (var i=0; i < results.length; i++) {
        if (results[i]['ft'] == 'chapter') result_array['chapters'].push(results[i]);
        else                               result_array['activities'].push(results[i]);
    }
    
    $('.hint').hide();
    $('#innerResultsMenu, #innerResultsDiv').empty();
    
    displaySearchResults(result_array);

    
    makedraggable();  //not working for now
    
} //end displayresults()


/////////////////////////////////////////////////////////////
/////////////////  FILL IN SEARCH RESULTS PANE //////////////
/////////////////////////////////////////////////////////////

function displaySearchResults (filterdata_object) {
    var currentResultDiv = document.createElement("div");
    currentResultDiv.id = "currentResultDiv";
    $(currentResultDiv).appendTo("#innerResultsDiv");


//***********************
// display Activities in Search Results pane
//***********************
    
    var actResultDiv = document.createElement("div");
    actResultDiv.id = "actResultDiv";
    $(actResultDiv).appendTo(currentResultDiv);
    
    var collectionTitle = document.createElement("h5");
    collectionTitle.id = "activityTitle";
    
    var activitiesarraylength = filterdata_object.activities.length;
    if (activitiesarraylength == 0) {
        collectionTitle.innerHTML = "<a class='heading' name='activities'>Activities (0 Results)</a>";
    }
    else if (activitiesarraylength == 1) {
        collectionTitle.innerHTML = "<a class='heading' name='activities'>Activities (1 Result)</a>";
    }
    else {
        collectionTitle.innerHTML = "<a class='heading' name='activities'>Activities (" + activitiesarraylength + " Results)</a>";
    }
    actResultDiv.appendChild(collectionTitle);
    
    for(var i=0; i<filterdata_object.activities.length; i++) {
        var rElement = createActivityDiv(filterdata_object.activities[i]);  //BUG: array[i-1] not defined when i==0
        
        actResultDiv.appendChild(rElement);
        
    }
// end Print Activities Array


//***********************/
// display Chapters in Search Results pane
//***********************/
    
    var chaptersarraylength = filterdata_object.chapters.length;
    if (chaptersarraylength > 0) {
        collectionTitle = document.createElement("h5");
        collectionTitle.id = "chapterTitle";
        
        if (chaptersarraylength == 1) {
            collectionTitle.innerHTML = "<a class='heading' name='activities'>Chapters (1 Result)</a>";
        }
        else {
            collectionTitle.innerHTML = "<a class='heading' name='activities'>Chapters (" + chaptersarraylength + " Results)</a>";
        }
        actResultDiv.appendChild(collectionTitle);
        
        for(i=0; i<filterdata_object.chapters.length; i++) {
            rElement = createActivityDiv(filterdata_object.chapters[i]);
            
            actResultDiv.appendChild(rElement);
        }
    }

// end Print Chapters Array

///////////////////////////////
// Create inner results menu
//////////////////////////////
    
    $("<span/>", {
        id : "chaptersScroll",
        html : "Chapters (" + chaptersarraylength + ")&nbsp;&nbsp;&nbsp;&nbsp;"
    }).appendTo("#innerResultsMenu");
    $("<span/>", {
        id : "activitiesScroll",
        html : "Activities (" + activitiesarraylength + ')'
    }).appendTo("#innerResultsMenu");
    
    $("#innerResultsMenu").css("border-bottom","1px solid #000");
    
    $('#chaptersScroll').click(function()  {$('#innerResultsDiv').scrollTop($('#chapterTitle').position().top);});
    $('#activitiesScroll').click(function(){$('#innerResultsDiv').scrollTop($('#activityTitle').position().top);});
    
} //end displaySearchResults()



function thumbnail (item) {
    
    //builds a filepath/filename for the thumbnail of this "item" based on type
    var collection, filetype, filename, filepath;
    var thumbnail_prefix, path, imgsrc, idExtractArray;
    
    if ($(item).attr('thumb')) return $(item).attr('thumb');  //some activities have explicit thumbnail set
    
    collection = $(item).attr('collection');
    filetype = $(item).attr('ft');
    if ($(item).attr('fn')) filename = $(item).attr('fn');
    if ($(item).attr('fp')) filepath = $(item).attr('fp');
    
    if (collection == "chapters" || item.pn != null) {
        idExtractArray = extractItemId(item);
        filepath = idExtractArray["currentGradeFolder"] + "/" + idExtractArray["currentSubjectFull"] + "/";
        filename = idExtractArray["currentSubjectFull"] + "-" + idExtractArray["currentGradeNumber"];
        imgsrc = LOOMA.thumbnail(filename, filepath, 'chapter');
    }
    else imgsrc = LOOMA.thumbnail(filename, filepath, filetype);
  
    return imgsrc;
} // end thumbnail()

//rewrote extractItemId() to use REGEX
//  m=s.match(/^([1-8])(M|N|S|SS|EN|H|V)([0-9][0-9])\.([0-9][0-9])?$/);
//  then if m != null, m[0] is the ch_id,
//                     m[1] is the class digit,
//                     m[2] is the subj letter(s),
//                     m[3] is the chapter/unit, and m[4] is null or chapter#
//       e.g. "8N01.04".match(regex) is ["8N01.04", "8", "N", "01", "04"]
/* */
function extractItemId(item) {
    var ch_id = (item['ft'] == 'chapter')? item['_id'] : item['ch_id'];
    return LOOMA.parseCH_ID(ch_id);
    
/*    var elements = {
        currentSection: null,
        currentChapter: null,
        currentSubject: null,
        currentGradeNumber: null,
        currentGradeFolder: null,
        currentSubjectFull: null,
        chprefix: null};
    var names = {
        EN: "English", N:  "Nepali", M:  "Math", S:  "Science", SS: "SocialStudies"};
    
    if (ch_id) {
        var pieces = ch_id.toString().match(/^([1-8])(M|N|S|SS|EN|H|V)([0-9][0-9])(\.[0-9][0-9])?$/);
        //console.log ('ch_id ' + ch_id + '  pieces ' + pieces);
        
        if (pieces) {
            elements['currentGradeNumber'] = pieces[1];
            elements['currentSubject']     = pieces[2];
            elements['currentSection']     = pieces[4] ? pieces[3] : null;
            elements['currentChapter']     = pieces[4] ? pieces[4].substr(1) : pieces[3];
            elements['currentGradeFolder'] = 'Class' + pieces[1];
            elements['currentSubjectFull'] = names[pieces[2]];
            elements['chprefix']           = pieces[1] + pieces[2];
        };
    };
    return elements;
*/
    z}


////////////////////////////////////////
///////  createActivityDiv  //////////
////////////////////////////////////////
function createActivityDiv (activity) {
    
    
    function innerActivityDiv (item) {
        
        // activityDiv looks like this:
        //      <div class="activityDiv" data-collection=collection>
        //                               data-id=_id
        //                               data-type = ft
        //                               jqueryData = {'mongo': wholeMONGOdocument }>
        //          <div class="thumbnaildiv"><img src=   ></div>
        //          <div class="textdiv">
        //              <p class="result_dn"> dn </p>
        //              <span class="result_ft"> ft </span>
        //              <span class="result_ID"> ch_id </span>
        //          </div>
        //          <div class="buttondiv">
        //              <button> Preview </button>
        //              <button> Add </button>
        //              <button> Delete </button>
        //          </div>
        //      </div>
        var activityDiv = document.createElement("div");
        activityDiv.className = "activityDiv";
        
        $(activityDiv).attr("data-collection", (item.ft == 'chapter') ? 'chapters' : 'activities');
        //$(activityDiv).attr("data-id",         (item.ft == 'chapter') ? item['_id'] : item['_id']['$id']);
        $(activityDiv).attr("data-type", item['ft']);
        
        item.collection = (item.ft == 'chapter')?'chapters':'activities';
        $.data(activityDiv, 'mongo', item);  //save the whole mongo document ("item") in the DOM element
        
        // Thumbnail
        var thumbnaildiv = document.createElement("div");
        thumbnaildiv.className = "thumbnaildiv";
        $(thumbnaildiv).appendTo(activityDiv);
        
        $("<img/>", {
            class : "resultsimg",
            src : thumbnail(item, collection)
        }).appendTo(thumbnaildiv);
        
        // Result Text
        var textdiv = document.createElement("div");
        textdiv.className = "textdiv";
        $(textdiv).appendTo(activityDiv);
        
        // Display Name
        if (item.dn) var dn = item.dn.substring(0, 20); //else dn = item.ndn.substring(0,20);
        $("<p/>", {
            class : "result_dn",
            html : "<b>" + dn + "</b>"
        }).appendTo(textdiv);
        
        
        // File Type
        $("<span/>", {
            class : "result_ft",
            html : LOOMA.typename(item.ft) + "  "
        }).appendTo(textdiv);
        
        // ID
        if ('ch_id' in item) {
            $("<span/>", {
                class : "result_ID",
                html : "[" + item.ch_id + "]"
            }).appendTo(textdiv);
        } else //CHAPTERS have their 'ch_id' as '_id'
        if (item.ft == 'chapter') {
            $("<span/>", {
                class : "result_ID",
                html : "[" + item._id + "]"
            }).appendTo(textdiv);
        }
        
        $("<br>").appendTo(textdiv);
        
        // Buttons
        var buttondiv = document.createElement("div");
        buttondiv.className = "buttondiv";
        $(buttondiv).appendTo(activityDiv);
        
        // "Add" button
        var addButton = document.createElement("button");
        addButton.innerText = "Add";
        addButton.className = "add";
        
        buttondiv.appendChild(addButton);
        
        buttondiv.appendChild(document.createElement("div"));
        
        // "Delete" button
        var removeButton = $("<button/>", {class: "remove", html:"Delete"});
        $(buttondiv).append(removeButton);
        
        // "Preview" button
        var previewButton = document.createElement("button");
        previewButton.innerText = "Preview";
        previewButton.className = "preview";

        buttondiv.appendChild(previewButton);
        
        return activityDiv;
    } //end innerActivityDiv()
    
    
   // var idExtractArray = extractItemId(activity);
    
    var div = document.createElement("div");
    div.className = "resultitem";
    
    var newDiv = innerActivityDiv(activity);
    $(newDiv).appendTo(div);
    
    return div;
}  // end createActivityDiv()


///////////////////////////////////////////////////////////////
/////////////////////////// PREVIEW ///////////////////////////
///////////////////////////////////////////////////////////////

function preview_result (item) {
    
    $('#previewpanel').empty().append($("<p/>", {html : "Loading preview..."}));
    
    var collection = $(item).attr('data-collection');
    var filetype = $(item).data('type');
    var filename = $(item).data('mongo').fn;
    var $mongo = $(item).data('mongo');
    var filepath;
    if ('fp' in $mongo) filepath = $mongo.fp;
    
    //console.log ("collection is " + collection + " filename is " + filename + " and filetype is " + filetype);
    
    var idExtractArray = extractItemId($(item).data('mongo'));
    
    if (collection == "chapters") {
        var pagenum = $(item).data('mongo').pn;
        
        document.querySelector("div#previewpanel").innerHTML = '<embed src="' +
            //encodeURI(
            homedirectory + 'content/textbooks/' +
            idExtractArray["currentGradeFolder"] + '/' +
            idExtractArray["currentSubjectFull"] + '/' +
            idExtractArray["currentSubjectFull"] + '-' +
            idExtractArray["currentGradeNumber"] +
            '.pdf#page=' + pagenum + '\"  style=\"height:60vh;width:60vw;\" type=\"application/pdf\"' + '>';
    }
    
    else if (collection == "activities") {
        
        if(filetype == "mp4" || filetype == "video" || filetype == "mov" || filetype == "m4v" || filetype == "mp5") {
            if (!filepath) filepath = '../content/videos/';
            document.querySelector("#previewpanel").innerHTML =
                
                //		'<video controls> <source src="' + homedirectory +
                //		         'content/videos/' + filename + '" type="video/mp4"> </video>';
                
                
                // '<div id="video-player">' +
                '<div id="video-area">' +
                '<div id="fullscreen">' +
                '<video id="video-play">' +
                '<source id="video-source" src="' +
                filepath + filename + '" type="video/mp4">' +
                '</video>' +
                '</div></div></div>' +
                '<div id="title-area"><h3 id="title"></h3></div>' +
                '<div id="media-controls">' +
                
                //'<button id="fullscreen-playpause"></button>' +
                '<div id="time" class="title">0:00</div>' +
                '<button type="button" class="play-pause"></button>' +
                '<input type="range" class="video seek-bar" value="0" style="display:inline-block"><br>' +
                '<button type="button" class="mute"></button>' +
                '<input type="range" class="video volume-bar" min="0" max="1" step="0.1" value="0.5" style="display:inline-block"><br>' +
                '</div>';
            
            attachMediaControls(document.getElementById('video-play'));  //hook up event listeners to the audio and video HTML
            
        }
        else if (filetype=="pdf") {
            if (!filepath) filepath = '../content/pdfs/';
            document.querySelector("div#previewpanel").innerHTML =
                '<iframe src="' + filepath + filename + '"' +
                ' style="height:60vh;width:60vw;" type="application/pdf">';
        }
        else if (filetype=="mp3" || filetype=="m4a" || filetype=="audio") {
            if (!filepath) filepath = '../content/audio/';
            document.querySelector("div#previewpanel").innerHTML = '<br><br><br><audio id="audio-play"> <source src="' +
                filepath +
                filename + '" type="audio/mpeg"></audio>' +
                '<div id="media-controls">' +
                '<div id="time" class="title">0:00</div>' +
                '<button type="button" class="play-pause"></button>' +
                '<input type="range" class="video seek-bar" value="0" style="display:inline-block"><br>' +
                '<button type="button" class="mute"></button>' +
                '<input type="range" class="video volume-bar" min="0" max="1" step="0.1" value="0.5" style="display:inline-block"><br>' +
                '</div>';
            //attachMediaControls();  //hook up event listeners to the audio and video HTML
            attachMediaControls(document.getElementById('audio-play'));  //hook up event listeners to the audio and video HTML
    
        }
        // Pictures
        else if(filetype=="jpg" || filetype=="gif" || filetype=="png" || filetype=="image") {
            if (!filepath) filepath = '../content/pictures/';
            document.querySelector("div#previewpanel").innerHTML = '<img src="' +
                filepath +
                filename + '"id="displayImage">';
        }
        else if (filetype == "html") {
            document.querySelector("div#previewpanel").innerHTML =
                '<object type="text/html" data="' + $(item).data('mongo').fp +
                filename  + '" style="height:60vh;width:60vw;"> </object>';
        }
        else if (filetype=="EP") {
            document.querySelector("div#previewpanel").innerHTML =
                '<iframe src="' + homedirectory + 'content/epaath/activities/' +
                filename  + '/index.html" style="height:100%;width:100%;zoom:scale(0.9);-webkit-transform: scale(0.9);"> </iframe>';
        }
        else if (filetype=="map") {
            document.querySelector("div#previewpanel").innerHTML =
                '<iframe src="looma-map-basicMap.php"' +
                'style="height:100%;width:100%;zoom:scale(0.9);-webkit-transform: scale(0.9);"> </iframe>';
        }
        else if (filetype=="evi") {
            document.querySelector("div#previewpanel").innerHTML =
                '<iframe src="looma-play-edited-video.php"?fn=' + filename + '&fp=' + filepath +
                'style="height:100%;width:100%;zoom:scale(0.9);-webkit-transform: scale(0.9);"> </iframe>';
        }
        else if (filetype=="history") {
            document.querySelector("div#previewpanel").innerHTML =
                '<iframe src="' + homedirectory + 'content/epaath/activities/' +
                filename  + '/index.html" style="height:100%;width:100%;zoom:scale(0.9);-webkit-transform: scale(0.9);"> </iframe>';
        }
        else if (filetype=="looma")
            document.querySelector("div#previewpanel").innerHTML = '<img src="images/looma-screenshots/' +
                $(item).data('mongo').dn + '.png" id="displayImage">';
        
        else if (filetype=="slideshow") {
            //use the mongoID of the slideshow to query text_files collection and retrieve the first image for this slideshow
            
            $.post("looma-database-utilities.php",
                {cmd: "openByID", collection: "slideshow", id: $(item).data('mongo').mongoID.$id},
                function(result) {
                    //document.querySelector("div#previewpanel").innerHTML = result.data;
                    
                    document.querySelector("div#previewpanel").innerHTML = '<img src="' +
                        result.fp +
                        result.fn + '"id="displayImage">';
                },
                'json'
            );
        }
        else if (filetype=="text") {
            //use the mongoID of the textfile to query text_files collection and retrieve HTML for this text file
            
            $.post("looma-database-utilities.php",
                {cmd: "openByID", collection: "text", id: $(item).data('mongo').mongoID.$id},
                function(result) {
                    document.querySelector("div#previewpanel").innerHTML = result.data;
                },
                'json'
            );
        }
    }
    
}  // end preview_result()

//////////////////////////////////
/////  insertTimelineElement  ////
//////////////////////////////////
function insertTimelineElement(source) {
    var $dest = $(source).clone(true).off(); // clone(true) to retain all DATA for the element
                                             //NOTE: crucial to "off()" event handlers,
                                             //or the new element will still be linked to the old
    $dest.removeClass('ui-draggable-handle').removeClass("ui-draggable").removeClass("ui-draggable-disabled");
    
    //  ?? this next stmt needed??
    $dest.addClass("ui-sortable-handle");
    //
    $dest.appendTo("#timelineDisplay");
    
    // scroll the timeline so that the new element is in the middle - animated to slow scrolling
    $('#timeline').animate( { scrollLeft: $dest.outerWidth(true) * ( $dest.index() - 4 ) }, 100);
    
    refreshsortable();  //TIMELINE elements can be drag'n'dropped
    
} //end insertTimelineElement()

function removeTimelineElement (elem) {
    // Removing list item from timelineHolder
    //var outerDiv = this.parentNode.parentNode;
    //outerDiv.remove();    // "Remove" button is within 3 divs
    
    $('#timeline').animate( { scrollLeft: $(elem).closest('.activityDiv').outerWidth(true) * ( $(elem).closest('.activityDiv').index() - 4 ) }, 100);
    $(elem).closest('.activityDiv').remove();
    $('#previewpanel').empty();
}  //end removeTimelineElement()


var orderTimeline = function() {  // the timeline is populated with items that arrive acsynchronously by AJAX from the [mongo] server
    // a 'data-index' attribute is stored with each timeline item
    // this function [re-]orders the timeline based on those data-index values
    var $timeline = $('#timelineDisplay');
    
    $timeline.find('.activityDiv').sort(function(a, b) {
        return +a.dataset.index - +b.dataset.index;
    })
        .appendTo($timeline);
}; // end orderTimeline()

/////////////////////////// SORTABLE UI ////////  requires jQuery UI  ///////////////////
function makesortable () {
    //$('timelineDisplay').sortable( "destroy" ); //remove previous sortable state
    $("#timelineDisplay").sortable({
        opacity: 0.7,   // makes dragged element transparent
        revert: true,   //Animates the drop
        axis:   "x",
        scroll: true,   //Allows page to scroll when dragging. Good for wide pages.
        handle: $(".activityDiv")  //restricts elements that can be clicked to drag to .timelinediv's
    }).disableSelection();
}  // end makesortable()

function refreshsortable () {
    // the call to sortable ("refresh") below should refresh the sortability of the timeline, but it's not working, so call makesortable() instead
    //$("#timelineDisplay").sortable( "refresh" );
    
    makesortable();
    
} // end refreshsortable()

/////////////////////////// DROPPABLE UI ////////  requires jQuery UI  ///////////////////
//set up Drag'n'Drop  - -  code borrowed from looma-slideshow.js [T. Woodside, summer 2016]
function makedraggable() {
    var $clone;
    $('.resultitem  .activityDiv').draggable({
        connectToSortable: "#timelineDisplay",
        //opacity: 0.7,
        addClasses: false,
        helper: "clone",
        //containment: "#timelineDisplay",
        start: function(event, ui) {
            $clone = $(this).clone(true, true).off(); //make a 'deep' clone of this element. preserves jQuery 'data' attributes
                                                      //NOTE: crucial to "off()" event handlers, or the new element will still be linked to the old
        },
        //start: function(event, ui) {
        //$(ui.helper).css("z-index", "10000").find("img").css("height", "15vh").css("width", "auto"); //Sometimes will display under buttons
        //    $('#timelineDisplay').sortable("option", "scroll", false);
        //},
        stop: function(event, ui) {
            
            if ($('#timelineDisplay').find(ui.helper).length > 0) {  //if the helper was dropped on the timeline...
                $(ui.helper).data($clone.data());  // insert the data() we copied into $clone back into the new timeline element
                refreshsortable();
            }
        }
    });
} //end makedraggable()

function quit() {
    if (callbacks['modified']())
        savework(currentname, currentcollection, currentfiletype);
    else
        window.history.back();
}

$(document).ready(function() {
    
    loginname = LOOMA.loggedIn();
    loginlevel = LOOMA.readStore('login-level');
    
    if (loginname && loginlevel === 'admin') $('.admin').show();

    $('.template-cmd').hide();
    
    // the Editor using this code must set 'currentcollection' to the mongo collection being edited
    // e.g. "slideshows", "lessons", "text_files" or "edited_videos"
    currentcollection = "slideshows";
        //currentcollection = "lessons";
        //currentcollection = "text_files";
        //currentcollection = "edited_videos";
    
    $('.filesearch-collectionname').text('Slide Shows');
        //$('#collectionname').text('Lesson Plans');
        //$('#collectionname').text('Text Files');
        //$('#collectionname').text('Edited Videos');
    
    //callback functions expected by looma-filecommands.js:
    callbacks ['savetemplate']  =   function(){console.log ('filecommand: savetemplate called');};
    callbacks ['open']  =           function(){console.log ('filecommand: open called');};
    callbacks ['undocheckpoint'] =  function(){console.log ('filecommand: undocheckpoint called');};
    //callbacks ['quit'] not overridden - use default action from filecommands.js

    callbacks ['clear'] =           editor_clear;
    callbacks ['save']  =           editor_save;
    callbacks ['savetemplate']  =   editor_templatesave;
    callbacks ['display'] =         editor_display;
    callbacks ['modified'] =        editor_modified;
    callbacks ['showsearchitems'] = editor_showsearchitems;
    callbacks ['checkpoint'] =      editor_checkpoint;


///////////////////////////////
// click handlers for '.add', '.preview' buttons
///////////////////////////////
    
    //$(elementlist).on(event, selector, handler).
    $('#innerResultsDiv'           ).on('click', '.add',        function() {
        insertTimelineElement($(this).closest('.activityDiv'));return false;});
    $('                  #timeline').on('click', '.remove',     function() {
        removeTimelineElement(this);return false;});
    $('#innerResultsDiv, #timeline').on('click', '.preview',    function() {
        preview_result($(this).closest('.activityDiv'));return false;});
    $('#innerResultsDiv, #timeline').on('click', '.resultsimg', function() {
        preview_result($(this).closest('.activityDiv'));return false;});


// from connor
    $('#timelineLeft').on('click', function(){
        $('#timeline').animate({scrollLeft: '-=200px'}, 700);
    });
    $('#timelineRight').on('click', function(){
        $('#timeline').animate({scrollLeft: '+=200px'}, 700);
    });
// from connor
    $timeline = $('#timelineDisplay');  //the DIV where the timeline is being edited
    
    //show the "New Text File" button in filecommands.js to allow text-frame editor to be called in an iFrame
    $('#show_text').show();
    
    $('#dismiss').off('click').click( function() { quit();});  //disable default DISMISS btn function and substitute QUIT()
    
});
