<?php
/*<!--
File: editor.html
Author: Nikhil Singhal
Date: July 28, 2016

Sets up the editor page so it can be used to display and modify dictionary entries in
the staging and Permanent dictionaries.

The main segments are #uploadPDFDiv, a floating popup that asks the user to input pdfs for
scanning, menuArea, the area with control buttons and the search area, viewArea, the section
that contains the majority of the screen with the staging table, and officialViewer, the
floating footer that displays a table with published definitions of the currently selected word.

This file requires js/looma-dictionary-autogen-editor.js for functionality,
and js/looma-dictionary-autogen-editor.js requires jQuery, which
is attained through google dynamic loading, js/pdf.js, js/looma-dictionary-autogen-pdfToText.js,
and js/looma-dictionary-autogen-uniquewords.js. Also requires css/looma-dictionary-autogen-editor.css
for style and looma-dictionary-autogen-backend.php for backend functionality.

To operate the page, first log in. Then you can click the "Upload PDF" button
and upload a pdf, which will be transmitted to the database and added to staging. Then you
can search for certain words and modify any of the staging words (any modifications to a
single field will immediately be transmitted and saved, otherwise the user will be alerted
and the change will be reverted), though only permitted fields (fields such as 'id' and
the last modifier cannot be modified). Since searches are likely to return too many results
to load or display, the server only returns a small page of a few words at a time. To view
more words, press the next/previous page buttons at the bottom of the staging table or input
a page number. To view published definitions of staging words, click the "selected/unselected"
button on the left side of the row and those entries will appear in the footer. To edit the
published entries in the footer, click on the "edit" button on the left side of the row and
they will be moved to the staging dictionary where they can be edited. Once you are done
editing, simply click the "publish" button and say you are sure and all accepted changes will
be transferred to the Permanentdictionary.

The status column shows the current status of a word:
if the word is in the Permanentlooma dictionary database it is considered "published"/"unedited"
and this is displayed directly in the column in the footer or in the left button in the column
in the staging table. Clicking this button will have no effect.

if the word is in the staging dictionary and has been deleted, the left button in the status
column will say "deleted" and the "delete" button will change to "re add", and clicking
either button will re-add it and restore its previous status. By deleted, we mean that
the definition will be COMPLETELY REMOVED FROM BOTH DICTIONARIES when published.

if the word is in the staging dictionary (whether modified or not) and not deleted
and has been accepted, meaning that it is set to be transfered to the
Permanentdictionary when the page is published, it will say "accepted" in the button on the
left. Clicking this button will toggle it between "accepted" and its previous status (which
must be "modified" or "added")

if the word is in the staging dictionary and not been deleted or accepted, but has been modified
from its original state (whether that was its original value after being added or the value
it had in the Permanentdictionary), the left button will say "modified", and clicking it
will toggle it between "accepted" and "modified".

if the word is in the staging dictionary and has just been added (eg from a pdf, not the
Permanentdatabase), the left button will say "added", and clicking it will toggle it between
"accepted" and "added"

if delete is pressed, the status will change to deleted (see above). if the cancel button is
pressed and the user confirms, the entry selected will IMMEDIATELY be deleted from the STAGING
dictionary. If it had a previous version in the Permanentdictionary, that version will NOT be
modified or removed.

More features and usage information can be found in the user manual

 -->
*/

function isLoggedIn() { return (isset($_COOKIE['login']) ? $_COOKIE['login'] : null);}

function loginLevel() { return $_COOKIE['login-level'];}

// NOTE: this code sending "header" must be before ANY data is sent to client=side
$loggedin = isLoggedIn(); if (!$loggedin && loginLevel() !== 'exec' && loginLevel() !== 'admin') header('Location: looma-login.php');
error_log("Starting Dictionary Edit session. logged in as: " . $loggedin);
?>

<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Looma Dictionary Editor</title>
    <script src="js/jquery.min.js"></script>
    <script src="js/pdfjs/pdf.min.js"></script>
    <script src="js/looma.js">           </script>      <!-- Looma common page functions -->
    <script src="js/looma-utilities.js"></script>
    <script src="js/looma-dictionary-autogen-pdfToText.js"></script>
    <script src="js/looma-dictionary-autogen-uniquewords.js"></script>
    <script src="js/looma-dictionary-autogen-editor.js"></script>
    <link rel="stylesheet" href="css/looma-dictionary-autogen-editor.css">



</head>
<body>

<div id="uploadPDFDiv" class="popupDiv">
    <button class="closePopupButton" onclick="hideUploadDiv()"> X </button> <br>
    <input type="file" id="pdfInput" title="Choose the file containing the words you wish to upload">
    <br>
    <pre class="inline" title="Type the prefix for the chapter id, which should include the grade level,
                               then subject abbreviation, and possibly the chapter number if you are only loading one chapter.
                               If the book doesnt have units, then legal prefixes are '3M', '7SS', etc.
                               If the book has units, add the unit number and a '.' like '7SS01.' or '8EN03.'">
                ch_id prefix: <input type="text" id="prefixInput" placeholder="ex. 3EN"></pre>
    <br>
    <!--
    <pre class="inline" title="Check this box if you want the program to automatically parse where chapters start and end. Make sure you read the user manual to know the limitations of this feature">Autogenerate ch_ids: <input type="checkbox" id="autoChidCheck" onclick="changeAutoGen()"></pre>
    <br>
    -->
    <pre id="chidInputLabel" class="inline" title="If you're loading an entire textbook, enter the page numbers (in the pdf) of the start of each chapter.
                                                    If you're just loading 1 chapter, don't type anything here but include the chapter number in the 'ch_id prefix' field">
                Page numbers: </pre>
    <input type="text" id="chapInput" placeholder="ex. 12, 14, 17, 23">
    <br>
    <pre class="inline" title="Input the page number (in the pdf) you want to start with. If you don't type anything, defaults to page 1">Start: <input type="number" id="startPageNumber" class="quarter"> </pre>
    <pre class="inline" title="Input the page number (in the pdf) you want to end with. If you don't type anything, defaults to the last page">End: <input type="number" id="endPageNumber" class="quarter"> </pre>
    <br>
    <button id="processPDFButton" onclick="processPDF()" title="Click here to start processing and uploading this PDF. After clicking this, you should not exit the page or reload until it is finished or you press cancel">Process PDF</button>
    <br>
    <p id="progressDisplay" class="centeredText alwaysShow"> </p>
    <button id="cancelUploadButton" class="alwaysClickable alwaysShow" onclick="cancelUpload()"
            title="Click here to cancel the current upload. Entries that have already been added from this upload will not be removed">Cancel</button>
</div>

<div id="addWordDiv" class="popupDiv">
    <button class="closePopupButton" onclick="hideAddWordDiv()"> X </button> <br>
    <pre class="inline">Word: </pre>
    <input type="text" id="newWordInput" placeholder="ex. test">
    <br>
    <input type="button" id="addWordButton" onclick="addSingleWord()" value="Add word and show in editor">
</div>


<div id="menuArea">

    <div id="rightButtons">
        <button id="uploadPDFButton"
                class="leftButton admin"
                title="Click here to upload a PDF with words for the dictionary">Upload PDF</button>
        <br>
        <button id="showWordDivButton"
                class="leftButton"
                onclick="showAddWordDiv()" title="Click here to add a single word to the staging database manually">Add Single Word</button>

    </div>

    <div class="boxedSection  thirtyW">
        <b>Search Staging Dictionary: </b>
        <input type="text" name="wordPart" id="wordPart" placeholder="Enter Search Term Here" title="Normal Search:
	Type a part of a word you want to search for, or nothing
Advanced Search:
	Type key:value pairs (keys are en, rw, part, np, def, ch_id, mod, date) separated by & or |, where & has a higher operator precedence. Entries will match if they contain the value given.">
        <input type="button" value="Search" id="searchButton" onclick="submitSearch()">
        <input type="checkbox" name="added" id="added">Added
        <input type="checkbox" name="modified" id="modified">Modified
        <input type="checkbox" name="accepted" id="accepted">Accepted
        <input type="checkbox" name="deleted" id="deleted">Deleted
        <br>
    </div>

    <div class="boxedSection  thirtyW">
        <b>Context: </b>
        <input type="file" id="contextInput" onchange="changeContext()">
        <p id="contextText" class="fullWidthBreakText"></p>
        <div id="arrows">
            <input type="button" onclick="moveContext(0);" value="<<">
            <input type="button" onclick="moveContext(-1);" value="<">
            <input type="button" onclick="moveContext(1);" value=">">
        </div>
    </div>

    <div id="leftButtons">
        <button id="publishButton"
                class="rightButton admin"
                title="Click here to publish accepted/deleted entries from the staging database to the Permanent Dictionary">Publish Accepted Changes</button>
        <br>
        <button id="revertAllButton"
                class="rightButton exec"
                class="right" title="Click here to remove all entries from the staging database and return to the previous published state">Revert All</button>
    </div>

</div>


<div id="viewArea" class="clearAll">

    <div id="pageSwitcherSuper">
        <div id="pageSwitcherSub">
            <input type="button" id="firstPageButton" value="<<<" onclick="switchPage(-2)">
            <input type="button" id="previousPageButton" value="<" onclick="switchPage(-1)">
            <b>Page</b>
            <input type="number" id="pageInput" value="1" min="1" onchange="pageChange()">
            <b>of</b>
            <b id="maxPage"></b>
            <input type="button" id="nextPageButton" value=">" onclick="switchPage(1)">
            <input type="button" id="lastPageButton" value=">>>" onclick="switchPage(2)">
        </div>
    </div>

    <div id="resultsArea">
        <table id="resultsTable">
            <tr>
                <th class="selectCol">Selected</th>
                <th class="wordCol">Word</th>
                <th class="statCol">Status</th>
                <th class="rootCol">Root Word</th>
                <th class="pluralCol">Plural</th>
                <th class="posCol">Part</th>
                <th class="nepCol">Nepali</th>
                <th class="defCol">Definition</th>
                <th class="ch_idCol">ch_id</th>
                <th class="modCol">Editor</th>
                <th class="dateCol">Date</th>
            </tr>
        </table>
    </div>


</div>

<div id="officialViewer">
    <div id="footerLabel">
        <span><b>Search Permanent Dictionary: </b></span>
        <div id="officialSearchArea">
            <input type="text" name="wordPart" id="officialSearchBox" placeholder="Enter Search Term Here" title="input a search for a specific word in the published dictionary">
            <input type="button" value="Search" id="officialSearchButton" onclick="submitOfficialSearch()" title="Click to search">
        </div>
        <button id="showOverwriteButton" class="toggledOff" onclick="toggleOverwrite();" title="Click to toggle showing published versions of entries currently in the staging dictionary"></button>
    </div>
    <table id="officialTable">
        <tr>
            <th class="editCol"></th>
            <th class="wordCol">Word</th>
            <th class="statCol">Status</th>
            <th class="rootCol">Root Word</th>
            <th class="pluralCol">Plural</th>
            <th class="posCol">Part</th>
            <th class="nepCol">Nepali</th>
            <th class="defCol">Definition</th>
            <th class="ch_idCol">ch_id</th>
            <th class="modCol">Modified By</th>
            <th class="dateCol">Date Modified</th>
        </tr>
    </table>
</div>

<div id="verbFormChoices" hidden>
    <select>
        <option value='none'>(no change)</option>
        <option value='comparative form of'>comparative form of</option>
        <option value='superlative form of'>superlative form of</option>
        <option value='present participle of'>present participle of</option>
        <option value='past participle of'>past participle of</option>
        <option value='past tense of'>past tense of</option>
        <option value='third person singular of'>third person singular of</option>
        <option value='past tense and past participle of'>past tense and past participle of</option>
    </select>
</div>

<img id="padlock"
     draggable="false"
     src="  <?php echo loggedIn() ? "images/padlock-open.png" : "images/padlock-closed.png"; ?>" >

<p id="login-id" ><?php if (loggedIn()) echo "You are logged in as '" . $_COOKIE['login'] ."'" ?></p>


</body>
</html>
