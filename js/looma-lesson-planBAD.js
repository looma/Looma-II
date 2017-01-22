/*
LOOMA javascript file
Filename: looma-lesson-plan.js
Description: version 1 [SCU]
             version 2 [skip]
Programmer name: SCU
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: version 1:spring 2016, version 2: Nov 16
Revision: Looma 2.4

Comments:
 */

'use strict';

/////////////////////////// INITIALIZING THINGS ///////////////////////////

var timelineAssArray = new Object();

var homedirectory = "../";

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
     $($('.resultitem  .activityDiv')).draggable({
        connectToSortable: "#timelineDisplay",
        helper: "clone",
        containment: "#timelineDisplay",
        start: function(event, ui) {
            //$(ui.helper).css("z-index", "10000").find("img").css("height", "15vh").css("width", "auto"); //Sometimes will display under buttons
            $('#timelineDisplay').sortable("option", "scroll", false);
        },
        stop: function(event, ui) {
            var newElem = $(ui.helper);
            if ($('#timelineDisplay').has($(newElem)).length > 0) {
                makesortable();
                //$('#timelineDisplay').sortable("option", "scroll", true);
                //$(newElem).removeAttr("style");
                //$(newElem).find("img").removeAttr("style");

                };
            }
        });
}; //end makedraggable()

/////////////////////////// ONLOAD FUNCTION ///////////////////////////
// This loads all the preliminary elements in the page.
window.onload = function () {

    fillInDOM(); // fills in DOM elements - could be done in static HTML in the PHP file

    $('#clear_button').click(clearFilter);

///////////////////////////////
//FILE COMMANDS setup /////////
///////////////////////////////

var $timeline = $('#timelineDisplay');  //the DIV where the timeline is being edited

var savedTimeline;   //savedTimeline is checkpoint of timeline for checking for modification
var loginname;

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
currentname = "";
currentcollection = 'lesson';
currentfiletype = 'lesson';

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
       $timeline.html("");
       //savedTimeline = "";
       lessoncheckpoint();
};

lessonclear();

function lessonpack (html) { // pack the timeline into an array of collection/id pairs for storage
    var packitem = {collection: '', id: ''};
    var packarray = [];

    $(html).each(function() {
            packitem.collection = $(this).data('collection');
            packitem.id         = $(this).data('id');
            packarray.push(packitem);
        });

    return packarray;
};

function lessonunpack (data) {  //unpack the array of collection/id pairs into html to display on the timeline

    //for each element in data, call createActivityDiv, and attach the resturn value to #timelinediv
    // also set filename, [and collection??]

    $(data).each(function() {
        $('#timelinediv').empty();
       var newDiv = createActivityDiv(this, null);
       insertTimelineElement(newDiv);
    });
    return data;
};

function lessondisplay (data) {$timeline.html(lessonunpack(data));};

function lessonsave(name) {
    savefile(name, currentcollection, currentfiletype, lessonpack($timeline.html()), true);
}; //end testsave()

function lessontemplatesave(name) {
    savefile(name, currentcollection, currentfiletype + '-template', lessonpack($timeline.html()), false);
}; //end testsave()



    var loginname = LOOMA.loggedIn();
    //if (loginname && (loginname == 'kathy' || loginname == 'david' || loginname== 'skip')) $('.admin').show();

// end FILE COMMANDS stuff

// when search button is clicked - submit the 'search' form to looma-database.search.php
            $('#search').submit(function( event ) {
                  event.preventDefault();

                  $("#innerResultsMenu").empty();
                  $("#innerResultsDiv" ).empty();
                  $("#displaybox").empty();

                  var loadingmessage = $("<p/>", {html : "Loading results..."}).appendTo("#innerResultsMenu");

                  if (!isFilterSet()) {
                        $('#innerResultsDiv').html('Please select at least 1 filter option before searching.');
                  } else {
                  $.post( "looma-database-utilities.php",
                           $( "#search" ).serialize(),
                           function (result) {
                                loadingmessage.remove();
                                displayResults(result);return;},
                           'json');
                  //this POST to looma-databas-search.php sends all the submit FORM elements
                  // and returns an array of objects which are mongo documents that match the search criteria from the form
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

// var resultArray = [];

var clearFilter = function() {
	 console.log('clearFilter');

     $('#searchString').val("");

	 $(".filter_dropdown").each(function() {
	 	this.selectedIndex = 0;
	 });
	 $(".filter_checkbox").each(function() {
	 	$(this).prop("checked", false);
	 });

     $("#innerResultsMenu").empty();
     $("#innerResultsDiv").empty();
     $("#displaybox").empty();

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
         if (results[i]['ft'] == 'chapter') result_array['chapters'].push(results[i])
         else                               result_array['activities'].push(results[i]);
      };

      printFilterData(result_array);

     //makedraggable();  //not working for now

     }; //end displayresults()


/////////////////////////////////////////////////////////////
/////////////////  FILL IN SEARCH RESULTS PANE //////////////
/////////////////////////////////////////////////////////////

var printFilterData = function(filterdata_object) {
	var currentResultDiv = document.createElement("div");
	currentResultDiv.id = "currentResultDiv";
	// currentResultDiv.appendTo("#innerResultsDiv");
	$(currentResultDiv).appendTo("#innerResultsDiv");

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
	var arraylength = filterdata_object.chapters.length;		// WE NEED TO FIX THIS. This is counting sections as well!!!
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
			// 	console.log($(chapterResults[i]).data("chprefix"));
			// 	// if ($(chapterResults[i]).data("chprefix") == $(rElement).data("chprefix")) {
			// 	// 	console.log("IT'S A MATCH!!!!!!!");
			// 	// 	// append to chapterResults[i]
			// 	// }
			// 	// search through and check ch prefixes
			// }
			// var sectionChapterDiv = document.getElementBy
		}
		// var rElement = createChapterDiv(resultArray[i]);

	}
// end Print Chapter Array

*/


//***********************
// display Activities in Search Results pane
//***********************

	var actResultDiv = document.createElement("div");
	actResultDiv.id = "actResultDiv";
	$(actResultDiv).appendTo(currentResultDiv);

	var collectionTitle = document.createElement("h1");
    	collectionTitle.id = "activityTitle";

    	var arraylength = filterdata_object.activities.length;
    	if (arraylength == 0) {
            collectionTitle.innerHTML = "<a class='heading' name='activities'>Activities (0 Results)</a>";        }
    	else if (arraylength == 1) {
    		collectionTitle.innerHTML = "<a class='heading' name='activities'>Activities (" + arraylength + " Result)</a>";
    	}
    	else {
    		collectionTitle.innerHTML = "<a class='heading' name='activities'>Activities (" + arraylength + " Results)</a>";
    	}
	actResultDiv.appendChild(collectionTitle);

	for(var i=0; i<filterdata_object.activities.length; i++) {
		var rElement = createActivityDiv(filterdata_object.activities[i], filterdata_object.activities[i-1]);  //BUG: array[i-1] not defined when i==0

            actResultDiv.appendChild(rElement);

	}
// end Print Activities Array


//***********************
// display Chapters in Search Results pane
//***********************

	    arraylength = filterdata_object.chapters.length;
        if (arraylength > 0) {
            collectionTitle = document.createElement("h1");
            collectionTitle.id = "chapterTitle";

            if (arraylength == 1) {
                collectionTitle.innerHTML = "<a class='heading' name='activities'>Chapters (" + arraylength + " Result)</a>";
            }
            else {
                collectionTitle.innerHTML = "<a class='heading' name='activities'>Chapters (" + arraylength + " Results)</a>";
            };
            actResultDiv.appendChild(collectionTitle);

            for(i=0; i<filterdata_object.chapters.length; i++) {
                rElement = createActivityDiv(filterdata_object.chapters[i], filterdata_object.chapters[i-1]);  //BUG: array[i-1] not defined when i==0

                actResultDiv.appendChild(rElement);
            };
       };


/* print Dictionary array

	var dictResultDiv = document.createElement("div");
	dictResultDiv.id = "dictResultDiv";
	$(dictResultDiv).appendTo(currentResultDiv);

	var collectionTitle = document.createElement("h1");
	collectionTitle.id = "collectionTitle";

	var arraylength = filterdata_object.dictionary.length;
    if (arraylength > 0 ) {
    	if (arraylength == 1) {
    		collectionTitle.innerHTML = "<a class='heading'  name='dictionary'>Dictionary (" + arraylength + " Result)</a>";
    	}
    	else {
    		collectionTitle.innerHTML = "<a class='heading'  name='dictionary'>Dictionary (" + arraylength + " Results)</a>";
    	}
    	dictResultDiv.appendChild(collectionTitle);
    };

	for(var i=0; i<filterdata_object.dictionary.length; i++) {
		var rElement = createDictionaryDiv(filterdata_object.dictionary[i], filterdata_object.dictionary[i-1]);
		// var rElement = createChapterDiv(resultArray[i]);
		dictResultDiv.appendChild(rElement);
	}
// end Print Dictionary Array

*/


}; //end printFilterData()

//getSectionChapterByPrefix() no longer used
var getSectionChapterByPrefix = function(currentResultsDiv, rElement) {
	if ($(currentResultsDiv).html != "") {
		if ($(rElement).data("collection") == "chapters") {
			var chapterResults = currentResultsDiv.getElementsByTagName("div");
			for (var i=0; i<chapterResults.length; i++) {
				if ($(chapterResults[i]).data("collection") == "chapters" && $(chapterResults[i]).data("type") == "chapter" && $(chapterResults[i]).data("chprefix") == $(rElement).data("chprefix")) {
					return chapterResults[i];	// IT'S A MATCH!
				}
			}
			return null;
		}
		else if ($(rElement).data("collection") == "activities") {
			var actResults = currentResultsDiv.getElementsByTagName("div");
			for (i=0; i<actResults.length; i++) {
				if ($(actResults[i]).data("collection") == "activities" && $(actResults[i]).data("type") == "chapter" && $(actResults[i]).data("chprefix") == $(rElement).data("chprefix")) {
					return actResults[i];	// IT'S A MATCH!
				}
			}
			return null;
		}
	}
};  // end getSectionChapterByPrefix()


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

var getFileType = function(ft) {
    //converts a file extension into
	     if (ft == "gif" || ft == "jpg" || ft == "png") return "Image"
	else if (ft == "mov" || ft == "mp4" || ft == "mp5") return "Video"
	else if (ft == "mp3")       return "Audio"
	else if (ft == "EP")        return "Game"
	else if (ft == "html")      return "Webpage"
	else if (ft == "pdf")       return "Document"
	else if (ft == "text")      return "Text File"
    else if (ft == "looma")     return "Looma Page"
    else if (ft == "chapter")   return "Chapter";
}; // end getFileType()


var getImgFilepath = function(item, collection) {

    //builds a filepath/filename for the thumbnail of this "item" based on type
    //SOME HARD-CODING HERE to be fixed
    // need to store FP in Activities and use it here

	var idExtractArray = extractItemId(item, collection);

	var imgsrc = "";

	if (collection == "chapters" || item.pn != null) {

	    //NOTE: in the next statement, sometimes get error "Uncaught TypeError: Cannot read property 'concat' of undefined"
		var thumbnail_prefix = idExtractArray["currentSubjectFull"].concat("-", idExtractArray["currentGradeNumber"]);

		imgsrc = homedirectory + "content/textbooks/" + idExtractArray["currentGradeFolder"] + "/" + idExtractArray["currentSubjectFull"] + "/" + thumbnail_prefix + "_thumb.jpg";

	}

	else if (collection == "textbooks" || item.subject != null) {
		var thumbnail_prefix = item.fn;
		thumbnail_prefix = thumbnail_prefix.substr(0, thumbnail_prefix.indexOf('.'));
		imgsrc = homedirectory + "content/" + item.fp + thumbnail_prefix + "_thumb.jpg";
	}
///////***** changed 'activity' to 'activities' ///////////////
	else if (collection == "activities" || item.ft != null) {
		var thumbnail_prefix = item.fn;
		if (item.ft == "mp3") {	 //audio
			imgsrc = homedirectory + "content/audio/thumbnail.png";
		}
		else if (item.ft == "mp4" || item.ft == "mp5") { //video
			thumbnail_prefix = thumbnail_prefix.substr(0, thumbnail_prefix.indexOf('.'));
			imgsrc = homedirectory + "content/videos/" + thumbnail_prefix + "_thumb.jpg";
		}
		else if (item.ft == "jpg"  || item.ft == "gif" || item.ft == "png" ) { //picture
			var thumbnail_prefix = item.fn;
			thumbnail_prefix = thumbnail_prefix.substr(0, thumbnail_prefix.indexOf('.'));
			imgsrc = homedirectory + "content/pictures/" + thumbnail_prefix + "_thumb.jpg";
		}
		else if (item.ft == "pdf") { //pdf
			var thumbnail_prefix = item.fn;
			thumbnail_prefix = thumbnail_prefix.substr(0, thumbnail_prefix.indexOf('.'));
			imgsrc = homedirectory + "content/pdfs/" + thumbnail_prefix + "_thumb.jpg";
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

	// Note: We don't use thumbnails for dictionary.

	return imgsrc;
}; // end getImgFilepath()

//rewrite extractItemId() to use REGEX
//  m=s.match(/^([1-8])(M|N|S|SS|EN)([0-9][0-9])(\.[0-9][0-9])?$/);
//  then if m != null, m[0] is the ch_id,
//                     m[1] is the class digit,
//                     m[2] is the subj letter(s),
//                     m[3] is the chapter/unit, and m[4] is null or chapter#
//       e.g. "8N01.04".match(regex) is ["8N01.04", "8", "N", "01", ".04"]
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
            N:  "Nepal",
            M:  "Math",
            S:  "Science",
            SS: "SocialStudies"};

        var pieces = ch_id.toString().match(/^([1-8])(M|N|S|SS|EN)([0-9][0-9])(\.[0-9][0-9])?$/);

        //console.log ('ch_id ' + ch_id + '  pieces ' + pieces);

        elements['currentGradeNumber'] = pieces[1];
        elements['currentSubject']     = pieces[2];
        elements['currentSection']     = pieces[4] ? pieces[3] : null;
        elements['currentChapter']     = pieces[4] ? pieces[4].substr(1) : pieces[3];
        elements['currentGradeFolder'] = 'Class' + pieces[1];
        elements['currentSubjectFull'] = names[pieces[2]];
        elements['chprefix']           = pieces[1] + pieces[2];

        return elements;
    }



var createActivityDiv = function(item, previtem) {   //NOTE: previtem not used


var innerActivityDiv = function(item) {

                var activityDiv = document.createElement("div");
                activityDiv.className = "activityDiv";

                $(activityDiv).attr("data-chprefix", idExtractArray["chprefix"]);
                $(activityDiv).attr("data-collection", collection);
                $(activityDiv).attr("data-id", item['_id']['$id']);

                item.collection = "activities";
                $.data(activityDiv, 'mongo', item);  //save the whole mongo document ("item") in the DOM element

                // code below doesnt work. the 'item' for a text doesnt have the HTML.
                 //have to query text_files collection to get it
                 /*
                 if (item.ft == 'text') {
                    $("<div/>", {
                        class: "html",
                        css: "visibility:none;"
                    }).html(item.html).appendTo(activityDiv);
                };
                */

                // Thumbnail
                var thumbnaildiv = document.createElement("div");
                thumbnaildiv.className = "thumbnaildiv";
                $(thumbnaildiv).appendTo(activityDiv);

                $("<img/>", {
                    class : "resultsimg",
                    src : getImgFilepath(item, collection)
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
                    html : getFileType(item.ft) + "  "
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
                 //   createTimelineElement(item, collection, issection);
                 //TEST
                    insertTimelineElement($(this).closest('.activityDiv'));
                    });
                buttondiv.appendChild(addButton);

                // "Delete" button

                var removeButton = $("<button/>", {class: "remove", html:"Delete"}).bind("click", removeTimelineElement);
                $(buttondiv).append(removeButton);

                // "Preview" button
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




    var collection = "activities";
    var issection = 0;

    var idExtractArray = extractItemId(item, collection);
    if (previtem != null) {
        var idExtractArray_prev = extractItemId(previtem, collection);
    }

    var div = document.createElement("div");
    div.className = "resultitem";
    $(div).attr("data-chprefix", idExtractArray["chprefix"]);
    $(div).attr("data-type", "section");
    $(div).attr("data-collection", collection);




//NOTE [skip] big chunk of code removed that kept track of section number and chapter number
//            and inserted correct labels. This code seems to depend on the activity items being displayed being
//            returned in section/chapter order, but unless we do mondodb.sort() that is not a valid assumption
/*
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
				//	Make a section div
				var sectionDiv = innerActivityDiv(item);
				$(sectionDiv).attr("data-type", "section").appendTo(div);
			}
			// Else if the ID prefix doesn't match the last one
			else if (idExtractArray["chprefix"] != idExtractArray_prev["chprefix"]) {
				// Create a new Chapter section

			//	$("<h5/>", {
				//	html : "Chapter " + idExtractArray["currentChapter"]
			//	}).appendTo(div);

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
*/  //end of removed code

// replacing above removed code with:
    var chapterDiv = innerActivityDiv(item);
    $(chapterDiv).attr("data-type", "chapter").appendTo(div);
//
	return div;
};  // end createActivityDiv()





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
        src : getImgFilepath(item, collection)
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
        src : getImgFilepath(item, collection)
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


///////////////////////////////////////////////////////////////
/////////////////////////// PREVIEW ///////////////////////////
///////////////////////////////////////////////////////////////

// When you click the preview button
var preview_result = function(collection, item) {

	$("<p/>", {html : "Loading preview..."}).appendTo("#displaybox");

	var idExtractArray = extractItemId(item, collection);

	if (collection == "chapters") {

		document.querySelector("div#displaybox").innerHTML = '<embed src="' +
		                        homedirectory + 'content/textbooks/' +
		                        idExtractArray["currentGradeFolder"] + "/" +
		                        idExtractArray["currentSubjectFull"] + "/" +
		                        idExtractArray["currentSubjectFull"] + "-" +
		                        idExtractArray["currentGradeNumber"] +
		                        '.pdf#page=' + item.pn + '" width="100%" height="100%" type="application/pdf">';
	}


	else if (collection == "textbooks") {
		document.querySelector("div#displaybox").innerHTML = '<embed src="' +
		                        homedirectory + 'content/' + item.fp + item.fn +
		                        '" width="100%" height="100%" type="application/pdf">';
	}


	else if (collection == "activities") {

		if(item.ft == "mp4" || item.ft == "mov" || item.ft == "mp5") {
			document.querySelector("#displaybox").innerHTML = '<video controls> <source src="' + homedirectory +
			         'content/videos/' + item.fn + '" type="video/mp4"> </video>';
			// var newParagraph = document.createElement("p");
			// newParagraph.innerText = "media type: video";
			// document.querySelector("div#timelineBox").appendChild(newParagraph);
		}
		else if(item.ft=="mp3") {
		document.querySelector("div#displaybox").innerHTML = '<audio controls> <source src="' +
		                      homedirectory + 'content/audio/' +
		                      item.fn + '" type="audio/mpeg"></audio>';
		}
		// Pictures
		else if(item.ft=="jpg" || item.ft=="gif" || item.ft=="png") {
			document.querySelector("div#displaybox").innerHTML = '<img src="' +
			                     homedirectory + 'content/pictures/' +
			                     item.fn + '"id="displayImage">';
		}
		else if (item.ft=="EP" || item.ft == "html") {
		document.querySelector("div#displaybox").innerHTML =
		  '<object type="text/html" data="' + homedirectory + 'content/epaath/activities/' +
		    item.fn  + '/index.html" style="height:60vh;width:60vw;"> </object>';
		}
		else if (item.ft=="pdf") {
			document.querySelector("div#displaybox").innerHTML =
			     '<embed src="' + homedirectory + 'content/pdfs/' + item.fn + '"' +
			     ' style="height:60vh;width:60vw;" type="application/pdf">';
		}
		else if (item.ft=="looma")
            document.querySelector("div#displaybox").innerHTML = '<img src="images/looma-screenshots/' +
            item.dn + '.png" id="displayImage">';

        else if (item.ft=="slideshow")
            document.querySelector("div#displaybox").innerHTML = "Preview will show here";

		else if (item.ft=="text") {
		    //use the _id to query text_files collection and retrieve HTML for this text file
            document.querySelector("div#displaybox").innerHTML = "Preview will show here";
        }
	}

	else if (collection == "dictionary") {
		$("<p/>", {
			html : item.def
		}).appendTo("#displaybox");
		// document.querySelector("div#displaybox").innerHTML = item.def;
	}


	// Chapter information

	// Video

	// Audio

	// Definiton

	// Game

};


////////////////////////////////////////////////////////////////////////////
/////////////////////////// TIMELINE MANIPULATION //////////////////////////
////////////////////////////////////////////////////////////////////////////

//////////////////////////////     OPEN        /////////////////////////////
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

function insertTimelineElement(source) {
        var dest = $(source).clone(true).appendTo("#timelineDisplay");  //the 'true' option sets the the clone to copy 'deepWithDataAndEvents'

        makesortable();  //TIMELINE elements can be drag'n'dropped

}; //end insertTimelineElement()

var createTimelineElement = function(item, collection, issection){
    console.log("item: ");
    console.log(item);

    var idExtractArray = extractItemId(item, collection);
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

        var thumbnail_prefix = item.fn;
        thumbnail_prefix = thumbnail_prefix.substr(0, thumbnail_prefix.indexOf('.'));
        $("<img/>", {
            class : "timelineimg",
            src : getImgFilepath(item, collection)
        }).appendTo(textdiv);
        $("<p/>", { html : "<b>Textbook:</b>" }).appendTo(textdiv);
        $("<p/>", { html : "<b>" + item.dn + "</b>" }).appendTo(textdiv);

    }


     //chapter
    if(collection == "chapters" || item.pn != null) {
        $("<img/>", {
            class : "timelineimg",
            src : getImgFilepath(item, collection)
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
            src : getImgFilepath(item, collection)
        }).appendTo(textdiv);

        //$("<p/>", { html : "<b>" + getFileType(item.ft) + ":</b>" }).appendTo(textdiv);
        $("<p/>", { html : "<b>" + item.dn + "</b>" }).appendTo(textdiv);

    /*
        if (issection == 1) {
            $("<p/>", { html : "<Class " + idExtractArray["currentGradeNumber"] + " " + idExtractArray["currentSubjectFull"] + ",<br/>Chapter " + idExtractArray["currentChapter"] + ", Section " + idExtractArray["currentSection"]}).appendTo(textdiv);
        }
        else {
            $("<p/>", { html : "Class " + idExtractArray["currentGradeNumber"] + " " + idExtractArray["currentSubjectFull"] + ",<br/>Chapter " + idExtractArray["currentChapter"]}).appendTo(textdiv);
        }
    */
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

    var removebutton = $("<button/>", {class: "remove", html:"X"}).bind("click", removeTimelineElement);
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


var removeTimelineElement = function() {
  // Removing list item from timelineHolder
  //var outerDiv = this.parentNode.parentNode;
  //outerDiv.remove();    // "Remove" button is within 3 divs

  this.closest('.activityDiv').remove();

};


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
//	console.log("opening timeline in present...");
//	var itemIdArray = [];
//
//	var timelineDivs = document.getElementsByClassName("timelinediv");
//
//	var objectId = "";
//	var form = $("<form/>", {
//		method: "post",
//		action: homedirectory + "present.php",
//	});
//
//	for (var i=0; i<timelineDivs.length; i++) {
//		var formInput = $("<input/>", {
//			type : "text",
//			name : "objid",
//			value: $(timelineDivs[i]).data("objid"),
//		});
//
//		form.append(formInput);
//	}
//	form.submit();
//}



//QUERYSEARCH() no longer used
var querySearch = function() {
    $("#innerResultsMenu").empty();
    $("#innerResultsDiv" ).empty();

/*  var filetypes = {
            "image" :   {   id : "ft_image",     display : "Image"     },
            "video" :   {   id : "ft_video",     display : "Video"     },
            "audio" :   {   id : "ft_audio",     display : "Audio"     },
            "pdf" :     {   id : "ft_pdf",       display : "PDF"       },
            "text" :    {   id : "ft_text",      display : "Text"      },
            "chapter":  {   id : "ft_chapt",     display : "Chapter"   },
            "html" :    {   id : "ft_html",      display : "HTML"      },
            "looma":    {   id : "ft_looma",     display : "Looma Page"},
            "slideshow":{   id : "ft_slideshow", display : "Slide Show"}
*/

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

    /*if (filterdata['grade']   == "" &&
        filterdata['subject'] == "" &&
        filterdata['image'] == false &&
        filterdata['video'] == false &&
        filterdata['audio'] == false &&
        filterdata['pdf'] == false &&
        filterdata['text'] == false &&
        filterdata['chapter'] == false &&
        filterdata['html'] == false &&
        filterdata['slideshow']  == false) {
        $("#innerResultsDiv").html("Please select at least 1 filter option before searching.");
        */

    else {
        $('#innerResultsMenu').empty();
        $('#innerResultsDiv').empty();
        $("#displaybox").empty();

        var loadingmessage = $("<p/>", {html : "Loading results..."}).appendTo("#outerResultsMenu");

        $.get("looma-lesson-query.php", filterdata, function(filterdata) {
            $(loadingmessage).remove();
            console.log(JSON.parse(filterdata));
            var filterdata_object = storeFilterData(filterdata);
            printFilterData(filterdata_object);
        }); //Send filter data to server via GET request

    }
}; //end querySearch()

//storeFilterData() no longer used
var storeFilterData = function(filterdata) {
    var filterdata_object = /*JSON.parse(*/filterdata/*)*/;
    return filterdata_object;
};  //end storeFilterData()

var fillInDOM = function() {

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
            "English" : "EN",
            "Math" : "M",
            "Nepali" : "N",
            "Science" : "S",
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
            html : "Editing:&nbsp;&nbsp;"
        }).appendTo("#titleDiv");

        $("<p/>", {
            class: "textBox filename",
        }).appendTo("#titleDiv");



}; // end FillInDOM()


  /*          var OLDinnerActivityDiv = function(item) {

                var activityDiv = document.createElement("div");
                activityDiv.className = "activityDiv";

                $(activityDiv).attr("data-chprefix", idExtractArray["chprefix"]);
                $(activityDiv).attr("data-collection", collection);

                if (item.ft == 'text') {
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
                    src : getImgFilepath(item, collection)
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
                    html : getFileType(item.ft) + "  "
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

/*
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





