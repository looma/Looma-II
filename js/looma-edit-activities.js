/*
LOOMA javascript file
Filename: looma-editor_template.js
Description: template for Looma editor tools, like Lesson Plan Editor, Slideshow Editor, etc

Programmer name: Skip
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 04 2018
Revision: Looma 3.0
 */

'use strict';

//var savedcheckpoint;   //savedTimeline is checkpoint of timeline for checking for modification
//var savedSignature ='';   //savedSignature is checkpoint of timeline for checking for modification
var loginname;
//var homedirectory = "../";
//var $timeline;

var searchName = 'edit-activities-search';

function submitChanges (event) {  //check the form entries and submit to backend
    var n, str, len, arr, $checked, errors;
    event.preventDefault();
    
    errors = '';
    if ($('#innerResultsDiv .filter-checkbox:checked').length <= 0)
        errors = 'No Activities are checked for modification.<br>';
    
    else if ($('#innerResultsDiv .filter-checkbox:checked').length > 10)
        errors = 'Don\'t change more than 10 activities at a time.<br>';

    else if ($('#innerResultsDiv .filter-checkbox:checked').length > 1 && $('#dn-change').val())
        errors = 'Can\'t change display name for more than 1 activity at a time.<br>';

    else if ($('#grade-chng-menu').val() && $('#subject-chng-menu').val() && !$('#chapter-chng-menu').val() )
        errors = 'Must specify a specific chapter to set.<br>';
    
    
    /* ADD ERROR: if class and subject are set, chapter must be set*/
    
    if (errors) {  //validation here
        LOOMA.alert(errors + 'Modify changes and re-submit');
    } else {
        n = $('#innerResultsDiv .filter-checkbox:checked').length;
        str = (n==1 ? ' 1 activity?' : n + ' activities?');
  
    /*    arr = [];
        $('#innerResultsDiv  .filter-checkbox:checked').each(function() {
            arr.push( $(this).parent().data('mongo')['_id']['$id']);
        });
        $('#changes-activities').val(arr);
 */
        $checked = $('#innerResultsDiv .filter-checkbox:checked');
    
        len = $('.changes-activities').length;
        for (var i=0 ; i< len && i < 10; i++) {
            $($('.changes-activities')[i]).val(null);
        };
        
        len = $checked.length;
        for (var i=0 ; i< len && i < 10; i++) {
            var val = $($checked[i]).parent().data('mongo')['_id']['$id'];
            $($('.changes-activities')[i]).val(val);
        };
        
        /*  for (var i=len ; i< len && i < 10; i++) {
            $($('.changes-activities')[i]).prop('disabled', true);
        }; */
        
            LOOMA.confirm('Do you really want to modify ' + str,
                    function() {
                        $.post("looma-database-utilities.php",
                            $("#changes").serialize(),   //NOTE: sends cmd=editActivity, and collection=activities to database-utilities.php
                            function (result) {LOOMA.alert('Changes successful',4, true);},
                            //function (result) {LOOMA.alert('Changes FAILED',    7, true);},  //NOTE: 'fail' function not allowed
                            //  NOTE: should return any ERROR in 'result' and process it here
                            "json"
                        );
                    },
                    function(){console.log('Edit Activity submit canceled by user');}
                    );
    }
};  //  end submitChanges()

function clearResults() {
    //$("#innerResultsMenu").empty();
    $("#innerResultsDiv" ).empty();
    $('#details').hide();
    $('.hint').show();
    //$("#previewpanel"    ).empty();
    
} //end clearResults()


//////////////////////////////////
///////  displayResults    ///////
//////////////////////////////////
function displayResults(results) {
    var result_array = [];
    result_array['activities'] = [];  //array to store ACTIVITIES returned by SEARCH
    result_array['chapters']  = [];   //array to store CHAPTERS returned by SEARCH
    
    for (var i=0; i < results.length; i++) {
        if (results[i]['ft'] == 'chapter') result_array['chapters'].push(results[i]);
        else                               result_array['activities'].push(results[i]);
    };
    
    $('.hint').hide();
    $('#innerResultsDiv').empty();
    $('#details').hide();
    displaySearchResults(result_array);
    
    $('.info'           ).hover(
        function() {showInfo($(this).closest('.activityDiv'));}
        //, function() {$('#details').hide();}
    );

//
}; //end displayresults()


function showInfo (activity) {
    
    $('#details').html(   '<p>dn: ' + $.data(activity[0]).mongo.dn + '</p>'
                        + '<p>fn: ' + $.data(activity[0]).mongo.fn + '</p>'
                        + '<p>fp: ' + $.data(activity[0]).mongo.fp + '</p>'
                        + '<p>ft: ' + $.data(activity[0]).mongo.ft + '</p>'
                        + '<p>src: ' + $.data(activity[0]).mongo.src + '</p>'
                        + '<p>ch_id: ' + $.data(activity[0]).mongo.ch_id + '</p>'
                        + '<p>key1: ' + $.data(activity[0]).mongo.key1 + '</p>'
                        + '<p>key2: ' + $.data(activity[0]).mongo.key2 + '</p>'
                        + '<p>key3: ' + $.data(activity[0]).mongo.key3 + '</p>'
                        + '<p>key4: ' + $.data(activity[0]).mongo.key4 + '</p>'
                        + '<button class="popup-button" id="dismiss-popup"><b>X</b></button>'
        ).show();
    $('#dismiss-popup').click(function() {$('#details').hide();});
};

/////////////////////////////////////////////////////////////
/////////////////  FILL IN SEARCH RESULTS PANE //////////////
/////////////////////////////////////////////////////////////

function displaySearchResults (filterdata_object) {
    var currentResultDiv = document.createElement("div");
    currentResultDiv.id = "currentResultDiv";
    $(currentResultDiv).appendTo("#innerResultsDiv");


//***********************
// display Activities in Search Results pane
//***********************
    
    var actResultDiv = document.createElement("div");
    actResultDiv.id = "actResultDiv";
    $(actResultDiv).appendTo(currentResultDiv);
    
    var collectionTitle = document.createElement("h5");
    collectionTitle.id = "activityTitle";
    
    var activitiesarraylength = filterdata_object.activities.length;
    if (activitiesarraylength == 0) {
        collectionTitle.innerHTML = "<a class='heading' name='activities'>Activities (0 Results)</a>";
    }
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


//***********************/
// display Chapters in Search Results pane
//***********************/
    
    var chaptersarraylength = filterdata_object.chapters.length;
    if (chaptersarraylength > 0) {
        collectionTitle = document.createElement("h5");
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


}; //end displaySearchResults()



function thumbnail (item) {
    
    //builds a filepath/filename for the thumbnail of this "item" based on type
    var collection, filetype, filename, filepath;
    var thumbnail_prefix, path, imgsrc, idExtractArray;
    
    if ($(item).attr('thumb')) return $(item).attr('thumb');  //some activities have explicit thumbnail set
    
    collection = $(item).attr('collection');
    filetype = $(item).attr('ft');
    if ($(item).attr('fn')) filename = $(item).attr('fn');
    if ($(item).attr('fp')) filepath = $(item).attr('fp');
    
    if (collection == "chapters" || item.pn != null) {
        idExtractArray = extractItemId(item);
        filepath = idExtractArray["currentGradeFolder"] + "/" + idExtractArray["currentSubjectFull"] + "/";
        filename = idExtractArray["currentSubjectFull"] + "-" + idExtractArray["currentGradeNumber"];
        imgsrc = LOOMA.thumbnail(filename, filepath, 'chapter');
    }
    else imgsrc = LOOMA.thumbnail(filename, filepath, filetype);
    
    return imgsrc;
}; // end thumbnail()

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
    }


////////////////////////////////////////
///////  createActivityDiv  //////////
////////////////////////////////////////
function createActivityDiv (activity) {
    
    function addResultItem(activity) {
      //  "<span class='fn'>" . $file . "</span>"
    }
    
    function innerActivityDiv (item) {
        
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
        
        $(activityDiv).attr("data-collection", 'activities');
        $(activityDiv).attr("data-type", item['ft']);
        
        item.collection = 'activities';
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
        //  "<input class='text' name='dn' value='" . $dn . "'>" .
       
        // Display name
        var textdiv = document.createElement("div");
        textdiv.className = "textdiv";
        $(textdiv).appendTo(activityDiv);
        
        // Display Name
        if (item.dn) var dn = item.dn.substring(0, 40); //else dn = item.ndn.substring(0,20);
        $("<input/>", {
            class : "result_dn",
            value: item.dn
        }).appendTo(textdiv);
        
        $('<br>').appendTo(textdiv);
        
        // File Type
        $("<span/>", {
            class : "result_ft",
            html : LOOMA.typename(item.ft) + "  "
        }).appendTo(textdiv);
    
        // ID
        if ('ch_id' in item) {
            $("<span/>", {
                class : "result_ID",
                html : "[" + item.ch_id + "]"
            }).appendTo(textdiv);
        };
        
        // INFO button for each activity - popups detailed info for the activity
        var $info = $('<button class="info">');
        $info.appendTo(activityDiv);
    
        //  "<input type='checkbox' form='list' class='filter_checkbox'>" .
        var $checkbox = $('<input type="checkbox" form="list" class="filter-checkbox">');
        $checkbox.appendTo(activityDiv);
 
        
        return activityDiv;
    }; //end innerActivityDiv()
    
    
    // var idExtractArray = extractItemId(activity);
    
    var div = document.createElement("div");
    div.className = "resultitem";
    
    var newDiv = innerActivityDiv(activity);
    $(newDiv).appendTo(div);
    
    return div;
};  // end createActivityDiv()

$(document).ready(function() {
    
    loginname = LOOMA.loggedIn();
    
    $('#details').draggable();
    
    //$("#keyword-div .keyword-dropdown, .keyword-changes").off('change').change(showKeywordDropdown);
    $(".keyword-changes").change(showKeywordDropdown);
    
   // $("#grade-chng-menu, #subject-chng-menu").change(function() {
   //     showChapterDropdown(null, $('#grade-chng-menu'), $('#subject-chng-menu'), $('#chapter-chng-menu'))
   // });
    
    
            
            $("#grade-chng-menu").change(function() {
                showSubjectDropdown($('#grade-chng-menu'), $('#subject-chng-menu'), $('#chapter-chng-menu'))
            });  //end drop-menu.change()
            
            $("#subject-chng-menu").change(function() {
                showChapterDropdown($('#grade-chng-menu'), $('#subject-chng-menu'), $('#chapter-chng-menu'))
            });  //end drop-menu.change()
            
            
    
    $('#check-all'  ).click( function() { $('.filter-checkbox').prop('checked', true);});
    $('#uncheck-all').click( function() { $('.filter-checkbox').prop('checked', false);});
    
    $('#dn-clear').click(       function(e) {e.preventDefault(); $('#dn-changes').val(""); });
    $('#keyword-clear').click(  function(e) {e.preventDefault(); $('.keyword-changes').val(""); });
    $('#source-clear').click(   function(e) {e.preventDefault(); $('.source-changes').prop('checked', false); });
    $('#textbook-clear').click( function(e) {e.preventDefault(); $('.chapter-changes').val(""); });
    
    $('#submit-changes').click( submitChanges );
    
    $('#dismiss').off('click').click( function() {
        LOOMA.confirm('Leave Activity Editor Page?',
                        function() {window.history.back();},
                        function() {return;});
    });
    
    window.onbeforeunload = function() {
        event.preventDefault();
        // Chrome requires returnValue to be set.
        event.returnValue = '';
        console.log("activity editor 'beforeunload' event");
    };
});
