/*
LOOMA javascript file
Filename: looma-lessonopen.js
Description:

Programmer name: SCU
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: Nov 16
Revision: Looma 2.4

Comments:
 */

'use strict';

/*define functions here */

var load = function() {
	//Retrieve all valid timelines
	console.log("load() called");

//used to get a list of all existing LPs to display on page and have user select which one to open
// replace with looma-database.search.php as used in text files

//
//CHANGE this to read info from MONGO, not from timelines.json
//
/*
            $.post("looma-lesson-open.php", timelineID, function(data){
                data = JSON.parse(data);
                $("#titleInput").attr("value", data.name);
            }).fail(function(jqXHR){
                console.log("looma-lesson-open.php " + jqXHR.status);
            });

            $.ajax({
                url: "looma-lesson-openTimeline.php",
                dataType: 'json',
                async: false,
                data: timelineID,
                success: function(timelineData){
                    console.log("getting timeline");
                    $.each(timelineData, function(index, val){
                        timelineArray.push(val);
                        console.log(timelineData);
                    });
                }
            }).fail(function(jqXHR){
                console.log(jqXHR.status)
                $.get("looma-lesson-openTimeline.php", timelineID, function(timelineData){
                    console.log(timelineData);
                });
            });
 */
// then remove timelines.json from DELETE and SAVE
//

	$.getJSON("timelines.json", function(timelinesJSON) {
		//console.log(timelinesJSON);
		//timelinesJSON = JSON.parse(timelinesJSON);
		//For each object in timeline directory, populate list
		$.each(timelinesJSON, function(index, val) {
			// console.log("index: " + index + " id: " + val._id);

			createOpenListElement(index, val.name, val._id, val.line);

		});

	 }).fail(function(jqXHR){console.log(jqXHR.status);});
};

var createOpenListElement = function(index, itemString, itemId, line) {
	// var div = document.createElement("div");
	var element = {
		"index" : index,
		"itemString" : itemString,
		"itemId" : itemId,
		"line" : line
	};

	$('<li/>', {
		id : "time" + index,
		class: "lessonEntry",
		value: itemId,
	    title: itemString,
	    rel: 'external',
	    text: itemString,
	}).appendTo('#lessonDiv ul');

	$('<div/>', {
		class: "editPresent" + index,
	}).appendTo('#time' + index);

	$('.editPresent'+index).css({
    	"float": "right"
    });

	$('<button/>', {
		text: "Edit",
		class: "btnOpenTimeline",
		id: "editBtn" + index,
	}).appendTo('.editPresent' + index);
	$("#editBtn" + index).bind("click", function(){
			window.location.href = 'looma-lesson-plan.html?timelineId=' + encodeURI(itemId);
	});
	$('<button/>', {
		text: "Present",
		class: "btnOpenTimeline",
		id: "presentBtn" + index,
	}).appendTo('.editPresent' + index);
	$("#presentBtn" + index).bind("click", function(){
		window.location.href = 'looma-lesson-present.php?timelineId=' + encodeURI(itemId);
	});
	$('<button/>', {
		text: "Delete",
		class: "btnOpenTimeline",
		id: "deleteBtn" + index,
		// onclick : "deleteFromPage()"
	}).appendTo('.editPresent' + index);
	$("#deleteBtn" + index).bind("click", function(){
		var li = this.parentNode;
		li.parentNode.remove();
		$.post("looma-lesson-delete.php", element, function(element) {
			console.log(element);
		});
	});

};
