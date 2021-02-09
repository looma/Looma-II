/*
LOOMA javascript file
Filename: looma-content-request.js
Programmer name: Skip
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: May 2020
Revision: Looma 5.9
 */

'use strict';

var loginname, loginlevel;
var searchName = 'chapter-search';
var textbook = true;
var errors = "";

function clearResults() {
    //$("#innerResultsMenu").empty();
    $("#innerResultsDiv" ).empty();
    $('#details').hide();
    $('.hint').show();
    //$("#previewpanel"    ).empty();
    
} //end clearResults()

function clearSettings() {  // clears all the settings. used after a new SEARCH
    $('#dn-setting').val("").focus();
    $('#ndn-setting').val("");
    $('#ch_id-setting').val("");
    $('#nch_id-setting').val("");
    $('#ft-setting').val("");
    $('#fn-setting').val("");
    $('#url-setting').val("");
    $('.keyword-setting').val("");
    $('#lo-setting').prop('selectedIndex',0);
    $('#hi-setting').prop('selectedIndex',0);
} // end clearSettings()

//////////////////////////////////
///////  displayResults    ///////
//////////////////////////////////
function displayResults(results) {
    var result_array = [];
    result_array['activities'] = [];  //array to store ACTIVITIES returned by SEARCH
    result_array['chapters']  = [];   //array to store CHAPTERS returned by SEARCH
    
    if (results['list'].length > 0) {
        for (var i = 0; i < results['list'].length; i++) {
            if (results['list'][i]['ft'] == 'chapter') result_array['chapters'].push(results['list'][i]);
            else result_array['activities'].push(results['list'][i]);
        }
        $('.hint').hide();
        $('#innerResultsDiv').empty();
        clearResults();
        $('#details').hide();
        displaySearchResults(result_array);
    } else     $('#innerResultsDiv').text('No chapters found');
    
    $('.info').mouseover(function() {showInfo($(this).closest('.activityDiv'));});
    
    $('.info').mouseout(function() {$('#details').hide();});
    $('#media-submit').prop("disabled",false);
    
} //end displayresults()

function showInfo (activity) {
    
    $('#details').html(   '<p>dn: ' + $.data(activity[0]).mongo.dn + '</p>'
        + '<p>fn: ' + $.data(activity[0]).mongo.fn + '</p>'
        + '<p>fp: ' + $.data(activity[0]).mongo.fp + '</p>'
        + '<p>ft: ' + $.data(activity[0]).mongo.ft + '</p>'
        + '<p>src: ' + $.data(activity[0]).mongo.src + '</p>'
        + '<p>ch_id: ' + $.data(activity[0]).mongo.ch_id + '</p>'
        + '<p>nch_id: ' + $.data(activity[0]).mongo.nch_id + '</p>'
        + '<p>key1: ' + $.data(activity[0]).mongo.key1 + '</p>'
        + '<p>key2: ' + $.data(activity[0]).mongo.key2 + '</p>'
        + '<p>key3: ' + $.data(activity[0]).mongo.key3 + '</p>'
        + '<p>key4: ' + $.data(activity[0]).mongo.key4 + '</p>'
        + '<button class="popup-button" id="dismiss-popup"><b>X</b></button>'
    ).show();
    $('#dismiss-popup').click(function() {$('#details').hide();});
}
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
    
 /*
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
*/

//***********************/
// display Chapters in Search Results pane
//***********************/
    
    var chaptersarraylength = filterdata_object.chapters.length;
    if (chaptersarraylength > 0) {
        var collectionTitle = document.createElement("h5");
        collectionTitle.id = "chapterTitle";
    
        if (chaptersarraylength == 1) {
            collectionTitle.innerHTML = "<a class='heading' name='activities'>Chapters (1 Result)</a>";
        } else {
            collectionTitle.innerHTML = "<a class='heading' name='activities'>Chapters (" + chaptersarraylength + " Results)</a>";
        }
        actResultDiv.appendChild(collectionTitle);
    
        for (var i = 0; i < filterdata_object.chapters.length; i++) {
            var rElement = createActivityDiv(filterdata_object.chapters[i]);
        
            actResultDiv.appendChild(rElement);
        }
        $('button.add').click(function () {
            if ($(this).data('lang') === 'en') {
                if ($('#ch_id-setting').val()) $('#ch_id-setting').val($('#ch_id-setting').val() + ',');
                $('#ch_id-setting').val($('#ch_id-setting').val() + $(this).data('id'));
            }
            if ($(this).data('lang' )=== 'np' || $(this).data('match')) {
                if ($('#nch_id-setting').val()) $('#nch_id-setting').val($('#nch_id-setting').val() + ',');
                $('#nch_id-setting').val($('#nch_id-setting').val() + $(this).data('id'));
            }
        });
    
        $('button.preview').click(function () {
            preview_result($(this).closest('.activityDiv'));
            return false;
        });
    }
} //end displaySearchResults()

/*
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
} // end thumbnail()
*/

function extractItemId(item) {
    var ch_id = (item['ft'] == 'chapter')? item['_id'] : item['ch_id'];
    return LOOMA.parseCH_ID(ch_id);
}
////////////////////////////////////////
///////  createActivityDiv  //////////
////////////////////////////////////////
function createActivityDiv (activity) {
    
    function innerActivityDiv (item) {
        
        var activityDiv = document.createElement("div");
        activityDiv.className = "activityDiv";
        
        $(activityDiv).attr("data-collection", 'chapters');
        $(activityDiv).attr("data-type", 'chapter');
        $(activityDiv).attr("data-lang", $('#lang-drop-menu').val());
        
        item.collection = 'chapters';
        $.data(activityDiv, 'mongo', item);  //save the whole mongo document ("item") in the DOM element

        // Display name
        var textdiv = document.createElement("div");
        textdiv.className = "textdiv";
        $(textdiv).appendTo(activityDiv);
        
        // Display Name
        if (item.dn) var dn = item.dn.substring(0, 40); //else dn = item.ndn.substring(0,20);
        $('<span class="result_dn">' + item.dn + '</span><br>').appendTo(textdiv);
        
        $('<br>').appendTo(activityDiv);
    
        // ID
        if ('_id' in item) {
            $('<span class="result_ID">' + item._id + '</span>').appendTo(activityDiv);
        }
        // language
        var langs = '(' + $('#lang-drop-menu').val() + ')';
        //var langs = '(' +
          //  (( 'dn' in item && item.dn !== "")? 'en': '') +
          //  (( 'dn' in item && item.dn !== "" && 'ndn' in item && item.ndn !== "")? ',' : '') +
          //  (( 'ndn' in item && item.ndn !== "")?'ne' : '') +
          //  ')';
        $('<span class="result_lang">' + langs + '</span>').appendTo(activityDiv);
       
        // ADD button for each activity - popups detailed info for the activity
        var $info = $('<button class="add" data-id="' + item['_id']
            + '" data-lang="' + $('#lang-drop-menu').val()
            + '" data-match="'  + (('match' in item) ? item['match'] : false)
            + '">Add</button>');
        
        $info.appendTo(activityDiv);
    
        // PREVIEW button for each activity
        var $info = $('<button class="preview">Preview</button>');
        $info.appendTo(activityDiv);
        
        return activityDiv;
    } //end innerActivityDiv()
    
    var div = document.createElement("div");
    div.className = "resultitem";
    
    var newDiv = innerActivityDiv(activity);
    $(newDiv).appendTo(div);
    
    return div;
}  // end createActivityDiv()

function validateInputs() {
    //check and clean inputs and return true or list of errors
    
    // remove duplicates in ch_ids and nch_ids
    // require: DN, FN
    // trim and clean DN
    // is there a check for legal URL?
    // encourage: KEYWORDS
    // checks: cl_lo <= cl_hi
    var OK = true;
    errors = "";
    
    if ( ! $('#dn-setting').val()) {
        errors += 'Display name required \r\n '; OK = false;}
    if ( ! ($('#fn-setting').val() || $('#url-setting').val())) {
        errors += 'Filename or URL required \r\n '; OK = false;}
    if ($('#lo-setting').val() != null && $('#hi-setting').val() != null && $('#lo-setting').val() > $('#hi-setting').val()) {
        errors += 'Lowest grade must be less than \r\n or equal to Highest grade \r\n '; OK = false;}
    if (  $('#lo-setting').val() === null &&  $('#hi-setting').val() !== null ||
          $('#lo-setting').val() !== null &&  $('#hi-setting').val() === null) {
        errors += 'Must set both Lowest grade and Highest grade, \r\n or neither'; OK = false;}
    //if () {errors += 'Display name required'; OK = false;}
    return OK;
} // end valiateInputs()


///////////////////////////////////////////////////////////////
/////////////////////////// PREVIEW ///////////////////////////
///////////////////////////////////////////////////////////////

    function preview_result (item) {
        
        $('#previewpanel').empty().append($("<p/>", {html : "Loading preview..."}));
        
        var collection = $(item).attr('data-collection');
        var filetype = 'chapter';
        var $mongo = $(item).data('mongo');
        var filename = $mongo.fn;
        var filepath = $mongo.fp;
        //console.log ("collection is " + collection + " filename is " + filename + " and filetype is " + filetype);
        
        var idExtractArray = extractItemId($(item).data('mongo'));
        var previewSrc;
        if (collection == "chapters") {
            if ($(item).data('lang') === 'en')
                previewSrc = '../content/' +
                    $mongo.fp + $mongo.fn +
                    '#page=' + $mongo.pn + '\"  style=\"height:60vh;width:60vw;\" type=\"application/pdf\"';
            else previewSrc = '../content/'  +
                $mongo.fp + $mongo.nfn +
                '#page=' + $mongo.npn + '\"  style=\"height:100%;width:100%;\" type=\"application/pdf\"';
            
            document.querySelector("div#preview").innerHTML = '<embed src="' + previewSrc + '>';
           
        } else document.querySelector("div#preview").innerHTML = '<div class="text-display"> File not found</div>';
    }  // end preview_result()

    function submitSettings () {
        if (validateInputs()) {
            var settings = {};
            settings.dn = LOOMA.clean($('#dn-setting').val());
            settings.ndn = $('#ndn-setting').val();
            settings.ft = $('#ft-setting').val();
            settings.cl_lo = $('#lo-setting').val();
            settings.cl_hi = $('#hi-setting').val();
            settings.fn = $('#fn-setting').val();
            settings.url = $('#url-setting').val();
            settings.key1 = $('#key1-setting-menu').val();
            settings.key2 = $('#key2-setting-menu').val();
            settings.key3 = $('#key3-setting-menu').val();
            settings.key4 = $('#key4-setting-menu').val();
            settings.ch_id = $('#ch_id-setting').val().replace(/\s/g, '').split(',');
            settings.nch_id = $('#nch_id-setting').val().replace(/\s/g, '').split(',');
        
                $.post("looma-database-utilities.php",
                    {   cmd: 'save',
                        collection: 'new_content',
                        data: settings,
                        activity: 'false'      // NOTE: this is a STRING, either "false" or "true"
                    },
                    
                    function (response) {
                        if (response['ok'] && response['ok'] == 1) {
                            console.log("SAVED new content");
                            LOOMA.alert('Activity ' + settings.dn + ' saved', 0, false, function(){});
                        } else {
                            console.log("SAVE new content didn't work?");
                        }
                    },
                    'json'
                );
    
            $.post("looma-database-utilities.php",
                {   cmd: 'sendmail',
                    data: settings
                },
        
                function (response) {
                   console.log (response);
                   
                },
                'json'
            );
            console.log('Submitted: ' + settings);
        } else {LOOMA.alert('Errors: \r\n' + errors)}  // show popup with error messages
        return false;
    } // end submitSettings()

/////////////////////////////
/////  isFilterSet()    /////
///////////////////////////// overriding looma-search.js version
function isFilterSet() {
        return ($('#search-term').val()       !== "" ||
            $('#grade-drop-menu').val()   !== "" ||
            $('#subject-drop-menu').val() !== "" ||
            $('#key1-menu').val()         !== "");
}  //  end isFilterSet()

$(document).ready(function() {
    
    loginname = LOOMA.loggedIn();
    
    $('#chapter-search').show();
    $('#collection').val('chapters');
    $(".media-filter").off('change');
    $('#media-submit').prop('disabled', false);
    $('.chapter-input').prop('disabled', false);
    $('#search-term').prop('disabled', false);
    
    $searchResultsDiv = $('#innerResultsDiv');  //where to display the search x - override in page's JS if desired
    
    $('img.q').hover(
        function() {$('#info-' + this.id).show();},
        function() {$('#info-' + this.id).hide();}
        );
    
    $('#details').draggable();
    
    //$("#keyword-div .keyword-dropdown, .keyword-changes").off('change').change(showKeywordDropdown);
    $(".keyword-dropdown").change(showKeywordDropdown);
    
    // $("#grade-chng-menu, #subject-chng-menu").change(function() {
    //     showChapterDropdown(null, $('#grade-chng-menu'), $('#subject-chng-menu'), $('#chapter-chng-menu'))
    // });
    
    // text books search terms

/*
///////////////////////////////////
/////  showChapterDropdown()  /////
///////////////////////////////////
    function showChapterDropdown($grades, $subjects, $chapters, $lang) {
        //if ($div) $div.hide();
        
        $chapters.show();
        if ( ($grades.val() != '') && ($subjects.val() != ''))
              $chapters.show();
              $.post("looma-database-utilities.php",
                {cmd: "textChapterList",
                    class:   $grades.val(),
                    subject: $subjects.val(),
                    lang:    $lang.val()},
                
                function(response) {
                    //$('#chapter_label').show();
                    $('#chapter-div').show();
                    $('<option/>', {value: "", label: "(any)..."}).appendTo($chapters);
                    
                    $chapters.append(response.list);
                },
                'html'
            );
        $("#search-term").focus();
    };  //end showTextChapterDropdown()
*/
/*
    $("#grade-chng-menu").off('change').change(function() {
        showChapterDropdown($('#grade-chng-menu'),
            $('#subject-chng-menu'),
            $('#chapter-chng-menu'),
            $("input:radio[name='lang']:checked").val());
    });  //end drop-menu.change()
    
    $("#subject-chng-menu").off('change').change(function() {
        showChapterDropdown($('#grade-chng-menu'),
            $('#subject-chng-menu'),
            $('#chapter-chng-menu'),
            $("input:radio[name='lang']:checked").val());
    });  //end drop-menu.change()
    
    $("input[type=radio][name='lang']").change(function() {
        $('#grade-chng-menu').prop('selectedIndex', 0); // reset grade select field
        $('#subject-chng-menu').empty(); $('#chapter-chng-menu').empty();
    });
 */
    $('#settings-clear').click(function(){clearSettings();return false;});
    $('#settings-submit').click( submitSettings );

    $('#clear-search').click(function() {$('#chapter-div').show();})
    //$('#clear-all').click( function() { $('.filter-checkbox').prop('checked', false);});
    
    $("#grade-drop-menu").off('change').change(function() {
        //showChapterDropdown($('#grade-drop-menu'), $('#subject-drop-menu'), $('#chapter-drop-menu'), $('#lang-drop-menu'));
         //   $("input:radio[name='lang']:checked").val());
    });  //end drop-menu.change()
    
    $("#subject-drop-menu").off('change').change(function() {
        //showChapterDropdown($('#grade-drop-menu'),$('#subject-drop-menu'),$('#chapter-drop-menu'),$('#lang-drop-menu'));
    });  //end drop-menu.change()
    
    
    window.onbeforeunload = function(event) {
        event.preventDefault();
        // Chrome requires returnValue to be set.
        event.returnValue = '';
        console.log("activity editor 'beforeunload' event");
    };
});
