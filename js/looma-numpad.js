/*
 Name: Akshay Srivatsan
 Date: Summer 2016

 Description:
 This file adds an on-screen num pad to Looma pages.
 If you are editing this file, make sure your editor can handle unicode! There should be Nepali characters on lines 12 & 13.
 */
var keys = "123456789.0";
var nepaliKeys = "१२३४५६७८९.०";

var destination = undefined;
var temporaryDestination = undefined;

var validInputsString =
    'input:not([type]):not(.nonumpad):not([readonly]), input[type=text]:not(.nonumpad):not([readonly]), textarea:not(.nonumpad):not([readonly])';

// Check if the "nepali" key is down.
function isNepali() {
    return $("#looma-numpad").hasClass("nepali");
}

// Check if the text is supposed to be put in a <textarea>, which can accept newlines.
function isTextArea() {
    return (temporaryDestination.prop("tagName").toLowerCase() == "textarea");
}

// Toggle whether English or Nepali characters are showing.
function toggleNepali() {
    if (isNepali()) {
        $("#looma-numpad").removeClass("nepali");
        $("#numpad-language").removeClass("nepali");
    } else {
        $("#looma-numpad").addClass("nepali");
        $("#numpad-language").addClass("nepali");
    }
}

function backspaceChar() {
    "use strict";
    //var $input = $('#inputEntry')
    temporaryDestination.html(temporaryDestination.html().substr(0,temporaryDestination.html().length-2));
}

function addKey(numpad, i) {
    // There are four things each button could represent: the normal English key, the shifted English key, the normal Nepali key, and the shifted Nepali key.
    var key = $("<button></button>")
        .addClass("numpad-button");
    var keySpan = $("<span></span>");
    keySpan.addClass("numpad-normal");
    keySpan.html(keys[i]);
    key.append(keySpan);

    var nepali = $("<span></span>");
    nepali.addClass("numpad-nepali");
    nepali.html(nepaliKeys[i]);
    key.append(nepali);

    numpad.append(key);
}

/*
 * This whole function just generates the DOM elements for the numpad – since it must be on every page, it's generated dynamically.
 * Each row is generated in a loop, then any special characters are added to the end of that row and the beginning of the next.
 */
function createnumpad() {

    var numpadContainer = $("<div></div>")
        .attr('id', 'looma-numpad-container')
        .addClass('numpadContainer');
    
    var numpad = $("<div></div>")
        .attr('id', 'looma-numpad')
        .addClass('numpad');

    numpadContainer.append($("<br/>"));

    // First Row
    for (var i = 0; i < 11; i++) { addKey(numpad, i); }
   
    var backspace = $("<button></button>")
        .attr('id', 'numpad-backspace')
        .addClass("numpad-button numpad-special")
        .click(backspaceChar);
    numpad.append(backspace);
    
    var language = $("<button></button>")
        .attr('id', 'numpad-language')
        .addClass("numpad-button numpad-special")
        .click(toggleNepali);
    numpad.append(language);

    var blank = $('<button></button>')
        .addClass("numpad-button numpad-blank")
        .css({visibility:"none" });
    $(numpad).append(blank);

    var hideButton = $('<button></button>')
        .attr('id', 'numpad-hide')
        .addClass("numpad-button numpad-special")
        .click(hidenumpad);
    $(numpad).append(hideButton);
    
    $(numpadContainer).append(numpad);
    $('body').append(numpadContainer);
    $('#looma-numpad-container').hide();
    //LOOMA.rtl(document.getElementById('inputEntry'));
    
    $('.numpad-button').click(keyClicked);
}  //end createnumpad()

// Send a certain character to the input/textarea.
function sendKey(key) {
    var startPos = temporaryDestination[0].selectionStart;
    var endPos = temporaryDestination[0].selectionEnd;
    //console.log(startPos, endPos);
    var oldContent = "";
    if (isTextArea()) {
        oldContent = $(temporaryDestination).html();
    } else {
        oldContent = $(temporaryDestination).val();
    }
    var newContent = oldContent.slice(0, startPos) + key + oldContent.slice(
        endPos);
    if (isTextArea()) {
        temporaryDestination.html(newContent);
    } else {
        temporaryDestination.val(newContent);
    }
    temporaryDestination[0].selectionStart = 0;
    temporaryDestination[0].selectionEnd = 0;
}

// Remove the last character from the input/textarea.
function backspace() {
    if (isTextArea()) {
        var oldValue = $(temporaryDestination).html();
    } else {
        var oldValue = $(temporaryDestination).val();
    }

    if (oldValue.length == 0) {
        return;
    }
    var newValue = oldValue.substring(1, oldValue.length);

    if (isTextArea()) {
        temporaryDestination.html(newValue);
    } else {
        temporaryDestination.val(newValue);
    }
    temporaryDestination[0].selectionStart = 0;
    temporaryDestination[0].selectionEnd = 0;
}

// Event handler when a button is clicked. Checks if the key is a special key, then performs the appropriate action.
function keyClicked(event) {
    var target = event.currentTarget;

    if ($(target).hasClass('numpad-special')) {
        switch ($(target).attr('id')) {
            case 'numpad-space':
                sendKey(' ');
                break;
            case 'numpad-enter':
                if (isTextArea()) {
                    sendKey('\n');
                }
                break;
            case 'numpad-backspace':
                backspace();
                break;
        }
    } else {
        var key = null;

         if (isNepali()) {
            key = $(target).find('.numpad-nepali').html();

        } else {
            key = $(target).find('.numpad-normal').html();
        }
        sendKey(key);
    }

    temporaryDestination.focus();
}

/*
 * Call this to activate the numpad on the current element. If there is no selected element, but there is only one matching element on the screen, it will be selected.
 */
function shownumpad(event) {
    var target = destination;
    // Make sure the target is a valid type of input.
    if ($(target).prop("tagName").toLowerCase() != "textarea" && $(target).prop(
            "tagName").toLowerCase() != "input") {
        var $validInputs = $(validInputsString);
        // If there's only one valid input, we can assume that's what the user wanted to edit.
        if ($validInputs.length == 1) {
            target = $validInputs;
	    destination = $validInputs;
        } else {
            return;
        }
    }
    // Ignore invalid inputs, if they were somehow assigned to "destination".
    if ($(target).hasClass("nonumpad")) return;
    if ($(target).attr("readonly") != null) return;

    $('.numpad-entry').css({
        display: "none"
    });

    // We only want to show the relevant element, since textareas and inputs have different features.
    if ($(target).prop("tagName").toLowerCase() == "textarea") {
        temporaryDestination = $('#textareaEntry');
        temporaryDestination.html($(target).html());
        $('#numpad-enter').css({
            visibility: "visible"
        });
    } else {
        temporaryDestination = destination;   //$('#inputEntry');
        if ($(target).val()) {
            temporaryDestination.val($(target).val());
        }
        $('#numpad-enter').css({
            visibility: "hidden"
        });
    }

    temporaryDestination.css({
        display: ""
    });

    LOOMA.makeTransparent($("#main-container-horizontal"));
    
    $("#looma-numpad-container").css({
        display: "block"
    });
    temporaryDestination.focus();
}

// Dismiss the numpad, resetting everything to normal. The current text will be inserted into the text field.
function hidenumpad() {
    if (isTextArea()) {
        destination.html(temporaryDestination.html());
    } else {
        destination.val(temporaryDestination.val());
    }

    $('#textareaEntry').html();
    $('#inputEntry').val('');
    
    //$("#main-container-horizontal").removeClass('all-transparent');
    LOOMA.makeOpaque($("#main-container-horizontal"));
    
    //checkAnswer();
    
    $("#looma-numpad-container").hide();
}

// Called whenever a compatible element is focused.
function elementFocused(event) {
    destination = $(event.currentTarget);
}

// This will enable the OSK for every input/textarea. If any of these elements exist, a "show numpad" button will appear at the bottom-left of the screen.

$(document).ready(function() {
    var $validInputs = $(validInputsString);
    console.log($validInputs);
    if ($validInputs.length == 0) {
        console.log("No text inputs.");
        return;
    }
    createnumpad();

    $validInputs.click(elementFocused);
    
    var shownumpadButton = $("<button></button>").addClass(
        "show-numpad-button").click(shownumpad);

    destination = $(document.activeElement);
    $("#main-container-horizontal").append(
        shownumpadButton);
});
