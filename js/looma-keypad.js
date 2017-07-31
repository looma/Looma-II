/*
 Name: Akshay Srivatsan
 Email: akshay.srivatsan@menloschool.org
 Date: Summer 2016

 Description:
 This file adds an on-screen keyboard to Looma pages.
 If you are editing this file, make sure your editor can handle unicode! There should be Nepali characters on lines 12 & 13.
 */
var keys = "123456789.0";
var nepaliKeys = "ऽ१२३४५६७८९.०";

var destination = undefined;
var temporaryDestination = undefined;

var validInputsString =
    'input:not([type]):not(.nokeyboard):not([readonly]), input[type=text]:not(.nokeyboard):not([readonly]), textarea:not(.nokeyboard):not([readonly])';

// Check if the "nepali" key is down.
function isNepali() {
    return $("#looma-keyboard").hasClass("nepali");
}

// Check if the text is supposed to be put in a <textarea>, which can accept newlines.
function isTextArea() {
    return (temporaryDestination.prop("tagName").toLowerCase() == "textarea");
}

// Toggle whether English or Nepali characters are showing.
function toggleNepali() {
    if (isNepali()) {
        $("#looma-keyboard").removeClass("nepali");
    } else {
        $("#looma-keyboard").addClass("nepali");
    }
}

function addKey(keyboard, i) {
    // There are four things each button could represent: the normal English key, the shifted English key, the normal Nepali key, and the shifted Nepali key.
    var key = $("<button></button>")
        .addClass("keyboard-button");
    var keySpan = $("<span></span>");
    keySpan.addClass("key-normal");
    keySpan.html(keys[i]);
    key.append(keySpan);

    var nepali = $("<span></span>");
    nepali.addClass("key-nepali");
    nepali.html(nepaliKeys[i]);
    key.append(nepali);

    keyboard.append(key);

}

/*
 * This whole function just generates the DOM elements for the keyboard – since it must be on every page, it's generated dynamically.
 * Each row is generated in a loop, then any special characters are added to the end of that row and the beginning of the next.
 */
function createKeyboard() {

    var keyboardContainer = $("<div></div>")
        .attr('id', 'looma-keyboard-container')
        .addClass('keyboardContainer');

    var textareaEntry = $("<textarea></textarea>");
    textareaEntry.attr('id', 'textareaEntry');
    textareaEntry.addClass('nokeyboard keyboard-entry');
    keyboardContainer.append(textareaEntry);

    var inputEntry = $("<input></input>");
    inputEntry.val('');
    inputEntry.attr('id', 'inputEntry');
    inputEntry.addClass('nokeyboard keyboard-entry');
    keyboardContainer.append(inputEntry);

    var keyboard = $("<div></div>")
        .attr('id', 'looma-keyboard')
        .addClass('keyboard');

    keyboardContainer.append($("<br/>"));

    // First Row
    for (var i = 0; i < 3; i++) {
        addKey(keyboard, i);
    }
    keyboard.append($("<br/>"));

    // This isn't actually a button, but using a button element will make sure everything lines up. The visibility is set to "hidden" in the CSS.
    /*var row2Space = $("<button></button>")
        .addClass("keyboard-button keyboard-space");
    row2Space.html("&nbsp;");
    keyboard.append(row2Space);
*/
    // Second Row
    for (var i = 3; i < 6; i++) {
        addKey(keyboard, i);
    }
    keyboard.append($("<br/>"));

    // Third Row
    for (var i = 6; i < 9; i++) {
        addKey(keyboard, i);
    }
    keyboard.append($("<br/>"));

    /*var enter = $("<button></button>")
        .attr('id', 'keyboard-enter')
        .addClass("keyboard-button keyboard-special")
        .html("&nbsp;&#9166;");
    keyboard.append(enter);
*/

    //var key = $("<button hidden></button>")
      //  .addClass("keyboard-button");

    // Fourth Row
    for (var i = 9; i < 11; i++) {
        addKey(keyboard, i);
    }
    keyboard.append($("<br/>"));

    var language = $("<button></button>")
        .attr('id', 'keyboard-language')
        .addClass("keyboard-button keyboard-special")
        .click(toggleNepali)
        .append($("<span></span>").attr('id', 'nepaliButtonText').addClass(
            "languageButtonText").html(
            "Nepali"))
        .append($("<span></span>").attr('id', 'englishButtonText').addClass(
            "languageButtonText").html(
            "English"));
    keyboard.append(language);

    /*var spacebar = $('<button></button>')
        .attr('id', 'keyboard-space')
        .html("&nbsp;&nbsp;&nbsp;&nbsp;Space&nbsp;&nbsp;&nbsp;&nbsp;")
        .addClass("keyboard-button keyboard-special")
        .css({
            margin: "5px auto",
            float: "none"
        });
    $(keyboard).append(spacebar);
*/
    $(keyboard).append("<br/>");
    var hideButton = $('<button></button>')
        .attr('id', 'keyboard-hide')
        .html("Hide Keyboard")
        .addClass("keyboard-button keyboard-special")
        .css({
            margin: "5px auto",
            float: "none"
        })
        .click(hideKeyboard);
    $(keyboard).append(hideButton);

    $(keyboardContainer).append(keyboard);
    $('body').append(keyboardContainer);
    $('.keyboard-button').click(keyClicked);
}  //end createKeyboard()

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
    temporaryDestination[0].selectionStart = startPos + 1;
    temporaryDestination[0].selectionEnd = startPos + 1;
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
    var newValue = oldValue.substring(0, oldValue.length - 1);

    if (isTextArea()) {
        temporaryDestination.html(newValue);
    } else {
        temporaryDestination.val(newValue);
    }
}

// Event handler when a button is clicked. Checks if the key is a special key, then performs the appropriate action.
function keyClicked(event) {
    var target = event.currentTarget;

    if ($(target).hasClass('keyboard-special')) {
        switch ($(target).attr('id')) {
            case 'keyboard-space':
                sendKey(' ');
                break;
            case 'keyboard-enter':
                if (isTextArea()) {
                    sendKey('\n');
                }
                break;
            case 'keyboard-backspace':
                backspace();
                break;
        }
    } else {
        var key = null;

         if (isNepali()) {
            key = $(target).find('.key-nepali').html();

        } else {
            key = $(target).find('.key-normal').html();
        }
        sendKey(key);
    }

    temporaryDestination.focus();
}

/*
 * Call this to activate the keyboard on the current element. If there is no selected element, but there is only one matching element on the screen, it will be selected.
 */
function showKeyboard(event) {
    var target = destination;
    // Make sure the target is a valid type of input.
    if ($(target).prop("tagName").toLowerCase() != "textarea" && $(target).prop(
            "tagName").toLowerCase() != "input") {
        var validInputs = $(validInputsString);
        // If there's only one valid input, we can assume that's what the user wanted to edit.
        if (validInputs.length == 1) {
            target = validInputs;
	    destination = validInputs;
        } else {
            return;
        }
    }
    // Ignore invalid inputs, if they were somehow assigned to "destination".
    if ($(target).hasClass("nokeyboard")) return;
    if ($(target).attr("readonly") != null) return;

    $('.keyboard-entry').css({
        display: "none"
    });

    // We only want to show the relevant element, since textareas and inputs have different features.
    if ($(target).prop("tagName").toLowerCase() == "textarea") {
        temporaryDestination = $('#textareaEntry');
        temporaryDestination.html($(target).html());
        $('#keyboard-enter').css({
            visibility: "visible"
        });
    } else {
        temporaryDestination = $('#inputEntry');
        if ($(target).val()) {
            temporaryDestination.val($(target).val());
        }
        $('#keyboard-enter').css({
            visibility: "hidden"
        });
    }

    temporaryDestination.css({
        display: ""
    });

    $("#looma-keyboard-container").css({
        display: "block"
    });
    temporaryDestination.focus();
}

// Dismiss the keyboard, resetting everything to normal. The current text will be inserted into the text field.
function hideKeyboard() {
    if (isTextArea()) {
        destination.html(temporaryDestination.html());
    } else {
        destination.val(temporaryDestination.val());
    }

    $('#textareaEntry').html();
    $('#inputEntry').val('');
    $("#looma-keyboard-container").css({
        display: "none"
    });
}

// Called whenever a compatible element is focused.
function elementFocused(event) {
    destination = $(event.currentTarget);
}

// This will enable the OSK for every input/textarea. If any of these elements exist, a "show keyboard" button will appear at the bottom-left of the screen.
$(document).ready(function() {
    var validInputs = $(validInputsString);
    console.log(validInputs);
    if (validInputs.length == 0) {
        console.log("No text inputs.");
        return;
    }
    createKeyboard();

    validInputs.click(
        elementFocused);
    var showKeyboardButton = $("<button></button>").addClass(
        "show-keyboard-button").click(showKeyboard);

    destination = $(document.activeElement);
    $("#main-container-horizontal").append(
        showKeyboardButton);
});
