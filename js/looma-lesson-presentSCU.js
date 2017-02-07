/*
LOOMA javascript file
Filename: looma-lesson-present.js
Description:

Programmer name: SCU
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: Nov 16
Revision: Looma 2.4

Comments:
 */

'use strict';

/*define functions here */

var homedirectory = "../";

/////////////////////////// TIMELINE MANIPULATION //////////////////////////


//***********************************************************************things we need for present**********************************************************************************************
window.onload = function openTimeline() {
	var timelineElements = opentime();	// gets the ID from the URL and retrieves the whole timeline array
	$.each(timelineElements, function(index, timelineObj) {
		createTimelineElement(timelineObj);
	});
};

//gets the object from the array, determines which type of media it is, then gets the info and puts it into a div (inside a div inside the timeline display div)

//NOTE: kludgy design - looks at fields in a document to see what 'type' the document is. not guaranteed to work as DB schema change

var createTimelineElement = function(object){

	var innerdiv = null;

 	if(object.ft !=null)
 		innerdiv = createActivityDiv(object);

 	//textbook
 	//if (collection=="textbooks")
 	if(object.subject!=null)
 		innerdiv = createTextbookDiv(object);

 	//dictionary
 	//if (collection=="dictionary")
 	if(object.part!=null)
 		innerdiv = createDictionaryDiv(object);

 	//chapter
 	//if (collection = "chapters")
 	if(object.pn!=null)
 		innerdiv = createChapterDiv(object);

	var timelinediv = $(innerdiv).appendTo($("<div/>", {class: "timelinediv"}).appendTo("#timelineDisplay"));
 	// $(".timelinediv button.add").remove();

};

// Create "Chapter" collection results
var createChapterDiv = function(item) {
	var collection = "chapters";
	var div = document.createElement("div");
	div.className = "resultitem";

	// Thumbnail & Extracting the ID elements
	/////////////////////// ALSO MAKE WORK IF THE ID HAS A DECIMAL!!!!!!!!//////////////////////

	var str = item._id;
	var arr_split = str.split("");

	// For loop extracts the last 2 numbers as the chapter.

	for (var i = arr_split.length-1; i>=0; i--) {
		// console.log(typeof(arr_split[i]));
		// if (arr_split[i] == "0" || arr_split[i] == "1" || arr_split[i] == "2" || arr_split[i] == "3" || arr_split[i] == "4" || arr_split[i] == "5" || arr_split[i] == "6" || arr_split[i] == "7" || arr_split[i] == "8" || arr_split[i] == "9") {
		// 	arr_split.splice(i,1);
		// }
		// console.log(arr_split);
		// break;

		var currentChapter = arr_split[i-1].concat(arr_split[i]);
		arr_split.splice(i, 1);
		arr_split.splice(i-1, 1);
		break;
	}

	if (arr_split.length == 3) {	// If the subject is EN, or SS (or something with 2 letters)
		arr_split[1] = arr_split[1].concat(arr_split[2]);
		arr_split.splice(2, 1);
	}
	else if (arr_split.length < 3) {	// If the subject is M or S, N (or something with 1 letter)
		// MAKE THIS WORK
	}

	var currentGradeNumber = arr_split[0];
	var currentGrade = "Class".concat(arr_split[0]);
	if (arr_split[1] == "EN") {
		var currentSubject = "English";
	}
	else if (arr_split[1] == "M") {
		var currentSubject = "Math";
	}
	else if (arr_split[1] == "N") {
		var currentSubject = "Nepali";
	}
	else if (arr_split[1] == "S") {
		var currentSubject = "Science";
	}
	else if (arr_split[1] == "SS") {
		var currentSubject = "SocialStudies";
	}

	var thumbnail_prefix = currentSubject.concat("-", currentGradeNumber);

	var image = document.createElement("img");
	image.className = "resultsimg";
	image.src = homedirectory + "content/textbooks/" + currentGrade + "/" + currentSubject + "/" + thumbnail_prefix + "_thumb.jpg";
	div.appendChild(image);

	// Display name
	$("<p/>", {
		id : "result_dn",
		html : "<b>" + item.dn + "</b>"
	}).appendTo(div);

	// Nepali Name
	$("<p/>", {
		id : "result_ndn",
		html : item.ndn
	}).appendTo(div);

	// ID
	$("<p/>", {
		id : "result_ID",
		html : item._id
	}).appendTo(div);

	var previewButton = document.createElement("button");
	previewButton.innerText = "Preview";
	previewButton.className = "preview";
	// previewButton.onclick = preview_result(item);
	$(previewButton).bind("click", function() {
		preview_result(collection, item);
	});
	div.appendChild(previewButton);

	return div;
};

// Create "Textbook" collection results
var createTextbookDiv = function(item) {
	var collection = "textbooks";
	var div = document.createElement("div");
	div.className = "resultitem";

	// Thumbnail
	var thumbnail_prefix = item.fn;
	thumbnail_prefix = thumbnail_prefix.substr(0, thumbnail_prefix.indexOf('.'));

	$("<img/>", {
		class : "resultsimg",
		src : homedirectory + "content/" + item.fp + thumbnail_prefix + "_thumb.jpg"
	}).appendTo(div);

	// var image = document.createElement("img");
	// image.id = "resultsimg";
	// image.src =  homedirectory + "content/" + item.fp + thumbnail_prefix + "_thumb.jpg";
	// div.appendChild(image);

	// Display name
	$("<p/>", {
		id : "result_dn",
		html : "<b>" + item.dn + "</b>"
	}).appendTo(div);

	// Nepali Name
	$("<p/>", {
		id : "result_ndn",
		html : item.ndn
	}).appendTo(div);

	// ID
	$("<p/>", {
		id : "result_ID",
		html : item._id
	}).appendTo(div);

	var previewButton = document.createElement("button");
	previewButton.innerText = "Preview";
	previewButton.className = "preview";
	// previewButton.onclick = preview_result(item);
	$(previewButton).bind("click", function() {
		preview_result(collection, item);
	});
	div.appendChild(previewButton);

	return div;
};

// Create "Actdict" collection results
var createActivityDiv = function(item) {
	var collection = "activities";
	var div = document.createElement("div");
	// div.className = "resultitem";

	// Thumbnail
	var image = document.createElement("img");
	if (item.ft == "mp3") {	 //audio
		image.className = "resultsimg";
		image.src = homedirectory + "content/audio/thumbnail.png";
	}
	else if (item.ft == "mp4" || item.ft == "mp5") { //video
		var thumbnail_prefix = item.fn;
		thumbnail_prefix = thumbnail_prefix.substr(0, thumbnail_prefix.indexOf('.'));

		var image = document.createElement("img");
		image.className = "resultsimg";
		image.src = homedirectory + "content/videos/" + thumbnail_prefix + "_thumb.jpg";
	}
	else if (item.ft == "jpg"  || item.ft == "gif" || item.ft == "png" ) { //picture
		var thumbnail_prefix = item.fn;
		thumbnail_prefix = thumbnail_prefix.substr(0, thumbnail_prefix.indexOf('.'));

		var image = document.createElement("img");
		image.className = "resultsimg";
		image.src = homedirectory + "content/pictures/" + thumbnail_prefix + "_thumb.jpg";
	}
	else if (item.ft == "pdf") { //pdf
		var thumbnail_prefix = item.fn;
		thumbnail_prefix = thumbnail_prefix.substr(0, thumbnail_prefix.indexOf('.'));

		var image = document.createElement("img");
		image.className = "resultsimg";
		image.src = homedirectory + "content/pdfs/" + thumbnail_prefix + "_thumb.jpg";
	}
	else if (item.ft == "EP") {
		var image = document.createElement("img");
		image.className = "resultsimg";
		image.src = homedirectory + "content/epaath/thumbnail.png";
	}
	// else {
	// 	var image = document.createElement("img");
	// 	image.id = "resultsimg";
	// 	image.src = "images/kitty.jpg";
	// }
	div.appendChild(image);

	// Display ID
	var loomaID = document.createElement("p");
	loomaID.id = "result_ID";
	loomaID.innerHTML = "<b>ID: </b>" + item.ch_id;
	div.appendChild(loomaID);

	// Display file type
	var filetype = document.createElement("p");
	filetype.id = "result_ft";
	filetype.innerHTML = "<b>File type: </b>" + item.ft;
	div.appendChild(filetype);

	// Display file name
	var filename = document.createElement("p");
	filename.id = "result_fn";
	filename.innerHTML = "<b>File name: </b>" + item.fn;
	div.appendChild(filename);

	var previewButton = document.createElement("button");
	previewButton.innerText = "Preview";
	previewButton.className = "preview";
	// previewButton.onclick = preview_result(item);
	$(previewButton).bind("click", function() {
		preview_result(collection, item);
	});
	div.appendChild(previewButton);

	return div;
};

var createDictionaryDiv = function(item) {
	var collection = "dictionary";
	var div = document.createElement("div");
	div.className = "resultitem";

	var image = document.createElement("img");
	image.className = "resultsimg";
	image.src = homedirectory + "content/dictionaries/thumbnail.png";
	div.appendChild(image);

	var loomaID = document.createElement("p");
	loomaID.id = "result_ID";
	loomaID.innerHTML = "<b>ID: </b>" + item.ch_id;
	div.appendChild(loomaID);

	var resulttype = document.createElement("p");
	resulttype.id = "result_ID";
	resulttype.innerHTML = "<b>Result type: </b> Dictionary entry";
	div.appendChild(resulttype);

	var word = document.createElement("p");
	word.innerHTML = "<b>Word: </b>" + item.en;
	div.appendChild(word);

	var part = document.createElement("p");
	part.innerHTML = "<b>Part of speech: </b>" + item.part;
	div.appendChild(part);

	var previewButton = document.createElement("button");
	previewButton.innerText = "Preview";
	previewButton.className = "preview";
	// previewButton.onclick = preview_result(item);
	$(previewButton).bind("click", function() {
		preview_result(collection, item);
	});
	div.appendChild(previewButton);

	return div;
};









/////////////////////////// PREVIEW ///////////////////////////

// When you click the preview button
var preview_result = function(collection, item) {
	console.log("PREVIEWING THINGS");

	if (collection == "chapters") {
		console.log("chapters");
		// Chapter (pn of textbook)
		var str = item._id;
		var arr_split = str.split("");

		// For loop extracts the last 2 numbers as the chapter.

/////////////// THIS ACCOMMODATES FOR LACK OF 0'S BEFORE SOME OF THEM. LOL UGH.
		// If there is a decimal
			// If there are 2 numbers between the last letter & the decimal
				// Extract the 2 numbers between the last letter & the decimal
				// If the first number is 0
					// current chapter = the 2nd number
				// Else if the first number is not 0
					// concatenate the 2 numbers
					// current chapter = the 2 numbers
			// Else if there is 1 number between the last letter & the decimal
				// Extract the number between the last letter & decimal
				// current chapter = that number
		// Else if there is no decimal
			// If there are 2 numbers after the last letter
					// Extract the 2 numbers after the last letter
					// If the first number is 0
						// current chapter = the 2nd number
					// Else if the first number is not 0
						// concatenate the 2 numbers
						// current chapter = the 2 numbers
				// Else if there is 1 number after the last letter
					// Extract the number after the last letter
					// current chapter = that number
/////////////////////////////

// TO DO
// - extract sections when there is a decimal
// - some of them have display names & some dont & some have nepali dns & some dont & idk
// - add Roshan's function for mongo fix _id object into not object b/c i took that out when i was making the 3 arrays into 4 arrays


			for (var i = arr_split.length-1; i>=0; i--) {
				var currentChapter = arr_split[i-1].concat(arr_split[i]);
				arr_split.splice(i, 1);
				arr_split.splice(i-1, 1);
				break;
			}

		if (arr_split.length == 3) {	// If the subject is EN, or SS (or something with 2 letters)
			arr_split[1] = arr_split[1].concat(arr_split[2]);
			arr_split.splice(2, 1);
		}
		else if (arr_split.length < 3) {	// If the subject is M or S, N (or something with 1 letter)
			// MAKE THIS WORK
		}

		var currentGradeNumber = arr_split[0];
		var currentGrade = "Class".concat(arr_split[0]);
		if (arr_split[1] == "EN") {
			var currentSubject = "English";
		}
		else if (arr_split[1] == "M") {
			var currentSubject = "Math";
		}
		else if (arr_split[1] == "N") {
			var currentSubject = "Nepali";
		}
		else if (arr_split[1] == "S") {
			var currentSubject = "Science";
		}
		else if (arr_split[1] == "SS") {
			var currentSubject = "SocialStudies";
		}

		document.querySelector("div#displaybox").innerHTML = '<embed src="' + homedirectory + 'content/textbooks/' + currentGrade + "/" + currentSubject + "/" + currentSubject + "-" + currentGradeNumber + '.pdf#page=' + item.pn + '" width="100%" height="100%" type="application/pdf">';
	}


	else if (collection == "textbooks") {
		console.log("textbooks");
		document.querySelector("div#displaybox").innerHTML = '<embed src="' + homedirectory + 'content/' + item.fp + item.fn + '" width="100%" height="100%" type="application/pdf">';
	}


	else if (collection == "activities") {
		if(item.ft == "mp4" || item.ft == "mov" || item.ft == "mp5") {
			document.querySelector("div#displaybox").innerHTML = '<video width="100%" height="100%" controls> <source src="' + homedirectory + 'content/videos/' + item.fn + '" type="video/mp4"> </video>';
			// var newParagraph = document.createElement("p");
			// newParagraph.innerText = "media type: video";
			// document.querySelector("div#timelineBox").appendChild(newParagraph);
		}
		else if(item.ft=="mp3") {
		document.querySelector("div#displaybox").innerHTML = '<audio controls> <source src="' + homedirectory + 'content/audio/' + item.fn + '" type="audio/mpeg"></audio>';
		}
		// Pictures
		else if(item.ft=="jpg" || item.ft=="gif" || item.ft=="png") {
			document.querySelector("div#displaybox").innerHTML = '<img src="' + homedirectory + 'content/pictures/' + item.fn + '"id="displayImage">';
		}
		else if (item.ft=="EP") {
		document.querySelector("div#displaybox").innerHTML = '<object type="text/html" data="' + homedirectory +
		                                                      'content/epaath/activites/' + item.fn  +
		                                                      'style="width:100%; height:100%; margin:1%;"> </object>';
		}
	}

	else if (collection == "dictionary") {
		document.querySelector("div#displaybox").innerHTML = item.def;
	}


	// Chapter information

	// Video

	// Audio

	// Definiton

	// Game

};
//*********************************************************************** end of things we need for  **********************************************************************************************

