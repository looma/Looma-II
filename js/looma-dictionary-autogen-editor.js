/*
 * File: looma-dictionary-autogen-editor.js
 * Author: Nikhil Singhal
 * Date: July 28, 2016
 *
 * Version 2.0: July 2018, Skip
 *      [disables revert and revert all, requires ADMIN login for Publish,
 *      fix permanent dictionary search to fine plurals, highlight PART or RW when requiired,
 *      load textbook for context by double-clicking th ech_id, dropdowns for PART and verb-forms
 *
 * this is the javascript that controls the functionality of looma-dictionary-autogen-editor.php.
 *
 * The function of this code is specific to the current setup of the PHP and may need to
 * be modified along with it.
 *
 * Requires that the php file have already imported jQuery, js/looma-dictionary-autogen-pdfToText.js (which requires
 * that it has imported js/pdf.js), and js/looma-dictionary-autogen-uniquewords.js
 *
 * Also relies on css classes defined in css/looma-dictionary-autogen-editor.css, and specifications on data
 * transfer format from looma-dictionary-autogen-backend.php
 *
 *
 */

'use strict';

var loginname;

/**
 * True if a pdf is being processed and other changes should be prevented, false for normal
 */
var processing = false;

/**
 * The max page number for the current search results. Should be updated with each query.
 */
var maxPage = 1;

/**
 * The list of words from the current page of the current query. Should always be updated
 * after successful modifications to the database's representation of the data, but stay
 * the same until then so that, if the update fails, the user's view can be restored to the
 * version on the cloud without having to reload the page
 */
var words = [];

/**
 * The list of official definitions for the currently selected word
 */
var officialDefs = [];

/**
 * Notes the text specified by the last search so the search can be repeated if necessary
 */
var prevText = "";

/**
 * Notes whether the last search specified 'added' so the search can be repeated
 */
var prevAdded = false;

/**
 * Notes whether the last search specified 'modified' so the search can be repeated
 */
var prevModified = false;

/**
 * Notes whether the last search specified 'accepted' so the search can be repeated
 */
var prevAccepted = false;

/**
 * Notes whether the last search specified 'deleted' so the search can be repeated
 */
var prevDeleted = false;

/**
 * The word currently selected and displayed in the bottom bar
 */
var selectedWord = "";

/**
 * If true, Permanent Dictionary searches and word selections should show overwritten entries, if false,
 * act as normal
 */
var showOverwritten = false;

/**
 * The id returned by setInterval while using it to update the progress bar
 */
var progressTimer;

/**
 * Keeps track of the furthest the progress of the upload has reportedly gotten since
 * some requests return too late and end up making it look like it went backwards
 */
var maxProgress;

/**
 * Stores the context file (or part of it) so it can be searched and displayed
 */
var context = "";

/**
 * Marks the last visited place the selected word was found in the context, or 0 on init
 */
var contextMarker = 0;

/**
 * Shows the div that allows users to upload PDFs, and disables the background area
 */
function showUploadDiv() {
    $("#uploadPDFDiv").show();
    $("#progressDisplay").text("");
    $("#menuArea, #viewArea, #officialViewer").addClass("disableButtons");
}

/**
 * Hides the div that allows users to upload PDFs, and enables the background area
 */
function hideUploadDiv() {
    if(!processing) {
        $("#uploadPDFDiv").hide();
        $("#menuArea, #viewArea, #officialViewer").removeClass("disableButtons");
    }
}

function changeAutoGen() {
    if($("#autoChidCheck").prop("checked")) {
        $("#chidInputLabel").text("Chapter prefix: ");
        $("#chapInput").prop("placeholder", "ex. Lesson");
    } else {
        $("#chidInputLabel").text("Page numbers: ");
        $("#chapInput").prop("placeholder", "ex. 12, 14, 17, 23");
    }
}

/**
 * processes the PDF selected in the uploadPDFDiv, finding all unique words and sending
 * them to the server to be processed and added to the dictionary. Currently does not
 * handle skipped words. After adding to the dictionary, this function reloads the data table
 * on the current page to get new results.
 */
function processPDF() {
    // lock process and prevent user resubmission
    processing = true;
    var progress = $("#progressDisplay");
    $("#uploadPDFDiv").addClass("disableButtons");
    
    
    var prefix = $("#prefixInput").val();
    var chapterList = $("#chapInput").val();
    
    //validate user's upload settings
    // validate ch_id prefix
    
    //  if NO list of starting page numbers is given, then the provided CH_ID prefix is the full ch_id for this chapter
    //  check if provided prefix is a legal FULL ch_id
    if (!chapterList || chapterList == '') {
        if(!prefix.match(/^([0-9]|10)(M|S|EN|N|SS|H|V)([0-9][0-9](\.[0-9][0-9])?)$/)) {
            progress.text("chapter prefix must be a full CH_ID, like '3M04' or '7SS02.01'");
            finishProcessingPDF();
            return;
        }
    }
    else
    //  if a list of starting page numbers IS given, then the provided CH_ID prefix will have "01", "02" etc added to generate ch_ids
    //  check if provided prefix is a legal PREFIX ch_id
    if(!prefix.match(/([0-9]|10)(M|S|EN|N|SS|H|V)([0-9][0-9]\.)?$/)) {
        progress.text("chapter prefix must be a PREFIX CH_ID, like '3M' or '7SS02.'");
        finishProcessingPDF();
        return;
    };
    
    // convert file to text
    var file = document.getElementById("pdfInput").files[0];
    
    if(!file || file == null || !("name" in file) || !file.name.endsWith(".pdf")) {
        progress.text("No file selected or file is not PDF");
        finishProcessingPDF();
        return;
    };
    progress.text("Converting file to text");
    Pdf2TextClass().convertPDF(file, function(page, total) {}, function(pages) {
        // called when the pdf is fully converted to text. Finds all unique words
        
        progress.text("finding unique words and chapters");
        var start = $("#startPageNumber").val();
        var end = $("#endPageNumber").val();
        var auto = $("#autoChidCheck").prop("checked");
        
        
        var words = findUniqueWordsFromString(pages, auto, $("#chapInput").val(), prefix,
            start, end);
        if(words === false) {
            progress.text("You can't autogenerate ch_ids if you specify 'start' and 'end'");
            finishProcessingPDF();
            return;
        }
        
        updateContext(pages, start, end);
        
        progress.text("uploading...");
        
        maxProgress = 0;
        // uploads the words to the backend to be added to the dictionary
        $.post("looma-dictionary-autogen-backend.php",
            {'loginInfo': {"allowed": true, 'user': loginname},
                'wordList': JSON.stringify(words)},
            function(data, status, jqXHR) {
                // called when the post request returns (whether successful or not)
                if('status' in data && data['status']['type'] == 'error') {
                    // after a non-fatal error
                    progress.text("Failed with error: " + data['status']['value']);
                } else {
                    progress.html("Done!<br>Success: " + (data['success'] || "NONE")
                        + "<br>Fully skipped for unknown reason: " + (data['fullSkip'] || "NONE")
                        + "<br>Some definitions skipped for unknown reason: " + (data['partSkip'] || "NONE")
                        + "<br>Some definitions missing vital data: " + (data['partMissing'] || "NONE")
                        + "<br>Already Existed: " + (data['exists'] || "NONE")
                        + "<br>Connection error: " + (data["noCon"] || "NONE")
                        + "<br>Canceled: " + (data['canceled'] || "NONE"));
                }
                
                // show the first instance of the word in context
                moveContext(0);
                
                finishProcessingPDF();
                
            }, "json").fail(function(){
            // called after a fatal error
            progress.text("Network or Internal Error while connecting to server. Check with the developers!");
            finishProcessingPDF();
        });
        
        // start allowing cancelation
        $("#cancelUploadButton").show();
        
        // start updating the progress bar
        progressTimer = setInterval(function() {
            $.get("looma-dictionary-autogen-backend.php",
                {'loginInfo': {"allowed": true, 'user': loginname}, "progress": true},
                function(data, status, jqXHR) {
                    var output = data['progress'];
                    if(!output || output["position"] < maxProgress) {
                        return;
                    }
                    maxProgress = output["position"];
                    progress.text("Adding definition: " + output["position"] + " / " + output['length']);
                }, "json");
        }, 1000);
    });
}

/**
 * Clean up uploadPDFDiv and all request problems and displays after returning
 */
function finishProcessingPDF() {
    $("#cancelUploadButton").hide();
    // stop updating the progress bar
    clearInterval(progressTimer);
    maxProgress = 0;
    
    // unlocks the process and reallows user submission
    $("#uploadPDFDiv").removeClass("disableButtons");
    processing = false;
    submitSearch(true);
}

/**
 * Searches the database for all entries matching the parameters of text, added, modified, etc.
 * then formats these results and loads them into the results table.
 * @param oldSearch If true, searches for the results using the previously SUBMITTED
 * (by the user or another function where oldSearch is set to false) search
 * on the current page, rather than the new search on page 1. Defaults to false, and therefore
 * searches for the parameters currently on screen with page=1 and updates the previous
 * values
 */
function submitSearch(oldSearch) {
    // send request to server
    if(!oldSearch) {
        prevText =     $("#wordPart").val();
        prevAdded =    $("#added").prop("checked")
        prevModified = $("#modified").prop("checked");
        prevAccepted = $("#accepted").prop("checked");
        prevDeleted =  $("#deleted").prop("checked");
    }
    
    var searchArgs = {};
    searchArgs['text'] = prevText;
    searchArgs['page'] = oldSearch?$("#pageInput").val():1;
    
    searchArgs['added']    = prevAdded;
    searchArgs['modified'] = prevModified;
    searchArgs['accepted'] = prevAccepted;
    searchArgs['deleted']  = prevDeleted;
    
    /* if (prevAccepted ) searchArgs['accepted'] = true;
     if (prevModified ) searchArgs['modified'] = true;
     if (prevAdded )    searchArgs['added']    = true;
 */
    
    $.get("looma-dictionary-autogen-backend.php",
        {'loginInfo': {"allowed": true, 'user': loginname},
            'searchArgs': searchArgs,
            'staging': true},
        function(data, status, jqXHR) {
            // called when server responds
            //TODO handle errors after the format for error responses is determined
            
            // sets current page and maxPage so the display is consistent with the state
            data = data['data'];
            $("#pageInput").val(data['page']);
            maxPage = data['maxPage'];
            $("#maxPage").text(maxPage);
            
            // clears the table
            var table = $("#resultsTable");
            table.find("tr:gt(0)").remove();
            
            // processes each word's data
            words = data['words'].sort(function(a, b) {
                if(a["wordData"]["word"] == b["wordData"]["word"]) {
                    return 0;
                } else if(a["wordData"]["word"] < b["wordData"]["word"]) {
                    return -1;
                } else {
                    return 1;
                }
            });
            for(var i = 0; i < words.length; i++) {
                var word = words[i];
                
                // deal with possible boolean to string conversions in JSON transfer
                ["modified", "added", "accepted", "deleted"].forEach(function(field, i, a) {
                    word['stagingData'][field] = isTrue(word['stagingData'][field]);
                });
                
                //creates a new row for the table and fills it with the data from the word
                var row = createTableEntry(word, i);
                
                // adds the new row to the table
                table.append(row);
            };
            $('.ch_idCol').dblclick(function(event) {loadContext(event);})
            
            // reload officialTable
            //      **************** ????????????? ***********
            //loadOfficialTable();
        }, 'json');
}

/**
 * Allows consistent replacement of problematic characters for jquery to handle
 * @param str
 * @returns
 */
function cssEscapeString( str ) {
    return str.replace("'", '_');
}

/**
 * Allows consistent un-replacement of problematic characters for jquery to handle
 * @param str
 * @returns
 */
function cssUnescapeString(str) {
    return str.replace("_", "'");
}

/**
 * Creates a table entry for the Staging Dictionary with all necessary fields in the right format
 * @param word The word object to create it for
 * @param i The index of that word object in the stored list
 * @returns the new entry
 */
function createTableEntry(word, i) {
    var row = $('<tr>');
    
    /**
     * Creates editable fields in the table
     * @returns A jQuery object representing a td tag
     */
    function createEditableTd(type, index, value) {
        return $('<td class="' + type + 'Col"></td>')
            .append($('<textarea id="' + type + "_" + index
                + '" onchange="edit(\'' + type + '\', ' + index + ')"'
                + 'class="resultsTableInput">'
                + (value || "") + "</textarea>").keyup(function(event){
                if(event.keyCode == 13){
                    //console.log("test")
                    $("#" + type + "_" + index).blur();
                }
            }));
    }
    /**
     * Creates editable fields in the table
     * @returns A jQuery object representing a td tag
     */
    function createEditableTdDropdown(type, index, value) {
        
        
        //$("#leaveCode").val("14");
        
        
        function posDropdown (select) {
            
            var forms = ['noun','verb','adjective','adverb','preposition',
                'conjunction','pronoun','contraction','interjection',
                'article','proper name','title'];
            
            var dropdown = '';
            if (!select || select == "") dropdown = '<option value="" selected="selected">none</option>option>\n';
            
            for (let form of forms) {
                if (form == select) dropdown = dropdown + '<option value="' + form + '" selected="selected">' + form + '</option>option>\n';
                else                dropdown = dropdown + '<option value="' + form + '">'                     + form + '</option>option>\n';
            };
            
            return dropdown;
        }
        
        return $('<td class="' + type + 'Col"></td>')
            .append($('<select id="' + type + "_" + index
                + '" onchange="editPos(\'' + type + '\', ' + index + ')"'
                + 'class="resultsTableInput white">'
                + (value || "") + posDropdown(value) + "</select>").keyup(function(event){
                if(event.keyCode == 13){
                    //console.log("test")
                    $("#" + type + "_" + index).blur();
                }
            }));
    }
    
    // add each field
    row.append($('<td class="selectedCol"> <button onclick="selectWord(\''
        + cssEscapeString(words[i]['wordData']['word']) + '\')" class="'
        + (words[i]['wordData']['word'] == selectedWord ? "" : "un")
        + 'selectedWord" word="' + cssEscapeString(words[i]['wordData']['word'])
        + '" title="Click to display accepted definitions in the footer">selected'
        + '</button></td>'));
    row.append(createEditableTd("word", i, word["wordData"]["word"]));
    var stat;
    var colorClass;
    if(word['stagingData']['deleted']) {
        stat = "de<wbr>let<wbr>ed";
        row.find("td input").addClass("strikethrough"); // strike through word field
        colorClass = 'statColorDeleted';
    } else if(word['stagingData']['accepted']) {
        stat = "acc<wbr>ept<wbr>ed";
        colorClass = 'statColorAccepted';
    } else if(word['stagingData']['modified']) {
        stat = "mod<wbr>if<wbr>ied";
        colorClass = 'statColorModified';
    } else if(word['stagingData']['added']) {
        stat = "add<wbr>ed";
        colorClass = 'statColorAdded';
    } else {
        stat = "un<wbr>ed<wbr>it<wbr>ed";
        colorClass = 'statColorUnedited';
    }
    
    //adds data to the row from the word object
    row.append($('<td class="statCol"><button onclick="edit(\'stat\', '
        + i + ')" id="stat_' + i + '" class="statButton ' + colorClass
        + '" title="Click to toggle Accepted/Deleted on or off">' + stat
        + '</button><button class="cancelButton" onclick="edit(\'cancel\', ' + i
        + ')" title="Click to revert to last published version immediately">'
        + 're<wbr>vert</button><button onclick="edit(\'delete\', '
        + i + ')" class="entryDeleteButton" title="Click to toggle Delete on or off">'
        + (word['stagingData']['deleted']?'un-<wbr>delete':'de<wbr>lete')+'</button></td>'));
    row.append(createEditableTd("root", i, word["wordData"]["root"] || ""));
    
    row.append(createEditableTd("plural", i, word["wordData"]["plural"]));
    
    row.append(createEditableTdDropdown("pos", i, word["wordData"]["pos"]));
    row.append(createEditableTd("nep", i, word["wordData"]["nep"]));
    row.append(createEditableTd("def", i, word["wordData"]["def"]));
    row.append(createEditableTd("ch_id", i, word["wordData"]["ch_id"]));
    
    row.append($('<td class="modCol"><p>'
        + (word['wordData']["mod"]) + '</p></td>'));
    row.append($('<td class="dateCol"><p>'
        + (word['wordData']["date"]) + '</p></td>'));
    
    // mark NOUN entries as requiring PLURAL
    if  ($(row).find('td.posCol').text() === 'noun')
        $(row).find('td.pluralCol textarea').addClass('highlighted')
    else $(row).find('td.pluralCol textarea').removeClass('highlighted');
    
    var verbforms = ['comparative form of',
        'superlative form of',
        'present participle of',
        'past participle of',
        'past tense of',
        'third person singular of',
        'past tense and past participle of'];
    
    // mark VERB FORM entries as requiring ROOT WORD
    if  (verbforms.includes($(row).find('td.defCol').text().trim().toLowerCase()))
        $(row).find('td.rootCol textarea').addClass('highlighted')
    else $(row).find('td.rootCol textarea').removeClass('highlighted');
    
    return row;
}


/**
 * Asks the user for specific permission and then publishes accepted changes to the Permanent Dictionary
 */
function publish() {
    if (!(loginname === 'skip')) LOOMA.alert('Only Skip is authorized to PUBLISH')
    else if(confirm("Are you sure you want to publish these changes?")) {
        // tells server to publish
        $.get("looma-dictionary-autogen-backend.php", {'loginInfo': {'allowed': true, 'user': loginname}, 'publish': true},
            function(data, status, jqXHR) {
                // called on server response, alerts the user to the success or failure
                // TODO replace alert with a less intrusive notification
                if(data['status']['type'] == 'success') {
                    LOOMA.alert("published successfully");
                    //since this causes lots of changes, just reload the table
                    submitSearch(true);
                } else {
                    LOOMA.alert("ERROR: publishing failed");
                }
            }, 'json');
    }
}


/**
 * Allows the buttons to the side of the page number to change the page number by signalling
 * this method. It then reloads the table on the new page if the page changed.
 * @param change Specifies the change requested:
 * 	-2: go to page 1
 * 	-1: go back 1 page
 * 	1: go forward 1 page
 * 	2: go to last page
 * 	any other value: stay on same page
 */
function switchPage(change) {
    var elem = $("#pageInput");
    var val = elem.val();
    var prev = val;
    if(change == -2) {
        val = 1;
    } else if(change == -1) {
        val--;
    } else if(change == 1) {
        val++;
    } else if(change == 2) {
        val = maxPage;
    }
    val = Math.max(1, Math.min(maxPage, val));
    elem.val(val);
    if(val != prev) {
        pageChange();
    }
}

/**
 * Reloads the table on the new page
 */
function pageChange() {
    submitSearch(true);
}

function editPos(type, index) {
    edit(type,index);
};

/**
 * Called when an editable cell in the table is changed and should be transmitted to the server
 * @param type The column of the cell changed. For statCol, also allows 'delete' and 'cancel'
 * @param index The row of the cell changed (corresponds to the index in the word list
 */
function edit(type, index) {
    
    // disable all of screen until the response so that there won't be any collisions
    $("#menuArea, #viewArea, #officialViewer").addClass("disableButtons");
    
    // get correct id to get statCol button element (delete and cancel don't have ids)
    var id_type = (type == 'cancel' || type == 'delete') ? 'stat' : type;
    // get correct element
    var elem = $("#" + id_type + "_" + index);
    // confirm a cancel, which takes immediate effect in removing a definition from Staging Dictionary
    
    if(type == 'cancel') {  //code for REVERT staging entry
        LOOMA.alert('Revert function is disabled. Use Delete',null,true);
        $("#menuArea, #viewArea, #officialViewer").removeClass("disableButtons");
        return;
    }
    
    /* REVERT staging entry - code REMOVED june 2018
            if(type == 'cancel' && !confirm(
                    "Are you sure you want to revert all unpublished changes to this entry?")) {
                $("#menuArea, #viewArea, #officialViewer").removeClass("disableButtons");
                return;
            }
    */

// if published, stat button should have no effect (can't be accepted without a change)
    if(type == 'stat' && elem.text() == 'unedited') {
        $("#menuArea, #viewArea, #officialViewer").removeClass("disableButtons");
        return;
    }
    
    //validate EDITs here before commiting them to STAGING dictionary
    // valid ch_id  with regex   '/^([1-9]|10)(M|N|S|SS|EN|H|V)([0-9][0-9])(\.[0-9][0-9])?$/'
    if ((type=='ch_id') && !elem.val().match(/^([1-9]|10)(M|N|S|SS|EN|H|V)([0-9][0-9])(\.[0-9][0-9])?$/)) {
        LOOMA.alert('invalid Chapter ID (ch_id)');
        $("#menuArea, #viewArea, #officialViewer").removeClass("disableButtons");
        return;
    }
    // noun has plural
    if (false) {
        LOOMA.alert('');
        $("#menuArea, #viewArea, #officialViewer").removeClass("disableButtons");
        return;
    }
    // verb form has rw
    
    // end validation
    
    // request change
    $.post('looma-dictionary-autogen-backend.php',
        {'loginInfo': {'allowed': true, 'user': loginname},
            'mod': {'wordId': words[index]['wordData']['id'],
                'field': type, 'new': elem.val(),
                'deleteToggled': (words[index]['stagingData']['deleted']
                    && type == "stat") || type == 'delete'}},
        function(data, status, jqXHR) {  // called on server response
            if(data['status']['type'] == 'success') {
                // don't alert user, since success is assumed, and keep server's change
                words[index] = data['new'];
                if(words[index] == true) {
                    // the change was a removal (cancel), so reload the page
                    submitSearch(true);
                } else {
                    // standard edit.
                    elem.parent().parent().replaceWith(createTableEntry(words[index],
                        index));
                }
            } else {
                // alert user of failure and revert change
                elem.parent().parent().replaceWith(createTableEntry(words[index], index));
                LOOMA.alert("The changes you made to the word <b>"
                    + words[index]['wordData']['word'] +
                    //" (" + words[index]['wordData']['pos'] + ", "
                    //+ words[index]['wordData']['id'] + ") +
                    " </b> failed and were reverted."
                    + "They were most likely badly formatted");
            }
            
            // unlock screen so the user can continue
            $("#menuArea, #viewArea, #officialViewer").removeClass("disableButtons");
        },
        'json');
}

/**
 * Called when a word is selected in the Staging Dictionary and should be displayed in the Permanent Dictionary
 * @param word The word selected as a string
 */
function selectWord(word) {
    selectedWord = cssUnescapeString(word); //.toLowerCase()  [instead of tolowercase here, fix utiities.php to be case insensitive
    // select correct words
    $(".selectedWord").addClass("unselectedWord").removeClass("selectedWord");
    $(".unselectedWord[word='" + word + "']").addClass("selectedWord")
        .removeClass("unselectedWord");
    
    loadOfficialTable();
    moveContext(0);
}

/**
 * Submits a search for a word in the Permanent Dictionary
 */
function submitOfficialSearch() {
    selectWord($("#officialSearchBox").val());
    //loadOfficialTable();  //removed [skip] since it is called in selectWord()
}

/**
 * loads the Permanent Dictionary table using the selected word (global variable)
 */
function loadOfficialTable() {
    
    if (!selectedWord || selectedWord == '')
         { $("#officialTable").find("tr:gt(0)").remove(); }  //dont do a search on '' [too long], just clear the official search results
    else {
        $.get("looma-dictionary-autogen-backend.php",
            {'loginInfo': {"allowed": true, 'user': loginname},
                'searchArgs': {'word': selectedWord, 'overwritten': showOverwritten},
                'staging': false},
            function(data, status, jqXHR) {
                if(data != null) {
                    officialDefs = data['data'];
                    function createOfficialTd(word, field) {
                        var special = false;
                        if(field == "primary") {
                            special = word['wordData']['primary'] + "";
                        }
                        return $("<td class='" + field + "Col'> <p>"
                            + (special || word['wordData'][field] || "") + "</p></td>");
                    }
                    var table = $("#officialTable");
                    table.find("tr:gt(0)").remove();
                    for(var i = 0; i < officialDefs.length; i++) {
                        var row = $("<tr>");
                        row.append($("<td class='editCol'><button id='edit_" + i
                            + "' onclick='moveOfficial(" + i
                            + ");' title='Click to copy to the Staging Database to edit'>"
                            + "Edit</button></td>"));
                        row.append(createOfficialTd(officialDefs[i], "word"));
                        row.append($("<td class='statCol'><p>unedited</p></td>"));
                        row.append(createOfficialTd(officialDefs[i], "root"));
                        row.append(createOfficialTd(officialDefs[i], "plural"));
                        row.append(createOfficialTd(officialDefs[i], "pos"));
                        row.append(createOfficialTd(officialDefs[i], "nep"));
                        row.append(createOfficialTd(officialDefs[i], "def"));
                        row.append(createOfficialTd(officialDefs[i], "ch_id"));
                        //row.append(createOfficialTd(officialDefs[i], "primary"));
                        row.append(createOfficialTd(officialDefs[i], "mod"));
                        row.append(createOfficialTd(officialDefs[i], "date"));
                        table.append(row);
                    }
                    
                    // update margin-bottom of resultsTable
                    $("#viewArea").css("margin-bottom",
                        $("#officialViewer").height() + "px");
                } else {
                    LOOMA.alert("loading from permanent database failed");
                }
            }, 'json');
    }
}

/**
 * moves the word at the given index in the Permanent Dictionary array to the Staging Dictionary
 * with no other changes
 * @param index The index of the word to move
 */
function moveOfficial(index) {
    $.get("looma-dictionary-autogen-backend.php",
        {'loginInfo': {"allowed": true, 'user': loginname},
            'moveId': officialDefs[index]['wordData']['id']},
        function(data, status, jqXHR) {
            if(data['status']['type'] == 'success') {
                // reload page, don't notify, since success is expected
                submitSearch(true);
            } else {
                // notify that it failed and leave page
                LOOMA.alert("moving word to staging failed");
            }
        }, 'json');
}

/**
 * Toggles the show/hide overwritten button and resubmits the table with the new setting
 */
function toggleOverwrite() {
    function getClass() {
        return showOverwritten ? "toggledOn" : "toggledOff";
    }
    $("#showOverwriteButton").removeClass(getClass());
    showOverwritten = !showOverwritten;
    $("#showOverwriteButton").addClass(getClass());
    loadOfficialTable();
}

/**
 * Checks if the input is true or "true"
 * @param input The input to check
 */
function isTrue(input) {
    return input === true || input == "true";
}

/**
 * Checks to confirm the user's intent, and then removes all entries from the Staging Database
 */
function revertStaging() {
    if (!(loginname === 'skip')) LOOMA.alert('Only Skip is authorized to REVERT')
    else if(confirm("Are you sure you want to revert all staging changes? This cannot be undone.")) {
        $.get("looma-dictionary-autogen-backend.php", {'loginInfo': {"allowed": true, 'user': loginname}, 'revertAll': true},
            function(data, status, jqXHR) {
                submitSearch(true);
            }, 'json');
    }
}


/**
 * Shows the add word div and hides everything else
 */
function showAddWordDiv() {
    $("#addWordDiv").show();
    $("#newWordInput").focus();
    $("#menuArea, #viewArea, #officialViewer").addClass("disableButtons");
}

/**
 * Hides the add word div and shows everything else
 */
function hideAddWordDiv() {
    $("#addWordDiv").hide();
    $("#menuArea, #viewArea, #officialViewer").removeClass("disableButtons");
}

/**
 * Adds a single word to the Staging Dictionary with only the english word inputted.
 * Nothing is autogenerated. Then searches for this exact word by id
 */
function addSingleWord() {
    var word = $("#newWordInput").val().toLowerCase();
    $("#addWordDiv").addClass("disableButtons");
    $.get("looma-dictionary-autogen-backend.php", {'loginInfo': {"allowed": true, 'user': loginname}, 'newWord': word},
        function(data, status, jqXHR) {
            if(data && data['status'] && data['status']['type'] == 'success') {
                $("#newWordInput").val("");
                $("#wordPart").val(word);
                $("#added").prop("checked", false);
                $("#modified").prop("checked", false);
                $("#accepted").prop("checked", false);
                submitSearch();
                hideAddWordDiv();
            } else {
                LOOMA.alert("failed to add word");
            }
            $("#addWordDiv").removeClass("disableButtons");
        }, 'json');
}

/**
 * Cancels the current upload
 */
function cancelUpload() {
    $.get("looma-dictionary-autogen-backend.php", {'loginInfo': {"allowed": true, 'user': loginname}, "cancelUpload": true},
        function(data, status, jqXHR) {
            // don't do anything. it will continue to run until it skips all entries. then
            // the normal processPDF() handler will finish it
        });
}



/**
 * Moves and updates the context depending on the input
 * @param change 0 to signal to go to the first instance, 1 for the next, -1 for the previous.
 * Any other value results in staying in the same place
 */
function moveContext(change) {
    if(context == "") {
        $("#contextText").text("No file selected");
        return;
    }
    if(selectedWord == "") {
        $("#contextText").text("No Word Selected");
        return;
    }
    if(change == -1) {
        var prev = context.toLowerCase().lastIndexOf(selectedWord, contextMarker - 1);
        if(prev >= 0) {
            contextMarker = prev;
        }
    } else if(change == 1) {
        var next = context.toLowerCase().indexOf(selectedWord, contextMarker + 1);
        if(next >= 0) {
            contextMarker = next;
        }
    } else if(change == 0){
        contextMarker = context.toLowerCase().indexOf(selectedWord);
    }
    if(contextMarker < 0) {
        $("#contextText").text("Not found");
    } else {
        $("#contextText").html(getContext());
    }
}

/**
 * returns the index of the previous whitespace character or -1 if not found
 * @param string
 * @param place
 * @returns {Number}
 */
function lastSpace(string, place) {
    var ans = -1;
    var separators = [" ", "\t", "\n"];
    for(var i in separators) {
        ans = Math.max(ans, string.lastIndexOf(separators[i], place));
    }
    return ans;
}

/**
 * Returns the index of the next whitespace character or the max value provided
 * @param string
 * @param place
 * @param max
 * @returns
 */
function nextSpace(string, place, max) {
    var ans = max;
    var separators = [" ", "\t", "\n"];
    for(var i in separators) {
        var next = string.indexOf(separators[i], place);
        if(next != -1) {
            ans = Math.min(ans, next);
        }
    }
    return ans;
}

/**
 * Gets the context around a particular location in the context string. bolds the selected word
 */
function getContext() {
    var start = Math.max(0, contextMarker - 50);
    start = lastSpace(context, start) + 1;
    var end = Math.min(context.length - 1, contextMarker + 50);
    end = nextSpace(context, end, context.length);
    return context.substring(start, contextMarker) + "<b>"
        + context.substring(contextMarker, contextMarker + selectedWord.length)
        + "</b>" + context.substring(contextMarker + selectedWord.length, end);
}

/**
 * Changes the context file to the inputted file
 */
function changeContext() {
    var file = document.getElementById("contextInput").files[0];
    if(file == null || !("name" in file) || !file.name.endsWith(".pdf")) {
        $("#contextInput").val("");
        $("#contextText").text("invalid file");
    }
    Pdf2TextClass().convertPDF(file, function(page, total) {}, function(pages) {
        updateContext(pages);
        moveContext(0);
    });
}

function loadContext (event) {  //called when a CH_ID is clicked to open the textbook in the "context" panel
    var ch_id = $(event.target).val();
    
    $.ajax({
        url: LOOMA.ch_idFilepath(ch_id),
        success: function (pdf) {
            //var blobPDF = new Blob(pdf);
            //var filePDF = new File(pdf, 'pdf.txt');
            Pdf2TextClass().convertPDF(
                pdf,
                // blobPDF,
                // filePDF,
                function(page, total) {},
                function(pages) {
                    updateContext(pages);
                    moveContext(0);
                });
        }
    });
}

/**
 * Updates the context string to the given pages of text from a pdf
 * @param pages The list of pages
 * @param start The page to start on , defaults to 0
 * @param end The page to end on, defaults to the last page
 */
function updateContext(pages, start, end) {
    // set the context
    context = "";
    for(var i = start || 0; i <= (end || (pages.length - 1)); i++) {
        context += pages[i];
    }
    // reset to the beginning of the context
    contextMarker = 0;
}


/**
 * To be called when closing window. If necessary, will cancel a running upload. Will not
 * be able to notify the user
 */
function checkBeforeUnload() {
    if(processing) {
        cancelUpload();
    }
}
function verbFormSelect(event) {
    event.preventDefault;
    // only show dropdown if PART is 'verb'
    
    if ($(event.target).parent().siblings(".posCol").find('select')[0].value == 'verb') {
        $(event.target).css('background-color', '#FFFFE0')
        
        var $verb = $('#verbFormChoices').show().prop('selectedIndex',0);
        
        //$verb.select(function(){$verb.trigger('change')});
        
        $verb.change(function (innerevent) {
            //innerevent.preventDefault;
            if ($("#verbFormChoices option:selected").val() != 'none'  ||
                event.target.value == $("#verbFormChoices option:selected").val())
                    event.target.value = $("#verbFormChoices option:selected").val();
            
            $(event.target).css('background-color', 'inherit')
            $(event.target).trigger('change');
            $verb.prop('selectedIndex',0).hide();
        });
    }
}

/**
 * To be called on when the page is loaded. Sets up the screen and pulls data from the backend.
 */
function startup() {
    
    loginname = LOOMA.loggedIn();
    
    if (loginname === 'skip' || loginname === 'david') $('.admin').removeClass('admin').prop('disabled', false);
    //if (loginname === 'skip' )                         $('.exec').removeClass('exec').prop('disabled', false);
    
    hideUploadDiv();
    hideAddWordDiv();
    submitSearch();
    $("#cancelUploadButton").hide();
    $(window).on("beforeunload", checkBeforeUnload);
    $("#wordPart").keyup(function(event){
        if(event.keyCode == 13){
            submitSearch(false);
        }
    });
    $("#officialSearchBox").keyup(function(event){
        if(event.keyCode == 13){
            submitOfficialSearch();
        }
    });
    $("#newWordInput").keyup(function(event){
        if(event.keyCode == 13){
            addSingleWord();
        }
    });
    
    $('#resultsTable').on("dblclick", 'td.defCol textarea',verbFormSelect);
    
    //this is not working
    $('#verbFormChoices').blur(function() {
        $('#verbFormChoices').hide();
    });
}

$(document).ready(startup);
