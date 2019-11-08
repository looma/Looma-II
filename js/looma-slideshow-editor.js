/*
LOOMA javascript file
Filename: looma-editor_template.js
Description: template for Looma editor tools, like Lesson Plan Editor, Slideshow Editor, etc

Programmer name: Skip, Kiefer, Peridot
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 04 2018
Revision: Looma 4.0
 */
 
'use strict';

var savedSignature ="";   //savedSignature is checkpoint of timeline for checking for modification
var loginname;
//var homedirectory = "../";
var $timeline;
var currentlyPreviewedActivity;

var searchName = 'slideshow-editor-search';

////////////////////////////////////////////
//////   functions used by filecommands/////
////////////////////////////////////////////

///////// editor_clear  /////////
function editor_clear() {
    
    setname("");
    $("#preview").hide();
    $timeline.empty();
    $timeline.data('thumb', 'images/play-slideshow-icon.png');
    clearFilter();
    
    editor_checkpoint();
    
};

///////  editor_showsearchitems  /////////
function editor_showsearchitems() {    //NOTE: this should all be done with CSS
  
    // Remove the ability of the user to check unwanted boxes
    var pdf = document.querySelector('span[data-id="pdf-chk"]');
    pdf.style.display = "none";
  
    var video = document.querySelector('span[data-id="video-chk"]');
    video.style.display = "none";
  
    var audio = document.querySelector('span[data-id="audio-chk"]');
    audio.style.display = "none";
  
    var history = document.querySelector('span[data-id="history-chk"]');
    history.style.display = "none";
  
    var html = document.querySelector('span[data-id="html-chk"]');
    html.style.display = "none";
  
    var ss = document.querySelector('span[data-id="slideshow-chk"]');
    ss.style.display = "none";
  
    var map = document.querySelector('span[data-id="map-chk"]');
    map.style.display = "none";
  
    var evi = document.querySelector('span[data-id="evi-chk"]');
    evi.style.display = "none";
  
    var lesson = document.querySelector('span[data-id="lesson-chk"]');
    lesson.style.display = "none";
    
    var game = document.querySelector('span[data-id="game-chk"]');
    game.style.display = "none";
    
    var looma = document.querySelector('span[data-id="looma-chk"]');
    looma.style.display = "none";
};

///////// editor_checkpoint /////////
function editor_checkpoint()       {savedSignature = signature($timeline);};

///////// editor_modified /////////
function editor_modified() {
    return (signature($timeline) !== savedSignature);
};

///////// signature  /////////
function signature(elem) { //param is jQ object of the timeline ($timeline)
    var sig = $timeline.data('thumb') ? $timeline.data('thumb') : "";
    elem.find('.activityDiv').each(function(index, x){
        //console.log('sig is ', sig);
        //console.log('x is ', x);
        //console.log('index is ', index);
        sig += $(x).data('id');});
    return sig;
};

///////// editor_pack  /////////
function editor_pack (activityDivs) { // pack the timeline into an array of collection/id pairs for storage
    var packitem;
    var packarray = [];
    
    $(activityDivs).each(function() {
        packitem = {};  //make a new object, unlinking the references already pushed into packarray
        packitem.collection = $(this).data('collection');
        packitem.id         = $(this).data('id');
        packitem.type       = $(this).data('type');
        packitem.caption    = $(this).data('caption');
        
        if (packitem.collection == "activities"){
            packarray.push(packitem);
        }
    });
    
    return packarray;
}; //end editor_pack()

///////// unpack /////////
function unpack (response) {
    //unpack the array of collection/id pairs into html to display on the timeline
    //for each element in response.data, call createActivityDiv, and attach the return value to #timelinediv
    // also set filename in UI
    
    editor_clear();
    
    setname(response.dn);
    $timeline.data('slideshow-id', response['_id']['$id']);
    
    // need to record ID of newly opened LP so that later SAVEs can save to it
    
    var posts = [];  //we will push all the $.post() deferreds in the foreach below into posts[]
    
    $(response.data).each(function(index) {
        // retrieve each timeline element from mongo and add it to the current timeline
        //var newDiv = null;  //reset newDiv so previous references to it are broken
        var caption = this.caption;
        posts.push($.post("looma-database-utilities.php",
            {cmd: "openByID", collection: this.collection, id: this.id},
            function(result) {
                var newDiv = createActivityDiv(result);
                //add data-index to timeline element for later sorting
                //    (because the elements are delivered async, they may be out of order)
                $(newDiv.firstChild).data('index', index);
                $(newDiv.firstChild).data('caption', caption);
                console.log('adding ID :' + result._id);
                insertTimelineElement(newDiv.firstChild);
            },
            'json'
        ));
    });
    
    //  when all the $.post are complete, then re-order the timeline to account for out-of-order elements from asynch $.post calls
    $.when.apply(null, posts).then(function() {
        orderTimeline();
        editor_checkpoint();
        makesortable();
    
    if (response.thumb && response.thumb != '') {
        $timeline.data('thumb', response.thumb);
        var thumb = response.thumb;
       // outlineThumbnail( $(".inTimeline[data-thumb='" + response.thumb + "']") );
        outlineThumbnail( $(".inTimeline").find("img[src='" + thumb + "']" ).parents('.activityDiv') ); //also should be CSS
        
    } else
        $timeline.data('thumb', 'images/play-slideshow-icon.png');
    });
    
}; //end unpack()

///////// editor_display  /////////
function editor_display (response) {clearFilter(); $timeline.html(unpack(response)); editor_checkpoint();};

/////////  editor_save  /////////
//
// this 'editor_save() should be replace with a call to [filecommands.js] savefile()
//

function editor_save(name) {
    console.log('FILE COMMANDS: saving file (' + name + ') with ft: ' + currentfiletype );
         $.post("looma-database-utilities.php",
                {cmd: "save",
                 collection: currentcollection,
                 dn: escapeHTML(name),
                 ft: currentfiletype,
                 data: editor_pack($('#timelineDisplay .activityDiv')),
                 thumb: $timeline.data('thumb'),
                 activity:"true"}, // NOTE: this is a STRING, either "false" or "true"

                 function(response) {
                    callbacks['checkpoint']();
                    if (response['_id']) {
                       console.log("SAVE: upserted ID = ", response['_id']['$id']);
                        $timeline.data('slideshow-id', response['_id']['$id']);
                    }
                    else {
                      console.log("SAVE: didn't work?");
                    }
                 },
                 'json'
              );
}; //end editor_save()

///////// editor_templatesave /////////
function editor_templatesave(name) {
    savefile(name, currentcollection, currentfiletype + '-template', editor_pack($timeline.html()), "false");
    //note, the final param to 'savefile()' [to make an activity] set to 'false'
    //because lessons templates are not recorded as  activities
}; //end editor_templatesave()

// end FILE COMMANDS stuff



var clearFilter = function() {
    console.log('clearFilter');
    
    if ($('#collection').val() == 'activities') {
        $('#searchString').val("");
        $(".filter_dropdown").each(function() { this.selectedIndex = 0; });
        $(".filter_checkbox").each(function() { $(this).prop("checked", false); });
        var image = document.getElementById('image-checkbox'); image.checked = true;
    } else //collection=='chapters'
    {
        $("#dropdown_grade").val("").change();
        $("#dropdown_subject").val("").change();
    };
    
    $("#innerResultsMenu").empty();
    $("#innerResultsDiv").empty();
    $("#preview").empty();
}; //end clearFilter()


function clearResults() {
    $("#innerResultsDiv").empty();
    //document.getElementById('image-checkbox').checked = true;
    //document.getElementById('text-checkbox').checked = false;
} //end clearResults()

//////////////////////////////////
///////  displayResults  of SEARCH  ///////
//////////////////////////////////
function displayResults(results) {
    var result_array = [];
    result_array['activities'] = [];  //array to store ACTIVITIES returned by SEARCH
    result_array['chapters']  = [];   //array to store CHAPTERS returned by SEARCH
    
    for (var i=0; i < results.length; i++) {
        if (results[i]['ft'] == 'chapter') result_array['chapters'].push(results[i]);
        else                               result_array['activities'].push(results[i]);
    };
    
    $('#innerResultsMenu, #innerResultsDiv').empty();
    
    displaySearchResults(result_array);
    
    makedraggable();  //not working for now
    
}; //end displayresults()


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
        };
        actResultDiv.appendChild(collectionTitle);
        
        for(i=0; i<filterdata_object.chapters.length; i++) {
            rElement = createActivityDiv(filterdata_object.chapters[i]);
            
            actResultDiv.appendChild(rElement);
        };
    };
  
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
    
}; //end displaySearchResults()


function thumbnail (item) {
    
    //builds a filepath/filename for the thumbnail of this "item" based on type
    var collection, filetype, filename, filepath;
    var thumbnail_prefix, path, imgsrc, idExtractArray;
    
    if (item.thumb) return item.thumb;  //some activities have explicit thumbnail set
    
    if (item.ft) filetype = item.ft;
    if (item.fn) filename = item.fn;
    if (item.fp) filepath = item.fp;
    
    imgsrc = LOOMA.thumbnail(filename, filepath, filetype);
    
    return imgsrc;
}; // end thumbnail()

function extractItemId(item) {
    var ch_id = (item['ft'] == 'chapter')? item['_id'] : item['ch_id'];
    return LOOMA.parseCH_ID(ch_id);
};


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
        
        $(activityDiv).data("collection", (item.ft == 'chapter') ? 'chapters' : 'activities');
        $(activityDiv).data("id",         (item.ft == 'chapter') ? item['_id'] : item['_id']['$id']);
        $(activityDiv).data("type", item['ft']);
        $(activityDiv).data("caption", item.caption);
        
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
        
      /*
        // File Type
        $("<span/>", {
            class : "result_ft",
            html : LOOMA.typename(item.ft) + "  "
        }).appendTo(textdiv);
      */
      
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
        };
        
        $("<br>").appendTo(activityDiv);
        
        // Buttons
        var buttondiv = document.createElement("div");
        buttondiv.className = "buttondiv";
        $(buttondiv).appendTo(activityDiv);
        
        // "Add" button
        var addButton = document.createElement("button");
        addButton.innerText = "Add";
        addButton.className = "add";
        
        buttondiv.appendChild(addButton);
        
        //buttondiv.appendChild(document.createElement("div"));
        
        // "Delete" button
        var removeButton = $("<button/>", {class: "remove", html:"Delete"});
        $(buttondiv).append(removeButton);
        
        // "Preview" button
        var previewButton = document.createElement("button");
        previewButton.innerText = "Preview";
        previewButton.className = "preview";
  
        buttondiv.appendChild(previewButton);
        
        return activityDiv;
    }; //end innerActivityDiv()
    
    
   // var idExtractArray = extractItemId(activity);
    
    var div = document.createElement("div");
    div.className = "resultitem";
    
    var newDiv = innerActivityDiv(activity);
    $(newDiv).appendTo(div);
    
    return div;
};  // end createActivityDiv()


///////////////////////////////////////////////////////////////
/////////////////////////// PREVIEW ///////////////////////////
///////////////////////////////////////////////////////////////

function preview_result (item) {
    $('#preview').show();
    $('#hints').hide();
    $('.hint').hide();
    //$('#previewpanel').append($("<p/>", {html : "Loading preview..."}));
    
    var collection = $(item).data('collection');
    var filetype = $(item).data('type');
    var filename = $(item).data('mongo').fn;
    var $mongo = $(item).data('mongo');
    var dataID = $(item).data('id');
    var caption = $(item).data('caption');
    
    currentlyPreviewedActivity = item;
    
    var filepath;
    if ('fp' in $mongo) filepath = $mongo.fp;
    
    // Pictures
    if(filetype=="jpg" || filetype=="gif" || filetype=="png" || filetype=="image") {
        if (!filepath) filepath = '../content/pictures/';
        document.querySelector("div#preview").innerHTML =
            '<img src="' +
            filepath +
            filename + '"id="displayImage" data-id="' + dataID + '">'
            //+ '<button class="addCaption" hidden>Add Caption</button>'
            + '<button class="deleteCaption" hidden>Delete Caption</button>'
            + '<input id="captionForm" placeholder="<Edit caption here (followed by carriage return)>" hidden></br>';
       
       if ($(item).hasClass('inTimeline')) {
           $('#captionForm').show().focus();
           $('#captionForm').change(newCaption);
           $('.deleteCaption').click(deleteCaption);
           if (caption && caption !== "") $('#captionForm').val(caption);
       }
       
       
        /*
        showCaptionForm();
        $('#displayImage').css('max-height', '55vh');
        $('.captionForm').hide();
        var caption = getCorrectCaption();
        document.getElementById("captionBox").value = caption;
        
        dealWithCaptionButtons();
        */
    }
        // Text Files
        else if (filetype=="text") {
            //use the mongoID of the textfile to query text_files collection and retrieve HTML for this text file
            
            $.post("looma-database-utilities.php",
                {cmd: "openByID", collection: "text", id: $(item).data('mongo').mongoID.$id},
                function(result) {
                    document.querySelector("div#preview").innerHTML = result.data
                },
                'json'
            );
        }
//    $('#timeline .activityDiv').css({"border-style":"none"});
//    getCorrectActivityDiv().css({"border": "3px solid blue"});
};  // end preview_result()

function newCaption() {
    $(currentlyPreviewedActivity).data('caption', $('#captionForm').val());
    $('.deleteCaption').show();
}; //end newCaption()

function deleteCaption() {
    $('#captionForm').val('');
    $(currentlyPreviewedActivity).data('caption', '');
    $('.deleteCaption').hide();
};  //end deleteCaption()

function getCorrectActivityDiv() {
    var idOfPreviewedImage = document.getElementById("displayImage").dataset.id;
    var activityDivs = $('#timeline .activityDiv');
    var matchingID = document.querySelectorAll(`[${'data-id'}="${idOfPreviewedImage}"]`);
    return activityDivs.filter(matchingID);
}

function saveThumbnailToTimeline(e) {
    var item = e.currentTarget;
    //var $activityDiv = getCorrectActivityDiv();
    //var thumb = $activityDiv.find('img').attr('src');
    var thumb = $(item).find('img').attr('src');
    $timeline.data('thumb', thumb);
    LOOMA.alert("Using " + $(item).find('.result_dn').text().bold() + " as thumbnail.");
    outlineThumbnail(item);
} //end saveThumbnailToTimeline()

function outlineThumbnail(item) {
    $('#timeline .activityDiv').css({"border-style":"none"});
    $(item).css({"border": "3px solid green"});
}

function presentSlideshow() {
    
    //NEED TO save COOKIE with current slideshow so it can be re-loaded on return
    // also delete the COOKIE when new slideshow is loaded in editor
    
    if (savedSignature === "") LOOMA.alert("No slideshow is open",5);
    else if (editor_modified())  LOOMA.alert("You must save your work before presenting",5);
    else  window.location.href = 'looma-slideshow-present.php?id=' + $timeline.data('slideshow-id');
}  //end presentSlideshow()



//////////////////////////////////
/////  insertTimelineElement  ////
//////////////////////////////////
function insertTimelineElement(source) {
    var $dest = $(source).clone(true).off(); // clone(true) to retain all DATA for the element
                                             //NOTE: crucial to "off()" event handlers,
                                             //or the new element will still be linked to the old
    $dest.removeClass('ui-draggable-handle').removeClass("ui-draggable").removeClass("ui-draggable-disabled");
    
    //  ?? this next stmt needed??
    $dest.addClass("ui-sortable-handle").addClass("inTimeline");
    //
    $dest.appendTo("#timelineDisplay");
    
    // scroll the timeline so that the new element is in the middle - animated to slow scrolling
    $('#timeline').animate( { scrollLeft: $dest.outerWidth(true) * ( $dest.index() - 4 ) }, 100);
    
    refreshsortable();  //TIMELINE elements can be drag'n'dropped
    
}; //end insertTimelineElement()

function removeTimelineElement (elem) {
    // Removing list item from timelineHolder
    //var outerDiv = this.parentNode.parentNode;
    //outerDiv.remove();    // "Remove" button is within 3 divs
    
    $('#timeline').animate( { scrollLeft: $(elem).closest('.activityDiv').outerWidth(true) * ( $(elem).closest('.activityDiv').index() - 4 ) }, 100);
    $(elem).closest('.activityDiv').remove();
    $('#preview').hide();
    $('#hints').show();
    $('.hint').show();
};  //end removeTimelineElement()


var orderTimeline = function() {  // the timeline is populated with items that arrive acsynchronously by AJAX from the [mongo] server
    // a 'data-index' attribute is stored with each timeline item
    // this function [re-]orders the timeline based on those data-index values
    var $timeline = $('#timelineDisplay');
    
    $timeline.find('.activityDiv').sort(function(a, b) {
        //return +a.dataset.index - +b.dataset.index;
        return $(a).data('index') - $(b).data('index');
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
};  // end makesortable()

function refreshsortable () {
    // the call to sortable ("refresh") below should refresh the sortability of the timeline, but it's not working, so call makesortable() instead
    //$("#timelineDisplay").sortable( "refresh" );
    
    makesortable();
    
}; // end refreshsortable()

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
}; //end makedraggable()

function quit() {
    if (callbacks['modified']())
        savework(currentname, currentcollection, currentfiletype);
    else
        window.history.back();
}


$(document).ready(function() {
   // editor_showsearchitems();
    
    $('#present-link').click(presentSlideshow);
    $('#timeline').on('dblclick', '.activityDiv', saveThumbnailToTimeline);
    
    var image = document.getElementById('image-checkbox');
    //var text =  document.getElementById('text-checkbox');
    // Set the 'image' box to checked by default
    image.checked = true;
    
    // Ensure that a file type is always selected.
    // If none is selected, automatically select the 'image' box
  //  image.onchange = function(){if (!image.checked && !text.checked){image.checked = true;}};
  //  text.onchange = function() {if (!image.checked && !text.checked){image.checked = true;}};
    
    $('#timeline').show();
    $('#source-div').empty();
    $('#search-kind').empty();
  
    loginname = LOOMA.loggedIn();
    if (loginname && ( loginname== 'skip')) $('.admin').show();
    $('.template-cmd').hide();
    
    // the Editor using this code must set 'currentcollection' to the mongo collection being edited
    // e.g. "slideshows", "lessons", "text_files" or "edited_videos"
    currentname = "";
    currentcollection = "slideshows";
    currentfiletype = "slideshow";
    
    $('#collectionname').text('Slideshows');
    $('#includeLesson').val(false);
    
    //callback functions expected by looma-filecommands.js:
    callbacks ['savetemplate']  =   function(){console.log ('filecommand: savetemplate called');};
    callbacks ['open']  =           function(){console.log ('filecommand: open called');};
    callbacks ['clear'] =           editor_clear;
    callbacks ['save']  =           editor_save;
    callbacks ['savetemplate']  =   editor_templatesave;
    callbacks ['display'] =         editor_display;
    callbacks ['modified'] =        editor_modified;
    //callbacks ['showsearchitems'] = editor_showsearchitems;
    callbacks ['checkpoint'] =      editor_checkpoint;
    //callbacks ['undocheckpoint'] =  function(){console.log ('filecommand: undocheckpoint called');};
    //callbacks ['quit'] not overridden - use default action from filecommands.js

///////////////////////////////
// click handlers for '.add', '.preview' buttons
///////////////////////////////
    
    currentlyPreviewedActivity = null;
    
    //$(elementlist).on(event, selector, handler).
    $('#innerResultsDiv'           ).on('click', '.add',        function() {
        insertTimelineElement($(this).closest('.activityDiv'));return false;});
    $('                  #timeline').on('click', '.remove',     function() {
        removeTimelineElement(this);return false;});
    $('#innerResultsDiv, #timeline').on('click', '.preview',    function() {
        preview_result($(this).closest('.activityDiv'));return false;});
    $('#innerResultsDiv, #timeline').on('click', '.resultsimg', function() {
        preview_result($(this).closest('.activityDiv'));return false;});
   /*
    $('#preview').on('click', '.addCaption', function() {
        showCaptionForm();
        document.getElementById("captionBox").focus();
        return false;});
    $('#preview').on('click', '.deleteCaption', function() {
            deleteCaptionForm();
            return false;
        });
  */
   
    $('#timelineLeft').on('click', function(){
        $('#timeline').animate({scrollLeft: '-=200px'}, 700);
    });
    $('#timelineRight').on('click', function(){
        $('#timeline').animate({scrollLeft: '+=200px'}, 700);
    });
    
    $timeline = $('#timelineDisplay');  //the DIV where the timeline is being edited
    //$timelinedata = $('#timeline-data');  //the DIV where the timeline hidden data is stored
    
    //show the "New Text File" button in filecommands.js to allow text-frame editor to be called in an iFrame
    $('#show_text').show();
    
    $('#dismiss').off('click').click( function() { quit();});  //disable default DISMISS btn function and substitute QUIT()
});
