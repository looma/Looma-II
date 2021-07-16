/*
Author: Charlotte, Skip
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: June 2021
Revision: Looma 6.4

filename: looma-edit-dictionary.js
Description:
*/
'use strict';

var displayArea;
var deleteRow;
var selectRow;
var generatedId;

// setFields is called to set the text fields
// words is an array of documents returned by searchall
function setFields(words) {
    $(".row").remove();
    $("#confirmTable").css("display", "none");
    if (words.length == 0) {
        LOOMA.alert("Word not found", 2);
    }
    else {
        // create a row for each document
        // fill in the fields with the corresponding value from the words array
        for (var i = 1; i < words.length + 1; i++) {
            var newRow = $('<tr class="row" id="row_' + i + '"></tr>');
            var idField = $('<td><input type="text" class="hiddenID" id="row' + i + '-id"></td>');
            $(idField).appendTo(newRow);
            var enField = $('<td><input type="text" class="en" id="row' + i + '-en"></td>');
            $(enField).appendTo(newRow);
            var npField = $('<td><input type="text" class="np" id="row' + i + '-np"></td>');
            $(npField).appendTo(newRow);
            var partField = $('<td><select name="part" id="row' + i + '-part"><option value="noun">Noun</option>' +
                '<option value="verb">Verb</option><option value="adjective">Adjective</option><option value="adverb">Adverb</option>' +
                '<option value="preposition">Preposition</option><option value="conjunction">Conjunction</option><option value="pronoun">Pronoun</option>' +
                '<option value="contraction">Contraction</option><option value="interjection">Interjection</option><option value="article">Article</option>' +
                '<option value="proper name">Proper Name</option><option value="title">Title</option></select></td>');
            $(partField).appendTo(newRow);
            var pluralField = $('<td><input type="text" class="plural" id="row' + i + '-plural"></td>');
            $(pluralField).appendTo(newRow);
            var rwField = $('<td><input type="text" class="rw" id="row' + i + '-rw"></td>');
            $(rwField).appendTo(newRow);
            var ch_idField = $('<td><input type="text" class="ch_id" id="row' + i + '-ch_id"></td>');
            $(ch_idField).appendTo(newRow);
            var defField = $('<td><textarea name="definition" id="row' + i + '-definition" rows="1" cols="27"></textarea></td>');
            $(defField).appendTo(newRow);
            var selectButton = $('<td><button type="submit" id="select' + i + '" class="select">Select</button></td>');
            $(selectButton).appendTo(newRow);
            var deleteButton = $('<td><button type="submit" id="delete' + i + '" class="delete">Delete</button></td>');
            $(deleteButton).appendTo(newRow);
            
            var table = document.getElementById("titleTable");
            $(newRow).appendTo(table);
            
            $("#row_" + i).css("display", "block");
            $("#row"+ i + "-en").val(words[i-1]['en']);
            $("#row"+ i + "-np").val(words[i-1]['np']);
            $("#row"+ i + "-part").val(words[i-1]['part']);
            $("#row"+ i + "-plural").val(words[i-1]['plural']);
            $("#row"+ i + "-rw").val(words[i-1]['rw']);
            $("#row"+ i + "-ch_id").val(words[i-1]['ch_id']);
            $("#row"+ i + "-definition").val(words[i-1]['def']).autoResize();
            
            $("#row"+ i + "-id").val(words[i-1]['_id']['$oid'] || words[i-1]['_id']['$id'] || "placeholder").css("display", "none");
            
            // set the number of rows in the textarea using the length of the definition
            var textArea = document.getElementById("row"+ i + "-definition");
            textArea.rows = Math.floor(textArea.value.length / 33) + 1;
        }
        
    }
}

// adds an empty row
function addEntry() {
    $("#row_1").css("display", "block");
    $("#row1-id").css("display", "none");
    var empty = [{"_id":"","ch_id":"","en":"","plural":"","np":"","def":""}];
    setFields(empty);
}

// when the Looma database fails to find the word
function fail(jqXHR, textStatus, errorThrown) {
    alert("function fail");
    console.log('jqXHR is ' + jqXHR.status);
    window.alert('failed with textStatus = ' + textStatus);
    window.alert('failed with errorThrown = ' + errorThrown);
}

// gets the definition of the user's input
function getDefinition(event) {
    event.preventDefault();
    var input = document.getElementById("input").value;
    LOOMA.dictionarySearchall(input, setFields, fail);
    return false;
}

// is called as a success and canceled function for delete and a success function for update
function doNothing() {}

// deletes the document using the row's id
function deleteDocument() {
    var IDtoDelete = null;
    IDtoDelete = document.getElementById("row" + deleteRow + "-id").value;
    LOOMA.dictionaryDelete(IDtoDelete, doNothing, fail);
    $("#delete" + deleteRow).css("display", "none");
    $("#select" + deleteRow).css("display", "none");
    $("#row" + deleteRow + "-en").css("backgroundColor", "grey");
    $("#row" + deleteRow + "-np").css("backgroundColor", "grey");
    $("#row" + deleteRow + "-part").css("backgroundColor", "grey");
    $("#row" + deleteRow + "-plural").css("backgroundColor", "grey");
    $("#row" + deleteRow + "-rw").css("backgroundColor", "grey");
    $("#row" + deleteRow + "-ch_id").css("backgroundColor", "grey");
    
    $("#row" + deleteRow + "-definition").css("backgroundColor", "grey").css("resize", "vertical");
    document.getElementById("row" + deleteRow + "-definition").rows = "1";
}


// fills the confirm table with the user's selected entry
function fillConfirmTable() {
    $("#confirm-en").text(document.getElementById("row" + selectRow + "-en").value);
    $("#confirm-np").text(document.getElementById("row" + selectRow + "-np").value);
    $("#confirm-part").text(document.getElementById("row" + selectRow + "-part").value);
    $("#confirm-plural").text(document.getElementById("row" + selectRow + "-plural").value);
    $("#confirm-rw").text(document.getElementById("row" + selectRow + "-rw").value);
    $("#confirm-ch_id").text(document.getElementById("row" + selectRow + "-ch_id").value);
    $("#confirm-definition").text(document.getElementById("row" + selectRow + "-definition").value);
    $("#confirm-id").text(document.getElementById("row" + selectRow + "-id").value);
    
    if (document.getElementById("row" + selectRow + "-id").value !== "") {
        $("#confirmTable").show();
        $("#confirm-id").css("display", "none");
    }
}

// saves the entries shown in the confirm table
function saveEntry() {
    var id = $('#confirm-id').text();
    var en = $('#confirm-en').text();
    var np = $('#confirm-np').text();
    var part = $('#confirm-part').text();
    var plural = $('#confirm-plural').text();
    var rw = $('#confirm-rw').text();
    var ch_id = $('#confirm-ch_id').text();
    var def = $('#confirm-definition').text();
    
    if (en == "" || part == "" || def == "") {
        LOOMA.alert("'en' 'part' and 'definition' fields must be completed", 2);
    }
    else {
        try {
            if (ch_id !== "") {
                // checks if ch_id is valid and throws an error if invalid
                var validate = ch_id.match(LOOMA.CH_IDregex).length;
            }
            var selected = [id, en, np, part, plural, rw, ch_id, def];
            LOOMA.dictionaryUpdate(selected, doNothing, fail);
            $("#input").val(en);
            $("#confirmTable").css("display", "none");
            $("#delete" + selectRow).css("display", "none");
        }
        catch {
            LOOMA.alert("Invalid ch_id", 2);
        }
    }
}

$(document).ready (function() {
    var elem = document.getElementById("lookup");
    elem.addEventListener('submit', getDefinition);
    
    // delete buttons
    $("#titleTable").on("click", ".delete", function(e) {
        deleteRow = e.target.id.slice(e.target.id.length - 1);
        LOOMA.confirm("Delete this entry?", deleteDocument, doNothing);
    })
    
    // select buttons
    $("#titleTable").on("click", ".select", function(e) {
        selectRow = e.target.id.slice(e.target.id.length - 1);
        fillConfirmTable();
    })
    
    // save button
    document.getElementById("saveButton").onclick = function() {
        saveEntry();
    }
    
    // add button
    document.getElementById("addButton").onclick = function() {
        addEntry();
    }
    
})



/*
 * jQuery autoResize (textarea auto-resizer)
 * @copyright James Padolsey http://james.padolsey.com
 * @version 1.04
 */

$.fn.autoResize = function(options) {
    
    // Just some abstracted details,
    // to make plugin users happy:
    var settings = $.extend({
        onResize : function(){},
        animate : true,
        animateDuration : 150,
        animateCallback : function(){},
        extraSpace : 0,
        limit: 1000
    }, options);
    
    // Only textarea's auto-resize:
    this.filter('textarea').each(function(){
        
        // Get rid of scrollbars and disable WebKit resizing:
        var textarea = $(this).css({resize:'none','overflow-y':'hidden'}),
            
            // Cache original height, for use later:
            origHeight = textarea.height(),
            
            // Need clone of textarea, hidden off screen:
            clone = (function(){
                
                // Properties which may effect space taken up by chracters:
                var props = ['height','width','lineHeight','textDecoration','letterSpacing'],
                    propOb = {};
                
                // Create object of styles to apply:
                $.each(props, function(i, prop){
                    propOb[prop] = textarea.css(prop);
                });
                
                // Clone the actual textarea removing unique properties
                // and insert before original textarea:
                return textarea.clone().removeAttr('id').removeAttr('name').css({
                    position: 'absolute',
                    top: 0,
                    left: -9999
                }).css(propOb).attr('tabIndex','-1').insertBefore(textarea);
                
            })(),
            lastScrollTop = null,
            updateSize = function() {
                
                // Prepare the clone:
                clone.height(0).val($(this).val()).scrollTop(10000);
                
                // Find the height of text:
                var scrollTop = Math.max(clone.scrollTop(), origHeight) + settings.extraSpace,
                    toChange = $(this).add(clone);
                
                // Don't do anything if scrollTip hasen't changed:
                if (lastScrollTop === scrollTop) { return; }
                lastScrollTop = scrollTop;
                
                // Check for limit:
                if ( scrollTop >= settings.limit ) {
                    $(this).css('overflow-y','');
                    return;
                }
                // Fire off callback:
                settings.onResize.call(this);
                
                // Either animate or directly apply height:
                settings.animate && textarea.css('display') === 'block' ?
                    toChange.stop().animate({height:scrollTop}, settings.animateDuration, settings.animateCallback)
                    : toChange.height(scrollTop);
            };
        
        // Bind namespaced handlers to appropriate events:
        textarea
            .unbind('.dynSiz')
            .bind('keyup.dynSiz', updateSize)
            .bind('keydown.dynSiz', updateSize)
            .bind('change.dynSiz', updateSize);
        
    });
    
    // Chain:
    return this;
    
};
