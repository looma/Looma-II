/*
 javascript code file
 Filename: looma-alerts.js
 Description: Creates a styled translatable popup interface.
 NOTES: All methods support prompts/alerts in either text or html. If using either, any text can be converted into
 Looma's translatable spans using the provided generateTranslatableSpans() button.

 Programmer name: Thomas Woodside, Charlie Donnelly, and Sam Rosenberg
 Email: thomas.woodside@gmail.com, charlie.donnelly@menloschool.org, sam.rosenberg@menloschool.org
 Owner: VillageTech Solutions (villagetechsolutions.org)
 Date: 7/5/16
 Revision: 0.4
 */
/**
 * checks to see if the esc has been clicked and exits the modal
 */

var escKeyCode = 27;


//NOTE: should put the KEYDOWN inside the popup making functions
$(document).keydown(function (e) {
    if (e.keyCode == escKeyCode) { // escape key maps to keycode `27`
        $('#all').click();
    }
});

/**
 * Makes the entire screen minus modal transparent and checks for clicks outside the modal
 */
makeTransparent = function() {
    $('#all').addClass('all-transparent');
    $('#all').click(function(e) {
        $('#all').click(function(e) {
            closePopup();
            $('#all').off('click');
        });
    });
};  // End of makeTransparent

/**
 * This function creates a popup message box that can be dismissed by the user.
 * @param msg - The message the user is presented.
 * @param time (optional)- a delay in seconds after which the popup is automatically closed
 * */
var popupInterval;
alert = function(msg, time){
    closePopup();
    makeTransparent();
    $(document.body).append("<div class= 'popup clicked-dismissal'>" +
        "<button class='popup-button' id='dismiss-popup'><b>X</b></button>"+ msg +
        "<button id ='close-popup' class ='popup-button'>" + generateTranslatableSpans("OK", "ठिक छ") + "</button></div>");
    fadeInPopup();
    if (time) {
        var timeLeft = time - 1;
        var popupButton = $('#close-popup');
        popupButton.html(generateTranslatableSpans("OK (" + Math.round(timeLeft + 1) + ")",
            "ठिक छ(" + Math.round(timeLeft + 1) + ")"));
        clearInterval(popupInterval);
        popupInterval = setInterval(function() {
            if (timeLeft <= 0) {
                clearInterval(popupInterval);
                closePopup();
            }
            timeLeft -= 1;
            popupButton.html(generateTranslatableSpans("OK (" + Math.round(timeLeft + 1) + ")",
                "ठिक छ(" + Math.round(timeLeft + 1) + ")"));
        },1000);
    }
    $('#close-popup').click(function() {
        closePopup();
    });
    $('#dismiss-popup').click(function() {
        closePopup();
    });
};

/**
 * Prompts the user to confirm a message.
 * @param msg - The message the user is presented in question format.
 * @param confirmed - A function to call if the user confirms
 * @param canceled - A function to call if the user cancels
 * */
confirm = function(msg, confirmed, canceled) {
    closePopup();
    makeTransparent();
    $(document.body).append("<div class='popup confirmation'>" +
        "<button class='popup-button' id='dismiss-popup'><b>X</b></button> " + msg +
        "<button id='cancel-popup' class='popup-button'>" + generateTranslatableSpans("cancel", "रद्द गरेर") + "</button>" +
        "<button id='confirm-popup' class='popup-button'>"+ generateTranslatableSpans("confirm", "निश्चय गर्नुहोस्") +"</button></div>");
    fadeInPopup();
    $('#confirm-popup').click(function() {
        $("#confirm-popup").off('click');
        confirmed();
        closePopup();
        $("#all").click();
    });
    $('#dismiss-popup, #cancel-popup').click(function() {
        $("#confirm-popup").off('click');
        closePopup();
        canceled();
        $("#all").click();
    });
};

/**
 /**
 * Prompts the user to enter text.
 * @param msg - The message the user is presented, prompting them to enter text.
 * @param callback - A function where the user's text response will be sent.
 * */
prompt = function(msg, callback) {
    closePopup();
    makeTransparent();
    $(document.body).append("<div class='popup textEntry'>" +
        "<button class='popup-button' id='dismiss-popup'><b>X</b></button>" + msg +
        "<textarea id='popup-textarea'></textarea>" +
        "<button id='confirm-popup' class='popup-button'>"+ generateTranslatableSpans("OK", "ठिक छ") +"</button></div>");
    // keyPress();
    fadeInPopup();
    $('#confirm-popup').click(function() {
        callback($('#popup-textarea').val());
        closePopup();
    });
    $('#dismiss-popup').click(function() {
        closePopup();
        callback(null);
    });
};

/**
 * Removes any popups on the page.
 * */
closePopup = function() {
    $('.popup').remove();
    $('#all').removeClass('all-transparent');
    //NOTE: should remvoe the KEYDOWN listener here
};

/**
 * Fades in the popup
 * */
fadeInPopup = function () {
    $( ".popup" ).fadeIn();
};

