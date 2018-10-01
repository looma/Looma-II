/*
 Name: Akshay Srivatsan
 Email: akshay.srivatsan@menloschool.org
 Date: Summer 2016

 Description:
 This file adds an on-screen keyboard to Looma pages.
 If you are editing this file, make sure your editor can handle unicode! There should be Nepali characters on lines 12 & 13.
 */
var keys = "`1234567890-=qwertyuiop[]\\asdfghjkl;'zxcvbnm,./";
var shiftedKeys = "~!@#$%^&*()_+QWERTYUIOP{}|ASDFGHJKL:\"ZXCVBNM<>?";
var nepaliKeys = "ऽ१२३४५६७८९०-=टौेरतयुिोपइएॐासदउगहजकल;'षडछवबनम,।्";
var nepaliShiftedKeys = "़!@#$%^&*()॰॒ठऔैृथञूीओफईऐःआशधऊघअझखळ:\"ऋढचँभणंङ॥?"

var destination = undefined;
var temporaryDestination = undefined;

var validInputsString =
    'input:not([type]):not(.nokeyboard):not([readonly]), input[type=text]:not(.nokeyboard):not([readonly]), textarea:not(.nokeyboard):not([readonly])'

// Check if the "shift" key is down.
function isShifted() {
    return $("#looma-keyboard").hasClass("shifted");
}

// Check if the "nepali" key is down.
function isNepali() {
    return $("#looma-keyboard").hasClass("nepali");
}

// Check if the text is supposed to be put in a <textarea>, which can accept newlines.
function isTextArea() {
    return (temporaryDestination.prop("tagName").toLowerCase() == "textarea");
}

// Toggle whether capital or lowercase characters are showing.
function toggleShift() {
    if (isShifted()) {
        $("#looma-keyboard").removeClass("shifted");
    } else {
        $("#looma-keyboard").addClass("shifted");
    }
}

// Toggle whether English or Nepali characters are showing.
function toggleNepali() {
    if (isNepali()) {
        $("#looma-keyboard").removeClass("nepali");
    } else {
        $("#looma-keyboard").addClass("nepali");
    }
}

function addKey(keyboardRow, i) {
    var key = $("<button></button>").addClass("keyboard-button");
    
    // There are four things each button could represent: the normal English key, the shifted English key, the normal Nepali key, and the shifted Nepali key.
    var keySpan = $("<span></span>");
    keySpan.addClass("key-normal");
    keySpan.html(keys[i]);
    key.append(keySpan);

    var shifted = $("<span></span>");
    shifted.addClass("key-shifted");
    shifted.html(shiftedKeys[i]);
    key.append(shifted);

    var nepali = $("<span></span>");
    nepali.addClass("key-nepali");
    nepali.html(nepaliKeys[i]);
    key.append(nepali);

    var nepaliShifted = $("<span></span>");
    nepaliShifted.addClass("key-nepali-shifted");
    nepaliShifted.html(nepaliShiftedKeys[i]);
    key.append(nepaliShifted);
    
    keyboardRow.append(key);
}

/*
 * This  function generates the DOM elements for the keyboard – since it must be on every page, it's generated dynamically.
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

    ///keyboardContainer.append($("<br/>"));
 
    // First Row
    var keyboardRow = ($('<div class="keyboard-row">'));
    keyboard.append(keyboardRow);
    
    for (var i = 0; i < 13; i++) {
        addKey(keyboardRow, i);
    }
    var bksp = $("<button></button>")
        .attr('id', 'keyboard-backspace')
        .addClass("keyboard-button keyboard-special")
        .html("<img src='images/backspace.png'>"); // This looks like "␡".
    keyboardRow.append(bksp);

    ///keyboard.append($("<br/>"));

    // This isn't actually a button, but using a button element will make sure everything lines up. The visibility is set to "hidden" in the CSS.
    var row2Space = $("<button></button>")
        .addClass("keyboard-button keyboard-space");
    row2Space.html("&nbsp;");
    keyboardRow.append(row2Space);

    // Second Row
    var keyboardRow = ($('<div class="keyboard-row">'));
    keyboard.append(keyboardRow);
    
    for (var i = 13; i < 26; i++) {
        addKey(keyboardRow, i);
    }

    ///keyboard.append($("<br/>"));

    var row3Space = $("<button></button>")
        .addClass("keyboard-button keyboard-space");
    row3Space.html("&nbsp;");
    keyboardRow.append(row3Space);

    // Third Row
    var keyboardRow = ($('<div class="keyboard-row">'));
    keyboard.append(keyboardRow);
    
    for (var i = 26; i < 37; i++) {
        addKey(keyboardRow, i);
    }

    /*
    var enter = $("<button></button>")
        .attr('id', 'keyboard-enter')
        .addClass("keyboard-button keyboard-special")
        .html("&nbsp;&#9166;");
    keyboardRow.append(enter);
    */
    ///keyboard.append($("<br/>"));
    
    // Fourth Row
    var keyboardRow = ($('<div class="keyboard-row">'));
    keyboard.append(keyboardRow);
    
    var shift = $("<button></button>")
        .attr('id', 'keyboard-shift')
        .addClass("keyboard-button keyboard-special")
        .html("Shift")
        .click(toggleShift);
    keyboardRow.append(shift);

    for (var i = 37; i < 47; i++) {
        addKey(keyboardRow, i);
    }

    var language = $("<button></button>")
        .attr('id', 'keyboard-language')
        .addClass("keyboard-button keyboard-special")
        .click(toggleNepali)
        .append($("<span></span>").attr('id', 'nepaliButtonText').addClass(
            "languageButtonText").html(
            $('<img src="images/native-flag.png">')))
        .append($("<span></span>").attr('id', 'englishButtonText').addClass(
            "languageButtonText").html(
            $('<img src="images/english-flag.png">')));
    keyboardRow.append(language);

    //$(keyboard).append("<br/>");
    var spacebar = $('<button></button>')
        .attr('id', 'keyboard-space')
        .html("&nbsp;&nbsp;&nbsp;&nbsp;Space&nbsp;&nbsp;&nbsp;&nbsp;")
        .addClass("keyboard-button keyboard-special");
    
    $(keyboardRow).append(spacebar);

    //$(keyboard).append("<br/>");
    var hideButton = $('<button></button>')
        .attr('id', 'keyboard-hide')
        .html("Hide Keyboard")
        .addClass("keyboard-button keyboard-special")
        .click(hideKeyboard);
    $(keyboardRow).append(hideButton);

    $(keyboardContainer).append(keyboard);
    $('body').append(keyboardContainer);
    $('.keyboard-button').click(keyClicked);
}

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
        if (isShifted() && isNepali()) {
            key = $(target).find('.key-nepali-shifted').html();
        } else if (isNepali()) {
            key = $(target).find('.key-nepali').html();
        } else if (isShifted()) {
            key = $(target).find('.key-shifted').html();
        } else {
            key = $(target).find('.key-normal').html();
        }
        sendKey(key);
    }
    if ($(target).attr('id') != 'keyboard-shift') {
        $("#looma-keyboard").removeClass("shifted");
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
            // ??? handle multiple input elements here. not implemented yet.
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
    
    LOOMA.makeTransparent( $('#main-container-horizontal') );
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
    LOOMA.undoTransparent( $('#main-container-horizontal') );
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
    //console.log(validInputs);
    if (validInputs.length == 0) {
        console.log("No text inputs.");
        return;
    }
    createKeyboard();

    validInputs.click(
        elementFocused);
    var showKeyboardButton = $("<button></button>").addClass(
        "show-keyboard looma-control-button").click(showKeyboard);

    destination = $(document.activeElement);
    
    if ( $('#fullscreen').length)
         $('#fullscreen').append(showKeyboardButton)
    else $("#main-container-horizontal").append(showKeyboardButton)
    
});
