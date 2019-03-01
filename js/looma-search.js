/*
author: Skip, Bo
Owner: VillageTech Solutions (villagetechsolutions.org)
Date:  2017 07, 2018 03
Revision: Looma 3.0

filename: looma-search.js
Description:
 */

'use strict';
var $searchResultsDiv;
var $ajaxRequest;

var pagesz = 500;  //default search results 'page size' (number of results returned form each search)
                    // can be over-ridden by calling code (e.g looma-library.js)
var pageno;

/////////////////////////////
/////  clearSearch()    /////
/////////////////////////////
function clearSearch() {
    
    if ($ajaxRequest) $ajaxRequest.abort();
    $('#media-submit').prop("disabled",false);
    
    var prevCollection = $('#collection').val();
    $("#search").trigger("reset");
    setCollection(prevCollection);
    
    if ($('#collection').val() == 'activities') {
        //$('.keyword-filter').val("").change();
        setRootKeyword();
    } else {
        $("#grade-drop-menu").val("").change();
        $("#subject-drop-menu").val("").change();
        $('#ft-chapter').prop("checked", true);
    };
    $('#chapter-div').hide();
    
    pageno = 1;
    
    //clearResults();  //provided by calling .JS file
    clearSearchState();
    
}; // end clearSearch()

/////////////////////////////
/////  clearSearchState()     /////
/////////////////////////////
function clearSearchState () {
    $("#top").hide;
    LOOMA.clearStore('libraryScroll', 'session');
    LOOMA.clearStore(searchName,      'session');
    
};  //end clearSearchState()

/////////////////////////////
/////  restoreSearchState()   /////
/////////////////////////////
function restoreSearchState () {
    
    var $search = $('#search');
    //$search[0].reset();
    
    var savedForm = LOOMA.restoreForm($('#search'), searchName);  //restore the search settings
    pagesz = $search.find("#pagesz").val();
    
    if ($('#collection').val() == 'chapters') {
        setCollection('chapters');
        //$('.media-input').prop('disabled', true);
        if ( ($('#grade-drop-menu').val() != '') && ($('#subject-drop-menu').val() != ''))
            showChapterDropdown($('#chapter-div'), $('#grade-drop-menu'), $('#subject-drop-menu'), $('#chapter-drop-menu'));
        
        $('#search').submit();  //re-run the search
        
    } else {
        $('#chapter-search').hide();
        
        // reset some search form fields not handled by LOOMA.restoreForm() using 'savedForm'
        //for each element of savedForm that has name=='type[]' and name=='src[]' set the type[value] = selected
        if (savedForm && savedForm.length > 0) {
            // get the name, value pairs from formSettings and restore them in 'form'
            $.each(savedForm, function (i, item) {
                // restore 'type' and 'scr' selections
                if (item.name == 'type[]') $("#search #" + item.value + "-checkbox")[0].checked = true;
                if (item.name == 'src[]')  $("#search #" + item.value + "-checkbox")[0].checked = true;
                //if (item.name == 'src[]')  $('#source-div')[0][item.value].checked = true;
            });
            
            //setRootKeyword();  // initialize keyword 1 to 'root' of keyword tree from mongo
            
            var keys = [];
            var key1 = savedForm.find(x => x.name === 'key1'); keys[1] = (key1?key1.value:null);
            var key2 = savedForm.find(x => x.name === 'key2'); keys[2]=  (key2?key2.value:null);
            var key3 = savedForm.find(x => x.name === 'key3'); keys[3] = (key3?key3.value:null);
            var key4 = savedForm.find(x => x.name === 'key4'); keys[4] = (key4?key4.value:null);
            keys[5] = null;
            // add more elements to KEYS[] if there are more levels of keywords
            
            restoreKeywordDropdown(1,keys);  // restore and select keywords 1,2,3,4 if specified
    
            //$('#search').submit();  //re-run the search
    
    
        };
    };
    
    //note: restorekeywordropdown calls search.submut, so DONT do it here
    // $('#search').submit();  //re-run the search
    
    $("#main-container-horizontal").scrollTop(LOOMA.readStore('libraryScroll', 'session'));
    
};  //end restoreSearchState()

/////////////////////////////
/////  saveSearchState()      /////
/////////////////////////////
function saveSearchState () {
    // save SCROLL position
    LOOMA.setStore('libraryScroll', $("#main-container-horizontal").scrollTop(), 'session');
    // save FROM contents
    LOOMA.saveForm($('#search'), searchName);
}; //end saveSearchState()

/////////////////////////////
/////  setCollection()  /////
/////////////////////////////
function setCollection(collection) {
    clearResults();  //provided by calling .JS file
    $('#collection').val(collection);
    
    if (collection == 'activities') {
        $('.media-filter').show();
        $('.chapter-filter').hide();
        $('.chapter-input').prop('disabled', true);
        $('.media-input').prop('disabled',   false);
    } else { // collection == 'chapters'
        $('.media-filter').hide();
        $('.chapter-filter').show();
        $('.chapter-input').prop('disabled', false);
        $('.media-input').prop('disabled',   true);
        
        $('#chapter-div').hide();
        $('#chapter-drop-menu').empty();
        
    }
}; //end setCollection

/////////////////////////////
/////  isFilterSet()    /////
/////////////////////////////
function isFilterSet() {
    var set = false;
    
    if ($('#collection').val() == 'activities') {
        if ($('#search-term').val()){set = true;}
        $(".flt-chkbx").each( function() {if (this.checked) {set = true;}} );
        if ($("#key1-menu").val() != "") {set = true;};
    } else { //collection=='chapters'
        
        if ($("#grade-drop-menu").val() != "") {set = true;}
        else if ($("#subject-drop-menu").val() != "") {set = true;}
    };
    
    return set;
};  //  end isFilterSet()

/////////////////////////////
/////  setRootKeyword()    /////
/////////////////////////////
function setRootKeyword() {
    // reset keyword dropdowns to level one
    $.post("looma-database-utilities.php",
        {cmd: "keywordRoot"},
        function(kids) {
            var dropdown = $('#key1-menu').empty();
            if (kids) {
                dropdown.prop('disabled', false);
                //console.log('response is ' + kids);
                $('<option value="" label="Select..."/>').prop('selected', true).appendTo(dropdown);
                kids.forEach(function (kid) {
                    $('<option data-kids=' + kid.kids["$id"] + ' value="' + kid.name + '" label="' + kid.name + '"/>').appendTo(dropdown);
                });
                $('<option value="none" label="(none)"/>').appendTo(dropdown);
    
            }
        },
        'json'
    );
    $('#key1-menu').nextAll().empty().val('').prop('disabled', true).text('');
    //$('#key2-menu').prop('disabled', true).text('');
    //$('#key3-menu').prop('disabled', true).text('');
    //$('#key4-menu').prop('disabled', true).text('');
}; // end setRootKeyword()

//////////////////////////////////////
/////  restoreKeywordDropdown()  /////
//////////////////////////////////////
function restoreKeywordDropdown(level,keys) {

    var $menu, $element;
    var key = keys[level]?keys[level]:null;
    
    if (key && key !== '') {
        
        //mark this key as SELECTED in this level's dropdown menu
        $menu = $('#key' + level + '-menu'); // get the dropdown option elements for this level
        if ($menu) {
            $element = $menu.children('option[value="' + key + '"]');
            $element.prop('selected', true);
        };

         if ($element.data('kids') !== 'undefined') {  //the MONGO document for KEYWORDS returns KIDS as 'undefined' if there are no kids
            console.log('calling server wi th level = ' + level + ' and keys: ' + keys[1] + ', '+ keys[2] + ', '+ keys[3] + ', '+ keys[4] );
            
            $.post("looma-database-utilities.php",
                {cmd: "keywordList", id: $element.data('kids')},
                function(kids) {
                    var nextLevel = level + 1;
                    var $next = $('#key' + nextLevel + '-menu').empty().val('').prop('disabled', false).text('');
                    if (kids) {
                        $('<option value="" label="(any)..."/>').prop('selected', true).appendTo($next);
                        
                        for (var i=0;i<kids.length;i++){
                            $('<option data-kids=' + kids[i].kids["$id"] + ' value="' + kids[i].name + '" label="' + kids[i].name + '"/>').appendTo($next);
                        };
                        
                        $('<option value="none" label="(none)"/>').appendTo($next);
                    };
                    restoreKeywordDropdown(nextLevel, keys);
                },
              'json'
            );
        } // end if (kids)
         else $('#search').submit();  //re-run the search
    }  //end if(key)
    else $('#search').submit();  //re-run the search
}; //end restoreKeywordDropdown()

///////////////////////////////////
/////  showKeywordDropdown()  /////
///////////////////////////////////
function showKeywordDropdown(event) {
    var menu  = event.target;
    var selected = menu.options[menu.selectedIndex];
    
    //clear and disable younger brothers
    $(menu).nextAll().empty().val('').prop('disabled', true).text('');
    var $val = $(menu).val();
    
    if ( $val && $val != '' && ($(menu).data('level') < 4))
        
        //console.log('asking for keyword list of ' + $(selected).data('kids'));
        $.post("looma-database-utilities.php",
            {cmd: "keywordList",
             id: $(selected).data('kids')},
             function(kids) {
                var next = $(menu).next().empty().prop('disabled', false);
                if (kids) {
                    //console.log('response is ' + kids);
                    $('<option value="" label="(any)..."/>').prop('selected', true).appendTo(next);
                    kids.forEach(function (kid) {
                        $('<option data-kids=' + kid.kids["$id"] + ' value="' + kid.name + '" label="' + kid.name + '"/>').appendTo(next);
                    });
                    $('<option value="none" label="(none)"/>').appendTo(next);
    
                }
            },
            'json'
        );
}; //end showKeywordDropdown()

///////////////////////////////////
/////  showChapterDropdown()  /////
///////////////////////////////////
function showChapterDropdown($div, $grades, $subjects, $chapters) {
    if ($div) $div.hide();
    
    $chapters.empty();
    if ( ($grades.val() != '') && ($subjects.val() != ''))
        $.post("looma-database-utilities.php",
            {cmd: "chapterList",
             class:   $grades.val(),
             subject: $subjects.val()},
            
            function(response) {
                //$('#chapter_label').show();
                if ($div) $div.show();
                $('<option/>', {value: "", label: "(any)..."}).appendTo($chapters);
                
                $chapters.append(response);
            },
            'html'
        );
};  //end showChapterDropdown()


/////////////////////////////
/////  refreshPage()    /////
/////////////////////////////
function refreshPage() {
    //  if the FORM contents have been saved, then restore them, else make a clean search page with the form cleared
    var formSettings = LOOMA.readStore(searchName, 'session');
    
    if (formSettings) {
        restoreSearchState();
    } else {
        //start page on media search with all form fields cleared
        //clearSearchState();
        clearSearch();
    }
};  // end refreshPage()



/////////////////////////////
/////  sendSearchRequest()    /////
/////////////////////////////
function sendSearchRequest(searchForm, callBack) {
    searchForm.find("#pagesz").val(pagesz);
    searchForm.find("#pageno").val(pageno);
    
    var loadingmessage = $("<p/>Loading results<span id='ellipsis'>.</span>").appendTo("#results-div");
    
    var ellipsisTimer = setInterval(
        function () {
            $('#ellipsis').text($('#ellipsis').text().length < 10 ? $('#ellipsis').text() + '.' : '');
        },33 );
    
    $ajaxRequest = $.post( "looma-database-utilities.php",
        searchForm.serialize(),
        function (result) {
            loadingmessage.remove();
            clearInterval(ellipsisTimer);
            pageno++;
            callBack(result);
            $('#media-submit').prop("disabled",false);
        },  // NOTE: displayResults() function is supplied in the JS of the user looma-search (e.g. looma-lessonplan.xx)
        'json');
}; //end sendSearchRequest()


/////////////////////////////
/////  document.ready()  /////
/////////////////////////////
$(document).ready(function() {
    
    $searchResultsDiv = $('#results-div');  //where to display the search results - override in page's JS if desired
    
    $('#search').submit(function( event ) {
        event.preventDefault();
    
        console.log('search submitted');
        
        clearResults();  // "clearResults()" provided by the JS of the page which includes search.php
    
        $searchResultsDiv.empty().show();
        pageno = 1;
        
        if (!isFilterSet()) {
            $searchResultsDiv.html('Please select at least 1 filter option before searching');
        } else {
            
  
            $('#media-submit').prop("disabled",true);

        sendSearchRequest ($("#search"), displayResults);
        
        /*  //following code replaced with call to sendSearchRequest() call above //
            $ajaxRequest = $.post( "looma-database-utilities.php",
                $("#search").serialize(),
                function (result) {
                    loadingmessage.remove();
                    clearInterval(ellipsisTimer);
                    displayResults(result);
                    $('#media-submit').prop("disabled",false);
                },  // NOTE: displayResults() function is supplied in the JS of the user looma-search (e.g. looma-lessonplan.xx)
                'json');
        */
        }
        return false;
    }); //end search.submit
    
    $('#ft-media').click(function() {
        
        if ($('#collection').val() == 'chapters'){ //changing from CHAPTERS to ACTIVITIES
            setCollection('activities');
        }
    }); //end ft-media.click()
    
    $('#ft-chapter').click(function() { //changing from ACTIVITIES to CHAPTERS
        
        if ($('#collection').val() == 'activities') {
            setCollection('chapters');
            
            if ( ($('#grade-drop-menu').val() != '') && ($('#subject-drop-menu').val() != '') )
                 $('#chapter-div').show();
            else $('#chapter-div').hide();
        }
    });  //end ft-chapter.click()
    
    $("#grade-drop-menu, #subject-drop-menu").change(function() {
        showChapterDropdown($('#chapter-div'), $('#grade-drop-menu'), $('#subject-drop-menu'), $('#chapter-drop-menu'))
    });  //end drop-menu.change()

    $("#keyword-div .keyword-dropdown").change(showKeywordDropdown);
    
    $('.clear-search').click(clearSearch);
    
    refreshPage();
    
}); // end document.ready

