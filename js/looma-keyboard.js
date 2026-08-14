/*
 Name: Akshay Srivatsan
 Email: akshay.srivatsan@menloschool.org
 Date: Summer 2016

 Description:
 This file adds an on-screen keyboard to Looma pages.
 If you are editing this file, make sure your editor can handle unicode! There should be Nepali characters on lines 12 & 13.
 */
'use strict';
var keys = "`1234567890-=qwertyuiop[]\\asdfghjkl;'zxcvbnm,./";
var shiftedKeys = "~!@#$%^&*()_+QWERTYUIOP{}|ASDFGHJKL:\"ZXCVBNM<>?";
var nepaliKeys = "ऽ१२३४५६७८९0-=टौेरतयुिोपइएॐासदउगहजकल;'षडछवबनम,।्";
var nepaliShiftedKeys = "़!@#$%^&*()॰॒ठऔैृथञूीओफईऐःआशधऊघअझखळ:\"ऋढचँभणंङ॥?"

var destination = undefined;
var temporaryDestination = undefined;
var dimmed = undefined;     // the page content that is dimmed while the keyboard is showing

var validInputsString = ['input:not([type])', 'input[type=text]', 'input[type=password]',
                         'input[type=number]', 'textarea'
                        ].map(function(selector) {
                            return selector + ':not(.nokeyboard):not([readonly]):not([disabled])';
                        }).join(', ');

/*******************************************************************************
 * ACTIVITY FRAMES
 *
 * ePaath (and other HTML) activities are displayed in an <iframe> (or an <embed>),
 * so the boxes the student types into belong to a different document than this
 * keyboard. The functions below reach into those documents. Activities are served
 * by the Looma server itself, so they are same-origin and readable; a frame that
 * isn't readable (e.g. an external website) is simply skipped.
 ******************************************************************************/

// the document inside a frame element, or null if it can't be read
function frameDocument(frame) {
    try {
        return frame.contentDocument ||
              (frame.contentWindow && frame.contentWindow.document) || null;
    } catch (error) {   // cross-origin frame
        return null;
    }
}

// this page's document, plus the document of every readable frame on it
function allDocuments(doc, list) {
    doc  = doc  || document;
    list = list || [];
    list.push(doc);
    $('iframe, embed, object', doc).each(function() {
        var framedoc = frameDocument(this);
        if (framedoc && list.indexOf(framedoc) < 0) allDocuments(framedoc, list);
    });
    return list;
}

// every input the keyboard can type into, including those inside activity frames
function allValidInputs() {
    var $inputs = $();
    allDocuments().forEach(function(doc) {
        $inputs = $inputs.add($(validInputsString, doc));
    });
    return $inputs;
}

// the input the student last tapped, on this page or inside any activity frame
function focusedInput() {
    var $focused = $();
    allDocuments().forEach(function(doc) {
        var focused = doc.activeElement;
        if (focused && $(focused).is(validInputsString)) $focused = $focused.add(focused);
    });
    return $focused.last();    // an activity's input wins over anything focused on the Looma page
}

// can the keyboard type into this element?
function isInput($element) {
    if (!$element || !$element.length) return false;
    var tag = $element.prop('tagName').toLowerCase();
    return (tag === 'input' || tag === 'textarea');
}

// is the destination inside an activity frame rather than on the Looma page itself?
function inFrame() {
    return !!(destination && destination[0] && destination[0].ownerDocument !== document);
}

/*
 * Watch every activity frame for the student tapping one of its inputs.
 * Activities build their input boxes as they run, so the handler is delegated to the
 * frame's document - that way it also works for boxes that don't exist yet. A frame that
 * loads a new page gets a new document, which clears the flag below automatically.
 */
function watchFrames() {
    allDocuments().forEach(function(doc) {
        if (doc === document || doc.loomaKeyboardWatched) return;
        doc.loomaKeyboardWatched = true;
        $(doc).on('focusin click', validInputsString, elementFocused);
    });
}

// on a page that displays activities, show the Keyboard button only while a box the student
// can type into is on the screen
function updateKeyboardButton() {
    if ($('#looma-keyboard-container').is(':visible')) return;   // leave it alone while typing
    $('.show-keyboard').toggle(allValidInputs().filter(':visible').length > 0);
}

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
        .attr('id', 'looma-keyboard');
        //.addClass('keyboard');

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

/*    // This isn't actually a button, but using a button element will make sure everything lines up. The visibility is set to "hidden" in the CSS.
    var row2Space = $("<button></button>")
        .addClass("keyboard-button keyboard-space");
    row2Space.html("&nbsp;");
    keyboardRow.append(row2Space);
*/
    // Second Row
    var keyboardRow = ($('<div class="keyboard-row">'));
    keyboard.append(keyboardRow);

    for (var i = 13; i < 26; i++) {
        addKey(keyboardRow, i);
    }

    ///keyboard.append($("<br/>"));

/*    var row3Space = $("<button></button>")
        .addClass("keyboard-button keyboard-space");
    row3Space.html("&nbsp;");
    keyboardRow.append(row3Space);
*/
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
        //.html("Shift")
        //.html(LOOMA.translatableSpans('Shift','पालो'))
        .html('<span class="key-normal">Shift</span><span class="key-nepali">पालो</span>' +
              '<span class="key-shifted">Shift</span><span class="key-nepali-shifted">पालो</span>')
        .click(toggleShift);
    keyboardRow.append(shift);

    for (var i = 37; i < 47; i++) {
        addKey(keyboardRow, i);
    }

    // Fifth Row
    var keyboardRow = ($('<div class="keyboard-row">'));
    keyboard.append(keyboardRow);

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

    var spacebar = $('<button></button>')
        .attr('id', 'keyboard-space')
      //  .html("&nbsp;&nbsp;&nbsp;&nbsp;Space&nbsp;&nbsp;&nbsp;&nbsp;")
      //  .html(LOOMA.translatableSpans('Space','अन्तरिक्ष'))
        .html('<span class="key-normal">Space</span><span class="key-nepali">अन्तरिक्ष</span>' +
              '<span class="key-shifted">Space</span><span class="key-nepali-shifted">अन्तरिक्ष</span>')
        .addClass("keyboard-button keyboard-special");

    $(keyboardRow).append(spacebar);

    //$(keyboard).append("<br/>");
    var hideButton = $('<button></button>')
        .attr('id', 'keyboard-hide')
        //.html("Hide Keyboard")
        //.html(LOOMA.translatableSpans('Hide','लुकाउनु'))
        .html('<span class="key-normal">Close</span><span class="key-nepali">लुकाउनु</span>' +
              '<span class="key-shifted">Close</span><span class="key-nepali-shifted">लुकाउनु</span>')
        .addClass("keyboard-button keyboard-special")
        .click(hideKeyboard);
    $(keyboardRow).append(hideButton);

    $(keyboardContainer).append(keyboard);
    $('body').append(keyboardContainer);

    // NOTE: the keyboard should be attached to #fullscreen, not body, in order to show when in FS mode
    //       BUT, have to fix transparent setting for it to work
    // $('#fullscreen').append(keyboardContainer);

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

// <input type="number"> accepts only ASCII digits, so translate Nepali digits for those boxes.
function forDestination(text) {
    if (destination.attr('type') !== 'number') return text;
    return text.replace(/[०-९]/g, function(digit) {
        return String('०१२३४५६७८९'.indexOf(digit));
    });
}

/*
 * Copy the keyboard's text into the box the student is filling in.
 * An activity in a frame watches its inputs to check answers as they are typed, and
 * jQuery's .val() is silent, so also send the events the activity is listening for.
 */
function writeDestination() {
    if (!isInput(destination) || !temporaryDestination) return;

    if (isTextArea()) destination.html(forDestination(temporaryDestination.html()));
    else              destination.val (forDestination(temporaryDestination.val()));

    if (!inFrame()) return;

    var input = destination[0];
    var frameWindow = input.ownerDocument.defaultView || window;
    ['input', 'keyup', 'change'].forEach(function(type) {
        input.dispatchEvent(new frameWindow.Event(type, {bubbles: true}));
    });
}

// Event handler when a button is clicked. Checks if the key is a special key, then performs the appropriate action.
function keyClicked(event) {
    var target = event.currentTarget;

    // the Close key is handled by hideKeyboard(), which is also bound to it
    if ($(target).attr('id') === 'keyboard-hide') return;

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

    // An activity in a frame reacts as the student types (it checks answers, echoes the
    // number in Nepali, etc), so keep its box in step with the keyboard. On Looma's own
    // pages the text is still copied over only when the keyboard closes.
    if (inFrame()) writeDestination();

    temporaryDestination.focus();
}

/*
 * Call this to activate the keyboard on the current element. If there is no selected element, but there is only one matching element on the screen, it will be selected.
 */
function showKeyboard(event) {
    var target = destination;
    // Make sure the target is a valid type of input.
    if (! isInput(target)) {
        // the box the student tapped, wherever it is - including inside an activity frame
        var focused = focusedInput();
        var validInputs = allValidInputs();

        if (focused.length) {
            target = focused;
        } else if (validInputs.length == 1) {
            // If there's only one valid input, we can assume that's what the user wanted to edit.
            target = validInputs;
        } else {
            // several boxes and none of them chosen - the student has to pick one first
            LOOMA.alert(LOOMA.translatableSpans('Tap the box you want to type in, then tap Keyboard',
                'तपाईं टाइप गर्न चाहनुहुने बाकसमा थिच्नुहोस्, त्यसपछि किबोर्ड थिच्नुहोस्'), 4, true);
            return;
        }
        destination = target;
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
        temporaryDestination.val($(target).val() || '');   // empty box means start with an empty entry
        $('#keyboard-enter').css({
            visibility: "hidden"
        });
    }

    temporaryDestination.css({
        display: ""
    });

    var $keyboardContainer = $("#looma-keyboard-container");

    // In fullscreen the browser paints only what is inside the fullscreen element, so the
    // keyboard has to move in there (hideKeyboard() puts it back on the body).
    var fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement;
    if (fullscreenElement && ! $.contains(fullscreenElement, $keyboardContainer[0]))
        $keyboardContainer.appendTo(fullscreenElement);

    // Dim what is behind the keyboard - but never an ancestor of the keyboard, because
    // 'all-transparent' would fade the keys and pointerEvents:'none' would ignore taps on them.
    var $main = $('#main-container-horizontal');
    if ($main.length && ! $.contains($main[0], $keyboardContainer[0])) dimmed = $main;
    else dimmed = $keyboardContainer.siblings('div, iframe, embed, object');
    LOOMA.makeTransparent(dimmed);

    $keyboardContainer.css({
        display: "block"
    });
    temporaryDestination.focus();

    var lang = LOOMA.readStore('language', 'cookie');
    if  (lang === 'native' && !isNepali() || lang === 'english' && isNepali()) toggleNepali();

}  // end showKeyboard()

// Dismiss the keyboard, resetting everything to normal. The current text will be inserted into the text field.
function hideKeyboard() {
    writeDestination();

    $('#textareaEntry').html('');
    $('#inputEntry').val('');
    $("#looma-keyboard").removeClass("shifted");

    LOOMA.makeOpaque(dimmed || $('#main-container-horizontal'));
    dimmed = undefined;

    var $keyboardContainer = $("#looma-keyboard-container");
    $keyboardContainer.css({
        display: "none"
    });
    if ($keyboardContainer.parent()[0] !== document.body) $keyboardContainer.appendTo('body');

    // hand focus back to the activity's box, so it sees the answer being finished
    if (inFrame()) destination.focus();
    else          $("#search-term").focus();
}

// Called whenever a compatible element is focused.
function elementFocused(event) {
    destination = $(event.currentTarget);
}

// This will enable the OSK for every input/textarea. If any of these elements exist, a "show keyboard" button will appear at the bottom-left of the screen.
$(document).ready(function() {
    var validInputs = $(validInputsString);
    //console.log(validInputs);

    // A page that plays an ePaath or HTML activity has no inputs of its own - the activity's
    // boxes show up later, inside its frame - so build the keyboard for those pages too.
    var playsActivities = $('#fullscreen').hasClass('keyboard') ||
                          $('#fullscreen').find('iframe, embed, object').length > 0;

/**/
    if (validInputs.length == 0 && ! playsActivities) {
        console.log("No text inputs.");
        return;
    }
 /**/

    createKeyboard();

    validInputs.click(
        elementFocused);
    var showKeyboardButton = $("<button></button>").addClass(
        "show-keyboard looma-control-button").click(showKeyboard);

    showKeyboardButton.append($('<span class="tip english-tip yes-show">Keyboard</span>'))
    showKeyboardButton.append($('<span class="tip native-tip">Keyboard</span>'))

    destination = $(document.activeElement);

  //  if ( $('#epaath_iframe').length)
  //      $('#iframe').append(showKeyboardButton)
  //  else
    if ( $('#fullscreen').length)
        $('#fullscreen').append(showKeyboardButton)
    else $("#main-container-horizontal").append(showKeyboardButton)

    // An activity frame loads new pages and builds new input boxes while it runs, so keep
    // looking for boxes to type into instead of deciding once, at page load.
    if (playsActivities) {
        watchFrames();
        updateKeyboardButton();
        setInterval(function() {
            watchFrames();
            updateKeyboardButton();
        }, 1000);
    }

});
