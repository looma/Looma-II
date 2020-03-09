/*
Name: Ian
Email: ian.costello@menloschool.org
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2016 6
Revision: Looma 2.0.0
File: looma-contentNav.js
Description:  Javascript for looma-contentNav.php
*/
var resultsShown;
var fileBase = "../content/";

$(document).ready(function(){
  var page = 0;
  var lvlSelected;
  var classSelected;
  var chapter_id;
  var selectedId;
  var currSelectedFile;
  var currSelectedFileType;
  var inSearch = true;
  var displayThumbnails = true;



//////////////////////////////////////////////
//change by skip 2017 03

            initializeDOM();   //this code from looma-edit-lesson.js [by SCU] that sets up the activity search filters

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

//////////////////////////////////////////////


  //Toggle Between Adding Activities and Assigning Activities
  $(document).on("click", "#modeSelector", function(){
    if (inSearch) {
      $("#headingTitle").text("Content Navigation: Adding Activities");
      $("#modeSelector").text("Editor");
      $("#showThumbnails").removeClass("hidden");
      openContentNav("", displayThumbnails);
      inSearch = false;
    } else {
      $("#headingTitle").text("Content Navigation: Assigning Activities");
      $("#modeSelector").text("Add New");
      $("#showThumbnails").addClass("hidden");
      search($("#searchBar").val(), false, page);
      inSearch = true;
    }
  });

  //
  //Toggle Between activity adder and results
  $(document).on("click", "#thumbnailButton", function(){
    displayThumbnails = document.getElementById("thumbnailButton").checked;
  });

  $(document).on("click", ".directoryButton", function(){
    var linksTo = $(this).attr("linksTo");
    //If User Choose To Back
    if ($(this).attr("shouldGoToParent") == "true") {
      linksTo = linksTo.substr(0, linksTo.length-1);
      linksTo = linksTo.substr(0, linksTo.lastIndexOf("/")+1);
    }
    openContentNav(linksTo, displayThumbnails);
  });

  $(document).on("click", ".fileButton", function(){
    var filePath = fileBase + $(this).attr("linksTo");
    currSelectedFile = filePath.substring(filePath.lastIndexOf("/") + 1);
    currSelectedFileType = filePath.substring(filePath.lastIndexOf(".") + 1);

    //Try To Guess File Name by removing underscores
    var displayName = currSelectedFile.substring(0, currSelectedFile.indexOf("."));
    for (var i = 0; i < displayName.length; i+=1) {
      var charAt = displayName.charAt(i);
      if (charAt == "_" || charAt == "-") {
        displayName.replace("_", " ");
        displayName = displayName.substring(0, i) + " " + displayName.substring(i+1, displayName.length);
      }
    }

    //Update and load info
    loadPreviewWithParams(filePath, currSelectedFile, currSelectedFileType);
    $("#titleInput").val(displayName);
    loadChapterId(currSelectedFile);
  });

  //When a chapter/lesson is selected set the database id and close the modal
  $(document).on("click", "#contentNavButton", function() {
    $(".chapterNav").removeClass('hidden');
    $(".chapterSearch").addClass('hidden');
  });

  //When a chapter/lesson is selected set the database id and close the modal
  $(document).on("click", "#searchLessonButton", function() {
    $(".chapterNav").addClass('hidden');
    $(".chapterSearch").removeClass('hidden');
  });

  //When a chapter/lesson is selected set the database id and close the modal
  $(document).on("click", ".chapterResult", function() {
    chapter_id = $(this).attr('ch_id');
    $("#contentNavModal").modal("toggle");
    $(".chapterNav").removeClass("hidden");
    $(".chapterSearch").addClass('hidden');
    $("#chapterSearchBar").val("");
    lvlSelected = null;
    classSelected = null;
    resetModal();
  });

  //When a chapter/lesson is selected set the database id and close the modal
  $(document).on("click", ".individualResult", function(){
    selectedId = $(this).attr("dbid");
    loadPreview(selectedId);
    $("#titleInput").val($(this).attr("title"));
    $(".individualResult").removeClass("highlighted");
    $(this).addClass("highlighted");
    var currClass = $(this).attr("chid");
    if (currClass == "") {
      currClass = "Not Assigned";
    }
    $("#currClass").text(currClass);
  });

  //On Level Select Update the Selected level
  $(document).on("click", ".lvlSelect", function() {
    $(".lvlSelect").removeClass("active");
    $(this).addClass("active");
    lvlSelected = this.id;
    if (classSelected != undefined) {
      loadPage(lvlSelected, classSelected);
    }
  });

  //On Class Select load the correct chapters
  $(document).on("click", ".classSelect", function() {
    $(".classSelect").removeClass("active");
    $(this).addClass("active");
    classSelected = this.id;
    if (lvlSelected != undefined) {
      loadPage(lvlSelected, classSelected);
    }
  });

  //On Class Select load chapters titles
  $(document).on("click", "#inputButton", function() {
    var titleText = $("#titleInput").val();

    //Make sure user selected activity and destination
    if (titleText == undefined) {
      alert("Please Select An Activity First!");
    } else if (chapter_id == undefined) {
      alert("Please Select A Destination To Insert!");
    } else {
      $("#confirmationModal").modal("show");
      $("#activityName").text(titleText);
      $("#locationName").text(chapter_id);
      if (!(((chapter_id == "Not Assigned")) || ($("#currClass").text() == "Not Assigned"))) {
        $("#confirmButton").removeClass("hidden");
      }
    }
  });

  //When a chapter/lesson is selected set the database id and close the modal
  $(document).on("click", "button.lessonButton", function(){
    var button = event.target;
    chapter_id = this.getAttribute("data-ch");
    $("#contentNavModal").modal("toggle");
    lvlSelected = null;
    classSelected = null;
    resetModal();
  });

  //If They Choose To Unassign An Activity
  $(document).on("click", "#unassignButton", function() {
    chapter_id = "Not Assigned";
    $("#contentNavModal").modal("toggle");
    lvlSelected = null;
    classSelected = null;
    resetModal();
  });

  //Confirm placement of activity
  $(document).on("click", "#overrideButton", function() {
    var titleText = $("#titleInput").val();

    if (inSearch) {
      updateDatabase(selectedId, chapter_id, titleText, false);

      //Update Info On Page
      search($("#searchBar").val(), false, page);
    } else {
      insertToDatabase(chapter_id, titleText, currSelectedFile, currSelectedFileType);
    }

    $("#currClass").text(chapter_id);
    $("#confirmationModal").modal("hide");
    $("#confirmButton").addClass("hidden");
  });

  //Confirm placement of activity
  $(document).on("click", "#confirmButton", function() {
    var titleText = $("#titleInput").val();
    updateDatabase(selectedId, chapter_id, titleText, true);
    $("#confirmationModal").modal("hide");
    $("#confirmButton").addClass("hidden");
    resetModal();

    //Update Info On Page
    search($("#searchBar").val(), false, page);
    $("#currClass").text(chapter_id);
  });

  //When The Bottom Of Results is hit load more
  $(".results").on("scroll", function() {
    //If There Are More Results To Show
    if (inSearch && resultsShown%10 == 0) {
      //If They"ve Hit Bottom of Div
      if($(this)[0].scrollHeight <= $(this).scrollTop() + $(this).innerHeight()) {
        page +=1;
        search($("#searchBar").val(), true, page);
      }
    }
  });

  //When user filters out a type update
  $(":checkbox").change(function() {
    if(inSearch) {
      search($("#searchBar").val(), false, page);
    }
   });

  //On page load, load default results
  search("", false, page);
});

/*Search Function
Search: String To Search For
Append: Whether To Append to Exisiting Results or Replace
Page: What page of results to load
*/
function search(search, append, page) {
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function() {
    if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
      if (!append) {
        document.getElementById("resultsArea").innerHTML = xmlhttp.responseText;
      } else {
        document.getElementById("resultsArea").innerHTML += xmlhttp.responseText;
      }

      resultsShown = $("#resultsArea div").length;
    }
  };

  //Get Query Options
  var videosChecked = document.getElementById("videosChecked").checked;
  var webpagesChecked = document.getElementById("webpagesChecked").checked;
  var audioChecked = document.getElementById("audioChecked").checked;
  var imagesChecked = document.getElementById("imagesChecked").checked;
  var pdsChecked = document.getElementById("pdfsChecked").checked;
  if (!append) {
    page = 0;
  }

  //Build Search With Results
  var toLoad = "looma-contentNav-results.php?q=" + search + "&page=" + page;
  toLoad = toLoad + "&videosChecked=" + videosChecked;
  toLoad = toLoad + "&webpagesChecked=" + webpagesChecked;
  toLoad = toLoad + "&audioChecked=" + audioChecked;
  toLoad = toLoad + "&imagesChecked=" + imagesChecked;
  toLoad = toLoad + "&pdfsChecked=" + pdsChecked;

  //Send Request
  xmlhttp.open("GET", toLoad, true);
  xmlhttp.send();
} //END OF SEARCH

/*Chapter search Function
Search: String To Search For
Append: Whether To Append to Exisiting Results or Replace
Page: What page of results to load
*/
function chapterSearch(search) {
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function() {
    if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
      document.getElementById("chapterResults").innerHTML = xmlhttp.responseText;
    }
  };

  //Send Request
  xmlhttp.open("GET", "looma-textbook-search.php?q=" + search, true);
  xmlhttp.send();
}

function openContentNav(toAppend, displayThumbnails) {
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function() {
    if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
      document.getElementById("resultsArea").innerHTML = xmlhttp.responseText;
    }
  };
  xmlhttp.open("GET", "looma-contentNav-fileNav.php?q="+ toAppend + "&showThumbnails=" + displayThumbnails, true);
  xmlhttp.send();
}

//Load A Content Preview Given a mongo ID
function loadPreview(db_id) {
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function() {
    if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
      document.getElementById("preview").innerHTML = xmlhttp.responseText;
    }
  };
  xmlhttp.open("GET", "looma-contentNav-preview.php?" + "dbid=" + db_id, true);
  xmlhttp.send();
}

//Load A Content Preiew Given Relevant Info
function loadPreviewWithParams(filePath, fileName, fileType) {
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function() {
    if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
      document.getElementById("preview").innerHTML = xmlhttp.responseText;
    }
  };
  xmlhttp.open("GET", "looma-contentNav-preview.php?" + "fp=" + filePath + "&fn=" + fileName + "&ft=" + fileType , true);
  xmlhttp.send();
}

function loadChapterId(fileName) {
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function() {
    if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
      var response = xmlhttp.responseText;
      if (response == "") {
        response = "Not Assigned";
      }
      document.getElementById("currClass").innerHTML = response;
    }
  };
  xmlhttp.open("GET", "looma-contentNav-databaseUpdate.php?cmd=getChapterId&fn="+fileName);
  xmlhttp.send();
}

function insertToDatabase(ch_id, title, fileName, fileType) {
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.open("GET", "looma-contentNav-databaseUpdate.php?cmd=insert&title=" + title + "&chid=" + ch_id + "&fn=" + fileName + "&ft=" + fileType);
  xmlhttp.send();
}

//Update A Datebase ID given an id, ch id, and title
function updateDatabase(db_id, ch_id, title, isDuplicate) {
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.open("GET", "looma-contentNav-databaseUpdate.php?cmd=update&title=" + title + "&dbid=" + db_id + "&chid=" + ch_id + "&duplicate=" + isDuplicate);
  xmlhttp.send();
}

function resetModal() {
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function() {
    if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
      document.getElementById("classSelect").innerHTML = xmlhttp.responseText;
      document.getElementById("lessonSelect").innerHTML = "";
      document.getElementById("chapterResults").innerHTML = "";
    }
  };
  xmlhttp.open("GET", "looma-contentNav-classNav.php");
  xmlhttp.send();
}

//Loads all the chapters given a set className and subjectName
function loadPage(className, subjectName) {
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function() {
    if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
      document.getElementById("lessonSelect").innerHTML = xmlhttp.responseText;
    }
  };
  xmlhttp.open("GET", "looma-contentNav-lessonSelect.php?" + "class=" + className +
  "&subject=" +
  subjectName, true);
  xmlhttp.send();
}


// set up activity search FORM [Skip]

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
            "looma":{  id : "ft_looma",     display : "Looma Page"   }
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




