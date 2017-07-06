/*
LOOMA javascript file
Filename: looma-lesson-plan.js
Description: version 1 [SCU, Spring 2016]
             version 2 [skip, Fall 2016]
Programmer name: SCU
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: version 1:spring 2016, version 2: Nov 16
Revision: Looma 2.4
 */

'use strict';

/////////////////////////// INITIALIZING  ///////////////////////////

//var timelineAssArray = new Object();

var $timeline;
var savedSignature;   //savedTimeline is checkpoint of timeline for checking for modification
var loginname;

var homedirectory = "../";
var $details;

/////////////////////////// ONLOAD FUNCTION ///////////////////////////
window.onload = function () {

    //show the "New Text File" button in filecommands.js to allow text-frame editor to be called in an iFrame
    $('#show_text').show();

    $timeline = $('#timelineDisplay');  //the DIV where the timeline is being edited

    loginname = LOOMA.loggedIn();
    if (loginname && (loginname == 'kathy' || loginname == 'david' || loginname == 'vivian' || loginname== 'skip')) $('.admin').show();

    initializeDOM(); // fills in DOM elements - could be done in static HTML in the PHP file

    $('#clear_button').click(clearFilter);

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

var $timeline = $('#timelineDisplay');  //the DIV where the timeline is being edited
var savedTimeline;   //savedTimeline is checkpoint of timeline for checking for modification

var loginname = LOOMA.loggedIn();

    //if (loginname && (loginname == 'kathy' || loginname == 'david' || loginname== 'skip')) $('.admin').show();

/*  callback functions expected by looma-filecommands.js:  */
callbacks ['clear'] = lessonclear;
callbacks ['save']  = lessonsave;
callbacks ['savetemplate']  = lessontemplatesave;
//callbacks ['open']  = lessonopen;
callbacks ['display'] = lessondisplay;
callbacks ['modified'] = lessonmodified;
callbacks ['showsearchitems'] = lessonshowsearchitems;
callbacks ['checkpoint'] = lessoncheckpoint;
callbacks ['undocheckpoint'] = lessonundocheckpoint;

/*  variable assignments expected by looma-filecommands.js:  */
currentname = "";             //currentname       is defined in looma-filecommands.js and gets set and used there
currentcollection = 'lesson'; //currentcollection is defined in looma-filecommands.js and is used there
currentfiletype = 'lesson';   //currentfiletype   is defined in looma-filecommands.js and is used there
currenttemplatetype = 'lesson-template';    //currentfiletype   is defined in looma-filecommands.js and is used there

$('#search-form  #collection').val('lesson');

function lessonshowsearchitems() {
                    $('#lesson-chk').show();
                    // for TEXT EDIT, only show "text", clicked and disabled
                    $('#lesson-chk input').attr('checked', true).css('opacity', 0.5);
                    //$('#txt-chk input').prop('readonly'); //cant make 'readonly' work
                    $('#lesson-chk input').click(function() {return false;});

};

/*
function lessoncheckpoint() {         savedTimeline =   $timeline.html(); };
function lessonundocheckpoint() {     $timeline.html(    savedTimeline);     };  //not used now??
function lessonmodified()   {return (savedTimeline !== $timeline.html());};

*/
    function lessoncheckpoint()       {savedSignature = signature($timeline);};
    function lessonundocheckpoint() {}; //cant undo changes with signatures
    function lessonmodified() {return (signature($timeline) !== savedSignature);};


    function signature(elem) { //param is jQ object of the timeline ($timeline)
        var sig = '';
        elem.find('.activityDiv').each(function(index, x){
            console.log('sig is ', sig);
            console.log('x is ', x);
            console.log('index is ', index);
            sig += $(x).data('id');});
        return sig;
        };

function lessonclear() {

       setname("");
       //currentid="";
       $timeline.empty();
       clearFilter();
       lessoncheckpoint();
};

lessonclear();

function lessonpack (html) { // pack the timeline into an array of collection/id pairs for storage
    var packitem;
    var packarray = [];

    //change below pack code to add an ordering INDEX

    $(html).each(function() {
            packitem = {};  //make a new object, unlinking the references already pushed into packarray
            packitem.collection = $(this).data('collection');
            packitem.id         = $(this).data('id');
            packarray.push(packitem);
        });

    return packarray;
}; //end lessonpack()

function lessonunpack (response) {  //unpack the array of collection/id pairs into html to display on the timeline
    //var newDiv;

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
                console.log('adding ID :' + result._id);
                insertTimelineElement(newDiv.firstChild);
            },
            'json'
          ));
    });


    makesortable();

}; //end lessonunpack()

function lessondisplay (response) {clearFilter(); $timeline.html(lessonunpack(response)); lessoncheckpoint();};

function lessonsave(name) {
    savefile(name, currentcollection, currentfiletype, lessonpack($timeline.html()), true);
}; //end lessonsave()

function lessontemplatesave(name) {
    savefile(name, currentcollection, currentfiletype + '-template', lessonpack($timeline.html()), false);
}; //end lessontemplatesave()



// end FILE COMMANDS stuff


// search for ACTIVITIES (and CHAPTERS) to use in the lesson plan
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
                      $.post( "looma-database-utilities.php",
                             $( "#search" ).serialize(),
                               function (result) {
                                    loadingmessage.remove();
                                    clearInterval(ellipsisTimer);
                                    displayResults(result);return;},
                               'json');
                  };
           });
  //
  // $( "#timelineDisplay" ).sortable({disabled: true});
  //
        makesortable(); //makes the timeline sortable

};  //end window.onload()

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
         if ($('#searchString').val()) set = true;

         $(".filter_checkbox").each(function() {
            if (this.checked) set = true;
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

function displayResults(results) {
      var result_array = [];
      result_array['activities'] = [];  //not searching for dictionary entries
      result_array['chapters']  = [];  //not searching for textbooks

     for (var i=0; i < results.length; i++) {
         if (results[i]['ft'] == 'chapter') result_array['chapters'].push(results[i]);
         else                               result_array['activities'].push(results[i]);
      };

      displaySearchResults(result_array);

      makedraggable();  //not working for now

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
	- 	All the "thumbnail_prefix" variables: If the image source is null,
		it shouldn't try to get the substring, because it'll break the code
	- 	If the file isn't there. We need to make a little 404 image and
		code it in.

//////////////////////////END TO-DO */
//*************************************************************************************start of things we need for presentation **********************************************


//returns an english describing the file type, given a FT
// could use a key:value array instead

var filetype = function(ft) { return LOOMA.typename(ft);};

/*
var filetype = function(ft) {
    //converts a file extension into
	     if (ft == "gif" || ft == "jpg" || ft == "png") return "Image";
	else if (ft == "mov" || ft == "mp4" || ft == "mp5") return "Video";
	else if (ft == "mp3")       return "Audio";
	else if (ft == "EP")        return "Game";
	else if (ft == "html")      return "Webpage";
	else if (ft == "pdf")       return "Document";
	else if (ft == "text")      return "Text File";
    else if (ft == "looma")     return "Looma Page";
    else if (ft == "chapter")   return "Chapter";
    else return ft;
}; // end filetype()
*/
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
		if (item.ft == "mp3") {	 //audio
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
	}

	return imgsrc;
}; // end thumbnail()


//rewrote extractItemId() to use REGEX
//  m=s.match(/^([1-8])(M|N|S|SS|EN)([0-9][0-9])\.([0-9][0-9])?$/);
//  then if m != null, m[0] is the ch_id,
//                     m[1] is the class digit,
//                     m[2] is the subj letter(s),
//                     m[3] is the chapter/unit, and m[4] is null or chapter#
//       e.g. "8N01.04".match(regex) is ["8N01.04", "8", "N", "01", "04"]
/* */
    function extractItemId(item) {
        var ch_id = (item['ft'] == 'chapter')? item['_id'] : item['ch_id'];
        var elements = {
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
            var pieces = ch_id.toString().match(/^([1-8])(M|N|S|SS|EN)([0-9][0-9])(\.[0-9][0-9])?$/);

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
                addButton.innerText = "Add";
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

// When you click the preview button
var preview_result = function(item) {

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

}; //end insertTimelineElement()

var removeTimelineElement = function(elem) {
  // Removing list item from timelineHolder
  //var outerDiv = this.parentNode.parentNode;
  //outerDiv.remove();    // "Remove" button is within 3 divs

        $('#timeline').animate( { scrollLeft: $(elem).closest('.activityDiv').outerWidth(true) * ( $(elem).closest('.activityDiv').index() - 4 ) }, 100);
        $(elem).closest('.activityDiv').remove();

};


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
}; //end makedraggable()

var initializeDOM = function() {

    //////////////////////////////////////////////////////
/////////////////////////// Fill in the DOM //////////
//////////////////////////////////////////////////////

    // Building Navbar and Querybar-- all this could be in HTML

        $("<p/>", {
            html : "Lesson Plan Editor"
        }).appendTo("#navbar");

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
            "text" :    {   id : "ft_text",      display : "Text"   },
            "looma":    {   id : "ft_looma",      display : "Looma Page"   }
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
            html : "Name:     ",
        }).appendTo("#div_categories");

        $("<input/>", {
            id : "searchString",
            class: "textBox mediaFilter",
            type : "text",
            placeholder: "enter search term...",
            name : "search-term",
        }).appendTo("#div_categories");

        $('<br>').appendTo("#div_categories");

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
            class: "ellipsis"
        }).appendTo("#titleDiv");

        $("<p/>", {
            class: "textBox filename",
        }).appendTo("#titleDiv");

        $details = $('<div id="details"><div>' +
                      '</div></div>');

}; // end initializeDOM()


