/*
LOOMA javascript file
Filename: looma-edit-lesson.js
Description: version 1 [SCU, Spring 2016]
             version 2 [skip, Fall 2016]
             version 3 [skip, MAR 2021, NEW lesson pre-configured from template]
Programmer name: SCU
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: version 1:spring 2016, version 2: Nov 16  version 3: spring 2018
Revision: Looma 3
 */

'use strict';
var $timeline;
var savedSignature;   //savedSignature is checkpoint of timeline for checking for modification
var loginname, loginlevel, loginteam;
var homedirectory = "../";
//var $details;

var searchName = 'lesson-editor-search';
var isnewlesson;
//////////////   functions used by filecommands/////////////////

///////// lessonclear  /////////
function lessonclear() {
    setname("", "");
    $timeline.empty();
    lessoncheckpoint();
    $("#previewpanel").empty();
}

///////  lessonshowsearchitems  /////////
function lessonshowsearchitems() {
    $('#lesson-chk').show();
    $('#lesson-chk input').attr('checked', true).css('opacity', 0.5);
    $('#lesson-chk input').click(function() {return false;});
}

///////// lessoncheckpoint /////////
function lessoncheckpoint()       { savedSignature = signature($timeline);}

///////// lessonmodified /////////
function lessonmodified() {return ( signature($timeline) !== savedSignature);}

///////// signature  /////////
function signature(elem) { //param is jQ object of the timeline ($timeline)
    var sig = '';
    elem.find('.activityDiv').each(function(index, x){
        //console.log('sig is ', sig);
        //console.log('x is ', x);
        //console.log('index is ', index);
        sig += $(x).data('id');});
    return sig;
}

///////// lessonpack  /////////
function lessonpack (html) { // pack the timeline into an array of collection/id pairs for storage
    var packitem;
    var packarray = [];
    
    $(html).each(function() {
        packitem = {};  //make a new object, unlinking the references already pushed into packarray
        packitem.collection = $(this).data('collection');
        packitem.id         = $(this).data('id');
        if (packitem.collection === 'chapters') packitem.lang         = $(this).data('lang');
        packarray.push(packitem);
    });
    
    return packarray;
} //end lessonpack()

///////// lessonunpack /////////
function lessonunpack (response) {  //unpack the array of collection/id pairs into html to display on the timeline
    
    lessonclear();
    setname(response.dn, response.author);
    
    var posts = [];  //we will push all the $.post() deferreds in the foreach below into posts[]
    
    $(response.data).each(function(index) {
        // retrieve each timeline element from mongo and add it to the current timeline
        //var newDiv = null;  //reset newDiv so previous references to it are broken
       
       //  /////// if (this.id && this.collection)
            posts.push($.post("looma-database-utilities.php",
                {cmd: "openByID", collection: this.collection, id: this.id},
            function(result) {
                var newDiv = createActivityDiv(result);
                //add data-index to timeline element for later sorting
                //    (because the elements are delivered async, they may be out of order)
                $(newDiv.firstChild).attr('data-index', index);
                //console.log('adding ID :' + result._id);
                insertTimelineElement(newDiv.firstChild);
            },
            'json'
        ));
    });
    
    //  when all the $.post are complete, then re-order the timeline to account for out-of-order elements from asynch $.post calls
    $.when.apply(null, posts).then(function(){
        orderTimeline();
        makesortable();
        preview_result($('#timeline .activityDiv')[0], true);
        if (!isnewlesson) lessoncheckpoint();
    });
    
    
} //end lessonunpack()

///////// lessondisplay  /////////
function lessondisplay (response) {
    //clearFilter();
    $timeline.html(lessonunpack(response));
    /*lessoncheckpoint();  NOT needed. called in lessonunpack*/
}

/////////  lessonsave  /////////
function lessonsave(name) {
    isnewlesson = false;
    savefile(name, 'lessons', 'lesson', lessonpack($timeline.html()), "true");
    //note, the final param to 'savefile()' [to make an activity] set this param to 'true'
    //because lessons are recorded as  activities [for use in library-search, for instance]
} //end lessonsave()

///////////////////////////////////////////////////////////////////////
/////////////////////////// SEARCH   //////////////////////////////////
//////////////////////////////////////////////////////////////////////

function clearFilter () {
    //console.log('clearFilter');
    
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
} //end clearFilter()
/////////////////////////////////////////////////

function clearResults() {
    $("#innerResultsMenu").empty();
    $("#innerResultsDiv" ).empty();
    $("#previewpanel"    ).empty();
    
} //end clearResults()

function displayResults(results) {
    var result_array = [];
    result_array['activities'] = [];  //not searching for dictionary entries
    result_array['chapters']  = [];  //not searching for textbooks
    
    for (var i=0; i < results.list.length; i++) {
        if (results.list[i]['ft'] === 'chapter')      result_array['chapters'].push(results.list[i]);
        else if (results.list[i]['ft'] !== 'section') result_array['activities'].push(results.list[i]);
    }
    
    clearResults();
    displaySearchResults(result_array);
    
    makedraggable();
    
} //end displayresults()


/////////////////////////////////////////////////////////////
/////////////////  FILL IN SEARCH RESULTS PANE //////////////
/////////////////////////////////////////////////////////////

function displaySearchResults(filterdata_object) {
    var currentResultDiv = document.createElement("div");
    currentResultDiv.id = "currentResultDiv";
    $(currentResultDiv).appendTo($("#innerResultsDiv"));


//***********************
// display Activities in Search Results pane
//***********************
    
    var actResultDiv = document.createElement("div");
    actResultDiv.id = "actResultDiv";
    $(actResultDiv).appendTo(currentResultDiv);
    
    var collectionTitle = document.createElement("h1");
    collectionTitle.id = "activityTitle";
    
    var activitiesarraylength = filterdata_object.activities.length;

    for(var i=0; i<activitiesarraylength; i++) {
        var rElement = createActivityDiv(filterdata_object.activities[i]);  //BUG: array[i-1] not defined when i==0  FIXED
        
        actResultDiv.appendChild(rElement);
        
    }
// end displaySearchResults()


//***********************
// display Chapters in Search Results pane
//***********************
    
    var chaptersarraylength = filterdata_object.chapters.length;
    if (chaptersarraylength > 0) {
        for(i=0; i<chaptersarraylength; i++) {
            rElement = createActivityDiv(filterdata_object.chapters[i]);
            
            if (rElement) actResultDiv.appendChild(rElement);
        }
    } // end Print Chapters Array

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


function filetype(ft) { return LOOMA.typename(ft);}


function thumbnail (item) {
    
    //builds a filepath/filename for the thumbnail of this "item" based on type
    var collection, filetype, filename, filepath;
    var thumbnail_prefix, path, imgsrc, idExtractArray;
    
    if ($(item).attr('thumb')) return $(item).attr('thumb');  //some activities have explicit thumbnail set
    
    collection = $(item).attr('collection');
    filetype = $(item).attr('ft');
    if ($(item).attr('fn')) filename = $(item).attr('fn');
    
    if ($(item).attr('lang') === 'np') filename = $(item).attr('nfn');
    
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


function thumbnailXXX (item) {

//NOTE: this code should be merged and rationalized with LOOMA.thumbnail() in looma-utilities.js
    
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
        if ($(item).attr('fp') && ($(item).attr('fn') || $(item).attr('nfn'))) {
            var name = $(item).attr('fn') ? $(item).attr('fn') : $(item).attr('nfn');
            thumbnail_prefix = name.substr(0, name.lastIndexOf('.'));
            imgsrc = homedirectory + "content/" + $(item).attr('fp') + thumbnail_prefix + "_thumb.jpg";
        } else {
            //NOTE: in the next statement, sometimes get error "Uncaught TypeError: Cannot read property 'concat' of undefined"
            thumbnail_prefix = idExtractArray["currentSubjectFull"].concat("-", idExtractArray["currentGradeNumber"]);
            imgsrc = homedirectory + "content/textbooks/" + idExtractArray["currentGradeFolder"] + "/" + idExtractArray["currentSubjectFull"] + "/" + thumbnail_prefix + "_thumb.jpg";
        }
    }
    
    else if (collection == "activities" || item.ft != null) {
        if (item.ft === "mp3" || item.ft === 'm4a' || item.ft === 'audio') {	 //audio
            if (filepath) path = filepath; else path = homedirectory + 'content/audio/';
            imgsrc = path + "thumbnail.png";
        }
        else if (item.ft == "mp4" || item.ft == "mp5" || item.ft == "m4v" || item.ft == "mov" || item.ft == "video") { //video
            thumbnail_prefix = filename.substr(0, filename.lastIndexOf('.'));
            if (filepath) path = filepath; else path = homedirectory + 'content/videos/';
            imgsrc = path + thumbnail_prefix + "_thumb.jpg";
        }
        else if (item.ft == "jpg"  || item.ft == "gif" || item.ft == "png" || item.ft == "image" ) { //picture
            thumbnail_prefix = filename.substr(0, filename.lastIndexOf('.'));
            if (filepath) path = filepath; else path = homedirectory + 'content/pictures/';
            imgsrc = path + thumbnail_prefix + "_thumb.jpg";
        }
        else if (item.ft == "pdf") { //pdf
            thumbnail_prefix = filename.substr(0, filename.lastIndexOf('.'));
            if (filepath) path = filepath; else path = homedirectory + 'content/pdfs/';
            imgsrc = path + thumbnail_prefix + "_thumb.jpg";
        }
        else if (item.ft == "html") { //html
            thumbnail_prefix = filename.substr(0, filename.lastIndexOf('.'));
            if (filepath) path = filepath; else path = homedirectory + 'content/html/';
            imgsrc = path + thumbnail_prefix + "_thumb.jpg";
        }
        
        else if (item.ft == "map") {
            imgsrc = "../2018maps/mapThumbs/" + item.fn + "_thumb.png";
        }
        
        else if (item.ft == "EP") {
            imgsrc = homedirectory + "content/epaath/activities/" + item.fn + "/thumbnail.jpg";
        }
        else if (item.ft == "text" || item.ft === 'text-template') {
            imgsrc = "images/textfile.png";
        }
        else if (item.ft == "slideshow") {
            imgsrc = "images/play-slideshow-icon.png";
        }
        else if (item.ft == "looma") {
            imgsrc = item.thumb;
        }
    }
    
    return imgsrc;
} // end thumbnail()


function extractItemId(item) {
    var ch_id = (item['ft'] == 'chapter')? item['_id'] : item['ch_id'];
    return LOOMA.parseCH_ID(ch_id);
}


function createActivityDiv (activity) {
    
    function innerActivityDiv (item) {
        
        // activityDiv looks like this:
        //      <div class="activityDiv" data-collection=collection>
        //                               data-id=_id
        //                               data-dn = dn
        //                               data-type = ft
        //                               data-fp
        //                               data-fn and/or data-nfn
        //                               data-pn or data-npn
        //                               data-lang = 'en' or 'np'
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
        
        if ('_id' in item) $(activityDiv).attr("data-id",
            (item.ft == 'chapter') ? item['_id'] : item['_id']['$id'] || item['_id']['$oid']);
      
        if ('dn' in item) $(activityDiv).attr("data-dn",item['dn']);
    
        if ('mongoID' in item) $(activityDiv).attr("data-mongoID",
            (item.ft == 'chapter') ? '' : item['mongoID']['$id'] || item['mongoID']['$oid']);
        
        var itemtype = item['ft'] === 'text-template' ? 'text-template' : item['ft'];
        $(activityDiv).attr("data-type", itemtype);
        $(activityDiv).attr("data-fp", item['fp']);
        
        if(itemtype === "EP") $(activityDiv).attr("data-epversion",item['version']);
        
        var lang =  $("input:radio[name='chapter-language']:checked").val();
        $(activityDiv).attr("data-lang", lang);
        $(activityDiv).attr("data-fn", item['fn']);
        $(activityDiv).attr("data-pn", item['pn']);
        $(activityDiv).attr("data-nfn", item['nfn']);
        $(activityDiv).attr("data-npn", item['npn']);
        //if (lang==='np') {
        //      $(activityDiv).attr("data-fn", item['nfn'] ? item['nfn'] : null);
        //    $(activityDiv).attr("data-pn", item['npn'] ? item['npn'] : 1);
        // } else {
        //   $(activityDiv).attr("data-fn", item['fn'] ? item['fn'] : item['nfn']);
        // $(activityDiv).attr("data-pn", item['pn'] ? item['pn'] : item['npn']);
        //}
        item.collection = (item.ft == 'chapter')?'chapters':'activities';
        $.data(activityDiv, 'mongo', item);  //save the whole mongo document ("item") in the DOM element
        
        // Thumbnail
        var thumbnaildiv = document.createElement("div");
        thumbnaildiv.className = "thumbnaildiv";
        $(thumbnaildiv).appendTo(activityDiv);
        
        $("<img/>", {
            class : "resultsimg",
            loading: "lazy",
            src : thumbnail(item, collection)
        }).appendTo(thumbnaildiv);
        
        // Result Text
        var textdiv = document.createElement("div");
        textdiv.className = "textdiv";
        $(textdiv).appendTo(activityDiv);
        
        // Display Name
        if      ('dn' in  item) var dn = item.dn;
        else if ('ndn' in item)     dn = item.ndn;
        else dn = "";
        
        $("<p/>", {
            class : "result_dn",
            html : "<b>" + dn.substring(0, 30) + "</b>"
        }).appendTo(textdiv);
        
        // File Type
        $("<span/>", {
            class : "result_ft",
            html : filetype(itemtype) + "  "
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
    
        // "Copy" button
        var copyButton = document.createElement("button");
        copyButton.innerText = "Copy";
        copyButton.className = "copy";
        buttondiv.appendChild(copyButton);
        
        // "Delete" button
        var removeButton = $("<button/>", {class: "remove", html:"Remove"});
        $(buttondiv).append(removeButton);
        
        // "Preview" button
        var previewButton = document.createElement("button");
        previewButton.innerText = "View";
        previewButton.className = "preview";
        buttondiv.appendChild(previewButton);
    
        return activityDiv;
    } //end innerActivityDiv()
    
    
    var idExtractArray = extractItemId(activity);
    
    if (activity.ft !== 'section') {
        var div = document.createElement("div");
        div.className = "resultitem";
        
        var newDiv = innerActivityDiv(activity);
        $(newDiv).appendTo(div);
        
        return div;
    } else return null;
}  // end createActivityDiv()

///////////////////////////////////////////
///////////  scroll to item  //////////////
///////////////////////////////////////////
function scroll_to_item($item) {
    $('#timeline').animate( { scrollLeft: $item.outerWidth(true) * ( $item.index() - 3 ) }, 100);
}  //  end scroll_to_item()

///////////////////////////////////////////
/////////PREVIEW NEXT /////////////////////
///////////////////////////////////////////
function preview_next() {
    var current_item = $('.playing')[0];
    var $next_item = $(current_item).parents('.activityDiv').next();
    if ($next_item.length !== 0) {
        preview_result($next_item,true);
        scroll_to_item($next_item)
    }
};

///////////////////////////////////////////
/////////PREVIEW PREV /////////////////////
///////////////////////////////////////////
function preview_prev() {
    var current_item = $('.playing')[0];
    var $prev_item = $(current_item).parents('.activityDiv').prev();
    if ($prev_item.length !== 0) {
        preview_result($prev_item, true);
        scroll_to_item($prev_item);
    }
};

///////////////////////////////////////////////////////////////
/////////////////////////// PREVIEW ///////////////////////////
///////////////////////////////////////////////////////////////

// When you click the preview button
function preview_result (item, editable) {
    
    $('.resultsimg').removeClass('playing');
    $(item).find('.resultsimg').addClass('playing');
    
    $('#previewpanel').empty().append($("<p/>", {html : "Loading preview..."}));
    $('#edit-text-file').hide();
    
    var collection = $(item).attr('data-collection');
    var filetype = $(item).data('type');
    //    var filename = $(item).data('mongo').fn;
    var filename = $(item).data('fn');
    var $mongo = $(item).data('mongo');
    // if ('fp' in $mongo) var filepath = $mongo.fp;
    var filepath = $(item).data('fp');
    //console.log ("collection is " + collection + " filename is " + filename + " and filetype is " + filetype);
    
    //var idExtractArray = extractItemId($(item).data('mongo'));
    var previewSrc;
    if (collection == "chapters") {
        if ($(item).data('lang') === 'en')
            previewSrc = homedirectory + 'content/' +
                $(item).data('fp') + $(item).data('fn') +
                '#page=' + $(item).data('pn') + '\"  style=\"height:60vh;width:60vw;\" type=\"application/pdf\"';
        else previewSrc = homedirectory + 'content/' +
            $(item).data('fp') + $(item).data('nfn') +
            '#page=' + $(item).data('npn') + '\"  style=\"height:60vh;width:60vw;\" type=\"application/pdf\"';
        
        document.querySelector("div#previewpanel").innerHTML = '<embed src="' + previewSrc + '">';
    }
    
    else if (collection == "activities") {
        
        if(  filetype == "video" ||
            filetype == "mov" ||
            filetype == "m4v" ||
            filetype == "mp4" ||
            filetype == "mp5") {
            if (!filepath) filepath = '../content/videos/';
            document.querySelector("#previewpanel").innerHTML =
                
                //		'<video controls> <source src="' + homedirectory +
                //		         'content/videos/' + filename + '" type="video/mp4"> </video>';
                
                
                // '<div id="video-player">' +
                '<div id="video-area">' +
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
        else if (filetype=="mp3" || filetype=="m4a" || filetype=="audio") {
            
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
        else if (filetype=="jpg" || filetype=="gif" || filetype=="png" || filetype=="image" || filetype=="jpeg") {
            if (!filepath) filepath = '../content/pictures/';
            document.querySelector("div#previewpanel").innerHTML = '<img src="' +
                filepath +
                filename + '"id="displayImage">';
        }
        else if (filetype == "html" || filetype == "HTML") {
            document.querySelector("div#previewpanel").innerHTML =
                '<object type="text/html" data="' + $(item).data('mongo').fp +
                filename  + '" style="height:60vh;width:60vw;"> </object>';
        }
        else if (filetype=="EP") {
            document.querySelector("div#previewpanel").innerHTML = '<img src="' +
                $(item).find('img').prop('src') +   '" id=displayImage style="height:100%">';
            
            //'<object type="text/html" data="' + homedirectory + 'content/epaath/activities/' +
            //  filename  + '/index.html" style="height:60vh;width:60vw;"> </object>';
        }
        else if (filetype=="looma")
            document.querySelector("div#previewpanel").innerHTML = '<img src="images/looma-screenshots/' +
                $(item).data('mongo').dn + '.png" id="displayImage">';
        
        else if (filetype=="map")
            document.querySelector("div#previewpanel").innerHTML = '<img src="../maps/' + $(item).find('.resultsimg').attr('src') + '" id="displayImage">';
        
        else if (filetype=="game")
            document.querySelector("div#previewpanel").innerHTML = '<img src="images/games.png" id="displayImage">';
        
        else if (filetype=="history")
            document.querySelector("div#previewpanel").innerHTML = '<img src="../content/timelines/' + $(item).find('.result_dn').text() + '_thumb.jpg" id="displayImage">';
        
        else if (filetype=="slideshow") {
            //use the mongoID of the slideshow to query text_files collection and retrieve the first image for this slideshow
            var id = $(item).data('mongo').mongoID.$id || $(item).data('mongo').mongoID.$oid;
            $.post("looma-database-utilities.php",
                {cmd: "openByID", collection: "slideshow", id: id},
                function(result) {
                    //document.querySelector("div#previewpanel").innerHTML = result.data;
                    
                    document.querySelector("div#previewpanel").innerHTML = '<img src="' +
                        result.thumb + '"id="displayImage">';
                },
                'json'
            );
        }
        else if (filetype=="text"|| filetype == "text-template") {
            //use the mongoID of the textfile to query text_files collection and retrieve HTML for this text file
           
           // id = $(item).data('mongo').mongoID.$id || $(item).data('mongo').mongoID.$oid;
            id = $(item).attr('data-mongoid');
            
            $.post("looma-database-utilities.php",
                {cmd: "openByID", collection: "text", id: id},
                function(result) {
                    $('#previewpanel').empty().append($('<div class="textpreview text-display" data-id="' + id + '"></div>').html(result.data));

                    // change DN in timeline to result.dn in case it has been RENAMEd
                    $(item).find('.textdiv .result_dn').text(result.dn);

                  if (editable) $('#edit-text-file').show();
                },
                'json'
            );
        }
        else {
            document.querySelector("div#previewpanel").innerHTML = '<div class="text-display"> File not found</div>';
        }
    }
    scroll_to_item($(item));
    
}  // end preview_result()


function insertTimelineElement(source, target) {
                                             // insert a new timeline element, after 'target' element
    var $dest = $(source).clone(true).off(); // clone(true) to retain all DATA for the element
                                             //NOTE: crucial to "off()" event handlers,
                                             //or the new element will still be linked to the old
    
    if ($dest.data('type') === 'text-template') cloneTextfile($dest, target,false);
    else
        {
        $dest.removeClass('ui-draggable-handle').removeClass("ui-draggable").removeClass("ui-draggable-disabled");
    
        //$dest.addClass("ui-sortable-handle");  //  ?? this next stmt needed??
    
        if (target) $dest.insertAfter(target);   // insert after target
        else $dest.appendTo("#timelineDisplay");  // or insert at end
    
        // scroll the timeline so that the new element is in the middle - animated to slow scrolling
        scroll_to_item($dest);
        //$('#timeline').animate({scrollLeft: $dest.outerWidth(true) * ($dest.index() - 4)}, 100);
    
       makesortable();  //TIMELINE elements can be drag'n'dropped
    }
} //  end insertTimelineElement()

function copyTimelineElement(source) {

       if (source.data('type') !== 'text') insertTimelineElement(source,source)
       else                                cloneTextfile(source, source,false);
    
}; // end copyTimelineElement()

function cloneTextfile(source, target, deleteSource) {
    //$(source).find('.resultsimg').removeClass('playing');
    
    var $clone = source.clone(false).off();
    
    var newname = $clone.data('dn');
    if ($clone.data('type') === 'text-template' && currentname && currentname.match(LOOMA.CH_IDregex))
        newname = currentname.match(LOOMA.CH_IDregex)[0] + " " + newname;
    
            //POST "copytext" to looma-database-utilities.php
            // THEN copy the new _id and the new mongoID into the clone
            // THEN insert clone into timeline
    
       $.post("looma-database-utilities.php",
        {   cmd: "copytext",
            collection: 'text_files',
            id: $clone.data('id'),
            dn: LOOMA.escapeHTML(newname),
            ft: 'text'
        },
        'json'
    ).then(function(result) {
           // result has "_id" of the new ACTIVITY, and "dn", and "mongoID"
    
           result = JSON.parse(result);
           $clone.attr('data-id', result['id']);
           $clone.attr('data-mongoid', result['mongoID']);
           $clone.attr('data-dn', result['dn']);
           $clone.attr('data-type', 'text');
    
           $clone.removeClass('ui-draggable-handle')
               .removeClass("ui-draggable")
               .removeClass("ui-draggable-disabled")
               .removeClass("ui-draggable-dragging");
    
           $clone.removeClass("ui-sortable-helper");
           //$clone.addClass("ui-sortable-handle");  //  ?? this next stmt needed??
    
           if ($clone.find('.result_ft').text().trim() === 'text-template') $clone.find('.result_ft').text('text');
    
    
           //NOTE: this seems to be the critical section that causes the clone to appear at the end instead of in place
           // seems to be timing dependent? as if there is an async process that might not have completed
           // if (target) target.removeAttr("style");
       if (target) target.css('position', 'unset');
           //$clone.removeAttr("style");
       $clone.css('position', 'unset');
           //END NOTE
    
           //  if (target) $clone.insertAfter(target);   // insert after target
    
  
            if (target) target.after($clone);   // insert after target
            else $clone.appendTo("#timelineDisplay");  // or insert at end
            
            makesortable();
            
           // if ( deleteSource ) source.remove();
        
        scroll_to_item($clone);
        preview_result($clone, true);
    });
    
}  // end cloneTextfile()


function convertTextfile(source) {
    
    var newname = source.data('dn');
    if (currentname.match(LOOMA.CH_IDregex)) newname = currentname.match(LOOMA.CH_IDregex)[0] + " " + newname;
    
    //POST "copytext" to looma-database-utilities.php
    // THEN copy the new _id and the new mongoID into the clone
    // THEN insert clone into timeline
    
    $.post("looma-database-utilities.php",
        {   cmd: "copytext",
            collection: 'text_files',
            id: source.data('id'),
            dn: LOOMA.escapeHTML(newname),
            ft: 'text'
        },
        'json'
    ).then(function(result) {
        // result has "_id" of the new ACTIVITY, and "dn", and "mongoID"
        
        result = JSON.parse(result);
        source.attr('data-id', result['id']);
        source.attr('data-mongoid', result['mongoID']);
        source.attr('data-dn', result['dn']);
        source.attr('data-type', 'text');
        
        source.removeClass('ui-draggable-handle')
            .removeClass("ui-draggable")
            .removeClass("ui-draggable-disabled")
            .removeClass("ui-draggable-dragging");
        
        if (source.find('.result_ft').text().trim() === 'text-template') source.find('.result_ft').text('text');
        
        
        //NOTE: this seems to be the critical section that causes the clone to appear at the end instead of in place
        // seems to be timing dependent? as if there is an async process that might not have completed
        // if (target) target.removeAttr("style");
       // if (target) target.css('position', 'unset');
        source.removeAttr("style");
        //$clone.css('position', 'unset');
        //END NOTE
      
        makesortable();
        
        scroll_to_item(source);
        preview_result(source, true);
    });
    
}  // end convertTextfile()


function removeTimelineElement (elem) {
    // Removing list item from timelineHolder
    //var outerDiv = this.parentNode.parentNode;
    //outerDiv.remove();    // "Remove" button is within 3 divs
    
    $('#timeline').animate( { scrollLeft: $(elem).closest('.activityDiv').outerWidth(true) * ( $(elem).closest('.activityDiv').index() - 4 ) }, 100);
    $(elem).closest('.activityDiv').remove();
} // end removeTimelineElement()

function orderTimeline (){  // the timeline is populated with items that arrive acsynchronously by AJAX from the [mongo] server
    // a 'data-index' attribute is stored with each timeline item
    // this function [re-]orders the timeline based on those data-index values
   
    // var $timeline = $('#timelineDisplay');
    
    $timeline.find('.activityDiv').sort(function(a, b) {
        //return +a.dataset.index - +b.dataset.index;
        return $(a).data('index') - $(b).data('index');
    })
        .appendTo($timeline);
} // end orderTimeline()

// NOTE: orderNewLesson() may be redundant with orderTimeline() ????
function orderNewLesson(lessonData) {
    lessonData.sort(function(a, b) {
        return a.index - b.index;
    });
    return lessonData;
} // end orderNewLesson

/////////////////////////// SORTABLE UI ////////  requires jQuery UI  ///////////////////
function makesortable (){
    //$('timelineDisplay').sortable( "destroy" ); //remove previous sortable state

    //NOTE: next line souldnt be needed (??)
    // it removes 'position:absolute' and other style settings from a cloned text-template -> text element after drag'n'drop

    $("#timelineDisplay").sortable({
        opacity: 0.7,   // makes dragged element transparent
        revert: true,   //Animates the drop
        axis:   "x",
        containment: "#timelineDisplay",
        //helper: "clone",
        scroll: true,   //Allows page to scroll when dragging. Good for wide pages.
        handle: $(".activityDiv")  //restricts elements that can be clicked to drag to sort
    }).disableSelection();
    //    });
    
        $('#timelineDisplay .activityDiv').addClass('ui-sortable-handle');
    } // end makesortable()

function refreshsortable (){
    // the call to sortable ("refresh") below should refresh the sortability of the timeline,
    // but it's not working, so call makesortable() instead
    //$("#timelineDisplay").sortable( "refresh" );
    makesortable();
}

/////////////////////////// DRAGGABLE UI ////////  requires jQuery UI  ///////////////////
//set up Drag'n'Drop  - -  code borrowed from looma-slideshow.js [T. Woodside, summer 2016]


function makedraggable() {
        $('.resultitem  .activityDiv').draggable({
            connectToSortable: "#timelineDisplay",
            //connectWith: "#timelineDisplay .activityDiv",
           // opacity: 0.5,
            scope:'activityDivs',
            helper: "clone",
            addClasses: false,
            //cursorAt: 0,
            //containment:'#timelineDisplay'
            });
    }; //end makedraggable()

function makedroppable() {
    $('#timelineDisplay').droppable ({
        accept: '.activityDiv',
        scope:'activityDivs',
        drop: function(event, ui) {
            if ($(ui.helper).data('type') === 'text-template') convertTextfile(ui.helper);
            makesortable();
        }
    });
}; //end makedroppable()

/*
function makedraggable() {
    var $clone;
    $('.resultitem  .activityDiv').draggable({
        connectToSortable: "#timelineDisplay",
        //connectWith: "#timelineDisplay .activityDiv",
        //opacity: 0.7,
        addClasses: false,
        cursorAt: 0,
        helper: "clone",
        //containment: "#timelineDisplay",
        start: function(event, ui) {
            $clone = $(this).clone(true, true).off(); //make a 'deep' clone of this element. preserves jQuery 'data' attributes
                                                      //NOTE: crucial to "off()" event handlers, or the new element will still be linked to the old
      
      //COULD ADD AN ID
      
        },
        stop: function(event, ui) {
            
            if ($('#timelineDisplay').find(ui.helper).length > 0) {  //if the helper was dropped on the timeline...
                $(ui.helper).data($clone.data());  // insert the data() we copied into $clone back into the new timeline element
    
                $(ui.helper).removeClass('ui-draggable-handle').removeClass("ui-draggable").removeClass("ui-draggable-disabled");
                makesortable();
    
                if ($(ui.helper).data('type') === 'text-template') cloneTextfile(ui.helper,ui.helper, true);
            }
        }
    });
} //end makedraggable()
 */


function openTextEditor (e) {
    
    var textfile = $('#previewpanel .textpreview').data('id');
    
    if (textfile) {
        
        $("#previewpanel").empty();
    
        //  to open in a new tab
        //window.open('./looma-edit-text.php?id=' + textfile );
        // to open in the same tab
        $('#text-editor iframe').attr('src','./looma-text-frame.php?id=' + textfile);
        $('#text-editor').show().focus();
        
        //LOOMA.alert('right clicked text file with id: ' + textfile,0,false,function(){return;});
        return false;
    }
} // end openTextEditor()

function lessonopen() {
    LOOMA.makeOpaque($('#main-container, #filecommands'));
    $('.setup-panel').hide();
    performSearch("lessons", "lesson");
}  // end lessonopen()

function lessonnew () {
    LOOMA.makeTransparent($('#main-container, #filecommands'));
    $('#setup-panel').show();
    $('#setup-panel #grade-chng-menu').prop('selectedIndex', 0);
    $('#setup-panel #subject-chng-menu').empty();
    $('#setup-panel #chapter-chng-menu').empty();
    $('#setup-panel-select').prop("disabled",true);
}  // end lessonnew()


//////////////////////////////////////////
//////     CLONE MASTER LESSON       /////
//////////////////////////////////////////
function cloneMasterLesson($chapter) {
    
    var ch_id = $chapter.text().match(LOOMA.CH_IDregex)[0];
    
    // First, open the "Master" lesson
    $.post("looma-database-utilities.php",
        {cmd: "openByName", dn: 'Master', collection: 'lessons', ft: 'lesson'},
        function(response) {
            var newlesson = {};
            if (response['error'])
                LOOMA.alert(response['error'] + ': ' + dn, 3, true);
            else {
                console.log("Cloning 'Master' to " + $chapter.text());
                owner = true;
                currentname = $chapter.text();
                setname(currentname, loginname);
    
                newlesson['dn'] = $chapter.text();
                newlesson['ft'] = 'lesson';
                newlesson['author'] = loginname;
                newlesson['data'] = [];
                
                        /* "response" has this structure:
                            {   "dn": "Master",
                                "ft": "lesson",
                                "date": "2021.03.06",
                                "data": [{
                                    "collection": "activities",
                                    "id": "6043cd605c9304f25c314207"
                                },  ...
                                   {
                                    "collection": "activities",
                                    "id": "6043cec75c9304f25c31422b"
                                }],
                                "author": "skip"
                            } */
                
                var count = 0; var limit = response.data.length;
                
                var textclones = [];  //we will push all the $.post() deferreds in the foreach below into posts[]
           // then, for each item in the Master timeline, clone a copy for the new lesson
                response.data.forEach(function(timeline_item, index) {
                    if (timeline_item.collection === 'chapters') {
                        timeline_item.id = ch_id;
                        timeline_item.index = index;
                        newlesson.data.push(timeline_item);
                        count++;
                    } else {
           // open the Master timeline activity
                    $.post("looma-database-utilities.php",
                        {cmd: "openByID", collection: 'activities', id: timeline_item.id},
                        function (item_activity) {
    
            // if the item not a chapter, nor a text file, just copy it into the new lesson timeline
                            if (item_activity.ft !== 'text') {  //copy any non-text timeline items
                                newlesson.data.push(item_activity);
                                count++;
                            }
                            else {  //lookup the text file and clone it
                               // item_activity.dn = item_activity.dn.replace('Master', ch_id);
            // if the item is a text file, open its text_files document from Mongo

                                //   NOTE: for mongo 2.6 a mongoID has field $id  *************
                                //   NOTE: for mongo 4.0 a mongoID has field $oid  *************
                                var item_id = item_activity.mongoID.$oid || item_activity.mongoID.$id;
                                $.post("looma-database-utilities.php",
                                    {cmd: "openByID", collection: 'text_files', id: item_id},
                                    function (item_textfile) {
            //save the cloned text file
                                        textclones.push($.post("looma-database-utilities.php",
                                            {   cmd: "save",
                                                collection: 'text_files',
                                                dn: LOOMA.escapeHTML(item_textfile.dn.replace('Master', ch_id)),
                                                ft: 'text',
                                                data: item_textfile.data,
                                                activity: "true"      // NOTE: this is a STRING, either "false" or "true"
                                            },
                                            function (result) {  // record the id in the activityDiv
          // add the cloned text file to the new lesson timeline
                                            //   NOTE: for mongo 2.6 a mongoID has field $id  *************
                                            //   NOTE: for mongo 4.0 a mongoID has field $oid  *************
                                            var text_id = result.activity._id.$oid || result.activity._id.$id;
                                            newlesson.data.push(
                                                {id:text_id,
                                                 collection:'activities',
                                                index: index});
                                                count++;
                                                
                                                if (count === limit) {
                                                    newlesson.data = orderNewLesson(newlesson.data);
                                                    isnewlesson = true;
                                                    lessondisplay(newlesson);
                                                    savedSignature = null;
                                                }
                                          
                                            },
                                            'json'
                                        ));
                                    },
                                    'json'
                                );
                            }
                        },
                        'json'
                    );
                } });
            }
        },
        'json'
    );
}  // end cloneMasterLesson()

function makeNewLesson($chapter) {
    // build a new lesson using "Master" lesson as a template
    console.log ('making new lesson for: ' + $chapter.text());
    $('.setup-panel').hide();
    LOOMA.makeOpaque($('#main-container, #filecommands'));
    cloneMasterLesson($chapter);
} //end makeNewLesson()


//////////////////////////////////////////
//////     CLONE Phonics LESSON       /////
//////////////////////////////////////////
function clonePhonicsLesson(letter, master, number) {
    //NOTE: letter is a letter smallCap, like Gg, master is one of Aa or Bb, number is 1 or 2
    var mastername =  "Letter " + master + " Phonics Lesson" + number;
    
    // First, open the "Phonics Master" lesson
    $.post("looma-database-utilities.php",
        {cmd: "openByName", dn: master, collection: 'lessons', ft: 'lesson'},
        function(response) {
            var newlesson = {};
            if (response['error'])
                LOOMA.alert(response['error'] + ': ' + dn, 3, true);
            else {
                console.log("Cloning " + master + " for " + letter);
                owner = true;
                currentname = "Letter " + letter + " Phonics Lesson " + number;
                setname(currentname, loginname);
                
                newlesson['dn'] = currentname;
                newlesson['ft'] = 'lesson';
                newlesson['author'] = 'kathy';
                newlesson['data'] = [];
                
                /* "response" has this structure:
                    {   "dn": "Master",
                        "ft": "lesson",
                        "date": "2021.03.06",
                        "data": [{
                            "collection": "activities",
                            "id": "6043cd605c9304f25c314207"
                        },  ...
                           {
                            "collection": "activities",
                            "id": "6043cec75c9304f25c31422b"
                        }],
                        "author": "skip"
                    } */
                
                var count = 0; var limit = response.data.length;
                
                var textclones = [];  //we will push all the $.post() deferreds in the foreach below into textclones[]
                // then, for each item in the Master timeline, clone a copy for the new lesson
                response.data.forEach(function(timeline_item, index) {
                    if (timeline_item.collection === 'chapters') {
                        timeline_item.id = ch_id;
                        timeline_item.index = index;
                        newlesson.data.push(timeline_item);
                        count++;
                    } else {
                        // open the Master timeline activity
                        $.post("looma-database-utilities.php",
                            {cmd: "openByID", collection: 'activities', id: timeline_item.id},
                            function (item_activity) {
                                
                                // if the item not a chapter, nor a text file, just copy it into the new lesson timeline
                                if (item_activity.ft !== 'text') {  //copy any non-text timeline items
                                    newlesson.data.push(item_activity);
                                    count++;
                                }
                                else {  //lookup the text file and clone it
                                    // if the item is a text file, open its text_files document from Mongo
                                    //   NOTE: for mongo 2.6 a mongoID has field $id  *************
                                    //   NOTE: for mongo 4.0 a mongoID has field $oid  *************
                                    var item_id = item_activity.mongoID.$oid || item_activity.mongoID.$id;
                                    $.post("looma-database-utilities.php",
                                        {cmd: "openByID", collection: 'text_files', id: item_id},
                                        function (item_textfile) {
                                            //save the cloned text file
                                            textclones.push($.post("looma-database-utilities.php",
                                                {   cmd: "save",
                                                    collection: 'text_files',
                                                    dn: LOOMA.escapeHTML(item_textfile.dn.replace(master, letter)),
                                                    ft: 'text',
                                                    data: item_textfile.data,
                                                    activity: "true"      // NOTE: this is a STRING, either "false" or "true"
                                                },
                                                function (result) {  // record the id in the activityDiv
                                                    // add the cloned text file to the new lesson timeline
                                                    //   NOTE: for mongo 2.6 a mongoID has field $id  *************
                                                    //   NOTE: for mongo 4.0 a mongoID has field $oid  *************
                                                    var text_id = result.activity._id.$oid || result.activity._id.$id;
                                                    newlesson.data.push(
                                                        {id:text_id,
                                                            collection:'activities',
                                                            index: index});
                                                    count++;
                                                    
                                                    if (count === limit) {
                                                        newlesson.data = orderNewLesson(newlesson.data);
                                                        isnewlesson = true;
                                                        lessondisplay(newlesson);
                                                        savedSignature = null;
                                                    }
                                                    
                                                },
                                                'json'
                                            ));
                                        },
                                        'json'
                                    );
                                }
                            },
                            'json'
                        );
                    } });
            }
        },
        'json'
    );
}  // end clonePhonicsLesson()

function makePhonicsLesson(letter, number) {
    var master;
    // build a new lesson using Aa or Bb phonics lesson as a template
    console.log ('making new phonics lesson ' + number + ' for: ' + letter);
    $('.setup-panel').hide();
    LOOMA.makeOpaque($('#main-container, #filecommands'));
    var capSmall = letter.toUpperCase() + letter;
    if (['a','e','i','o','u'].includes(letter))
        master = "Aa";
    else master = "Bb";
    //NOTE: first param is a smallCap, like Gg, master is one of Aa or Bb, number is 1 or 2
    clonePhonicsLesson(capSmall, master, number);
} //end makePhonicsLesson()

function showOptions (item) {
    item.append($('<div class="options">' + currentname + '</div>'));
}

function hideOptions() {
    $('.options').remove('.options');
}

///////////////////////////////////////////////////////////////////////
/////////////////////////// ONLOAD FUNCTION ///////////////////////////

window.onload = function () {
    
    
    $searchResultsDiv = $('#innerResultsDiv');  //sets a global variable used by looma-search.js
    $timeline = $('#timelineDisplay');  //the DIV where the timeline is being edited
    
    loginname = LOOMA.loggedIn();
    var loginlevel = LOOMA.readStore('login-level','cookie')
    var loginteam  = LOOMA.readStore('login-team','cookie')
  //  if (loginname && loginlevel === 'admin' )   $('.admin').show();
  //  if (loginname && loginlevel === 'exec' )  { $('.admin').show(); $('.exec').show(); }
    
    $('#setup-panel .cancel').click(function(){
        $('.setup-panel').hide();
        LOOMA.makeOpaque($('#main-container, #filecommands'));
    });
    
//////////////////////////////////////////
    // text books
    
    $('.lang').change(function() {
        $('#setup-panel-select').prop("disabled",true);
    });
    
    $("#grade-chng-menu").change(function() {
        $('#warning').text("");
        showTextSubjectDropdown($('#grade-chng-menu'),
            $('#subject-chng-menu'),
            $('#chapter-chng-menu'),
            $("input:radio[name='lang']:checked").val());
        $('#setup-panel-select').prop("disabled",true);
    });  //end drop-menu.change()
    
    $("#subject-chng-menu").change(function() {
        $('#warning').text("");
        showTextChapterDropdown($('#grade-chng-menu'),
            $('#subject-chng-menu'),
            $('#chapter-chng-menu'),
            $("input:radio[name='lang']:checked").val());
        $('#setup-panel-select').prop("disabled",true);
    });  //end drop-menu.change()
    
    $('#chapter-chng-menu').change(function() {
        $('#warning').text("");
        if (!$('#chapter-chng-menu').val() ||$('#chapter-chng-menu :selected').text() === '(any)...')
               $('#setup-panel-select').prop("disabled",true);
        else  if ($('#chapter-chng-menu :selected').hasClass('hasLesson')) {// this chapter has an existing lesson
            $('#warning').text('This chapter already has a lesson');
            $('#setup-panel-select')
                .prop("disabled",false)
                .text('Open existing lesson')
                .off('click')
                .click(function() {
                    $('.setup-panel').hide();
                    LOOMA.makeOpaque($('#main-container, #filecommands'));
                    openfile($('#chapter-chng-menu :selected').data('mongo'), 'lessons', 'lesson');
                });
        }
        else $('#setup-panel-select')  // this chapter does not have an existing lesson
                .prop("disabled",false)
                .text('Create new lesson')
                .off('click')
                .click(function() {makeNewLesson($('#chapter-chng-menu :selected'));});
    });
    
    $('#setup-panel-select').click(function() {makeNewLesson($('#chapter-chng-menu :selected'));});
    
    $("input[type=radio][name='lang']").change(function() {
        $('#warning').text("");
        $('#grade-chng-menu').prop('selectedIndex', 0); // reset grade select field
        $('#subject-chng-menu').empty(); $('#chapter-chng-menu').empty();
    });
    
    //show the "New Text File" button in filecommands.js to allow text-frame editor to be called in an iFrame
    $('#show_text').show();
  
    $('#clear_button').click(clearFilter);
    
    $('#search').change(function() {
        $("#innerResultsMenu").empty();
        $("#innerResultsDiv").empty();
        $("#previewpanel").empty();
    });
    
    pagesz=100;
    
    $('.chapterFilter').prop('disabled', true);
    $('.mediaFilter').prop('disabled',   false);
    
    $('#lesson-checkbox').prop('disabled' , true).hide();
    $('#includeLesson').val(false);
    
///////////////////////////////
// click handlers for '.add', '.preview' buttons
///////////////////////////////
    
    //$(elementlist).on(event, selector, handler).
    // ADD
    $('#innerResultsDiv'           ).on('click', '.add',        function() {
        insertTimelineElement($(this).closest('.activityDiv'));return false;});
    
    //  VIEW
    $('#innerResultsDiv').on('click', '.preview',    function() {
        preview_result($(this).closest('.activityDiv'), false);return false;});
    $('#innerResultsDiv').on('click', '.resultsimg', function() {
        preview_result($(this).closest('.activityDiv'), false);return false;});
    
    $('#timeline').on('click', '.preview',    function() {
        preview_result($(this).closest('.activityDiv'), true);return false;});
    $('#timeline').on('click', '.resultsimg', function() {
        preview_result($(this).closest('.activityDiv'), true);return false;});
   
    //  REMOVE
    $('                  #timeline').on('click', '.remove',     function() {
        removeTimelineElement(this);return false;});
    
    //  COPY
    $('                  #timeline').on('click', '.copy',     function() {
            var $thiselement = $(this).closest('.activityDiv');  // get activityDiv parent of the button
            copyTimelineElement($thiselement);
            return false;
        });
    
//////////////////////////////////////
/////////FILE COMMANDS setup /////////
//////////////////////////////////////
    
    /*  callback functions expected by looma-filecommands.js:  */
    callbacks ['clear'] =           lessonclear;
    callbacks ['save']  =           lessonsave;
    //callbacks ['savetemplate']  =   lessontemplatesave;
    callbacks ['open']  =           lessonopen;
    callbacks ['new']  =            lessonnew;
    callbacks ['display'] =         lessondisplay;
    callbacks ['modified'] =        lessonmodified;
    callbacks ['showsearchitems'] = lessonshowsearchitems;
    callbacks ['checkpoint'] =      lessoncheckpoint;
    //callbacks ['undocheckpoint'] =  lessonundocheckpoint;
    //callbacks ['quit'] not overridden - use default action from filecommands.js
    
    /*  variable assignments expected by looma-filecommands.js:  */
    currentname = "";                    //currentcollection is defined in looma-filecommands.js and is used there
    currentcollection = 'lessons';       //currentcollection is defined in looma-filecommands.js and is used there
    currentfiletype =   'lesson';        //currentfiletype   is defined in looma-filecommands.js and is used there
    
    // set file search box title
    $('.filesearch-collectionname').text('Lesson Plans');
    // set collection in filesearch form
    $('#filesearch  #collection').val('lesson');  // should be 'lessons'  ???
    
   // lessonclear();
   
   makedroppable(); // sets the timeline to accept activityDiv drops
   makesortable();  // makes the timeline sortable
    
    //  $('#chapter-lang').show();

    $('#timelineLeft').on('click',  function(){ preview_prev();});
    $('#timelineRight').on('click', function(){ preview_next();});
    
    $('#timeline').on('mouseover', '.activityDiv',  function () { //handlerIn
        var $btn = $(this).closest('button');
        $('#subtitle').text($(this).attr('data-dn') + ' (' + LOOMA.typename(
            $(this).attr('data-type')) + ')');
    });
    
   $('#timeline').on('mouseout', '.activityDiv',  function () { //handlerOut
       $('#subtitle').text('');
   });
    
    $('#dismiss').off('click').click( function() { quit();});  //disable default DISMISS btn function and substitute QUIT()
   
    $('#edit-text-file').click(openTextEditor);
    
    // show setup panel, get user input
    lessoncheckpoint();
   // lessonnew(); //NOTE: removed annoying NEW startup panel. use "new" filecommand to get the panel
    LOOMA.alert('Use File Commands menu  "Open" or "New" buttons to edit a lesson', 5);
};  //end window.onload()


