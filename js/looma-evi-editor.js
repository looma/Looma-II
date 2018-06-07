/*
LOOMA javascript file
Filename: looma-edited-video.js
Programmer name: Connor Kennedy
Adapted From: looma-lesson-plan.js Summer 2017
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: Summer 2017
Revision: Looma 2.4
 */

'use strict';

/////////////////////////// INITIALIZING  ///////////////////////////

//var timelineAssArray = new Object();

var homedirectory = "../";
var $details;
var vid_selected = false;
var timeline_times = [];
var timeline_id = [];
var id_counter = 0;
var mainThumbSrc = "";
//var openClick = false;
var loginname;
var $timeline = $('#timelineDisplay');  //the DIV where the timeline is being edited
var savedTimeline;   //savedTimeline is checkpoint of timeline for checking for modification


/////////////////////////// ONLOAD FUNCTION ///////////////////////////
$(document).ready(function() {

    $('#show_text').show();

    initializeDOM(); // fills in DOM elements - could be done in static HTML in the PHP file
    firstTimeVideoHTMLDeletion();

    $('#clear_button').click(clearFilter);
    $('#clearPreview').click(clearPreview);

    $('.filter_radio').change(changeCollection);

    $('.chapterFilter').prop('disabled', true);
    $('.mediaFilter').prop('disabled',   false);

    $("#dropdown_grade, #dropdown_subject").change( function(){
        $('#div_chapter').hide();

        $('#dropdown_chapter').empty();
        if ( ($('#dropdown_grade').val() != '') && ($('#dropdown_subject').val() != ''))
            $.post("looma-database-utilities.php",
                {cmd: "chapterList",
                 class: $('#dropdown_grade').val(),
                 subject:   $('#dropdown_subject').val()},

                 function(response) {
                     console.log(response);
                     //$('#chapter_label').show();
                     $('#div_chapter').show();
                     $('<option/>', {value: "", label: "<select a chapter>"}).appendTo('#dropdown_chapter');

                     $('#dropdown_chapter').append(response);
                 },
                 'html'
              );
    });

///////////////////////////////
// click handlers for '.add', '.preview' buttons
///////////////////////////////

    //$(elementlist).on(event, selector, handler).
    
    $('#innerResultsDiv'           ).on('click', '.add',        function() {
        if(vid_selected == false) {
            vid_selected = true;
            $('#del_video').remove();
            $('#del_label').remove();
            $('#del_div').remove();
            $('#div_search').show();
            $('#div_filetypes').show();
            $('#clear_button').show();
            $('#search_label').html("Name:");
            $('<br>').insertAfter('#searchString');
            $('#div_categories').css("width", "25vw")
            $('.filter_label').css("margin-left", "auto");

            mainThumbSrc = $(this).closest('.activityDiv')[0].firstChild.firstChild.src;

            // if !fileexists, set name to dn+Edited, else setname to ""
            setname((($(this).closest('.activityDiv')).data('mongo').dn) + " Edited");
            owner = true;
            display_video($(this).closest('.activityDiv'));
        }
        else {
            insertTimelineElement($(this).closest('.activityDiv'), false);
        }
        return false;});

    $('                  #timeline').on('click', '.remove',     function() {
            removeTimelineElement(this);return false;});
    
    $('#innerResultsDiv, #timeline').on('click', '.preview',    function() {
            preview_result($(this).closest('.activityDiv'));
            $('#clearPreview').css('display', 'inline')
            return false;
          });
    
    $('#innerResultsDiv, #timeline').on('click', '.resultsimg', function() {
            preview_result($(this).closest('.activityDiv'));return false;});
    

//////////////////////////////////////
/////////FILE COMMANDS setup /////////
//////////////////////////////////////
    
    loginname = LOOMA.loggedIn();
    $('.template-cmd').hide();
        //if (loginname && (loginname == 'kathy' || loginname == 'david' || loginname== 'skip')) $('.admin').show();
    
    //callback functions expected by looma-filecommands.js:
    callbacks ['clear'] = eviNew;
    callbacks ['save']  = eviSave;
    callbacks ['savetemplate']  = eviTemplateSave;
    //callbacks ['open']  = eviOpen;
    callbacks ['display'] = eviDisplay;
    callbacks ['modified'] = eviModified;
    callbacks ['showsearchitems'] = eviShowSearchItemsOpen;
    callbacks ['checkpoint'] = eviCheckpoint;
    callbacks ['undocheckpoint'] = eviUndoCheckpoint;
        //callbacks ['quit'] not overridden - use default action from filecommands.js


/*  variable assignments expected by looma-filecommands.js:  */
    currentname = "";             //currentname       is defined in looma-filecommands.js and gets set and used there
    currentcollection = 'edited_videos'; //currentcollection is defined in looma-filecommands.js and is used there
    currentfiletype = 'evi';   //currentfiletype   is defined in looma-filecommands.js and is used there
    
    $('#search-form  #collection').val('edited_videos');

// end FILE COMMANDS stuff


// search for ACTIVITIES (and CHAPTERS) to use in the evi plan
// when search button is clicked - submit the 'search' form to looma-database.search.php
            $('#search').submit(function( event ) {
                  event.preventDefault();

                  $("#innerResultsMenu").empty();
                  $("#innerResultsDiv" ).empty();
                  $("#previewpanel"    ).empty();

                  if (!isFilterSet()) {
                        $('#innerResultsDiv').html('Please select at least 1 filter option before searching.');
                  } else {

                    var loadingmessage = $("<p/>", {html : "Loading results"}).appendTo("#innerResultsMenu");
                    $('<span id="ellipsis1" class="ellipsis"></span>').appendTo(loadingmessage);

                    var ellipsisTimer = setInterval(function () {
                        $('#ellipsis1').text($('#ellipsis1').text().length < 10 ? $('#ellipsis1').text() + '.' : '');
                        },100);

                        //this POST to looma-databas-search.php serializes and sends all the submit FORM elements
                        // and returns an array of objects which are mongo documents that match the search criteria from the form
                        if(vid_selected == false) {
                            $.post( "looma-database-utilities.php",
                                $( "#search" ).serialize() + "&type[]=video",
                                    function (result) {
                                        loadingmessage.remove();
                                        clearInterval(ellipsisTimer);
                                        displayResults(result);return;},
                               'json'
                            );
                        }
                        else {
                            $.post( "looma-database-utilities.php",
                                $( "#search" ).serialize(),
                                    function (result) {
                                        loadingmessage.remove();
                                        clearInterval(ellipsisTimer);
                                        displayResults(result);return;},
                               'json'
                            );
                        }
                  };
           });
  
    //Must check box AFTER clear filter has happened
    $('#del_video').prop("checked", true);
    
    eviCheckpoint();
    //eviNew();
    
    $('#dismiss').off('click').click( function() { quit();});  //disable default DISMISS btn function and substitute QUIT()
    
});  //end document.ready()

function eviShowSearchItemsOpen() {
    $('#search-form  #collection').val('edited_videos');
    
    $('#evi-chk').show();
    // for TEXT EDIT, only show "text", clicked and disabled
    $('#evi-chk input').attr('checked', true).css('opacity', 0.5);
    //$('#txt-chk input').prop('readonly'); //cant make 'readonly' work
    $('#evi-chk input').click(function() {return false;});
    
};

function eviShowSearchItemsNew() {
    $('#search-form  #collection').val('activities');
    
    $('#vid-chk').show();
    // for TEXT EDIT, only show "text", clicked and disabled
    $('#vid-chk input').attr('checked', true).css('opacity', 0.5);
    //$('#txt-chk input').prop('readonly'); //cant make 'readonly' work
    $('#vid-chk input').click(function() {return false;});
    
};

function eviCheckpoint() {         savedTimeline =   $timeline.html(); };
function eviUndoCheckpoint() {     $timeline.html(   savedTimeline);     };  //not used now??
function eviModified()   { return (savedTimeline !== $timeline.html());};

function eviSetOwner() {
    $.post("looma-database-utilities.php",
        {cmd: "open", collection: 'edited_videos', dn: currentname, ft: 'evi'},
        function(response) {
            if (response['error']) owner = true;
            else {
                if ('author' in response)
                    owner = (response['author'] == LOOMA.loggedIn());
                else owner = false;
            }
        },
        'json'
    );
};  // end eviSetOwner()

function eviNew()
{
    eviClear();
    
    callbacks ['showsearchitems'] = eviShowSearchItemsNew;
    
    opensearch(true);
    
    $('#search-results').on('click', 'button', function()
    {
        closesearch();
        if ($(this).attr('id') !== 'cancel-results') //if file not found, dont call OPEN()
        {
            vid_selected = true;
            $('#del_video').remove();
            $('#del_label').remove();
            $('#del_div').remove();
            $('#div_search').show();
            $('#div_filetypes').show();
            $('#clear_button').show();
            $('#search_label').html("Name:");
            $('<br>').insertAfter('#searchString');
            $('#div_categories').css("width", "25vw")
            $('.filter_label').css("margin-left", "auto");
            
            mainThumbSrc = $(this).find('.thumbnaildiv')[0].firstChild.src;
            setname(this.title + " (edited)");
            
            //opened a new base video to edit. set owner of this EVI being made to current owner
            eviSetOwner();
            
            //hack to make it like a newly loaded base video is 'modified'
            savedTimeline = 'x';
            
            var video_id = $(this).data('id');
            
            $.post("looma-database-utilities.php",
                {
                    cmd: "openByID", collection: 'activities', id: video_id},
                function(result) {
                    display_video(result, video_id);
                },
                'json');
        }
    });
    
    $('#cancel-search').on('click', function() {
        closesearch();
    });
    
    callbacks ['showsearchitems'] = eviShowSearchItemsOpen;
}  //end eviNew()

function eviClear() {
    
    clearFilter();
    
    if(vid_selected)
    {
        clearFilter();
        $('#video-area').remove();
        $('#title-area').remove();
        $('#media-controls').remove();
        firstTimeVideoHTMLDeletion();
        vid_selected = false;
        $('#del_video').prop("checked", true);
        $('#div_categories br').remove();
        $('#div_categories').css("width", "60vw")
        $('.filter_label').css("margin-left", "1vw");
    }
    
    timeline_times = [];
    timeline_id = [];
    id_counter = 0;
    setname("");
    //currentid="";
    $timeline.empty();
    eviCheckpoint();
}; //end eviClear()

function eviPack (html) { // pack the timeline into an array of collection/id pairs for storage
    var packitem;
    var packarray = [];
    
    packitem = {};
    packitem.collection = $('#master_video').data('collection');
    packitem.id = $('#master_video').data('id');
    packarray.push(packitem);
    
    //change below pack code to add an ordering INDEX
    $(html).each(function() {
        packitem = {};  //make a new object, unlinking the references already pushed into packarray
        packitem.collection = $(this).data('collection');
        packitem.id         = $(this).data('id');
        packitem.time       = $(this).data('time');
        packarray.push(packitem);
    });
    
    return packarray;
}; //end eviPack()

function eviUnPack (response) {  //unpack the array of collection/id pairs into html to display on the timeline
    var newDiv;
    var timeArray = [];
    
    //for each element in data, call createActivityDiv, and attach the resturn value to #timelinediv
    // also set filename, [and collection??]
    
    //$('#timelineDisplay').empty();
    
    setname(response.dn);
    
    owner = (response.author == loginname) ? true : false;  //set boolean OWNER to TRUE if we are the author of this existing EVI
    
    var mainVideo = response.data.splice(0, 1)[0];
    
    $.post("looma-database-utilities.php",
        {cmd: "openByID", collection: mainVideo.collection, id: mainVideo.id},
        function(result) {
            display_video(result, mainVideo.id);
        },
        'json'
    );
    
    $(response.data).each(function(){
        timeArray.push(this.time);
    });
    
    // need to record ID of newly opened LP so that later SAVEs can overwrite it
    $(response.data).each(function(index) {
        // retrieve each timeline element from mongo and add it to the current timeline
        newDiv = null;  //reset newDiv so previous references to it are broken
        $.post("looma-database-utilities.php",
            {cmd: "openByID", collection: this.collection, id: this.id},
            function(result) {
                newDiv = createActivityDiv(result);
                newDiv.firstChild.setAttribute("data-time", timeArray[index]);
                insertTimelineElement(newDiv.firstChild, true);
            },
            'json'
        );
    });
    
    if(response.thumb)
    {
        mainThumbSrc = response.thumb;
    }
    else
    {
        //FIX LATER
        mainThumbSrc = "";
    }
    
    //makesortable();
    $('#del_video').remove();
    $('#del_label').remove();
    $('#del_div').remove();
    $('#div_search').show();
    $('#div_filetypes').show();
    $('#clear_button').show();
    $('#search_label').html("Name:")
    clearFilter();
    vid_selected = true;
    $('<br>').insertAfter('#searchString');
    $('#div_categories').css("width", "25vw")
    $('.filter_label').css("margin-left", "auto");
}; //end eviUnPack()

function eviDisplay (response) {
    clearFilter();
    $timeline.html(eviUnPack(response));
}; //end eviDisplay()

function eviSave(name) {
    saveEviFile(name, 'edited_videos', 'evi', eviPack($timeline.html()), mainThumbSrc, true);
}; //end eviSave()

function eviTemplateSave(name) {
    saveEviFile(name, 'edited_videos', 'evi' + '-template', eviPack($timeline.html()), mainThumbSrc, false);
}; //end eviTemplateSave()

function saveEviFile(name, collection, filetype, data, thumb, activityFlag) {  //filetype must be given as 'text' or 'text-template'
    
    console.log('FILE COMMANDS: saving file (' + name + ') with ft: ' + filetype + 'and with data: ' + data);
    $.post("looma-database-utilities.php",
        {cmd: "save",
            collection: collection,
            dn: escapeHTML(name),
            ft: filetype,
            data: data,
            thumb: thumb,
            activity:activityFlag}, //need to use escapeHtml() with POST??
        
        function(response) {
            callbacks['checkpoint']();
            if (response['_id']) {
                console.log("SAVE: upserted ID = ", response['_id']['$id']);
            }
            else {
                console.log("SAVE: didn't work?");
            }
        },
        'json'
    );
}; //end saveEviFile()


var changeCollection = function() {
    $('#div_grade').toggle();
    $('#div_subject').toggle();
    $('#div_filetypes').toggle();
    $('#div_sources').toggle();
    $('#div_categories').toggle();
    
    if ($('#collection').val() == 'activities') { //changing from ACTIVITIES to CHAPTERS
        $('#collection').val('chapters');

    if ( ($('#dropdown_grade').val() != '') && ($('#dropdown_subject').val() != ''))
    $('#div_chapter').show();

        $('.chapterFilter').prop('disabled', false);
        $('.mediaFilter').prop('disabled',   true);
    } else { //changing from CHAPTERS to ACTIVITIES
        $('#collection').val('activities');

    $('#div_chapter').hide();

        $('.chapterFilter').prop('disabled', true);
        $('.mediaFilter').prop('disabled',   false);
    };
};// end changeCollection

///////////////////////////////////////////////////////////////////////
/////////////////////////// SEARCH  RESULTS  ///////////////////////////
//////////////////////////////////////////////////////////////////////

var clearFilter = function() {
     console.log('clearFilter');

   $('#previewpanel').hide();
   $('#clearPreview').hide();
   
   if ($('#collection').val() == 'activities') {
         $('#searchString').val("");
         $(".filter_dropdown").each(function() { this.selectedIndex = 0; });
         $(".filter_checkbox").each(function() { $(this).prop("checked", false); });
    } else //collection=='chapters'
    {
         $("#dropdown_grade").val("").change();
         $("#dropdown_subject").val("").change();
    };

    $("#innerResultsMenu").empty();
    $("#innerResultsDiv").empty();
    $("#previewpanel").empty();
}; //end clearFilter()

var isFilterSet = function() {
    var set = false;
    if ($('#collection').val() == 'activities') {
        if ($('#searchString').val()) {
          set = true;
        }

        $(".filter_checkbox").each(function() {
          if (this.checked) {
            set = true;
          }
         });
    } else //collection=='chapters'
    {
         if ($("#dropdown_grade").val() != "")   set = true;
         if ($("#dropdown_subject").val() != "") set = true;
    };

    return set;
}; //end isFilterSet()


//////////////////////////////////////////////////////
/////////////////////////// SEARCH //////////
//////////////////////////////////////////////////////


function clearResults() {
    $("#innerResultsMenu").empty();
    $("#innerResultsDiv" ).empty();
    $("#previewpanel"    ).empty();
    
} //end clearResults()

function displayResults(results) {
      var result_array = [];
      result_array['activities'] = [];  //not searching for dictionary entries
      result_array['chapters']  = [];  //not searching for textbooks

     for (var i=0; i < results.length; i++) {
         if (results[i]['ft'] == 'chapter') result_array['chapters'].push(results[i]);
         else                               result_array['activities'].push(results[i]);
      };

      displaySearchResults(result_array);

      //makedraggable();  //not working for now

     }; //end displayresults()


/////////////////////////////////////////////////////////////
/////////////////  FILL IN SEARCH RESULTS PANE //////////////
/////////////////////////////////////////////////////////////

var displaySearchResults = function(filterdata_object) {
    var currentResultDiv = document.createElement("div");
    currentResultDiv.id = "currentResultDiv";
    $(currentResultDiv).appendTo("#innerResultsDiv");


//***********************
// display Activities in Search Results pane
//***********************

    var actResultDiv = document.createElement("div");
    actResultDiv.id = "actResultDiv";
    $(actResultDiv).appendTo(currentResultDiv);

    var collectionTitle = document.createElement("h1");
        collectionTitle.id = "activityTitle";

        var activitiesarraylength = filterdata_object.activities.length;
        if (activitiesarraylength == 0) {
            collectionTitle.innerHTML = "<a class='heading' name='activities'>Activities (0 Results)</a>";        }
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


//***********************
// display Chapters in Search Results pane
//***********************

        var chaptersarraylength = filterdata_object.chapters.length;
        if (chaptersarraylength > 0) {
            collectionTitle = document.createElement("h1");
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

    //click handlers for Preview, IMG and Add buttons

    //FIX this - make clicking on the thumbnail img launch preview_result()

    //$('.thumbnaildiv').on('click', function() {preview_result(this.data-collection, this);});

        //NOTE: can't attach click handler to 'timlinediv'images which dont exist yet
        //      so add the ON handler to the DIV which will contain the result elements
    /*    $('#innerResultsDiv').on('click',
                                'button.preview',
                                function() {
                                    var el = $(this).parent().parent(); preview_result(el.data("collection"), el);}
                                ); */



}; //end displaySearchResults()

/* //////////////////////TO-DO FOR RESULTS

THUMBNAILS
- Take care of if the image source is null
    -   All the "thumbnail_prefix" variables: If the image source is null,
        it shouldn't try to get the substring, because it'll break the code
    -   If the file isn't there. We need to make a little 404 image and
        code it in.

//////////////////////////END TO-DO */
//*************************************************************************************start of things we need for presentation **********************************************


//returns an english describing the file type, given a FT
// could use a key:value array instead

var filetype = function(ft) { return LOOMA.typename(ft);};

            /*
             //FOR reference: PHP version of thumbnail():
                  function thumbnail ($fn) {  //NEW VERSION AUG '16
                        //given a CONTENT filename, generate the corresponding THUMBNAIL filename
                        //find the last '.' in the filename, strip off the extension, and append '_thumb.jpg'
                        //returns "" if no '.' found
                        //example: input 'aaa.bbb.mp4' returns 'aaa.bbb_thumb.jpg' - this is the looma standard for naming THUMBNAILS
                        $dot = strrpos($fn, ".");  //strrpos finds the LAST occurance
                        if ( $dot ) { return substr($fn, 0, $dot) . "_thumb.jpg";}
                        else return "";
                  } //end function THUMBNAIL
             */
var thumbnail = function(item) {

    //builds a filepath/filename for the thumbnail of this "item" based on type
    //SOME HARD-CODING HERE to be fixed
    var collection;
    var filetype;
    var filename;
    var filepath;
    var thumbnail_prefix;
    var path;
    var imgsrc;
    var idExtractArray;

    if ($(item).attr('thumb')) return $(item).attr('thumb');  //some activities have explicit thumbnail set

    collection = $(item).attr('collection');
    filetype = $(item).attr('ft');
    if ($(item).attr('fn')) filename = $(item).attr('fn');
    if ($(item).attr('fp')) filepath = $(item).attr('fp');

    idExtractArray = extractItemId(item);

    imgsrc = "";

    if (collection == "chapters" || item.pn != null) {
        //NOTE: in the next statement, sometimes get error "Uncaught TypeError: Cannot read property 'concat' of undefined"
        thumbnail_prefix = idExtractArray["currentSubjectFull"].concat("-", idExtractArray["currentGradeNumber"]);
        imgsrc = homedirectory + "content/textbooks/" + idExtractArray["currentGradeFolder"] + "/" + idExtractArray["currentSubjectFull"] + "/" + thumbnail_prefix + "_thumb.jpg";
    }

    else if (collection == "activities" || item.ft != null) {
        
        imgsrc = LOOMA.thumbnail(item.fn, item .fp, item.ft);
        
 /*       if (item.ft == "mp3") {  //audio
            if (filepath) path = filepath; else path = homedirectory + 'content/audio/';
            imgsrc = path + "thumbnail.png";
        }
        else if (item.ft == "mp4" || item.ft == "mp5" || item.ft == "m4v" || item.ft == "mov" || item.ft == "video") { //video
            thumbnail_prefix = filename.substr(0, filename.indexOf('.'));
            if (filepath) path = filepath; else path = homedirectory + 'content/videos/';
            imgsrc = path + thumbnail_prefix + "_thumb.jpg";
        }
        else if (item.ft == "jpg"  || item.ft == "gif" || item.ft == "png" || item.ft == "image" ) { //picture
            thumbnail_prefix = filename.substr(0, filename.indexOf('.'));
            if (filepath) path = filepath; else path = homedirectory + 'content/pictures/';
            imgsrc = path + thumbnail_prefix + "_thumb.jpg";
        }
        else if (item.ft == "pdf") { //pdf
            thumbnail_prefix = filename.substr(0, filename.indexOf('.'));
            if (filepath) path = filepath; else path = homedirectory + 'content/pdfs/';
            imgsrc = path + thumbnail_prefix + "_thumb.jpg";
        }
        else if (item.ft == "html") { //html
            thumbnail_prefix = filename.substr(0, filename.indexOf('.'));
            if (filepath) path = filepath; else path = homedirectory + 'content/html/';
            imgsrc = path + thumbnail_prefix + "_thumb.jpg";
        }
        else if (item.ft == "EP") {
            imgsrc = homedirectory + "content/epaath/activities/" + item.fn + "/thumbnail.jpg";
        }
        else if (item.ft == "text") {
            imgsrc = "images/textfile.png";
        }
        else if (item.ft == "slideshow") {
            imgsrc = "images/play-slideshow-icon.png";
        }
        else if (item.ft == "looma") {
            imgsrc = item.thumb;
        }
 */
    }
    return imgsrc;
}; // end thumbnail()


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
        
/*        var elements = {
            currentSection: null,
            currentChapter: null,
            currentSubject: null,
            currentGradeNumber: null,
            currentGradeFolder: null,
            currentSubjectFull: null,
            chprefix: null};
        var names = {
            EN: "English",
            N:  "Nepali",
            M:  "Math",
            S:  "Science",
            SS: "SocialStudies"};

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
    }



var createActivityDiv = function(activity) {


    var innerActivityDiv = function(item) {

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
                $(activityDiv).attr("data-id",         (item.ft == 'chapter') ? item['_id'] : item['_id']['$id']);
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
                    html : filetype(item.ft) + "  "
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
                };

                $("<br>").appendTo(textdiv);

                // Buttons
                var buttondiv = document.createElement("div");
                buttondiv.className = "buttondiv";
                $(buttondiv).appendTo(activityDiv);

                // "Add" button
                var addButton = document.createElement("button");
                if (vid_selected) addButton.innerText = "Add"; else addButton.innerText = "Select";
                addButton.className = "add";

               buttondiv.appendChild(addButton);

                // "Delete" button
                var removeButton = $("<button/>", {class: "remove", html:"Delete"});
                $(buttondiv).append(removeButton);

                // "Preview" button
                var previewButton = document.createElement("button");
                previewButton.innerText = "Preview";
                previewButton.className = "preview";
                // previewButton.onclick = preview_result(item);
           /*     $(previewButton).bind("click", function() {
                    preview_result(collection, item);
                });
             */
               buttondiv.appendChild(previewButton);

            return activityDiv;
            }; //end innerActivityDiv()


    var idExtractArray = extractItemId(activity);

    var div = document.createElement("div");
    div.className = "resultitem";

    var newDiv = innerActivityDiv(activity);
    $(newDiv).appendTo(div);

    return div;
};  // end createActivityDiv()


///////////////////////////////////////////////////////////////
/////////////////////////// PREVIEW ///////////////////////////
///////////////////////////////////////////////////////////////

var display_video = function(item, id) {
  console.log(item)

    $('vidpanel').append($("<p/>", {html : "Loading preview..."}));


    if($(item).data('mongo'))
    {
      var collection = $(item).attr('data-collection');
      var filetype = $(item).data('type');
      var filename = $(item).data('mongo').fn;
      var $mongo = $(item).data('mongo');
      var filepath;
      if ('fp' in $mongo) filepath = $mongo.fp;
    }
    else
    {
      var collection = "activities";
      var filetype = item.ft;
      var filename = item.fn;
      var filepath;
      $(item).attr('data-id', id)
    }

        //console.log ("collection is " + collection + " filename is " + filename + " and filetype is " + filetype);

    //var idExtractArray = extractItemId($(item).data('mongo'));

    if (collection == "activities") {

        if(filetype == "mp4" || filetype == "video" || filetype == "mov" || filetype == "m4v" || filetype == "mp5") {
            if (!filepath) filepath = '../content/videos/';
            document.querySelector('#vidpanel').innerHTML +=

    //      '<video controls> <source src="' + homedirectory +
    //               'content/videos/' + filename + '" type="video/mp4"> </video>';


              // '<div id="video-player">' +
                    '<div id="video-area">' +
                        '<div id="fullscreen">' +
                            '<video id="master_video">' +
                                '<source id="video-source" src="' +
                                       filepath + filename + '" type="video/mp4">' +
                            '</video>' +
                    '</div></div></div>' +
                '<div id="title-area"><h3 id="title"></h3></div>' +
                '<div id="media-controls">' +

                    //'<button id="fullscreen-playpause"></button>' +
                    '<div id="time" class="title master_time">0:00</div>' +
                    '<button type="button" class="play-pause"></button>' +
                    '<input type="range" class="video seek-bar" value="0" style="display:inline-block"><br>' +
                    '<button type="button" class="mute"></button>' +
                    '<input type="range" class="video volume-bar" min="0" max="1" step="0.1" value="0.5" style="display:inline-block"><br>' +
                '</div>';

              clearFilter();
              attachMediaControls(document.getElementById("master_video"));  //hook up event listeners to the audio and video HTML

              $('#master_video').attr('data-collection', collection);
              $('#master_video').attr('data-id', $(item).attr('data-id'));
        }
    }
    $('#clearPreview').click(clearPreview);
}


// When you click the preview button
var preview_result = function(item) {
    $('#previewpanel').show();
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

    //      '<video controls> <source src="' + homedirectory +
    //               'content/videos/' + filename + '" type="video/mp4"> </video>';


              // '<div id="video-player">' +
                    '<div id="video-area">' +
                        '<div id="fullscreen">' +
                            '<video id="video">' +
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

             attachMediaControls();  //hook up event listeners to the audio and video HTML

        }
        else if (filetype=="pdf") {
            if (!filepath) filepath = '../content/pdfs/';
            document.querySelector("div#previewpanel").innerHTML =
                 '<iframe src="' + filepath + filename + '"' +
                 ' style="height:60vh;width:60vw;" type="application/pdf">';
        }
        else if(filetype=="mp3") {
            if (!filepath) filepath = '../content/audio/';
              document.querySelector("div#previewpanel").innerHTML = '<br><br><br><audio id="audio"> <source src="' +
                              filepath +
                              filename + '" type="audio/mpeg"></audio>' +
                                              '<div id="media-controls">' +
                                            '<div id="time" class="title">0:00</div>' +
                                            '<button type="button" class="play-pause"></button>' +
                                            '<input type="range" class="video seek-bar" value="0" style="display:inline-block"><br>' +
                                            '<button type="button" class="mute"></button>' +
                                            '<input type="range" class="video volume-bar" min="0" max="1" step="0.1" value="0.5" style="display:inline-block"><br>' +
                                        '</div>';
             attachMediaControls();  //hook up event listeners to the audio and video HTML

        }
        // Pictures
        else if(filetype=="jpg" || filetype=="gif" || filetype=="png" || filetype=="image") {
            if (!filepath) filepath = '../content/pictures/';
            console.log(filepath + " " + filename);
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
          '<object type="text/html" data="' + homedirectory + 'content/epaath/activities/' +
            filename  + '/index.html" style="height:60vh;width:60vw;"> </object>';
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

};  // end preview_result()


function insertTimelineElement(source, open) {
        var $dest = $(source).clone(true).off(); // clone(true) to retain all DATA for the element
                                                 //NOTE: crucial to "off()" event handlers,
                                                 //or the new element will still be linked to the old

        $dest.removeClass('ui-draggable-handle').removeClass("ui-draggable").removeClass("ui-draggable-disabled");

 //  ?? this next stmt needed??
        $dest.addClass("ui-sortable-handle");

        //$dest.attr("data-time", $('.master_time').html());
        var new_id = 't' + id_counter;
        $dest.attr("id", new_id);
        id_counter += 1;

        var time = 0;
        if(open)
        {
          time = source.getAttribute("data-time");
        }
        else
        {
          var timeString = $('.master_time').html();

          if(timeString.length > 6)
          {
            time = (parseInt(timeString) * (60*60)) + (parseInt(timeString.substring(timeString.length - 4)) * 60) + parseInt(timeString.substring(timeString.length - 2));
          }
          else
          {
            time = (parseInt(timeString) * 60) + parseInt(timeString.substring(timeString.length - 2));
          }
        }


        $dest.attr("data-time", time);

        var index = 0;
        while(index < timeline_times.length && parseInt(time) >= parseInt(timeline_times[index]))
        {
          index += 1;
        }

        if(index == timeline_times.length)
        {
          timeline_times.push(time);
          timeline_id.push(new_id)
        }
        else
        {
          var backwards_index = timeline_times.length - 1;
          while(index <= backwards_index)
          {
            if(backwards_index == timeline_times.length - 1)
            {
              timeline_times.push(timeline_times[backwards_index]);
              timeline_id.push(timeline_id[backwards_index]);
            }
            else
            {
              timeline_times[backwards_index + 1] = timeline_times[backwards_index];
              timeline_id[backwards_index + 1] = timeline_id[backwards_index];
            }
            backwards_index -= 1;
          }
          timeline_times[index] = time;
          timeline_id[index] = new_id;
        }
        var timeText;

        if(open)
        {
          if(time >= 3600)
          {
            timeText = Math.floor(time/3600) + ":" + ((time/60)%60) + ":" + (time%3600);
          }
          else
          {
            if(time%60 < 10)
            {
              timeText = Math.floor(time/60) + ":" + 0 + (time%60);
            }
            else{
              timeText = Math.floor(time/60) + ":" + (time%60);
            }
          }
        }
        else
        {
          timeText = timeString;
        }

        $("<div/>", {
            class : "time_popup",
        }).text(timeText).appendTo($dest);

        $dest[0].className += " timelineElement";
        
        if(index == timeline_times.length - 1)
        {
          $dest.appendTo("#timelineDisplay");
        }
        else
        {
          $dest.insertBefore($('#' + timeline_id[index + 1]));
        }

        // scroll the timeline so that the new element is in the middle - animated to slow scrolling
        $('#timeline').animate( { scrollLeft: $dest.outerWidth(true) * ( $dest.index() - 4 ) }, 100);

        $('.timelineElement').off().hover(function() {$('.time_popup').show();}, function() {$('.time_popup').hide();})

}; //end insertTimelineElement()

var removeTimelineElement = function(elem) {
  // Removing list item from timelineHolder
  //var outerDiv = this.parentNode.parentNode;
  //outerDiv.remove();    // "Remove" button is within 3 divs

        var index = timeline_id.indexOf(elem.closest('.activityDiv').id);
        timeline_id.splice(index, 1)
        timeline_times.splice(index, 1)

        $('#timeline').animate( { scrollLeft: $(elem).closest('.activityDiv').outerWidth(true) * ( $(elem).closest('.activityDiv').index() - 4 ) }, 100);
        $(elem).closest('.activityDiv').remove();

};

function clearPreview() {
  $('#previewpanel').hide();
  $('#previewpanel').empty();
  $('#clearPreview').hide();
}


/*/////////////////////////// SORTABLE UI ////////  requires jQuery UI  ///////////////////
var makesortable = function() {
    //$('timelineDisplay').sortable( "destroy" ); //remove previous sortable state
    $("#timelineDisplay").sortable({
        opacity: 0.7,   // makes dragged element transparent
        revert: true,   //Animates the drop
        axis:   "x",
        scroll: true,   //Allows page to scroll when dragging. Good for wide pages.
        handle: $(".activityDiv")  //restricts elements that can be clicked to drag to .timelinediv's
    }).disableSelection();
};

var refreshsortable = function() {
    // the call to sortable ("refresh") below should refresh the sortability of the timeline, but it's not working, so call makesortable() instead
    //$("#timelineDisplay").sortable( "refresh" );

    makesortable();

    };

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
}; //end makedraggable()*/

var initializeDOM = function() {

    //////////////////////////////////////////////////////
/////////////////////////// Fill in the DOM //////////
//////////////////////////////////////////////////////

    // Building Navbar and Querybar-- all this could be in HTML

        /*$("<p/>", {
            html : "Video Editor"
        }).appendTo("#navbar");*/

    // Filter: Search
        $("<div/>", {
            id : "div_search",
        }).appendTo("#search");

        $("<input type='radio' name='radio' value='activities' class='filter_radio' checked>").appendTo("#div_search");
        $("<span class='filter_label'> Media</span>").appendTo("#div_search");
        $('<br>').appendTo("#div_search");
        $("<input type='radio' name='radio' value='chapters'  class='filter_radio' >").appendTo("#div_search");
        $("<span class='filter_label'> Chapter</span>").appendTo("#div_search");

        // Filter: Grade
        $("<div/>", {
            id : "div_grade"
        }).appendTo("#search");

        $("<span/>", {
            class : "filter_label",
            html : "Grade:",
        }).appendTo("#div_grade");

        $("<select/>", {
            class : "filter_dropdown chapterFilter",
            form  : "search",
            name  : "class",
            id : "dropdown_grade",
            placeholder: "Grade Level"
        }).appendTo("#div_grade");

        for (var i=0; i<9; i++) {
            if (i == 0) {
                $("<option/>", {
                    html : "All",
                    value : "",
                    id : ""
                }).appendTo("#dropdown_grade");
            }
            else {
                $("<option/>", {
                    html : i,
                    value : i,
                    id : i
                }).appendTo("#dropdown_grade");
            }
        }

    // Filter: Subject
        var subjects = {
            "English"      : "EN",
            "Math"         : "M",
            "Nepali"       : "N",
            "Science"      : "S",
            "Soc. Studies" : "SS"
        };

        $("<div/>", {
            id : "div_subject"
        }).appendTo("#search");

        $("<span/>", {
            class : "filter_label",
            html : "Subject: ",
        }).appendTo("#div_subject");

        $("<select/>", {
            class : "filter_dropdown chapterFilter",
            name  : "subj",
            form  : "search",
            id : "dropdown_subject",
        }).appendTo("#div_subject");

        $('<option>', {
            value: "",
            html : "All"
        }).appendTo("#dropdown_subject");

        $.each(subjects, function (key, value) {
            $("<option/>", {
                value: value,
                html : key
            }).appendTo("#dropdown_subject");
        });

    // Filter: chapters

        $("<div/>", {
            id : "div_chapter"
        }).appendTo("#search");

        $("<span/>", {
            class : "filter_label",
            id : "chapter_label",
            html : "Chapter: ",
        }).appendTo("#div_chapter");

        $('<select/>', {
            class : "filter_dropdown chapterFilter",
            form: "search",
     //       size: "2",
            name: "chapter",
            id: "dropdown_chapter"
        }).appendTo('#div_chapter');


   // Filter: File Type
        var filetypes = {
            "image" :   {   id : "ft_image",     display : "Image"  },
            "video" :   {   id : "ft_video",     display : "Video"  },
            "audio" :   {   id : "ft_audio",     display : "Audio"   },
            "pdf" :     {   id : "ft_pdf",       display : "PDF"   },
            "text" :    {   id : "ft_text",      display : "Text"   }
            // SLIDESHOW should be added
            //    "slideshow":{   id : "ft_slideshow", display : "Slide Show"   }
        };

        $("<div/>", {
            id : "div_filetypes"
        }).appendTo("#search");

        $("<span class='filter_label'>Type:       </span>").appendTo("#div_filetypes");

        $.each(filetypes, function (key, value) {
            $("<input/>", {
                class : "filter_checkbox mediaFilter",
                type : "checkbox",
                id : value.id,
                name : "type[]",
                value: key
                // html : value.display
            }).appendTo("#div_filetypes");
            $("<label/>", {
                class : "filter_label",
                for : value.id,
                style: "color:#00cc00;",
                html : value.display
            }).appendTo("#div_filetypes");

        });

        $('<br>').appendTo("#div_filetypes");

    //checkboxes for SOURCE
        var sources = {
            "Dr Dann" :     {   id : "src_ck12",   display : "CK-12"    },
            "PhET" :      {   id : "src_phet",   display : "PhET"     },
            "ePaath" :    {   id : "src_epaath", display : "ePaath"   },
            "khan" :      {   id : "src_khan",   display : "Khan"     },
            "wikipedia" : {   id : "src_wiki",   display : "Wikipedia"}
        };

        $("<div/>", {
            id : "div_sources"
        }).appendTo("#div_filetypes");

        $("<span class='filter_label'>Source: </span>").appendTo("#div_sources");

        $.each(sources, function (key, value) {
            $("<input/>", {
                class : "filter_checkbox mediaFilter",
                type : "checkbox",
                id : value.id,
                name : "src[]",
                value: key
            }).appendTo("#div_sources");
            $("<label/>", {
                class : "filter_label",
                style: "color:blue;",
                for : value.id,
                html : value.display
            }).appendTo("#div_sources");
        });


 // dropdowns for CATEGORIES  - - AREA, SUBAREA and TAG

        var categories = {
            "science" :  {   id : "cat_science",  display : "Science"  },
            "math" :     {   id : "cat_math",     display : "Math"  },
            "Art" :      {   id : "cat_art",      display : "Art"  },
            "business" : {   id : "cat_business", display : "Business"  },
            "citizen" :  {   id : "cat_citizen",  display : "Citizenship"  },
            "design" :   {   id : "cat_design",   display : "Design"  },
            "life" :     {   id : "cat_life",     display : "Life"  },
            "geography": {   id : "cat_geography",display : "Geography"  },
            "history" :  {   id : "cat_history",  display : "History"  },
            "tech" :     {   id : "cat_tech",     display : "Technology"  },
            "language" : {   id : "cat_language", display : "Language"  },
            "music" :    {   id : "cat_music",    display : "Music"  },
            "people" :   {   id : "cat_people",   display : "People"  },
            "religion" : {   id : "cat_religion", display : "Religion"  }
        };

        $("<div/>", {
            id : "div_categories"
        }).appendTo("#search");

        $("<span/>", {
            class : "filter_label",
            id : "search_label",
            html : "Name:",
        }).appendTo("#div_categories");

        $("<input/>", {
            id : "searchString",
            class: "textBox mediaFilter",
            type : "text",
            placeholder: "enter search term...",
            name : "search-term",
        }).appendTo("#div_categories");

        //$('<br>').appendTo("#div_categories");

        $("<span/>", {
            class : "filter_label",
            html : "Category: ",
        }).appendTo("#div_categories");

        $("<select/>", {
            class : "filter_dropdown mediaFilter",
            form  : "search",
            name  : "category",
            id : "dropdown_cat"
        }).appendTo("#div_categories");

        $("<option/>", {
                class : "filter_checkbox",
                name : "category",
                html : "All",
                value: "All"
            }).appendTo("#dropdown_cat");
        $.each(categories, function (key, value) {
            $("<option/>", {
                class : "filter_checkbox",
                id : value.id,
                name : "category",
                html : value.display,
                value: key
            }).appendTo("#dropdown_cat");
        });

   // Buttons for Search and Clear search criteria

        $("<button/>", {
            class: "search",
            id : "submit_button",
            name:  "search",
            value: "value",
            type : "submit",
            form : "search",
            style: "color:black;",
            html : "<i class=\"fa fa-search\">"
        }).appendTo("#search");

        $("#div_filetypes").append("<br/>");  //WHAT IS THIS??

        $("<button/>", {
            id : "clear_button",
            type : "button",
            html : "Clear"
        }).appendTo("#search");

        // Title string
        $("<p/>", {
            html : "Activity name:&nbsp;&nbsp;",
            class: "ellipsis titleString",
        }).appendTo("#titleDiv");

        $("<p/>", {
            class: "textBox filename",
            id: "activityName",
        }).appendTo("#titleDiv");

        $details = $('<div id="details"><div>' +
                      '</div></div>');

}; // end initializeDOM()

var firstTimeVideoHTMLDeletion = function() {
    $('#div_search').hide();
    $('#div_filetypes').hide();
    $('#clear_button').hide();

    $("<input/>", {
        type : "checkbox",
        id : "del_video",
        class : "filter_checkbox",
        value : "Video",
        name : "type[]",
        disabled : true
    }).appendTo("#div_categories");
    $("<label/>", {
        class : "filter_label",
        id : "del_label",
        for : "ft_video",
        style: "color:#00cc00;",
        html : "Video"
    }).appendTo("#div_categories");

    $("<div/>", {
            id : "del_div",
        }).appendTo("#search");

    $("#del_div").html("Please select a video to edit");
    $('#search_label').html("Base Video Name:")
    $('#div_categories').css("width", "60vw")
};


