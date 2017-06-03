/*
Filename: looma-import-content.js
Description: version 1 [skip, Fall 2016]
Derived from looma-lesson-plan.js
Programmer name: Skip
Owner: VillageTech Solutions (villagetechsolutions.org)
 */

'use strict';

/////////////////////////// INITIALIZING  ///////////////////////////

var path;

function display_name(item) {
    var dn = item.substr(0,item.lastIndexOf('.'));
    return dn.replace( /[_\/]/g, ' ');
};

function extension(item) {
    return item.substr(item.lastIndexOf('.') + 1);
};

/*function fileclass (item) {
    var types = {'mp4':'video', 'png':'image','jpg':'image'};
    var ext = extension(item);
    return (ext in types) ? types[ext] : "";
};
*/

function display_file (item) {
    var line;
    if (item.reg.reg) { //this file is registered as an activity already
        line = '<div class="fileitem reg">';
        line += '<input type="checkbox" disabled >';
        line += 'File name: <span class="filename">' + item.fn + '</span>';
        line += item.reg.ch_id;
        line += '&nbsp; &nbsp; &nbsp; &nbsp; &nbsp;';
        line += 'Display name: <input type="text" disabled class="displayname" value="' + item.reg.dn + '"></div>';
     } else {
        line = '<div class="fileitem notreg">';
        line += '<input type="checkbox" class="check" value="' + item.fn + '">';
        line += 'File name: <span class="filename">' + item.fn + '</span>';
        line += 'Type: <span class="filetype">' + LOOMA.typename(extension(item.fn))  + '</span>';
        line += '&nbsp; &nbsp; &nbsp; &nbsp; &nbsp;';
        line += 'Display name: ';
        line += '<input type="text" class="dn" value="' + display_name(item.fn) + '"></div>';
    };

    $(line).appendTo($('#filelist'));
};

function get_file_list(path) {
         $('#filelist').empty();
         $.post("looma-library-utilities.php",
                {cmd: "list", fp:path},
                function(file_list) {
                   if (file_list.length == 0) $('#filelist').empty().append($('<p>No files in this folder</p>'));
                   else file_list.forEach(function(item) {display_file(item);});
                },
                'json'
              );
}; // end get_file_list()

/*
function get_khan() {
         $('#filelist').empty();
         $.post("looma-library-utilities.php",
                {cmd: "khanlist", fp:path},
                function(file_list) {
                    var f = JSON.parse(file_list);
                   if (f.length == 0) $('#filelist').empty().append($('<p>No files in this folder</p>'));
                   else f.forEach(function(item) {$('#filelist').append($(
                       '<p>' + item.fn +
                       '  dn: ' + item.dn +
                       '</p>'));});
                }
              );
}; // end get_khan()
*/

/*
function get_W4S() {
         $('#filelist').empty();
         $.post("looma-library-utilities.php",
                {cmd: "w4slist", fp:path},
                function(file_list) {
                    var f = JSON.parse(file_list);
                   if (f.length == 0) $('#filelist').empty().append($('<p>No files in this folder</p>'));
                   else f.forEach(function(item) {$('#filelist').append($(
                       '<p>' + item.fn +
                       '  dn: ' + item.dn +
                       '</p>'));});
                }
              );
}; // end get_W4S()
*/

function get_folder_list(path) {
         $.post("looma-library-utilities.php",
                {cmd: "open", fp:path},
                function(folder_list) {
                  var element = '<a href="looma-import-content.php?fp=' +
                                 folder_list.parentpath +
                                 '">Parent: ' +
                                 folder_list.parent +
                                 '</a><br>';
                  $(element).appendTo($('#folderlist'));
                  if (folder_list.list.length == 0) $('#folderlist').append($('<p>No sub-folders in this folder</p>'));
                   else {

                       folder_list.list.forEach(function(item) {
                           element = '<a href="looma-import-content.php?fp=' + path + '/' + item + '">' + item + '</a><br>';
                           $(element).appendTo( $('#folderlist') );
                           });
                    };
                },
                'json'
              );
}; // end get_folder_list()

function make_activities () {
        var list = [];
        $('.fileitem.notreg').each(function(index, item) { //iterate thru files that are not registered and that are checked
            if ($(item).find('.check').prop('checked')) {
             list.push({fn: $(item).find('.filename').text() ,
                 fp: path + '/' ,
                 ft:  $(item).find('.filetype').text(),
                 dn:  $(item).find('.dn').val(),
                 src:     $('#timeline #source').val(),
                 area:    $('#timeline #area').val() ,
                 subarea: $('#timeline #subarea').val() ,
                 tags:    $('#timeline #tags').val(),
                 marker: 'actreg'});
              };
            });

        if (list.length > 0) LOOMA.confirm (
                'Registering ' + list.length + ' activities. Continue?',
                function() {
                    $.post("looma-library-utilities.php",
                        {cmd: "new_activities", list: list},
                        function(result) {console.log(result);},
                        'json'
                      );
                      get_file_list(path);
                    },
                function(){return;},
                false);
}; //end make_activities()

/*
function make_khan_activities () {
        var list = [];
        $('.fileitem.notreg').each(function(index, item) { //iterate thru files that are not registered and that are checked
            if ($(item).find('.check').prop('checked')) {
             list.push({fn: $(item).find('.filename').text() ,
                 fp: path + '/' ,
                 ft:  $(item).find('.filetype').text(),
                 dn:  $(item).find('.dn').val(),
                 src:     'khan',
                 area:    $('#timeline #area').val() ,
                 subarea: $('#timeline #subarea').val() ,
                 tags:    $('#timeline #tags').val(),
                 marker: 'actreg'});
              };
            });

        if (list.length > 0) LOOMA.confirm (
                'Registering ' + list.length + ' activities. Continue?',
                function() {
                    $.post("looma-library-utilities.php",
                        {cmd: "new_activities", list: list},
                        function(result) {console.log(result);},
                        'json'
                      );
                      get_file_list(path);
                    },
                function(){return;},
                false);
}; //end make_khan_activities()
*/

/////////////////////////// ONLOAD FUNCTION ///////////////////////////
window.onload = function () {

    initializeDOM(); // fills in DOM elements - could be done in static HTML in the PHP file

    $('#clear_button').click(clearFilter);

    path = $('#dirname').text();
    $('.foldername').text(path);

    // call looma-library.php?fn=list&fp=path to get a list of files (not DIRs) in this folder
    get_file_list (path);
    // call looma-library.php?fn=open&fp=path to get a list of dirs (not files) in this folder
    get_folder_list (path);

    var loginname = LOOMA.loggedIn();

    $('#folderlist').hide();
    $('#showfolders').click( function () {
            if ($('#showfolders').text() == 'Change folder') {
                $('#folderlist').show();
                $('#showfolders').text('Close folder list');
            }
            else {
            $('#folderlist').hide();
            $('#showfolders').text('Change folder');
            }
        });

    $('#check').click (function() {$('.check').prop('checked',true);});

    $('#uncheck').click (function() {$('.check').prop('checked',false);});

    $('#submit').click (function() {make_activities();});
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
			document.querySelector("#previewpanel").innerHTML =

	//		'<video controls> <source src="' + homedirectory +
	//		         'content/videos/' + filename + '" type="video/mp4"> </video>';


	          // '<div id="video-player">' +
                    '<div id="video-area">' +
                        '<div id="fullscreen">' +
                            '<video id="video">' +
                                '<source id="video-source" src="' + homedirectory +
                                       'content/videos/' + filename + '" type="video/mp4">' +
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
			document.querySelector("div#previewpanel").innerHTML =
			     '<iframe src="' + homedirectory + 'content/pdfs/' + filename + '"' +
			     ' style="height:60vh;width:60vw;" type="application/pdf">';
		}
		else if(filetype=="mp3") {
		      document.querySelector("div#previewpanel").innerHTML = '<br><br><br><audio id="audio"> <source src="' +
		                      homedirectory + 'content/audio/' +
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


var initializeDOM = function() {

    //////////////////////////////////////////////////////
/////////////////////////// Fill in the DOM //////////
//////////////////////////////////////////////////////

    // Building Navbar -- all this could be in HTML

        // Filter: Search

        $("<div/>", {
            id : "div_search",
        }).appendTo("#search");

        //insert a hidden input that sets the 'collection' name for searches
        //$("<input type='hidden' id='collection' value='activities' name='collection'/>").appendTo("#search");

        $("<span/>", {
            class : "filter_label",
            html : "Search:",
        }).appendTo("#div_search");

        $("<input/>", {
            id : "searchString",
            class: "textBox",
            type : "text",
            placeholder: "enter filename to search for...",
            name : "search-term",
        }).appendTo("#div_search");


        // Filter: File Type

        var filetypes = {
            "image" :   {   id : "ft_image",     display : "Image"  },
            "video" :   {   id : "ft_video",     display : "Video"  },
            "audio" :   {   id : "ft_audio",     display : "Audio"   },
            "pdf" :     {   id : "ft_pdf",       display : "PDF"   }
            //"text" :    {   id : "ft_text",      display : "Text"   },
            //"html" :    {   id : "ft_html",      display : "HTML"   }
            //"looma":    {  id : "ft_looma",     display : "Looma Page"   }
            // SLIDESHOW should be added
            //    "slideshow":{   id : "ft_slideshow", display : "Slide Show"   }
        };

        $("<div/>", {
            id : "div_filetypes"
        }).appendTo("#search");

        $.each(filetypes, function (key, value) {
            $("<input/>", {
                class : "filter_checkbox",
                type : "checkbox",
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
            //if(key == 'pdf') $('<br>').appendTo("#div_filetypes");
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

}; // end initializeDOM()


