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
var searchName = 'generic';

// function clearResults() is provided by the calling JS file
function clearResults() {}

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
    }
    $('#chapter-div').hide();
    $('#preview').empty();
    pageno = 1;
    
    //clearResults();  //provided by calling .JS file
    clearSearchState();
    $("#search-term").focus();
    
} // end clearSearch()

/////////////////////////////
/////  clearSearchState()     /////
/////////////////////////////
function clearSearchState () {
   // $("#top").hide;
    LOOMA.clearStore('libraryScroll', 'session');
    LOOMA.clearStore(searchName,      'session');
    
}  //end clearSearchState()

/////////////////////////////
/////  restoreSearchState()   /////
/////////////////////////////
function restoreSearchState () {
    
    var $search = $('#search');
    //$search[0].reset();
    
    var savedForm = LOOMA.restoreForm($('#search'), searchName);  //restore the search settings
    pagesz = $search.find("#pagesz").val();
    
    if ($('#collection').val() == 'chapters') {
        //$('#media-search').hide();
        setCollection('chapters');
        //$('.media-input').prop('disabled', true);
       
        if ( ($('#grade-drop-menu').val() != '') && ($('#subject-drop-menu').val() != ''))
            showTextChapterDropdown( $('#grade-drop-menu'), $('#subject-drop-menu'), $('#chapter-drop-menu'), $("input:radio[name='language']:checked").val());
        
        $('#search').submit();  //re-run the search
    
    } else {
        setCollection('activities');
    
        // reset some search form fields not handled by LOOMA.restoreForm() using 'savedForm'
        //for each element of savedForm that has name=='type[]' and name=='src[]' set the type[value] = selected
        if (savedForm && savedForm.length > 0) {
            // get the name, value pairs from formSettings and restore them in 'form'
            $.each(savedForm, function (i, item) {
                // restore 'type' and 'scr' selections
                if (item.name == 'type[]') $("#search #" + item.value + "-checkbox")[0].checked = true;
                if (item.name == 'src[]')  $("#search #" + item.value + "-checkbox")[0].checked = true;
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
        }
    }
 
    $("#main-container-horizontal").scrollTop(LOOMA.readStore('libraryScroll', 'session'));
    $("#search-term").focus();
    
}  //end restoreSearchState()

/////////////////////////////
/////  saveSearchState()      /////
/////////////////////////////
function saveSearchState () {
    // save SCROLL position
    LOOMA.setStore('libraryScroll', $("#main-container-horizontal").scrollTop(), 'session');
    // save FROM contents
    LOOMA.saveForm($('#search'), searchName);
} //end saveSearchState()

/////////////////////////////
/////  setCollection()  /////
/////////////////////////////
function setCollection(collection) {
    clearResults();  //provided by calling .JS file
    $('#collection').val(collection);
    
    if (collection == 'activities') {
        $('#media-search').show();
        $('#chapter-search').hide();
        $('#chapter-lang').hide();
        $('.chapter-input').prop('disabled', true);
        $('.media-input').prop('disabled',   false);
    } else { // collection == 'chapters'
        $('#media-search').hide();
        $('#chapter-search').show();
        $('#chapter-lang').show();
        $('.chapter-input').prop('disabled', false);
        $('.media-input').prop('disabled',   true);
        
        $('#chapter-div').hide();
        $('#chapter-drop-menu').empty();
    }
    $("#search-term").focus();
} //end setCollection

/////////////////////////////
/////  isFilterSet()    /////
/////////////////////////////
function isFilterSet() {
    var set = false;
    
    if ($('#collection').val() == 'activities') {
        if ($('#search-term').val()){set = true;}
        $(".flt-chkbx").each( function() {if (this.checked) {set = true;}} );
        if ($("#key1-menu").val() != "") {set = true;}
    } else { //collection=='chapters'
        
        if ($("#grade-drop-menu").val() != "") {set = true;}
        else if ($("#subject-drop-menu").val() != "") {set = true;}
    }
    return set;
}  //  end isFilterSet()

////////////////////////////////
////// makeKeywordDropdown /////
////////////////////////////////

function makeKeywordDropdown(kids, element) {
    var any = (language === 'native') ? "(कुनै)" : "(any)";
    $('<option value="" label="' + any + '" data-dn="(any)" data-ndn="(कुनै)"/>').prop('selected', true).appendTo(element);
    kids.forEach(function (kid) {
        var name = (language === 'native' && kid.ndn) ? kid.ndn : kid.name;
        var id = kid.kids["$id"] || kid.kids["$oid"];
        $('<option data-kids=' + id +
            ' data-dn="' + kid.name +
            '" data-ndn="' + kid.ndn +
            '" value="' + kid.name +
            '" label="' + name + '"/>').appendTo(element);
    });
    //$('<option value="none" label="(none)" data-dn="(none)" data-ndn="(कुनै हैन)"/>').appendTo(element);
};

/////////////////////////////
/////  setRootKeyword()    /////
/////////////////////////////
function setRootKeyword() {
    // reset keyword dropdowns to level one
    $.post("looma-database-utilities.php",
        {cmd: "keywordRoot"},
        function(kids) {
            var $dropdown = $('#key1-menu').empty();
            if (kids) {
                $dropdown.prop('disabled', false);
                makeKeywordDropdown (kids, $dropdown);
            }
        },
        'json'
    );
    $('#key1-menu').nextAll().empty().val('').prop('disabled', true).text('');
} // end setRootKeyword()

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
        }

         if ($element.data('kids') !== 'undefined') {  //the MONGO document for KEYWORDS returns KIDS as 'undefined' if there are no kids
            console.log('calling server with level = ' + level + ' and keys: ' + keys[1] + ', '+ keys[2] + ', '+ keys[3] + ', '+ keys[4] );
            
            $.post("looma-database-utilities.php",
                {cmd: "keywordList", id: $element.data('kids')},
                function(kids) {
                    var nextLevel = level + 1;
                    var $next = $('#key' + nextLevel + '-menu').empty().val('').prop('disabled', false).text('');
                    if (kids) {
                        makeKeywordDropdown (kids, $next);
                    }
                    restoreKeywordDropdown(nextLevel, keys);
                },
              'json'
            );
        } // end if (kids)
         else $('#search').submit();  //re-run the search
    }  //end if(key)
    else $('#search').submit();  //re-run the search
    $("#search-term").focus();
} //end restoreKeywordDropdown()

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
                var $next = $(menu).next().empty().prop('disabled', false);
                if (kids) {

                makeKeywordDropdown(kids,$next)
                /*
                    $('<option value="" label="(any)..."/>').prop('selected', true).appendTo($next);
                    kids.forEach(function (kid) {
                        $('<option data-kids=' + kid.kids["$id"] + ' value="' + kid.name + '" label="' + kid.name + '"/>').appendTo($next);
                    });
                    $('<option value="none" label="(none)"/>').appendTo($next);
                */
                }
            },
            'json'
        );
    $("#search-term").focus();
} //end showKeywordDropdown()

///////////////////////////////////
/////  showTextSubjectDropdown()  /////
///////////////////////////////////
function showTextSubjectDropdown($grades, $subjects, $chapters) {
    //$chapters.hide();
    $subjects.empty();
    $chapters.empty();
    if ( ($grades.val() != ''))
        $.post("looma-database-utilities.php",
            {cmd: "textSubjectList",
                class:   $grades.val()},
            
            function(response) {
                //if ($div) $div.show();
                $('<option/>', {value: "", label: "(any)..."}).appendTo($subjects);
                
                $subjects.append(response);
            },
            'html'
        );
    $("#search-term").focus();
}  //end showTextSubjectDropdown()


///////////////////////////////////
/////  showTextChapterDropdown()  /////
///////////////////////////////////
function showTextChapterDropdown($grades, $subjects, $chapters, lang) {
    
    $chapters.empty();
    if ( ($grades.val() != '') && ($subjects.val() != ''))
        $.post("looma-database-utilities.php",
            {cmd: "textChapterList",
                class:   $grades.val(),
                subject: $subjects.val(),
                lang:    lang},
            
            function(response) {
                //$('#chapter_label').show();
                $('#chapter-div').show();
                $('<option/>', {value: "", label: "(any)..."}).appendTo($chapters);
                
                $chapters.append(response);
            },
            'html'
        );
    $("#search-term").focus();
}  //end showTextChapterDropdown()

///////////////////////////////////
/////  showBookDropdown()  /////
///////////////////////////////////
function showBookDropdown($src, $books, $chapters) {
 
    $books.empty();
    $chapters.empty();
    if ( ($src.val() != ''))
        $.post("looma-database-utilities.php",
            {cmd: "bookList",
                prefix:   $src.val()},
            
            function(response) {
                $('<option/>', {value: "", label: "(any)..."}).appendTo($books);
                $books.append(response);
            },
            'html'
        );
    $("#search-term").focus();
}  //end showBookDropdown()


///////////////////////////////////
/////  showBookChapterDropdown()  /////
///////////////////////////////////
function showBookChapterDropdown($src, $books, $chapters) {
    
    $chapters.empty().show();
    if ( ($src.val() != '') && ($books.val() != ''))
        $.post("looma-database-utilities.php",
            {cmd: "bookChapterList",
             book_id: $books.val()},
            
            function(response) {
                $('<option/>', {value: "", label: "(any)..."}).appendTo($chapters);
                $chapters.append(response);
            },
            'html'
        );
    $("#search-term").focus();
}  //end showBookChapterDropdown()

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
}  // end refreshPage()

/////////////////////////////
/////  sendSearchRequest()    /////
/////////////////////////////
function sendSearchRequest(searchForm, callBack) {
    searchForm.find("#pagesz").val(pagesz);
    searchForm.find("#pageno").val(pageno);
    searchForm.find("#language").val(LOOMA.readCookie('language'));
    
    var loadingmessage = $("<p/>Loading results<span id='ellipsis'>.</span>").appendTo("#results-div");
    
    var ellipsisTimer = setInterval(
        function () {
            $('#ellipsis').text($('#ellipsis').text().length < 10 ? $('#ellipsis').text() + '.' : '');
        },33 );
    
    if  ($('#collection').val() == 'activities') {
        searchForm.find('#cmd').val("search");
        $ajaxRequest = $.post("looma-database-utilities.php",
            searchForm.serialize(),
            function (result) {
                loadingmessage.remove();
                clearInterval(ellipsisTimer);
                pageno++;
                callBack(result);
                $('#media-submit').prop("disabled", false);
            },  // NOTE: displayResults() function is supplied in the JS of the user looma-search (e.g. looma-lessonplan.xx)
            'json');
     }
     else {  //($('#collection').val() == 'chapters')
         searchForm.find('#cmd').val("searchChapters");
         $ajaxRequest = $.post("looma-database-utilities.php",
            searchForm.serialize(),
            function (result) {
                loadingmessage.remove();
                clearInterval(ellipsisTimer);
                pageno++;
                callBack(result);
                $('#media-submit').prop("disabled", false);
            },  // NOTE: displayResults() function is supplied in the JS of the user looma-search (e.g. looma-lessonplan.xx)
            'json');
    }
    //$("#search-term").focus();
    
} //end sendSearchRequest()

function translatePage() {
    language = LOOMA.readStore('language', 'cookie');
    if (language === 'native') {
        //$('#key1-menu option:first').attr('label','चुन्नु');
        $('.keyword-dropdown option').each(function(){$(this).attr('label',$(this).attr('data-ndn'));});
        $('#search-term').attr('placeholder', 'खोज शब्दावली टाइप गर्नुहोस्'  );
    } else {
        //$('#key1-menu option:first').attr('label', 'Select keyword...');
        $('.keyword-dropdown option').each(function(){$(this).attr('label',$(this).attr('data-dn'));});
        $('#search-term').attr('placeholder', 'Enter search term');
    }
}; //end translatePage()

//////////////////////////////
/////  document.ready()  /////
//////////////////////////////
$(document).ready(function() {
    
    ///////////////////////////
    ///////   SUBMIT    ///////
    ///////////////////////////
    $('#search').submit(function( event ) {
        event.preventDefault();
    
        console.log('search submitted');
        
        clearResults();  // "clearResults()" provided by the JS of the page which includes search.php
    
        $searchResultsDiv.empty().show();
        pageno = 1;
        
        if (!isFilterSet()) {
            $searchResultsDiv.html(LOOMA.translatableSpans('Please select at least 1 filter option before searching',
                                                           'खोजी गर्नु अघि कम्तिमा १ फिल्टर विकल्प छान्नुहोस्'));
        } else {
            $('#media-submit').prop("disabled",true);
            sendSearchRequest ($("#search"), displayResults);
        }
        $("#search-term").focus();
    
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
    
    $(".media-filter").change( function(){$("#search-term").focus();});
    
    $("#grade-drop-menu").change(function() {
        showTextSubjectDropdown($('#grade-drop-menu'), $('#subject-drop-menu'), $('#chapter-drop-menu'),$("input:radio[name='language']:checked").val());
    });  //end drop-menu.change()
    
    $("#subject-drop-menu").change(function() {
        showTextChapterDropdown($('#grade-drop-menu'), $('#subject-drop-menu'), $('#chapter-drop-menu'), $("input:radio[name='language']:checked").val());
    });  //end drop-menu.change()
    
    $('input[type=radio][name=language]').change(function() {
        $('#grade-drop-menu').prop('selectedIndex', 0); // reset grade select field
        $('#subject-drop-menu').empty(); $('#chapter-drop-menu').empty();
    });
    
    $("#keyword-div .keyword-dropdown").change(showKeywordDropdown);
    
    $('.clear-search').click(clearSearch);
    
    $searchResultsDiv = $('#results-div');  //where to display the search x - override in page's JS if desired
    
    var language = LOOMA.readStore('language', 'cookie');
    if (!language) {
        LOOMA.setStore('language', 'english', 'cookie');
        language = 'english';
    }
    if (language === 'native') $('#search-term').attr('placeholder','खोज टर्म प्रविष्ट गर्नुहोस्');
    
    translatePage();
    $('#translate').click(translatePage);
    
    setCollection('activities');
    refreshPage();
    
}); // end document.ready