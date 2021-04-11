/*
LOOMA javascript file
Filename: looma-edit-lesson.js
Description: version 1 [SCU, Spring 2016]
             version 2 [skip, Fall 2016]
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

//////////////   functions used by filecommands/////////////////

///////// lessonclear  /////////
function lessonclear() {
    
    setname("");
    $timeline.empty();
    //clearFilter();
    lessoncheckpoint();
    
}

///////  lessonshowsearchitems  /////////
function lessonshowsearchitems() {
    $('#lesson-chk').show();
    // for TEXT EDIT, only show "text", clicked and disabled
    
    $('#lesson-chk input').attr('checked', true).css('opacity', 0.5);
    
    //$('#txt-chk input').prop('readonly'); //cant make 'readonly' work
    $('#lesson-chk input').click(function() {return false;});
    
}


///////// lessoncheckpoint /////////
function lessoncheckpoint()       {savedSignature = signature($timeline);}
//function lessonundocheckpoint() {}; //cant undo changes with signatures

///////// lessonmodified /////////
function lessonmodified() {return (
    signature($timeline) !== savedSignature);}

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
    
    //var newDiv = null;  //reset newDiv so previous references to it are broken
    
    //for each element in data, call createActivityDiv, and attach the resturn value to #timelinediv
    // also set filename, [and collection??]
    
    //$('#timelineDisplay').empty();
    lessonclear();
    
    setname(response.dn);
    
    // need to record ID of newly opened LP so that later SAVEs can overwrite it
    
    var posts = [];  //we will push all the $.post() deferreds in the foreach below into posts[]
    
    $(response.data).each(function(index) {
        // retrieve each timeline element from mongo and add it to the current timeline
        //var newDiv = null;  //reset newDiv so previous references to it are broken
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
        lessoncheckpoint();
        preview_result($('.activityDiv')[0]);
    });
    
    makesortable();
    
} //end lessonunpack()

///////// lessondisplay  /////////
function lessondisplay (response) {
    //clearFilter();
    $timeline.html(lessonunpack(response)); /*lessoncheckpoint();  NOT needed. called in lessonunpack*/}

/////////  lessonsave  /////////
function lessonsave(name) {
    savefile(name, 'lessons', 'lesson', lessonpack($timeline.html()), "true");
    //note, the final param to 'savefile()' [to make an activity] set to 'true'
    //because lessons are recorded as  activities [for use in library-search, for instance]
} //end lessonsave()

///////// lessontemplatesave /////////
function lessontemplatesave(name) {
    savefile(name, 'lessons', 'lesson-template', lessonpack($timeline.html()), "false");
    //note, the final param to 'savefile()' [to make an activity] set to 'false'
    //because lessons templates are not recorded as  activities
} //end lessontemplatesave()

// end FILE COMMANDS stuff

function changeCollection (){   //NOTE: no longer used? looma-search.js setCollection() does all this
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
    } else {                                     //changing from CHAPTERS to ACTIVITIES
        $('#collection').val('activities');

        $('#div_chapter').hide();

        $('.chapterFilter').prop('disabled', true);
        $('.mediaFilter').prop('disabled',   false);
    }
}// end changeCollection

///////////////////////////////////////////////////////////////////////
/////////////////////////// SEARCH  RESULTS  ///////////////////////////
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

     for (var i=0; i < results.list.length; i++) {
         if (results.list[i]['ft'] === 'chapter')      result_array['chapters'].push(results.list[i]);
         else if (results.list[i]['ft'] !== 'section') result_array['activities'].push(results.list[i]);
      }
 
    $("#innerResultsMenu").empty();
    $("#innerResultsDiv" ).empty();
    $("#previewpanel"    ).empty();
    
      displaySearchResults(result_array);

      makedraggable();  //not working for now

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
   
/* 	if (activitiesarraylength == 0) {
            collectionTitle.innerHTML = "<a class='heading' name='activities'>Activities (0 Results)</a>";        }
    	else if (activitiesarraylength == 1) {
    		collectionTitle.innerHTML = "<a class='heading' name='activities'>Activities (1 Result)</a>";
    	}
    	else {
    		collectionTitle.innerHTML = "<a class='heading' name='activities'>Activities (" + activitiesarraylength + " Results)</a>";
    	}
	actResultDiv.appendChild(collectionTitle);
*/
	for(var i=0; i<activitiesarraylength; i++) {
		var rElement = createActivityDiv(filterdata_object.activities[i]);  //BUG: array[i-1] not defined when i==0  FIXED

            actResultDiv.appendChild(rElement);

	}
// end Print Activities Array


//***********************
// display Chapters in Search Results pane
//***********************

	    var chaptersarraylength = filterdata_object.chapters.length;
      if (chaptersarraylength > 0) {
      /*
         collectionTitle = document.createElement("h1");
           collectionTitle.id = "chapterTitle";

          if (chaptersarraylength == 1) {
               collectionTitle.innerHTML = "<a class='heading' name='activities'>Chapters (1 Result)</a>";
           }
           else {
               collectionTitle.innerHTML = "<a class='heading' name='activities'>Chapters (" + chaptersarraylength + " Results)</a>";
           };
           actResultDiv.appendChild(collectionTitle);
   */

            for(i=0; i<chaptersarraylength; i++) {
                rElement = createActivityDiv(filterdata_object.chapters[i]);

                if (rElement) actResultDiv.appendChild(rElement);
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
	- 	All the "thumbnail_prefix" variables: If the image source is null,
		it shouldn't try to get the substring, because it'll break the code
	- 	If the file isn't there. We need to make a little 404 image and
		code it in.

//////////////////////////END TO-DO */
//*************************************************************************************start of things we need for presentation **********************************************

function filetype(ft) { return LOOMA.typename(ft);}

function thumbnail (item) {

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
		else if (item.ft == "text") {
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
        
        /*var elements = {
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



function createActivityDiv (activity) {
    
    
    function innerActivityDiv (item) {

            // activityDiv looks like this:
            //      <div class="activityDiv" data-collection=collection>
            //                               data-id=_id
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
                
                if ('_id' in item)$(activityDiv).attr("data-id",
                    (item.ft == 'chapter') ? item['_id'] : item['_id']['$id'] || item['_id']['$oid']);
  
                if ('mongoID' in item) $(activityDiv).attr("data-mongoID",
                    (item.ft == 'chapter') ? '' : item['mongoID']['$id'] || item['mongoID']['$oid']);
    
        $(activityDiv).attr("data-type", item['ft']);
        $(activityDiv).attr("data-fp", item['fp']);
        
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
                    src : thumbnail(item, collection)
                }).appendTo(thumbnaildiv);

                // Result Text
                var textdiv = document.createElement("div");
                textdiv.className = "textdiv";
                $(textdiv).appendTo(activityDiv);

                // Display Name
                if      ('dn' in  item) var dn = item.dn.substring(0, 30);
                else if ('ndn' in item)     dn = item.ndn.substring(0,30);
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
                addButton.innerText = "Add";
                addButton.className = "add";

               buttondiv.appendChild(addButton);

                // "Delete" button
                var removeButton = $("<button/>", {class: "remove", html:"Remove"});
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
/////////PREVIEW NEXT /////////////////////
///////////////////////////////////////////
function preview_next() {
        var current_item = $('.playing')[0];
        var $next_item = $(current_item).parents('.activityDiv').next();
        if ($next_item.length !== 0) preview_result($next_item);
};

///////////////////////////////////////////
/////////PREVIEW PREV /////////////////////
///////////////////////////////////////////
function preview_prev() {
    var current_item = $('.playing')[0];
    var $prev_item = $(current_item).parents('.activityDiv').prev();
    if ($prev_item.length !== 0) preview_result($prev_item);
};

///////////////////////////////////////////////////////////////
/////////////////////////// PREVIEW ///////////////////////////
///////////////////////////////////////////////////////////////

// When you click the preview button
function preview_result (item) {
    
    $('.resultsimg').removeClass('playing');
    $(item).find('.resultsimg').addClass('playing');
    
    $('#previewpanel').empty().append($("<p/>", {html : "Loading preview..."}));

    var collection = $(item).attr('data-collection');
    var filetype = $(item).data('type');
         //    var filename = $(item).data('mongo').fn;
    var filename = $(item).data('fn');
    var $mongo = $(item).data('mongo');
        // if ('fp' in $mongo) var filepath = $mongo.fp;
    var filepath = $(item).data('fp');
        //console.log ("collection is " + collection + " filename is " + filename + " and filetype is " + filetype);

	var idExtractArray = extractItemId($(item).data('mongo'));
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
        /*
                    $.post("looma-database-utilities.php",
                        {cmd: "openByID", collection: "chapters", id: $(item).data('id')},
                        function(result) {
                            var pagenum  = result.pn ? result.pn : result.npn;
                            var filename = result.fn;
                            var filepath = result.fp;
    
                            var previewSrc = homedirectory + 'content/' + filepath + filename + '#page=' + pagenum + '\"  style=\"height:60vh;width:60vw;\" type=\"application/pdf\"';
                            document.querySelector("div#previewpanel").innerHTML = '<embed src="' + previewSrc + '>';
                        },
                        'json'
                    );
	    */
 
	/*	document.querySelector("div#previewpanel").innerHTML = '<embed src="' +
		                        //encodeURI(
		                           homedirectory + 'content/textbooks/' +
		                           idExtractArray["currentGradeFolder"] + '/' +
		                           idExtractArray["currentSubjectFull"] + '/' +
		                           idExtractArray["currentSubjectFull"] + '-' +
		                           idExtractArray["currentGradeNumber"] +
		                            '.pdf#page=' + pagenum + '\"  style=\"height:60vh;width:60vw;\" type=\"application/pdf\"' + '>';
	*/
	
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
		else if (filetype=="jpg" || filetype=="gif" || filetype=="png" || filetype=="image") {
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
		else if (filetype=="text") {
		    //use the mongoID of the textfile to query text_files collection and retrieve HTML for this text file
            id = $(item).data('mongo').mongoID.$id || $(item).data('mongo').mongoID.$oid;

	         $.post("looma-database-utilities.php",
                {cmd: "openByID", collection: "text", id: id},
                function(result) {
                    $('#previewpanel').empty().append($('<div class="textpreview text-display" data-id="' + id + '"></div>').html(result.data));
                    //document.querySelector("div#previewpanel").innerHTML = result.data;
                },
                'json'
              );
        }
		else {
            document.querySelector("div#previewpanel").innerHTML = '<div class="text-display"> File not found</div>';
        }
	}

}  // end preview_result()


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

}


function orderTimeline (){  // the timeline is populated with items that arrive acsynchronously by AJAX from the [mongo] server
                                  // a 'data-index' attribute is stored with each timeline item
                                  // this function [re-]orders the timeline based on those data-index values
    var $timeline = $('#timelineDisplay');

    $timeline.find('.activityDiv').sort(function(a, b) {
        //return +a.dataset.index - +b.dataset.index;
        return $(a).data('index') - $(b).data('index');
    })
    .appendTo($timeline);
} // end orderTimeline()

/////////////////////////// SORTABLE UI ////////  requires jQuery UI  ///////////////////
function makesortable (){
    //$('timelineDisplay').sortable( "destroy" ); //remove previous sortable state
    $("#timelineDisplay").sortable({
        opacity: 0.7,   // makes dragged element transparent
        revert: true,   //Animates the drop
        axis:   "x",
        //containment: "#timeline",
        //helper: "clone",
        scroll: true,   //Allows page to scroll when dragging. Good for wide pages.
        handle: $(".activityDiv")  //restricts elements that can be clicked to drag to .timelinediv's
    }).disableSelection();
}

function refreshsortable (){
    // the call to sortable ("refresh") below should refresh the sortability of the timeline, but it's not working, so call makesortable() instead
    //$("#timelineDisplay").sortable( "refresh" );

    makesortable();

    }

/////////////////////////// DROPPABLE UI ////////  requires jQuery UI  ///////////////////
//set up Drag'n'Drop  - -  code borrowed from looma-slideshow.js [T. Woodside, summer 2016]
function makedraggable() {
     var $clone;
     $('.resultitem  .activityDiv').draggable({
        connectToSortable: "#timelineDisplay",
        //opacity: 0.7,
        addClasses: false,
        cursorAt: 0,
         
         containment:"timeline",
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


function openTextEditor (e) {
    if ($(e.target).closest('.textpreview')) {
        var textfile = $(e.target).closest('.textpreview').data('id');
        
        //  to open in a new tab
        //window.open('./looma-edit-text.php?id=' + textfile );
        
        // to open in the same tab
        $('#text-editor iframe').attr('src','./looma-text-frame.php?id=' + textfile);
        $('#text-editor').show().focus();
        
        //LOOMA.alert('right clicked text file with id: ' + textfile,0,false,function(){return;});
        return false;
    }
} // end openTextEditor()


/////////////////////////// ONLOAD FUNCTION ///////////////////////////
window.onload = function () {
    
    //show the "New Text File" button in filecommands.js to allow text-frame editor to be called in an iFrame
    $('#show_text').show();
    
    $searchResultsDiv = $('#innerResultsDiv');  //sets a global variable used by looma-search.js
    $timeline = $('#timelineDisplay');  //the DIV where the timeline is being edited
    
    loginname = LOOMA.loggedIn();
    var loginlevel = LOOMA.readStore('login-level','cookie')
    var loginteam  = LOOMA.readStore('login-team','cookie')
    if (loginname && loginlevel === 'admin' ) $('.admin').show();
    if (loginname && loginlevel === 'exec' )  { $('.admin').show(); $('.exec').show(); }
    
    $('#clear_button').click(clearFilter);
    
    $('#search').change(function() {
        $("#innerResultsMenu").empty();
        $("#innerResultsDiv").empty();
        $("#previewpanel").empty();
    });
    
    pagesz=27;
    
    //NOTE: this code not used. looma-search.js handles this
    // $('.filter_radio').change(changeCollection);
    
    $('.chapterFilter').prop('disabled', true);
    $('.mediaFilter').prop('disabled',   false);

    $('#lesson-checkbox').prop('disabled' , true).hide();
    $('#includeLesson').val(false);
    
 /*       $("#dropdown_grade, #dropdown_subject").change( function(){
            $('#div_chapter').hide();
            
            $('#dropdown_chapter').empty();
            if ( ($('#dropdown_grade').val() != '') && ($('#dropdown_subject').val() != ''))
                $.post("looma-database-utilities.php",
                    {cmd: "textChapterList",
                        class: $('#dropdown_grade').val(),
                        subject:   $('#dropdown_subject').val()},
                    
                    function(response) {
                        //console.log(response);
                        //$('#chapter_label').show();
                        $('#div_chapter').show();
                        $('<option/>', {value: "", label: "<select a chapter>"}).appendTo('#dropdown_chapter');
                        
                        $('#dropdown_chapter').append(response);
                    },
                    'html'
                );
    });
*/

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



//////////////////////////////////////
/////////FILE COMMANDS setup /////////
//////////////////////////////////////
    
    /*  callback functions expected by looma-filecommands.js:  */
    callbacks ['clear'] =           lessonclear;
    callbacks ['save']  =           lessonsave;
    callbacks ['savetemplate']  =   lessontemplatesave;
    //callbacks ['open']  = lessonopen;
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
    $('#filesearch  #collection').val('lesson');
    
    lessonclear();
    
    // $( "#timelineDisplay" ).sortable({disabled: true});
    //
    makesortable(); //makes the timeline sortable

      //  $('#chapter-lang').show();
        
// from connor
    $('#timelineLeft').on('click', function(){
        preview_prev();
        //$('#timeline').animate({scrollLeft: '-=200px'}, 700);
    });
    $('#timelineRight').on('click', function(){
        preview_next();
        //$('#timeline').animate({scrollLeft: '+=200px'}, 700);
    });
// from connor
    
    $('#dismiss').off('click').click( function() { quit();});  //disable default DISMISS btn function and substitute QUIT()
    
    //LOOMA.makeTransparent($('#search-panel'));
    //$('#search-panel').hide();
    //$('#cmd-button').focus();
    
    // hide or disable #search-panel, focus on #cmd-button, put hints in preview panel "open a file, new file or template to work on"

    // enable right-click on text files to open Text Editor
    
    $('#previewpanel').on('contextmenu', '.textpreview', openTextEditor);
    
    
};  //end window.onload()


