/*
LOOMA javascript file
Filename: looma-edited-video.js
Programmer name: Connor Kennedy, skip
Adapted From: looma-edit-lesson.js Summer 2017
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: Summer 2017, May 2019
Revision: Looma 5
 */

'use strict';


/*
Apr 2019 things to fix:

Editing

1. Can’t  play the edited video including stopping on inserted elements ?

Other:


1. Separate ‘base video’ out of ‘data’ array [Instead of being the first array element]
2. Change parameter passing via <script> to <div hidden>

 */


/////////////////////////// INITIALIZING  ///////////////////////////

//var timelineAssArray = new Object();

var homedirectory = "../";
const frameRate = 24;  //NOTE: frame rate in NOT regular when played by a browser. this is an estimate that is good enough for EVI
//var vid_selected = false;
var timeline_times = [];
var timeline_id = [];
var id_counter = 0;
var mainThumbSrc = "";
//var openClick = false;
var loginname, loginlevel, loginteam;
var $timeline;  //the DIV where the timeline is being edited
var savedTimeline = "";   //savedTimeline is checkpoint of timeline for checking for modification

var searchName = 'evi-editor-search';  // localstore name for saving current search settings


function showPreview() {
    $('#video-area').hide();
    $('#preview-area').show();
} // end showPreview()


function clearPreview() {
    $('#preview-area').hide();
   // $('#previewContents').empty();
    $('#clearPreview').hide();
    $('#video-area').show();
}

/*
function eviShowSearchItemsOpen() {
    $('#search-form  #collection').val('edited_videos');
    
    $('#evi-chk').show();
    // for TEXT EDIT, only show "text", clicked and disabled
    $('#evi-chk input').attr('checked', true).css('opacity', 0.5);
    //$('#txt-chk input').prop('readonly'); //cant make 'readonly' work
    $('#evi-chk input').click(function() {return false;});
    
};
*/

/*function eviShowSearchItemsNew() {
    $('#search-form  #collection').val('activities');
    
    $('#vid-chk').show();
    // for TEXT EDIT, only show "text", clicked and disabled
    $('#vid-chk input').attr('checked', true).css('opacity', 0.5);
    //$('#txt-chk input').prop('readonly'); //cant make 'readonly' work
    $('#vid-chk input').click(function() {return false;});
    
};
*/

function eviCheckpoint() {         savedTimeline =   $timeline.html(); }
//function eviUndoCheckpoint() {     $timeline.html(   savedTimeline);     };  //not used now??
function eviModified()   { return ( savedTimeline !== $timeline.html());}

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
}  // end eviSetOwner()


function eviClear() {
    clearResults();
    //vid_selected = false;
    timeline_times = [];
    timeline_id = [];
    id_counter = 0;
    mainThumbSrc = "";
    savedTimeline = "";
   
    $timeline.empty();  //the DIV where the timeline is being edited
    
    $('#preview-area').hide();
    //$('#clearPreview').hide();
    $('#video-screen').empty();
    //$('#title_area').empty();
    $('#video-area #media-controls').hide();
    
    $('#innerResultsMenu').empty();
    $('#innerResultsDiv').empty();
    
    
} // end eviClear()

function eviNew()
{
    //eviClear();
    
    callbacks ['display'] = displayMasterVideo;
    performSearch('activities', 'video'); //providing alternate 'collection' and 'ft' to file search FORM
    
}  //end eviNew()

function clearResults() {

    $("#innerResultsMenu").empty();
    $("#innerResultsDiv" ).empty();
    
    $("#preview-area"    ).hide();
    $("#clearPreview"    ).hide();
    
    $("#video-area"      ).show();
    
 /*   if(vid_selected)
    {
        $('#video-area').hide();
      //  $('#title-area').remove();
        $('#media-controls').hide();
        //firstTimeVideoHTMLDeletion();
        vid_selected = false;
        //$('#del_video').prop("checked", true);
        //$('#title-area br').remove();
        //$('#div_categories').css("width", "60vw")
        //$('.filter_label').css("margin-left", "1vw");
    }*/
} //end clearResults()

function eviPack (html) { // pack the timeline into an array of collection/id pairs for storage
    var packitem;
    var packarray = [];
    
    packitem = {};
    packitem.collection = $('#master-video').data('collection');
    packitem.id =         $('#master-video').data('id');
    mainThumbSrc =         $('#master-video').data('thumb');
    packarray.push(packitem);
    
    //change below pack code to add an ordering INDEX
    $(html).each(function() {
        packitem = {};  //make a new object, unlinking the references already pushed into packarray
        packitem.collection = $(this).data('collection');
        packitem.id         = $(this).data('id');
        packitem.time       = $(this).data('time');
        if (packitem.collection === 'chapters') packitem.lang = $(this).data('lang');
    
        packarray.push(packitem);
    });
    
    return packarray;
} //end eviPack()

function eviUnPack (response) {  //unpack the array of collection/id pairs into html to display on the timeline
    var newDiv;
    var timeArray = [];
    
    //for each element in data, call createActivityDiv, and attach the resturn value to #timelinediv
    // also set filename, [and collection??]
    
    //$('#timelineDisplay').empty();
    
    setname(response.dn);
    
    owner = (response.author == loginname) ? true : false;  //set boolean OWNER to TRUE if we are the author of this existing EVI
    var mainVideo = response.data['0'];
    //var mainVideo = response.data.splice(0, 1)[0];
    
    $.post("looma-database-utilities.php",
        {cmd: "openByID", collection: mainVideo.collection, id: mainVideo.id},
        function(result) {
            displayMasterVideo(result);
        },
        'json'
    );
    
    $(response.data).slice(1).each(function(){
        if ((typeof this.time !== 'undefined'))
            timeArray.push(this.time);
    });
    
    // need to record ID of newly opened EVI so that later SAVEs can overwrite it
    $(response.data).slice(1).each(function(index) {
        // retrieve each timeline element from mongo and add it to the current timeline
        if ((typeof this.time !== 'undefined')) {
            newDiv = null;
            //reset newDiv so previous references to it are broken
            $.post("looma-database-utilities.php",
                {cmd: "openByID", collection: this.collection, id: this.id},
                function (result) {
                    newDiv = createActivityDiv(result);
                    newDiv.firstChild.setAttribute("data-time", timeArray[index]);
                    insertTimelineElement(newDiv.firstChild, true);
                },
                'json'
            );
        }
    }).promise().done( eviCheckpoint);
    
    if(response.thumb) {
        mainThumbSrc = response.thumb;
    } else {
        //FIX LATER
        mainThumbSrc = "";
    }

    $('#div_search').show();
    $('#div_filetypes').show();
    $('#clear_button').show();
    $('#search_label').html("Name:");
    $('<br>').insertAfter('#searchString');
    
} //end eviUnPack()

function eviDisplay (response) {
    eviClear();
    $timeline.html(eviUnPack(response));
    $('#media-search').show();
} //end eviDisplay()

function eviSave(name) {
    saveEviFile(name, 'edited_videos', 'evi', eviPack($timeline.html()), mainThumbSrc, true);
} //end eviSave()

function saveEviFile(name, collection, filetype, data, thumb, activityFlag) {
    
    console.log('FILE COMMANDS: saving file (' + name + ') with ft: ' + filetype + 'and with data: ' + data);
    $.post("looma-database-utilities.php",
        {cmd: "save",
            collection: collection,
            dn: LOOMA.escapeHTML(name),
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
} //end saveEviFile()

///////////////////////////////////////////////////////////////////////
/////////////////////////// SEARCH  RESULTS  ///////////////////////////
//////////////////////////////////////////////////////////////////////

function clearFilter() {
     //console.log('clearFilter');

   $('#preview-area').hide();
   $('#video-area'  ).show();
   //$('#clearPreview').hide();
   
 /*
   if ($('#collection').val() == 'activities') {
         $('#searchString').val("");
         $(".filter_dropdown").each(function() { this.selectedIndex = 0; });
         $(".filter_checkbox").each(function() { $(this).prop("checked", false); });
    } else //collection=='chapters'
    {
         $("#dropdown_grade").val("").change();
         $("#dropdown_subject").val("").change();
    };
*/
} //end clearFilter()

//////////////////////////////////////////////////////
/////////////////////////// SEARCH //////////
//////////////////////////////////////////////////////

function displayResults(results) {
      var result_array = [];
      result_array['activities'] = [];  //not searching for dictionary entries
      result_array['chapters']  = [];  //not searching for textbooks

     for (var i=0; i < results.list.length; i++) {
         if (results.list[i]['ft'] == 'chapter') result_array['chapters'].push(results.list[i]);
         else                               result_array['activities'].push(results.list[i]);
      }

      displaySearchResults(result_array);

      //makedraggable();  //not working for now

     } //end displayresults()


/////////////////////////////////////////////////////////////
/////////////////  FILL IN SEARCH RESULTS PANE //////////////
/////////////////////////////////////////////////////////////

function displaySearchResults(filterdata_object) {
    
    
    pauseMasterVideo();
    
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



} //end displaySearchResults()

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

function filetype(ft) { return LOOMA.typename(ft);}

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

            
function thumbnail(item) {

    //builds a filepath/filename for the thumbnail of this "item" based on type
    //SOME HARD-CODING HERE to be fixed
    var collection;
    var filetype;
    var filename;
    var filepath;
    var thumbnail_prefix;
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
    }
    return imgsrc;
} // end thumbnail()


function extractItemId(item) {
        var ch_id = (item['ft'] == 'chapter')? item['_id'] : item['ch_id'];
        return LOOMA.parseCH_ID(ch_id);
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

        $(activityDiv).attr("data-fp", item['fp']);
    
        var lang =  $("input:radio[name='language']:checked").val();
        $(activityDiv).attr("data-lang", lang);
        $(activityDiv).attr("data-fn", item['fn']);
        $(activityDiv).attr("data-pn", item['pn']);
        $(activityDiv).attr("data-nfn", item['nfn']);
        $(activityDiv).attr("data-npn", item['npn']);
        
                item.collection = (item.ft == 'chapter')?'chapters':'activities';
                $.data(activityDiv, 'mongo', item);  //save the whole mongo document ("item") in the DOM element

                // Thumbnail
                var thumbnaildiv = document.createElement("div");
                thumbnaildiv.className = "thumbnaildiv";
                $(thumbnaildiv).appendTo(activityDiv);

                var image = $("<img/>", {
                    class : "resultsimg",
                    src : thumbnail(item, collection)
                });
                image.attr('draggable', 'false');
                image.appendTo(thumbnaildiv);

                // Result Text
                var textdiv = document.createElement("div");
                textdiv.className = "textdiv";
                $(textdiv).appendTo(activityDiv);

                // Display Name
                if (item.dn) var dn = item.dn.substring(0, 20);
                else if (item.ndn) dn = item.ndn.substring(0,20);
                else dn = "";
        
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
                }

                $("<br>").appendTo(textdiv);

                // Buttons
                var buttondiv = document.createElement("div");
                buttondiv.className = "buttondiv";
                $(buttondiv).appendTo(activityDiv);

                // "Add" button
                var addButton = document.createElement("button");
                //if (vid_selected)
                addButton.innerText = "Add"; //else addButton.innerText = "Select";
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
    div.setAttribute("draggable", "false");
    
    var newDiv = innerActivityDiv(activity);
    $(newDiv).appendTo(div);

    return div;
};  // end createActivityDiv()


function pauseMasterVideo() {
    $('#master-video')[0].pause();
    $('.play-pause').css('background-image', 'url("images/video.png")');
}

function displayMasterVideo(item) {

    //$('video-area').html($("<p/>", {html : "Loading preview..."}));
    
 /*   if(item.ft = "evi")   // NOT USED ????
    {
        //var collection = $(item)[0].data[0].collection;  //.attr('data-collection');
      var collection = 'activities';
      var filetype = 'video';
      var filename = $(item).data('mongo').fn;
      //var $mongo = $(item).data('mongo');
      var filepath;
      if ('fp' in $(item).data('mongo')) filepath = $(item).data('mongo').fp;
    }
    else
        */
    {
      var collection = "activities";
      var filetype = item.ft;
      var filename = item.fn;
      var filepath = item.fp;
      $(item).attr('data-id', item._id["$id"]);
    }
    //setname(item.dn + ' (edited)');
    owner = true;
      
        if(filetype == "mp4" || filetype == "video" || filetype == "mov" || filetype == "m4v" || filetype == "mp5") {
            if (!filepath) filepath = '../content/videos/';
            document.querySelector('#video-screen').innerHTML +=

    //      '<video controls> <source src="' + homedirectory +
    //               'content/videos/' + filename + '" type="video/mp4"> </video>';


              // '<div id="video-player">' +
                   // '<div id="video-area">' +
                       // '<div id="fullscreen">' +
                            '<video id="master-video">' +
                                '<source id="video-source" src="' +
                                       filepath + filename + '" type="video/mp4">' +
                            '</video>';
                       // '</div>';
                    //</div>' +
                    //'</div>' +
            //    '<div id="title-area"><h3 id="title"></h3></div>' +
     /*
                '<div id="media-controls">' +

                    //'<button id="fullscreen-playpause"></button>' +
                    '<div id="time" class="title master_time">0:00</div>' +
                    '<button type="button" class="play-pause"></button>' +
                    '<input type="range" class="video seek-bar" value="0" style="display:inline-block"><br>' +
                    '<button type="button" class="mute"></button>' +
                    '<input type="range" class="video volume-bar" min="0" max="1" step="0.1" value="0.5" style="display:inline-block"><br>' +
                '</div>';
     */
              //clearFilter();
              $('#video-area .media-controls').show();
              attachMediaControls(document.getElementById("master-video"));  //hook up event listeners to the audio and video HTML
            $('#master-video')[0].currentTime = 0;
            $('#master-video').on('play', function()  {$('#adjust').hide();});
            $('#master-video').on('pause', function() {$('#adjust').show();});
    
            $('#master-video').attr('data-collection', collection);
            $('#master-video').attr('data-id', $(item).attr('data-id'));
            $('#master-video').attr('data-thumb', LOOMA.thumbnail(filename, filepath, filetype));
        } else console.log('displayMasterVideo tried to open a non-video file');
        
    $('.filesearch-collectionname').text('Edited Videos');  // set file search box title
    currentcollection = 'edited_videos';
    currentfiletype = 'evi';
    callbacks ['display'] =         eviDisplay;
    
    eviCheckpoint();
    
}  // end displayMasterVideo()


///////////////////////////////////////////////////////////////
/////////////////////////// PREVIEW ///////////////////////////
///////////////////////////////////////////////////////////////

// When you click the preview button
var preview_result = function(item) {
    //$('#preview-area, #clearPreview').show(); $('#video-area').hide();
    //$('#preview-area').empty().append($("<p/>", {html : "Loading preview..."}));

    var collection = $(item).attr('data-collection');
    var filetype = $(item).data('type');
    var filename = $(item).data('mongo').fn;
    var $mongo = $(item).data('mongo');
    var filepath;
    if ('fp' in $mongo) filepath = $mongo.fp;

        //console.log ("collection is " + collection + " filename is " + filename + " and filetype is " + filetype);

    var idExtractArray = extractItemId($(item).data('mongo'));
    
    pauseMasterVideo();

    if (collection == "chapters") {
        var pagenum = $(item).data('mongo').pn;

        document.querySelector("div#preview-area").innerHTML = '<embed src="' +
                                //encodeURI(
                                   homedirectory + 'content/textbooks/' +
                                   idExtractArray["currentGradeFolder"] + '/' +
                                   idExtractArray["currentSubjectFull"] + '/' +
                                   idExtractArray["currentSubjectFull"] + '-' +
                                   idExtractArray["currentGradeNumber"] +
                                    '.pdf#page=' + pagenum + '\"  style=\"height:60vh;width:60vw;\" type=\"application/pdf\"' + '>';
        //$('#preview-area, #clearPreview').show(); $('#video-area').hide();
        showPreview();
    }

    else if (collection == "activities") {

        if(filetype == "mp4" || filetype == "video" || filetype == "mov" || filetype == "m4v" || filetype == "mp5") {
            if (!filepath) filepath = '../content/videos/';
            document.querySelector("#preview-area").innerHTML =

    //      '<video controls> <source src="' + homedirectory +
    //               'content/videos/' + filename + '" type="video/mp4"> </video>';


              // '<div id="video-player">' +
                    //'<div id="video-area">' +
                        //'<div id="fullscreen">' +
                            '<video id="inserted-video">' +
                                '<source id="video-source" src="' +
                                       filepath + filename + '" type="video/mp4">' +
                            '</video>' +
                        //'</div>';
                    //</div>' +
                    //'</div>' +
              //  '<div id="title-area"><h3 id="title"></h3></div>' +
        
                '<div class="media-controls">' +
                    '<div class="time title">0:00</div>' +
                    '<button type="button" class="play-pause"></button>' +
                    '<input type="range" class="video seek-bar" value="0" style="display:inline-block"><br>' +
                    '<button type="button" class="mute"></button>' +
                    '<input type="range" class="video volume-bar" min="0" max="1" step="0.1" value="0.5" style="display:inline-block"><br>' +
                '</div>';
        
            // $('#preview-area .media-controls').show();
            attachMediaControls(document.getElementById('inserted-video'));  //hook up event listeners to the audio and video HTML
            //$('#preview-area, #clearPreview').show(); $('#video-area').hide();
            showPreview();
    
        }
        // AUDIO
        else if(filetype=="mp3") {
            if (!filepath) filepath = '../content/audio/';
              document.querySelector("div#preview-area").innerHTML = '<br><br><br><audio id="inserted-audio"> <source src="' +
                              filepath +
                              filename + '" type="audio/mpeg"></audio>' +
                                            '<div class="media-controls">' +
                                            '<div class="time title">0:00</div>' +
                                            '<button type="button" class="play-pause"></button>' +
                                            '<input type="range" class="video seek-bar" value="0" style="display:inline-block"><br>' +
                                            '<button type="button" class="mute"></button>' +
                                            '<input type="range" class="video volume-bar" min="0" max="1" step="0.1" value="0.5" style="display:inline-block"><br>' +
                                        '</div>';
            //$('#preview-area .media-controls').show();
            attachMediaControls(document.getElementById('inserted-audio'));  //hook up event listeners to the audio and video HTML
            //$('#preview-area, #clearPreview').show(); $('#video-area').hide();
            showPreview();
    
        }
        // PDF
        else if (filetype=="pdf") {
            if (!filepath) filepath = '../content/pdfs/';
            document.querySelector("div#preview-area").innerHTML =
                '<iframe src="' + filepath + filename + '"' +
                ' style="height:60vh;width:60vw;" type="application/pdf">';
            //$('#preview-area, #clearPreview').show(); $('#video-area').hide();
            showPreview();
    
        }
        // Pictures
        else if(filetype=="jpg" || filetype=="gif" || filetype=="png" || filetype=="image") {
            if (!filepath) filepath = '../content/pictures/';
            console.log(filepath + " " + filename);
            document.querySelector("div#preview-area").innerHTML = '<img src="' +
                                 filepath +
                                 filename + '"id="displayImage">';
            //$('#preview-area, #clearPreview').show(); $('#video-area').hide();
            showPreview();
    
        }
        else if (filetype == "html") {
            document.querySelector("div#preview-area").innerHTML =
              '<object type="text/html" data="' + $(item).data('mongo').fp +
                filename  + '" style="height:60vh;width:60vw;"> </object>';
            //$('#preview-area, #clearPreview').show(); $('#video-area').hide();
            showPreview();
    
        }
        else if (filetype=="EP") {
            document.querySelector("div#preview-area").innerHTML =
             '<object type="text/html" data="' + homedirectory + 'content/epaath/activities/' +
             filename  + '/index.html" style="height:60vh;width:60vw;"> </object>';
            //$('#preview-area, #clearPreview').show(); $('#video-area').hide();
            showPreview();
    
        }
        else if (filetype=="looma") {
            document.querySelector("div#preview-area").innerHTML = '<img src="images/looma-screenshots/' +
                $(item).data('mongo').dn + '.png" id="displayImage">';
            //$('#preview-area, #clearPreview').show(); $('#video-area').hide();
            showPreview();
    
        }
        else if (filetype=="slideshow") {
            //use the mongoID of the slideshow to query text_files collection and retrieve the first image for this slideshow

             $.post("looma-database-utilities.php",
                {cmd: "openByID", collection: "slideshow", id: $(item).data('mongo').mongoID.$id},
                function(result) {
                    //document.querySelector("div#preview-area").innerHTML = result.data;

                    document.querySelector("div#preview-area").innerHTML = '<img src="' +
                                 result.fp +
                                 result.fn + '"id="displayImage">';
                },
                'json'
              );
            //$('#preview-area, #clearPreview').show(); $('#video-area').hide();
            showPreview();
    
        }
        else if (filetype=="text") {
            //use the mongoID of the textfile to query text_files collection and retrieve HTML for this text file

             $.post("looma-database-utilities.php",
                {cmd: "openByID", collection: "text", id: $(item).data('mongo').mongoID.$id},
                function(result) {
                    document.querySelector("div#preview-area").innerHTML = result.data;
                    //$('#preview-area, #clearPreview').show(); $('#video-area').hide();
                    showPreview();
    
                },
                'json'
              );
        }
    }

};  // end preview_result()


function insertTimelineElement(source, open) {  // "open" == T indicates the element is being created while OPENing a saved EVI
                                                // "open" == F indicates the element is being copied from the activity SEARCH results list
        var $dest = $(source).clone(true).off(); // clone(true) to retain all DATA for the element
                                                 //NOTE: crucial to "off()" event handlers,
                                                 //or the new element will still be linked to the old

        $dest.removeClass('ui-draggable-handle').removeClass("ui-draggable").removeClass("ui-draggable-disabled");
        
        var new_id = 't' + id_counter;
        $dest.attr("id", new_id);
        id_counter += 1;

        var time;
        if(open) time = source.getAttribute("data-time");
        else     time = $('#master-video')[0].currentTime;

  /*        if(timeString.length > 6)
          {
            time = (parseInt(timeString) * (60*60)) + (parseInt(timeString.substring(timeString.length - 4)) * 60) + parseInt(timeString.substring(timeString.length - 2));
          }
          else
          {
            time = (parseInt(timeString) * 60) + parseInt(timeString.substring(timeString.length - 2));
          }
        }
*/
       // time=timeString;

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

/*        if(open)
        {
 */
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
 /*      }
        else
        {
          timeText = time;
        }
*/
        $("<div/>", {
            class : "time-popup",
        }).text(timeText).appendTo($dest);

        $dest[0].className += " timelineElement";
        
        if(index == timeline_times.length - 1)
        {
          $dest.appendTo($timeline);
        }
        else
        {
          $dest.insertBefore($('#' + timeline_id[index + 1]));
        }

        // scroll the timeline so that the new element is in the middle - animated to slow scrolling
        $timeline.animate( { scrollLeft: $dest.outerWidth(true) * ( $dest.index() - 4 ) }, 100);

        $('.timelineElement').off().hover(function() {$('.time-popup').show();}, function() {$('.time-popup').hide();})

} //end insertTimelineElement()

var removeTimelineElement = function(elem) {
  // Removing list item from timelineHolder
  //var outerDiv = this.parentNode.parentNode;
  //outerDiv.remove();    // "Remove" button is within 3 divs

        var index = timeline_id.indexOf(elem.closest('.activityDiv').id);
        timeline_id.splice(index, 1)
        timeline_times.splice(index, 1)

        $timeline.animate( { scrollLeft: $(elem).closest('.activityDiv').outerWidth(true) * ( $(elem).closest('.activityDiv').index() - 4 ) }, 100);
        $(elem).closest('.activityDiv').remove();
    
    clearPreview();
};

function minuteSecondFrame (time) {  //not used for now. just showing hh:mm:ss from media-controls.js
    var hours =   Math.floor(time / 3600);
    var minutes = Math.floor((time - hours * 3600) / 60);
    var seconds = Math.floor(time - hours * 3600 - minutes * 60);
    var frames =  Math.floor((time % 1) * 24);
    
    return "" + hours + ":" + minutes + ":" + seconds + ":" + frames;
}
/////////////////////////// ONLOAD FUNCTION ///////////////////////////
$(document).ready(function() {
    
    loginname = LOOMA.loggedIn();
    $searchResultsDiv = $('#innerResultsDiv');  //sets a global variable used by looma-search.js
    $timeline = $('#timelineDisplay');  //the DIV where the timeline is being edited
    
    $('#chapter-lang').show();

///////////////////////////////
// click handlers for '.add', '.preview' buttons
///////////////////////////////
    
    $('#innerResultsDiv'           ).on('click', '.add',        function() {  //ADD activity to TIMELINE
        insertTimelineElement($(this).closest('.activityDiv'), false);
        return false;});
    
    $('                  #timeline').on('click', '.remove',     function() {  //REMOVE activity from TIMELINE
        removeTimelineElement(this);return false;});
    
    $('#innerResultsDiv, #timeline').on('click', '.preview, .resultsimg',    function() { //PREVIEW activity
        preview_result($(this).closest('.activityDiv'));
        $('#clearPreview').css('display', 'inline')
        return false;
    });

//////////////////////////////////////
/////////FILE COMMANDS setup /////////
//////////////////////////////////////
    
    $('.template-cmd').hide();
    
    //callback functions expected by looma-filecommands.js:
    callbacks ['clear'] =           eviClear;
    callbacks ['new'] =             eviNew;
    callbacks ['save']  =           eviSave;
    //callbacks ['savetemplate']  = eviTemplateSave;
    //callbacks ['open']  = eviOpen;
    callbacks ['display'] =         eviDisplay;
    callbacks ['modified'] =        eviModified;
    //callbacks ['showsearchitems'] = eviShowSearchItemsOpen;
    callbacks ['checkpoint'] =      eviCheckpoint;
    //callbacks ['undocheckpoint'] = eviUndoCheckpoint;
    //callbacks ['quit'] not overridden - use default action from filecommands.js
    
    /*  variable assignments expected by looma-filecommands.js:  */
    currentname = "";                    //currentname       is defined in looma-filecommands.js and gets set and used there
    currentcollection = 'edited_videos'; //currentcollection is defined in looma-filecommands.js and is used there
    currentfiletype = 'evi';             //currentfiletype   is defined in looma-filecommands.js and is used there
    $('.filesearch-collectionname').text('Edited Videos');  // set file search box title
    
    $('#cancel-search').on('click',
        function() {
            // if a FILE COMMANDS SEARSCH is canceled, reset the 'display' callback
            callbacks ['display'] =         eviDisplay;
        }
    );
    
    $('#dismiss').off('click').click( function() { quit();});  //disable default DISMISS btn function and substitute QUIT()
    
    $('#adjust').draggable({containment: '#previewpanel'});
    
    $("#frameMinus1").click(function()  {$("#master-video")[0].currentTime -= 1/24;});
    $("#frameMinus5").click(function()  {$("#master-video")[0].currentTime -= 5/24;});
    $("#frameAdd1").click(function()   {$("#master-video")[0].currentTime += 1/24;});
    $("#frameAdd5").click(function()   {$("#master-video")[0].currentTime += 5/24;});
    $("#secMinus1").click(function()    {$("#master-video")[0].currentTime -= 1;});
    $("#secMinus5").click(function()    {$("#master-video")[0].currentTime -= 5;});
    $("#secAdd1").click(function()     {$("#master-video")[0].currentTime += 1;});
    $("#secAdd5").click(function()     {$("#master-video")[0].currentTime += 5;});
    
    $('#clearPreview').click(clearPreview);
    
    //now OPEN an existing edited video to be edited or open a NEW video to be edited
    $('#cmd-btn').focus();
    LOOMA.alert('Please use FILE COMMANDS to select a NEW video to edit or to OPEN an edited video to continue editing', 120, true);
    //LOOMA.makeTransparent($('#main-container'));
    //$('#media-search').show();  // unhide search panel once a base video is loaded
    
    
    //eviCheckpoint();
    
    
});  //end document.ready()

