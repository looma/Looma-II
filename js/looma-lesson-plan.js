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

var homedirectory = "../";


/////////////////////////// ONLOAD FUNCTION ///////////////////////////
window.onload = function () {

    initializeDOM(); // fills in DOM elements - could be done in static HTML in the PHP file

    $('#clear_button').click(clearFilter);


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

$('#search-form  #collection').val('lesson');

function lessonshowsearchitems() {
                    $('#lesson-chk').show();
                    // for TEXT EDIT, only show "text", clicked and disabled
                    $('#lesson-chk input').attr('checked', true).css('opacity', 0.5);
                    //$('#txt-chk input').prop('readonly'); //cant make 'readonly' work
                    $('#lesson-chk input').click(function() {return false;});

};

function lessoncheckpoint() {         savedTimeline =   $timeline.html(); };
function lessonundocheckpoint() {     $timeline.html(    savedTimeline);     };  //not used now??
function lessonmodified()   {
    return (savedTimeline !== $timeline.html());};

function lessonclear() {
       setname("");
       currentid="";
       $timeline.empty();
       lessoncheckpoint();
};

lessonclear();

function lessonpack (html) { // pack the timeline into an array of collection/id pairs for storage
    var packitem;
    var packarray = [];

    $(html).each(function() {
            packitem = {};  //make a new object, unlinking the references already pushed into packarray
            packitem.collection = $(this).data('collection');
            packitem.id         = $(this).data('id');
            packarray.push(packitem);
        });

    return packarray;
}; //end lessonpack()

function lessonunpack (response) {  //unpack the array of collection/id pairs into html to display on the timeline
    var newDiv;

    //for each element in data, call createActivityDiv, and attach the resturn value to #timelinediv
    // also set filename, [and collection??]

    //$('#timelineDisplay').empty();
    lessonclear();

    setname(response.dn);

    // need to record ID of newly opened LP so that later SAVEs can overwrite it

    $(response.data).each(function() {
       // retrieve each timeline element from mongo and add it to the current timeline
         newDiv = null;  //reset newDiv so previous references to it are broken
         $.post("looma-database-utilities.php",
            {cmd: "openByID", collection: this.collection, id: this.id},
            function(result) {
                newDiv = createActivityDiv(result);
                insertTimelineElement(newDiv.firstChild);
            },
            'json'
          );
    });
}; //end lessonunpack()

function lessondisplay (response) {$timeline.html(lessonunpack(response));};

function lessonsave(name) {
    savefile(name, 'lesson', 'lesson', lessonpack($timeline.html()), true);
}; //end lessonsave()

function lessontemplatesave(name) {
    savefile(name, 'lesson', 'lesson' + '-template', lessonpack($timeline.html()), false);
}; //end lessontemplatesave()



// end FILE COMMANDS stuff

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

        makesortable();

		//dont open timeline on launch
		// wait for OPEN command

		// openTimeline();

};  //end window.onload()


///////////////////////////////////////////////////////////////////////
/////////////////////////// SEARCH  RESULTS  ///////////////////////////
//////////////////////////////////////////////////////////////////////

var clearFilter = function() {
	 console.log('clearFilter');

     $('#searchString').val("");

	 $(".filter_dropdown").each(function() { this.selectedIndex = 0; });
	 $(".filter_checkbox").each(function() { $(this).prop("checked", false); });

     $("#innerResultsMenu").empty();
     $("#innerResultsDiv").empty();
     $("#previewpanel").empty();
}; //end clearFilter()

var isFilterSet = function() {
    var set = false;

     if ($('#searchString').val()) set = true;

     if ($("#dropdown_grade").val()) set = true;
     if ($("#dropdown_subject").val()) set = true;

     $(".filter_checkbox").each(function() {
        if (this.checked) set = true;
     });

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
	// currentResultDiv.appendTo("#innerResultsDiv");
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
                rElement = createActivityDiv(filterdata_object.chapters[i]);  //BUG: array[i-1] not defined when i==0

                actResultDiv.appendChild(rElement);
            };
       };

// end Print Chapters Array

///////////////////////////////
// Create inner results menu
//////////////////////////////
/*  $("<a/>", {
        href : "#textbooks",
        html : "Textbooks "
    }).appendTo("#innerResultsMenu");
*/
    $("<span/>", {
        id : "chaptersScroll",
        html : "Chapters (" + chaptersarraylength + ")&nbsp;&nbsp;&nbsp;&nbsp;"
    }).appendTo("#innerResultsMenu");
    $("<span/>", {
        id : "activitiesScroll",
        html : "Activities (" + activitiesarraylength + ')'
    }).appendTo("#innerResultsMenu");
/*  $("<a/>", {
        href : "#dictionary",
        html : "Dictionary "
    }).appendTo("#innerResultsMenu");
    */
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
}; // end filetype()

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

/*
	else if (collection == "textbooks" || item.subject != null) {
		thumbnail_prefix = item.fn;
		thumbnail_prefix = thumbnail_prefix.substr(0, thumbnail_prefix.indexOf('.'));
		imgsrc = homedirectory + "content/" + item.fp + thumbnail_prefix + "_thumb.jpg";
	}
*/

	else if (collection == "activities" || item.ft != null) {
		if (item.ft == "mp3") {	 //audio
            if (filepath) path = filepath; else path = homedirectory + 'content/audio/';
			imgsrc = path + "thumbnail.png";
		}
		else if (item.ft == "mp4" || item.ft == "mp5") { //video
			thumbnail_prefix = filename.substr(0, filename.indexOf('.'));
            if (filepath) path = filepath; else path = homedirectory + 'content/videos/';
			imgsrc = path + thumbnail_prefix + "_thumb.jpg";
		}
		else if (item.ft == "jpg"  || item.ft == "gif" || item.ft == "png" ) { //picture
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

                //$(activityDiv).attr("data-chprefix", idExtractArray["chprefix"]);
                $(activityDiv).attr("data-collection", (item.ft == 'chapter')?'chapters':'activities');
                $(activityDiv).attr("data-id", item['_id']['$id']);
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
                if (item.dn) var dn = item.dn.substring(0, 20); else dn = item.ndn.substring(0,20);
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
        /*        $(addButton).bind("click", function() {
                 //   createTimelineElement(item, collection, issection);
                 //TEST
                    insertTimelineElement($(this).closest('.activityDiv'));
                    });
          */
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

/*
	else if (collection == "textbooks") {
		document.querySelector("div#previewpanel").innerHTML = '<embed src="' +
		                        homedirectory + 'content/' + item.fp + filename +
		                        '" width="100%" height="100%" type="application/pdf">';
	}
*/

	else if (collection == "activities") {

		if(filetype == "mp4" || filetype == "mov" || filetype == "mp5") {
			document.querySelector("#previewpanel").innerHTML = '<video controls> <source src="' + homedirectory +
			         'content/videos/' + filename + '" type="video/mp4"> </video>';
			// var newParagraph = document.createElement("p");
			// newParagraph.innerText = "media type: video";
			// document.querySelector("div#timelineBox").appendChild(newParagraph);
		}
		else if (filetype=="pdf") {
			document.querySelector("div#previewpanel").innerHTML =
			     '<iframe src="' + homedirectory + 'content/pdfs/' + filename + '"' +
			     ' style="height:60vh;width:60vw;" type="application/pdf">';
		}
		else if(filetype=="mp3") {
		document.querySelector("div#previewpanel").innerHTML = '<br><br><br><audio controls> <source src="' +
		                      homedirectory + 'content/audio/' +
		                      filename + '" type="audio/mpeg"></audio>';
		}
		// Pictures
		else if(filetype=="jpg" || filetype=="gif" || filetype=="png") {
			document.querySelector("div#previewpanel").innerHTML = '<img src="' +
			                     homedirectory + 'content/pictures/' +
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

    /*
	else if (collection == "dictionary") {
		$("<p/>", {
			html : item.def
		}).appendTo("#previewpanel");
		// document.querySelector("div#previewpanel").innerHTML = item.def;
	}
	*/
};  // end preview_result()


function insertTimelineElement(source) {
        var $dest = $(source).clone(true).appendTo("#timelineDisplay");  //the 'true' option sets the the clone to copy 'deepWithDataAndEvents'

        // scroll the timeline so that the new element is in the middle - animated to slow scrolling
        $('#timeline').animate( { scrollLeft: $dest.outerWidth(true) * ( $dest.index() - 3 ) }, 1000);

        makesortable();  //TIMELINE elements can be drag'n'dropped

}; //end insertTimelineElement()

var removeTimelineElement = function(elem) {
  // Removing list item from timelineHolder
  //var outerDiv = this.parentNode.parentNode;
  //outerDiv.remove();    // "Remove" button is within 3 divs

        $('#timeline').animate( { scrollLeft: $(elem).closest('.activityDiv').outerWidth(true) * ( $(elem).closest('.activityDiv').index() - 3 ) }, 1000);
        $(elem).closest('.activityDiv').remove();

};


/////////////////////////// SORTABLE UI ////////  requires jQuery UI  ///////////////////
var makesortable = function() {
    $("#timelineDisplay").sortable({
        opacity: 0.7,   // makes dragged element transparent
        revert: true,   //Animates the drop
        axis:   "x",
        scroll: true,   //Allows page to scroll when dragging. Good for wide pages.
        handle: $(".activityDiv")  //restricts elements that can be clicked to drag to .timelinediv's
    }).disableSelection();
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
            $clone = $(this).clone(true, true); //make a 'deep' clone of this element. preserves jQuery 'data' attributes
        },
        //start: function(event, ui) {
            //$(ui.helper).css("z-index", "10000").find("img").css("height", "15vh").css("width", "auto"); //Sometimes will display under buttons
        //    $('#timelineDisplay').sortable("option", "scroll", false);
        //},
        stop: function(event, ui) {

                if ($('#timelineDisplay').find(ui.helper).length > 0) {  //if the helper was dropped on the timeline...

                    $(ui.helper).remove(); //the helper is not a 'deep' clone. we need to remove it and append the deep clone we make
                    $('#timelineDisplay').append($clone);
                    makesortable();
                //$('#timelineDisplay').sortable("option", "scroll", true);
                //$(newElem).find("img").removeAttr("style");
                }
              }
        });
}; //end makedraggable()

var initializeDOM = function() {

    //////////////////////////////////////////////////////
/////////////////////////// Fill in the DOM //////////
//////////////////////////////////////////////////////

    // Building Navbar -- all this could be in HTML

        $("<p/>", {
            html : "Lesson Plan Creator: Edit"
        }).appendTo("#navbar");

        // Filter: Search

        $("<div/>", {
            id : "div_search",
        }).appendTo("#search");

        //insert a hidden input that sets the 'collection' name for searches
        $("<input type='hidden' id='collection' value='activities' name='collection'/>").appendTo("#search");

        $("<span/>", {
            class : "filter_label",
            html : "Search:",
        }).appendTo("#div_search");

        $("<input/>", {
            id : "searchString",
            class: "textBox",
            type : "text",
            placeholder: "enter search term...",
            name : "search-term",
        }).appendTo("#div_search");

        // Filter: Grade

        $("<div/>", {
            id : "div_grade"
        }).appendTo("#search");

        $("<span/>", {
            class : "filter_label",
            html : "Grade:",
        }).appendTo("#div_grade");

        $("<select/>", {
            class : "filter_dropdown",
            form  : "search",
            name  : "class",
            id : "dropdown_grade",
            placeholder: "Grade Level"
        }).appendTo("#div_grade");

        for (var i=0; i<9; i++) { //fixed BUG: was "(var i=0, i<8, i++)" so that Chapter 8 did not show
            if (i == 0) {
                $("<option/>", {
                    html : "",
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
            class : "filter_dropdown",
            name  : "subj",
            form  : "search",
            id : "dropdown_subject"
        }).appendTo("#div_subject");

        $('<option>', {
            value: "",
            html : ""
        }).appendTo("#dropdown_subject");

        $.each(subjects, function (key, value) {
            $("<option/>", {
                value: value,
                html : key
            }).appendTo("#dropdown_subject");
        });

        // Filter: File Type

        var filetypes = {
            "image" :   {   id : "ft_image",     display : "Image"  },
            "video" :   {   id : "ft_video",     display : "Video"  },
            "audio" :   {   id : "ft_audio",     display : "Audio"   },
            "pdf" :     {   id : "ft_pdf",       display : "PDF"   },
            "text" :    {   id : "ft_text",      display : "Text"   },
            "chapter" : {   id : "ft_chapt",     display : "Chapter"   },
            "html" :    {   id : "ft_html",      display : "HTML"   },
            "looma":{  id : "ft_looma",     display : "Looma Page"   },
            "slideshow":{   id : "ft_slideshow", display : "Slide Show"   }
        };

        $("<div/>", {
            id : "div_filetypes"
        }).appendTo("#search");

        $.each(filetypes, function (key, value) {
            $("<input/>", {
                class : "filter_checkbox",
                type : "checkbox",
                style : "zoom:1.5",
                id : value.id,
                name : "type[]",
                value: key
                // html : value.display
            }).appendTo("#div_filetypes");
            $("<label/>", {
                class : "filter_label",
                for : value.id,
                html : value.display
            }).appendTo("#div_filetypes");
            //$("#div_filetypes").append("<br/>");
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
            html : "Lesson Plan name:&nbsp;&nbsp;",
            class: "ellipsis"
        }).appendTo("#titleDiv");

        $("<p/>", {
            class: "textBox filename",
        }).appendTo("#titleDiv");



}; // end initializeDOM()


  /*          var OLDinnerActivityDiv = function(item) {

                var activityDiv = document.createElement("div");
                activityDiv.className = "activityDiv";

                $(activityDiv).attr("data-chprefix", idExtractArray["chprefix"]);
                $(activityDiv).attr("data-collection", collection);

                if (filetype == 'text') {
                    $("<div/>", {
                        class: "html",
                        css: "visibility:none;"
                    }).html(item.html).appendTo(activityDiv);
                };

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
                $("<p/>", {
                    class : "result_dn",
                    html : "<b>" + item.dn.substring(0, 18) + "</b>"
                }).appendTo(textdiv);


                // File Type
                $("<span/>", {
                    class : "result_ft",
                    html : filetype(item.ft) + "  "
                }).appendTo(textdiv);

                // ID
                if (item.ch_id) {
                    $("<span/>", {
                    class : "result_ID",
                    html : "[" + item.ch_id + "]"
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
                $(addButton).bind("click", function() {
                   createTimelineElement(item, collection, issection);

                });
                buttondiv.appendChild(addButton);

                var previewButton = document.createElement("button");
                previewButton.innerText = "Preview";
                previewButton.className = "preview";
                // previewButton.onclick = preview_result(item);
                $(previewButton).bind("click", function() {
                    preview_result(collection, item);
                });
                buttondiv.appendChild(previewButton);

                return activityDiv;
            }; //end innerActivityDiv()
*/

/* */

/*  OLD version -- replaced with a REGEX method
var extractItemId = function(item, collection) {
// returns an array, with KEYS currentSection, currentChapter, etc and VALUES extracted from the CH_ID

    var elementsArray = [];

    if (collection == "chapters" || item.pn != null) {
        // Array will contain:
            // currentSection
            // currentChapter
            // currentSubject
            // currentGradeNumber
            // currentGradeFolder
            // currentSubjectFull (full name)
            // chprefix

        var itemId = item._id;
        var itemId_splitArray = itemId.split("");
        var arr_length = itemId_splitArray.length;

        // Extracts the section number
        if (itemId.indexOf(".") >= 0) {
            var currentSection = itemId_splitArray[arr_length-2].concat(itemId_splitArray[arr_length-1]);
            elementsArray["currentSection"] = currentSection;
            itemId_splitArray.splice(arr_length-1, 1);
            itemId_splitArray.splice(arr_length-2, 1);
            itemId_splitArray.splice(arr_length-3, 1);
            arr_length = itemId_splitArray.length;
        }

        // Extracts the last 2 numbers as the chapter
        var currentChapter = itemId_splitArray[arr_length-2].concat(itemId_splitArray[arr_length-1]);
        elementsArray["currentChapter"] = currentChapter;
        itemId_splitArray.splice(arr_length-1, 1);
        itemId_splitArray.splice(arr_length-2, 1);
        arr_length = itemId_splitArray.length;

        if (arr_length == 3) {  // If the subject is EN, or SS (or something with 2 letters)
            var currentSubject = itemId_splitArray[arr_length-2].concat(itemId_splitArray[arr_length-1]);
            elementsArray["currentSubject"] = currentSubject;
            itemId_splitArray.splice(arr_length-1, 1);
            itemId_splitArray.splice(arr_length-2, 1);
            arr_length = itemId_splitArray.length;
        }
        else if (itemId_splitArray.length == 2) {   // If the subject is M or S, N (or something with 1 letter)
            var currentSubject = itemId_splitArray[arr_length-1];
            elementsArray["currentSubject"] = currentSubject;
            itemId_splitArray.splice(arr_length-1, 1);
            arr_length = itemId_splitArray.length;
        }

        var currentGradeNumber = itemId_splitArray[0];
        elementsArray["currentGradeNumber"] = currentGradeNumber;

        var currentGradeFolder = "Class".concat(currentGradeNumber);
        elementsArray["currentGradeFolder"] = currentGradeFolder;

        if (currentSubject == "EN") {
            var currentSubjectFull = "English";
            elementsArray["currentSubjectFull"] = currentSubjectFull;
        }
        else if (currentSubject == "M") {
            var currentSubjectFull = "Math";
            elementsArray["currentSubjectFull"] = currentSubjectFull;
        }
        else if (currentSubject == "N") {
            var currentSubjectFull = "Nepali";
            elementsArray["currentSubjectFull"] = currentSubjectFull;
        }
        else if (currentSubject == "S") {
            var currentSubjectFull = "Science";
            elementsArray["currentSubjectFull"] = currentSubjectFull;
        }
        else if (currentSubject == "SS") {
            var currentSubjectFull = "SocialStudies";
            elementsArray["currentSubjectFull"] = currentSubjectFull;
        }

        var chprefix = currentGradeNumber.concat(currentSubject,currentChapter);
        elementsArray["chprefix"] = chprefix;
    }

    else if (collection == "textbooks" || item.subject != null) {
        // Array will contain:
            // currentSubject
            // currentGradeNumber
            // currentSubjectFull

        var itemId = item.prefix;
        var itemId_splitArray = itemId.split("");
        var arr_length = itemId_splitArray.length;

        if (arr_length == 3) {  // If the subject is EN, or SS (or something with 2 letters)
            var currentSubject = itemId_splitArray[arr_length-2].concat(itemId_splitArray[arr_length-1]);
            elementsArray["currentSubject"] = currentSubject;
            itemId_splitArray.splice(arr_length-1, 1);
            itemId_splitArray.splice(arr_length-2, 1);
            arr_length = itemId_splitArray.length;
        }
        else if (itemId_splitArray.length == 2) {   // If the subject is M or S, N (or something with 1 letter)
            var currentSubject = itemId_splitArray[arr_length-1];
            elementsArray["currentSubject"] = currentSubject;
            itemId_splitArray.splice(arr_length-1, 1);
            arr_length = itemId_splitArray.length;
        }

        var currentGradeNumber = itemId_splitArray[0];
        elementsArray["currentGradeNumber"] = currentGradeNumber;

        if (currentSubject == "EN") {
            var currentSubjectFull = "English";
            elementsArray["currentSubjectFull"] = currentSubjectFull;
        }
        else if (currentSubject == "M") {
            var currentSubjectFull = "Math";
            elementsArray["currentSubjectFull"] = currentSubjectFull;
        }
        else if (currentSubject == "N") {
            var currentSubjectFull = "Nepali";
            elementsArray["currentSubjectFull"] = currentSubjectFull;
        }
        else if (currentSubject == "S") {
            var currentSubjectFull = "Science";
            elementsArray["currentSubjectFull"] = currentSubjectFull;
        }
        else if (currentSubject == "SS") {
            var currentSubjectFull = "SocialStudies";
            elementsArray["currentSubjectFull"] = currentSubjectFull;
        }

    }



    else if (collection == "activity"
           //|| item.ft != null || collection == "dictionary" || item.part != null
            && item.ch_id) {
        // Array will contain:
            // currentSection
            // currentChapter
            // currentSubject
            // currentGradeNumber
            // currentGradeFolder
            // currentSubjectFull
            // chprefix

        var itemId = item.ch_id;
        var itemId_splitArray = itemId.split("");
        var arr_length = itemId_splitArray.length;

        // Extracts the section number
        if (itemId.indexOf(".") >= 0) {
            var currentSection = itemId_splitArray[arr_length-2].concat(itemId_splitArray[arr_length-1]);
            elementsArray["currentSection"] = currentSection;
            itemId_splitArray.splice(arr_length-1, 1);
            itemId_splitArray.splice(arr_length-2, 1);
            itemId_splitArray.splice(arr_length-3, 1);
            arr_length = itemId_splitArray.length;
        }

        // Extracts the last 2 numbers as the chapter
        var currentChapter = itemId_splitArray[arr_length-2].concat(itemId_splitArray[arr_length-1]);
        elementsArray["currentChapter"] = currentChapter;
        itemId_splitArray.splice(arr_length-1, 1);
        itemId_splitArray.splice(arr_length-2, 1);
        arr_length = itemId_splitArray.length;

        if (arr_length == 3) {  // If the subject is EN, or SS (or something with 2 letters)
            var currentSubject = itemId_splitArray[arr_length-2].concat(itemId_splitArray[arr_length-1]);
            elementsArray["currentSubject"] = currentSubject;
            itemId_splitArray.splice(arr_length-1, 1);
            itemId_splitArray.splice(arr_length-2, 1);
            arr_length = itemId_splitArray.length;
        }
        else if (itemId_splitArray.length == 2) {   // If the subject is M or S, N (or something with 1 letter)
            var currentSubject = itemId_splitArray[arr_length-1];
            elementsArray["currentSubject"] = currentSubject;
            itemId_splitArray.splice(arr_length-1, 1);
            arr_length = itemId_splitArray.length;
        }

        var currentGradeNumber = itemId_splitArray[0];
        elementsArray["currentGradeNumber"] = currentGradeNumber;

        var currentGradeFolder = "Class".concat(currentGradeNumber);
        elementsArray["currentGradeFolder"] = currentGradeFolder;

        if (currentSubject == "EN") {
            var currentSubjectFull = "English";
            elementsArray["currentSubjectFull"] = currentSubjectFull;
        }
        else if (currentSubject == "M") {
            var currentSubjectFull = "Math";
            elementsArray["currentSubjectFull"] = currentSubjectFull;
        }
        else if (currentSubject == "N") {
            var currentSubjectFull = "Nepali";
            elementsArray["currentSubjectFull"] = currentSubjectFull;
        }
        else if (currentSubject == "S") {
            var currentSubjectFull = "Science";
            elementsArray["currentSubjectFull"] = currentSubjectFull;
        }
        else if (currentSubject == "SS") {
            var currentSubjectFull = "SocialStudies";
            elementsArray["currentSubjectFull"] = currentSubjectFull;
        }

        var chprefix = currentGradeNumber.concat(currentSubject,currentChapter);
        elementsArray["chprefix"] = chprefix;
    }

return elementsArray;
};  // end extractItemId()
*/


/*  createChapterDiv not used
// Create "Chapter" collection results
var createChapterDiv = function(item, previtem) {
    var collection = "chapters";
    var issection = 0;

    var idExtractArray = extractItemId(item, collection);
    if (previtem != null) {
        var idExtractArray_prev = extractItemId(previtem, collection);
    }

    if (previtem != null) {
        if (item._id.indexOf(".") >= 0) {
            //  If the prefix is equal to the prefix before it
            if (idExtractArray["chprefix"] == idExtractArray_prev["chprefix"]) {
                issection = 1;
                var sectionDiv = document.createElement("div");
                sectionDiv.className = "result_chapter_section";
                $(sectionDiv).attr("data-chprefix", idExtractArray["chprefix"]);
                $(sectionDiv).attr("data-type", "section");
                $(sectionDiv).attr("data-collection", collection);
                // console.log("prefix for item " + item.dn + " is " + $(sectionDiv).data('chprefix'));

                $("<p/>", {
                    class : "result_dn",
                    html : "<b>Section " + idExtractArray["currentSection"]
                }).appendTo(sectionDiv);
                $("<p/>", {
                    class : "result_dn",
                    html : item.dn
                }).appendTo(sectionDiv);

                var previewButton = document.createElement("button");
                previewButton.innerText = "Preview";
                previewButton.className = "preview";
                // previewButton.onclick = preview_result(item);
                $(previewButton).bind("click", function() {
                    preview_result(collection, item);
                });
                sectionDiv.appendChild(previewButton);

                var addButton = document.createElement("button");
                addButton.innerText = "Add";
                addButton.className = "add";
                $(addButton).bind("click", function() {
                    createTimelineElement(item, collection, issection);
                });
                sectionDiv.appendChild(addButton);

                return sectionDiv;
            }
        }
    }

    var div = document.createElement("div");
    div.className = "resultitem";
    // var div = $("<div/>", {class:"resultitem"});


    $(div).attr("data-chprefix", idExtractArray["chprefix"]);
    $(div).attr("data-type", "chapter");
    $(div).attr("data-collection", collection);

    $("<img/>", {
        class : "resultsimg",
        src : thumbnail(item, collection)
    }).appendTo(div);

    // Display name
    $("<p/>", {
        class : "result_dn",
        html : "<b>Chapter " + idExtractArray["currentChapter"] + ": " + item.dn + "</b>"
    }).appendTo(div);

    // Nepali Name
    $("<p/>", {
        class : "result_ndn",
        html : item.ndn
    }).appendTo(div);

    // ID
    $("<p/>", {
        class : "result_ID",
        html : item._id
    }).appendTo(div);

    // "Add" button
    var addButton = document.createElement("button");
    addButton.innerText = "Add";
    addButton.className = "add";
    $(addButton).bind("click", function() {
        createTimelineElement(item, collection, issection);
    });
    div.appendChild(addButton);

    var previewButton = document.createElement("button");
    previewButton.innerText = "Preview";
    previewButton.className = "preview";

    $(previewButton).bind("click", function() {
        preview_result(collection, item);
    });
    div.appendChild(previewButton);

    return div;
}; //end createChapterDiv()
*/

/*  createTextbookDiv not used
// Create "Textbook" collection results
var createTextbookDiv = function(item) {
    var issection = 0;
    var collection = "textbooks";
    var resultdiv = document.createElement("div");
    resultdiv.className = "resultitem";

    // Thumbnail
    var thumbnaildiv = document.createElement("div");
    thumbnaildiv.className = "thumbnaildiv";
    $(thumbnaildiv).appendTo(resultdiv);

    $("<img/>", {
        class : "resultsimg",
        src : thumbnail(item, collection)
    }).appendTo(thumbnaildiv);

    // Result Text
    var textdiv = document.createElement("div");
    textdiv.className = "textdiv";
    $(textdiv).appendTo(resultdiv);

    $("<p/>", { // Display name
        class : "result_dn",
        html : "<b>" + item.dn + "</b>"
    }).appendTo(textdiv);

    $("<p/>", { // Nepali display name
        class : "result_ndn",
        html : item.ndn
    }).appendTo(textdiv);

    $("<p/>", { // Mongo ID
        class : "result_ID",
        html : item._id
    }).appendTo(textdiv);


    // Buttons
    var buttondiv = document.createElement("div");
    buttondiv.className = "buttondiv";
    $(buttondiv).appendTo(resultdiv);

    // "Add" button
    var addButton = document.createElement("button");
    addButton.innerText = "Add";
    addButton.className = "add";
    $(addButton).bind("click", function() {
        createTimelineElement(item, collection, issection);
    });
    $(addButton).appendTo(buttondiv);

    var previewButton = document.createElement("button");
    previewButton.innerText = "Preview";
    previewButton.className = "preview";
    // previewButton.onclick = preview_result(item);
    $(previewButton).bind("click", function() {
        preview_result(collection,
         item);
    });
    $(previewButton).appendTo(buttondiv);

    return resultdiv;
}; // end createTextbookDiv()
*/

/* createDictionaryDiv not used
var createDictionaryDiv = function(item, previtem) {
    var collection = "dictionary";
    var issection = 0;

    var idExtractArray = extractItemId(item, collection);
    if (previtem != null) {
        var idExtractArray_prev = extractItemId(previtem, collection);
    }

    var div = document.createElement("div");
    div.className = "resultitem";

    if (previtem == null) {
        if (idExtractArray["currentChapter"] == "01") {
            var headerdiv = document.createElement("div");
            div.appendChild(headerdiv);
            $("<h5/>", {
                html : "Chapter 01"
            }).appendTo(headerdiv);
        }
    }
    else if (previtem != null) {
        if (idExtractArray["chprefix"] != idExtractArray_prev["chprefix"]) {
            var headerdiv = document.createElement("div");
            div.appendChild(headerdiv);
            $("<h5/>", {
                html : "Chapter " + idExtractArray["currentChapter"]
            }).appendTo(headerdiv);
        }
    }

    var textdiv = document.createElement("div");
    textdiv.className = "textdiv";
    div.appendChild(textdiv);

    var buttondiv = document.createElement("div");
    buttondiv.className = "buttondiv";
    div.appendChild(buttondiv);

    $("<p/>", {
        html : "<b>" + item.en + "</b> (" + item.part + ")"
    }).appendTo(textdiv);

    $("<p/>", {
        html : item.ch_id
    }).appendTo(textdiv);

    // "Add" button
    var addButton = document.createElement("button");
    addButton.innerText = "Add";
    addButton.className = "add";
    $(addButton).bind("click", function() {
        createTimelineElement(item, collection, issection);
    });
    buttondiv.appendChild(addButton);

    var previewButton = document.createElement("button");
    previewButton.innerText = "Preview";
    previewButton.className = "preview";
    // previewButton.onclick = preview_result(item);
    $(previewButton).bind("click", function() {
        preview_result(collection, item);
    });
    buttondiv.appendChild(previewButton);

    return div;

};// end createDictionaryDiv()
*/

//removed from print search results
//
/////////////////////////////////////////////////////////////
    // Print Textbooks array
/*
    var textbookResultDiv = document.createElement("div");
    textbookResultDiv.id = "textbookResultDiv";
    $(textbookResultDiv).appendTo(currentResultDiv);

    var collectionTitle = document.createElement("h1");
    collectionTitle.id = "collectionTitle";

    var arraylength = filterdata_object.textbooks.length;
    if (arraylength > 0 ) {
        if (arraylength == 1) {
            collectionTitle.innerHTML = "<a class='heading'  name='textbooks'>Textbooks (" + arraylength + " Result)</a>";
        }
        else {
            collectionTitle.innerHTML = "<a class='heading'  name='textbooks'>Textbooks (" + arraylength + " Results)</a>";
        }
        textbookResultDiv.appendChild(collectionTitle);
    };

    for(var i=0; i<filterdata_object.textbooks.length; i++) {
        var rElement = createTextbookDiv(filterdata_object.textbooks[i]);

        textbookResultDiv.appendChild(rElement);
        console.log(filterdata_object.textbooks[i]._id);
    }
// end Print Textbook Array
*/

/*
    // Print Chapter array
    var chapterResultDiv = document.createElement("div");
    chapterResultDiv.id = "chapterResultDiv";
    $(chapterResultDiv).appendTo(currentResultDiv);

    var collectionTitle = document.createElement("h1");
    collectionTitle.id = "collectionTitle";
    var arraylength = filterdata_object.chapters.length;        // WE NEED TO FIX THIS. This is counting sections as well!!!
    if (arraylength > 0 ) {
        if (arraylength == 1) {
            collectionTitle.innerHTML = "<a class='heading'  name='chapters'>Chapters (" + arraylength + " Result)</a>";
        }
        else {
            collectionTitle.innerHTML = "<a class='heading'  name='chapters'>Chapters (" + arraylength + " Results)</a>";
        }
        chapterResultDiv.appendChild(collectionTitle);
    };

    for(var i=0; i<filterdata_object.chapters.length; i++) {
        var rElement = createChapterDiv(filterdata_object.chapters[i], filterdata_object.chapters[i-1]);
        if ($(rElement).data("type") == "chapter") {
            chapterResultDiv.appendChild(rElement);
        }
        else if ($(rElement).data("type") == "section") {
            var matchingDiv = getSectionChapterByPrefix(chapterResultDiv, rElement);
            if (matchingDiv != null) {
                $(matchingDiv).append(rElement);
            }
            else {
                chapterResultDiv.appendChild(rElement);
            }

            // var chapterResults = chapterResultDiv.getElementsByTagName("*");

            // for (i=0; i<chapterResults.length; i++) {
            //  console.log($(chapterResults[i]).data("chprefix"));
            //  // if ($(chapterResults[i]).data("chprefix") == $(rElement).data("chprefix")) {
            //  //  console.log("IT'S A MATCH!!!!!!!");
            //  //  // append to chapterResults[i]
            //  // }
            //  // search through and check ch prefixes
            // }
            // var sectionChapterDiv = document.getElementBy
        }
        // var rElement = createChapterDiv(resultArray[i]);

    }
// end Print Chapter Array

*/
//above removed from show search results

/*

////////////////////////////////////////////////////////////////////////////
/////////////////////////// TIMELINE MANIPULATION //////////////////////////
////////////////////////////////////////////////////////////////////////////

//////////////////////////////     OPEN        /////////////////////////////

// not used
var openTimeline = function() {
    var timelineElements = opentime();  // gets the ID from the URL and retrieves the whole timeline array
    $.each(timelineElements, function(index, timelineObj) {
        createTimelineElement(timelineObj);
    });
}; //end openTimeline()


//collects timeline elements for later SAVE (???)
var addToAssArray = function(object) {
    timelineAssArray[object._id] = object;
};


var createTimelineElement = function(item, collection, issection){
    console.log("item: ");
    console.log(item);

    var idExtractArray = extractItemId(item);
    // currentSection
    // currentChapter
    // currentSubject
    // currentGradeNumber
    // currentGradeFolder
    // currentSubjectFull
    // chprefix

    var timelinediv = $("<div/>", {class : "timelinediv"}).appendTo("#timelineDisplay");
    $(timelinediv).attr("data-objid", item._id);

    var innerdiv = document.createElement("div");
    innerdiv.className = "innerdiv";
    var textdiv = document.createElement("div");
    textdiv.className = "timelineTextDiv";
    var buttondiv = document.createElement("div");
    buttondiv.className = "timelineButtonDiv";

     //textbook
    if(collection == "textbooks" || item.subject != null) {

        var thumbnail_prefix = filename;
        thumbnail_prefix = thumbnail_prefix.substr(0, thumbnail_prefix.indexOf('.'));
        $("<img/>", {
            class : "timelineimg",
            src : thumbnail(item, collection)
        }).appendTo(textdiv);
        $("<p/>", { html : "<b>Textbook:</b>" }).appendTo(textdiv);
        $("<p/>", { html : "<b>" + item.dn + "</b>" }).appendTo(textdiv);

    }



     //chapter
    if(collection == "chapters" || item.pn != null) {
        $("<img/>", {
            class : "timelineimg",
            src : thumbnail(item, collection)
        }).appendTo(textdiv);

        if (issection == 1) {
            $("<p/>", { html : "<b>Chapter Section:</b>" }).appendTo(textdiv);
            $("<p/>", { html : "<b>" + item.dn + "</b>" }).appendTo(textdiv);
            $("<p/>", { html : "Class " + idExtractArray["currentGradeNumber"] +
                                    " " + idExtractArray["currentSubjectFull"] +
                                    ",<br/>Chapter " + idExtractArray["currentChapter"] +
                                    ", Section " + idExtractArray["currentSection"]}).appendTo(textdiv);
        }
        else {
            $("<p/>", { html : "<b>Chapter:</b>" }).appendTo(textdiv);
            $("<p/>", { html : "<b>" + item.dn + "</b>" }).appendTo(textdiv);
            $("<p/>", { html : "Class " + idExtractArray["currentGradeNumber"] +
                                    " " + idExtractArray["currentSubjectFull"] +
                                    ",<br/>Chapter " + idExtractArray["currentChapter"]}).appendTo(textdiv);
        }
    }



    // activities    ///////***** changed 'activity' to 'activities' ///////////////
    if(collection == "activities" || item.ft != null) {

        // Thumbnail
        $("<img/>", {
            class : "timelineimg",
            src : thumbnail(item, collection)
        }).appendTo(textdiv);

        //$("<p/>", { html : "<b>" + filetype(item.ft) + ":</b>" }).appendTo(textdiv);
        $("<p/>", { html : "<b>" + item.dn + "</b>" }).appendTo(textdiv);


        if (issection == 1) {
            $("<p/>", { html : "<Class " + idExtractArray["currentGradeNumber"] + " " + idExtractArray["currentSubjectFull"] + ",<br/>Chapter " + idExtractArray["currentChapter"] + ", Section " + idExtractArray["currentSection"]}).appendTo(textdiv);
        }
        else {
            $("<p/>", { html : "Class " + idExtractArray["currentGradeNumber"] + " " + idExtractArray["currentSubjectFull"] + ",<br/>Chapter " + idExtractArray["currentChapter"]}).appendTo(textdiv);
        }

    }



    //dictionary
    if(collection == "dictionary" || item.part != null) {
        $("<p/>", { html : "<b>Dictionary Entry:</b>" }).appendTo(textdiv);

        $("<p/>", { html : "Class " + idExtractArray["currentGradeNumber"] +
                                " " + idExtractArray["currentSubjectFull"] +
                                ",<br/>Chapter " + idExtractArray["currentChapter"]}).appendTo(textdiv);
    }


    var previewbutton = $("<button/>", {class: "preview", html:"Preview"}).bind("click", function() {
        preview_result(collection, item);
    });
    $(buttondiv).append(previewbutton);

    var removebutton = $("<button/>", {class: "remove", html:"X"});
    $(buttondiv).append(removebutton);

    $(textdiv).appendTo(innerdiv);
    $(buttondiv).appendTo(innerdiv);

    $(innerdiv).appendTo(timelinediv);
    addToAssArray(item);
    console.log("timeline ass array: ");
    console.log(timelineAssArray);

    makesortable();  //TIMELINE elements can be drag'n'dropped
                     //why is this needed on each insertion?

};  //end createTimelineElement()

 */


/*
//getSectionChapterByPrefix() no longer used
var getSectionChapterByPrefix = function(currentResultsDiv, rElement) {
    if ($(currentResultsDiv).html != "") {
        if ($(rElement).data("collection") == "chapters") {
            var chapterResults = currentResultsDiv.getElementsByTagName("div");
            for (var i=0; i<chapterResults.length; i++) {
                if ($(chapterResults[i]).data("collection") == "chapters" && $(chapterResults[i]).data("type") == "chapter" && $(chapterResults[i]).data("chprefix") == $(rElement).data("chprefix")) {
                    return chapterResults[i];   // IT'S A MATCH!
                }
            }
            return null;
        }
        else if ($(rElement).data("collection") == "activities") {
            var actResults = currentResultsDiv.getElementsByTagName("div");
            for (i=0; i<actResults.length; i++) {
                if ($(actResults[i]).data("collection") == "activities" && $(actResults[i]).data("type") == "chapter" && $(actResults[i]).data("chprefix") == $(rElement).data("chprefix")) {
                    return actResults[i];   // IT'S A MATCH!
                }
            }
            return null;
        }
    }
};  // end getSectionChapterByPrefix()

*/

/*
//NOTE [skip] big chunk of code removed that kept track of section number and chapter number
//            and inserted correct labels. This code seems to depend on the activity items being displayed being
//            returned in section/chapter order, but unless we do mondodb.sort() that is not a valid assumption

    // If this item is the first item
    if (previtem == null) {
        // Create h3 Chapter element
        //$("<h5/>", {
            //html : "Chapter " + idExtractArray["currentChapter"]
        //}).appendTo(div);

        // If the item ID has a decimal
        if (item.ch_id && item.ch_id.indexOf(".") >= 0) {
            // Create a section div & append to main div
            issection = 1;
            var sectionDiv = innerActivityDiv(item);
            $(sectionDiv).attr("data-type", "section").appendTo(div);
        }
        // Else if the item ID doesn't have a decimal
        else {
            // Create a chapter div & append to main div
            var chapterDiv = innerActivityDiv(item);
            $(chapterDiv).attr("data-type", "chapter").appendTo(div);
        }
    }
    // If this item isn't the first item
    else if (previtem != null) {
        // If the item  ID has a decimal
        if (

            item.ch_id &&

            item.ch_id.indexOf(".") >= 0) {
            issection = 1;
            // If the ID prefix matches the prefix of the last one
            if (idExtractArray["chprefix"] == idExtractArray_prev["chprefix"]) {
                //  Make a section div
                var sectionDiv = innerActivityDiv(item);
                $(sectionDiv).attr("data-type", "section").appendTo(div);
            }
            // Else if the ID prefix doesn't match the last one
            else if (idExtractArray["chprefix"] != idExtractArray_prev["chprefix"]) {
                // Create a new Chapter section

            //  $("<h5/>", {
                //  html : "Chapter " + idExtractArray["currentChapter"]
            //  }).appendTo(div);

                issection = 1;
                var sectionDiv = innerActivityDiv(item);
                $(sectionDiv).attr("data-type", "section").appendTo(div);
            }
        }
        // Else if the item ID doesn't have a decimal
        else {
            // Create h3 Chapter element

            //$("<h5/>", {
                //html : "Chapter " + idExtractArray["currentChapter"]
            //}).appendTo(div);

            var chapterDiv = innerActivityDiv(item);
            $(chapterDiv).attr("data-type", "chapter").appendTo(div);

        }
    }
  //end of removed code
  */

/////////////////////////// SAVE ///////////////////////////

/*
var save = function(){
    console.log("saving...");
    var itemIds = [];
    var titleInput = document.getElementById("titleInput").value;
    console.log("title:" + titleInput);

    if(titleInput == "") {
        alert("Lesson plan requires a title before saving.");
    }
    else {
        console.log("TITLE INPUT IS RUNNING");
        var timelineDivs = document.getElementsByClassName("timelinediv");
        var objectId = "";
        for (var i=0; i<timelineDivs.length; i++) {
            objectId = timelineAssArray[$(timelineDivs[i]).data("objid")]._id;
            itemIds.push(objectId);
        }

        var timeline = {
            timeline_id: getParameterByName("timelineId"),
            lesson_title : titleInput,
            items_array : itemIds
        };

        console.log(timeline);

        $.post("looma-lesson-save.php", timeline, function(data) {
            console.log(data);
            console.log("Saved!");
        }).fail(function(data){
            console.log(data);
        });
        alert("Your timeline, " + titleInput + ", has been saved!");
    }
}; end [OLD] save()
*/

////////////////////////// Present button from index  /////////////////////////////

//var indexToPresent = function(){
//  console.log("opening timeline in present...");
//  var itemIdArray = [];
//
//  var timelineDivs = document.getElementsByClassName("timelinediv");
//
//  var objectId = "";
//  var form = $("<form/>", {
//      method: "post",
//      action: homedirectory + "present.php",
//  });
//
//  for (var i=0; i<timelineDivs.length; i++) {
//      var formInput = $("<input/>", {
//          type : "text",
//          name : "objid",
//          value: $(timelineDivs[i]).data("objid"),
//      });
//
//      form.append(formInput);
//  }
//  form.submit();
//}


/*
//QUERYSEARCH() no longer used
var querySearch = function() {
    $("#innerResultsMenu").empty();
    $("#innerResultsDiv" ).empty();

// var filetypes = {
  //          "image" :   {   id : "ft_image",     display : "Image"     },
  //          "video" :   {   id : "ft_video",     display : "Video"     },
  //         "audio" :   {   id : "ft_audio",     display : "Audio"     },
  //         "pdf" :     {   id : "ft_pdf",       display : "PDF"       },
  //         "text" :    {   id : "ft_text",      display : "Text"      },
  //          "chapter":  {   id : "ft_chapt",     display : "Chapter"   },
  //          "html" :    {   id : "ft_html",      display : "HTML"      },
  //          "looma":    {   id : "ft_looma",     display : "Looma Page"},
  //          "slideshow":{   id : "ft_slideshow", display : "Slide Show"}


    var filterdata = {
        'grade' : document.getElementById('dropdown_grade').value,
        'subject' : document.getElementById('dropdown_subject').value,
          // 'chapter' : document.getElementById('dropdown_chapter').value,
          // 'section': document.getElementById('dropdown_section').value,
        'image'  : document.getElementById('ft_image').checked,
        'video'  : document.getElementById('ft_video').checked,
        'audio'  : document.getElementById('ft_audio').checked,
        'pdf'    : document.getElementById('ft_pdf').checked,
        'text'   : document.getElementById('ft_text').checked,
        'chapter': document.getElementById('ft_chapt').checked,
        'html'   : document.getElementById('ft_html').checked,
        'looma'  : document.getElementById('ft_looma').checked,
        'slideshow' : document.getElementById('ft_slideshow').checked
    };
    //console.log(filterdata['image']);

    if (!isFilterSet) {
        $("#innerResultsMenu").empty().html("Please select at least 1 filter option before searching.") }

//    if (filterdata['grade']   == "" &&
//        filterdata['subject'] == "" &&
//        filterdata['image'] == false &&
//        filterdata['video'] == false &&
//        filterdata['audio'] == false &&
//        filterdata['pdf'] == false &&
//        filterdata['text'] == false &&
//        filterdata['chapter'] == false &&
//        filterdata['html'] == false &&
//        filterdata['slideshow']  == false) {
//        $("#innerResultsDiv").html("Please select at least 1 filter option before searching.");


    else {
        $('#innerResultsMenu').empty();
        $('#innerResultsDiv').empty();
        $("#previewpanel").empty();

        var loadingmessage = $("<p/>", {html : "Loading results..."}).appendTo("#outerResultsMenu");

        $.get("looma-lesson-query.php", filterdata, function(filterdata) {
            $(loadingmessage).remove();
            console.log(JSON.parse(filterdata));
            var filterdata_object = storeFilterData(filterdata);
            displaySearchResults(filterdata_object);
        }); //Send filter data to server via GET request

    }
}; //end querySearch()

//storeFilterData() no longer used
var storeFilterData = function(filterdata) {
    var filterdata_object = JSON.parse(filterdata;
    return filterdata_object;
};  //end storeFilterData()
*/