/*
 javascript code file
 Filename: looma-slideshow.js
 Description: Allows interactivity of buttons.

 Programmer name: Thomas Woodside, Charlie Donnelly, and Sam Rosenberg
 Email: thomas.woodside@gmail.com, charlie.donnelly@menloschool.org, sam.rosenberg@menloschool.org
 Owner: VillageTech Solutions (villagetechsolutions.org)
 Date: 7/1/16
 Revision: 0.4
 */

var intervalTime = 20;
var fadeInterval = 500;
var interval;
var fullscreen = false;
var thumbContainer = $("#thumb-div");
var first;
var slowest = 40;
var fastest = 5;
var speed_up = $("#speed-up");
var slow_down = $("#slow-down");
var edit_mode = false;
var intervalMilliseconds = (60/intervalTime)*1000;
var down;
var captionSaved = true;


/**
 * This function will call the other functions in the program--thus enabling
 * interactivity!
 * */
$(document).ready(function() {
    toggleEdit();
    $('#pause, #retract').hide();
    var length = $('.img-thumbnail').length;
    first = $('.img-thumbnail:first'); //the first thumbnail on the page
    first.addClass('active');
    displayThumbnail(first);
    $('.img-thumbnail').click(function () //clicking on thumbnails
    {
        displayThumbnail(this);
        // set the first image to be on
    });
    $('#next').click(function () {
        displayImage("next");
    });
    $('#previous').click(function () {
        displayImage("prev");
    });
    $('#play').click(function () {
        playSlideshow();
    });
    $('#pause').click(function () {
        stopSlideshow();
    });
    $('#speed-up').click(function () {
        speedSlideshow();
    });
    $('#slow-down').click(function () {
        slowSlideshow();
    });
    $('#back-thumbnails').mousedown(function() {
        down = true;
        scroll("back");
    });
    $(document).mouseup(function() {
        down = false;
    });
    $('#next-thumbnails').mousedown(function() {
        down = true;
        scroll("forward");
    });
    $('#fullscreen-control').click(function (e) {
        e.preventDefault();
        screenfull.toggle($('#screenfull')[0]);
    });
    $('#submit').click(function () {
        captionSaved = true;
        saveCaption();
    });
    $('#edit').click(function () {
        captionSaved = false;
        editCaption();
    });
    $(document).on("'mozfullscreenchange webkitfullscreenchange fullscreenchange'", function () {
        toggleFullscreen();
    });
    $('#img-thumbs').sortable({
        axis: "x"
    });
    $('#save').click(function () {
        saveConfiguration();
        toggleEdit();
    });
    $('#delete').click(function () {
        deleteImage();
    });
    $('#ok').click(function () {
        response();
    });
    $('#extend').click(function () {
        showOtherImages();
    });
    $('#retract').click(function () {
        hideOtherImages();
    });
    $('#editor').click(function () {
        toggleEdit();
    });
    // This enables keyboard interactivity.
    $(document).keydown(function (evt){
        var upArrow = 38;
        var downArrow = 40;
        var leftArrow = 37;
        var rightArrow = 39;

        if (evt.which == upArrow || evt.which == rightArrow) {
            displayImage("next");
        }
        else if(evt.which == downArrow || evt.which == leftArrow)
        {
            displayImage("prev");
        }
    });
    if (window.location.search.split("&source=")[1] == "activities") {
        screenfull.toggle($('#screenfull')[0]);
        playSlideshow();
    }
    $( "#slide" ).change(function() {
        intervalTime = ($(this).val());
        intervalMilliseconds = (60/intervalTime)*1000;
        playSlideshow();
        /* If the slow down button has been clicked and the slideshow is moving at a slower speed,
         the (faster) button reappears.
         */
        enable();
    });
});     // End of document.ready

/*
 Checks to see if the user has moved the slider out of the grayed out range of the slider bar.
 If so, the corresponding button is enabled.
 */
function enable()
{
    if (intervalTime <= slowest)
    {
        speed_up.removeAttr("disabled");
        speed_up.removeClass("disabled");
    }
    if (intervalTime >= fastest) {
        slow_down.removeAttr("disabled");
        slow_down.removeClass("disabled");
    }
}   // End of enable

/**
 Saves a user entered caption in the form of data entered on the image thumbnail. Hides edit elements when done.
 */
function saveCaption() {
    var textarea = $("#caption-textarea");
    var captionText = $(textarea).val();
    $(".active img").data("caption", captionText);
    $(textarea).hide();
    $('#submit').hide();
    displayCaption();
    $("#edit").show();
    $("#caption").css("display", "block")
}   // End of saveCaption

/**
 Displays any relevant captions for the current image.
 */
function displayCaption() {
    var caption = $(".active img").data("caption");
    var p = $("#caption");
    if (caption) {
        $(p).text(caption);
    } else {
        $(p).text("");
    }
}   // End of displayCaption

/**
 Initiates editing the existing caption. Shows and hides corresponding buttons.
 */
function editCaption() {
    $("#caption-textarea").val($('.active img').data("caption"));
    $('textarea').show();
    $('#submit').css("display", "block");
    $("#edit").css("display", "none");
    $("#caption").css("display", "none");
}   // End of editCaption

/**
 * Changes styling associated with taking the slideshow fullscreen.
 * */
function toggleFullscreen() {
    if (fullscreen) {
        $('#controllers').appendTo('#start_stop').removeClass(".full_play");
        $('#screenfull').removeClass("fullscreen");
        $('#fullscreen-control').removeClass("fullscreen");
        $('#caption-text').removeClass("fullscreen").removeClass("center-captions");
        $('#controllers').removeClass("full_play").addClass("row slide-controls");
        fullscreen = false;
    } else {
        $('#controllers').appendTo('#screenfull').addClass(".full_play");
        $('#screenfull').addClass("fullscreen");
        $('#fullscreen-control').addClass("fullscreen");
        $('#caption-text').addClass("fullscreen").addClass("center-captions");
        $('#controllers').removeClass("row slide-controls").addClass("full_play");
        fullscreen = true;
    }
}   // End of toggleFullScreen

/**
 * This will display the clicked thumbnail. It will modify the #main-img element of the image from a thumbnail to a
 * main image.
 * @param   element is the current thumbnail
 * */
function displayThumbnail(element) {
    var newSrcDisplay = $(element).find("img").attr("data-fp");
    // This alters the source of the thumbnail to be the source of the displayed image.
    var mainImg = $('#main-img');
    mainImg.attr('src', newSrcDisplay);

    // Remove the active class from all thumbnails:
    $('.img-thumbnail').removeClass('active');
    // Add the active class to the clicked image:
    $(element).addClass('active');
    $(mainImg).hide().fadeIn(fadeInterval);
    displayCaption();
}   // End of displayThumbnail

/**
 * This will display the next or previous thumbnail.
 * It will check to see which element is active, then remove the active class from all the elements.
 * Next, it will add the active class to the next or previous element and display it.
 **/
function displayImage(nextprev) {
    if (!captionSaved) {
        saveCaption();
        captionSaved = true;
    }
    var currentElement = $('.active');      // Element with the active class is the current element.
    var element;
    var toScroll;
    var width;
    if (nextprev == "next") {
        element = $(currentElement).next(); // Element is the element after the current thumbnail.
        //
        if (element.size() < 1) {
            element = $('.img-thumbnail:first-child');
            toScroll = 0;
        } else {
            width = $(element)[0].offsetWidth;
            toScroll = "+=" + width;
        }
    }
    else {
        element = $(currentElement).prev();
        if (element.size() < 1) {
            element = $('.img-thumbnail:last-child');
            toScroll = $(element)[0].offsetLeft;
        } else {
            width = $(element)[0].offsetWidth;
            toScroll = "-=" + width;
        }
    }
    // Displays the new (next) element.
    displayThumbnail(element);
    $(thumbContainer).animate({
        scrollLeft: toScroll
    }, 100);
}   // End of displayImage

/**
 * This will play a slideshow of the images.
 * It will display the image, then wait for a certain time interval before looking at the next
 * image to display. (it calls nextDisplayImage)
 **/
function playSlideshow() {
    $('#play').hide();
    $('#pause').show();
    // Switch the image, wait. Repeat for every image.
    clearInterval(interval);
    interval = setInterval(
        function () {
            displayImage("next");
        }, intervalMilliseconds);
}  // End of playSlideshow

/**
 * This will speed up the slideshow by shortening the time interval.
 **/
function speedSlideshow() {
    $('#slide')[0].stepUp();
    intervalTime ++;
    intervalMilliseconds = (60/intervalTime)*1000;
    interval = clearInterval(interval);
    playSlideshow();
    /* Limits the speed of the slideshow--If the user clicks the faster button too many times, the
     button will become disabled and grayed out.
     */
    if(intervalTime >= slowest ) {
        speed_up.attr("disabled", "true");
        speed_up.addClass("disabled");
    }
    /* If the speed up button has been clicked and the slideshow is moving at a faster speed,
     the (slower) button reappears.
     */
    if (intervalTime >= fastest) {
        slow_down.removeAttr("disabled");
        slow_down.removeClass("disabled");
    }
}   // End of speedSlideshow

/**
 * This will slow down the slideshow by lengthening the time interval.
 **/
function slowSlideshow() {
    $('#slide')[0].stepDown();
    intervalTime--;
    intervalMilliseconds = (60 / intervalTime) * 1000;
    interval = clearInterval(interval);
    playSlideshow();
    /* Limits the speed of the slideshow--If the user clicks the faster button too many times, the
     button will become disabled and grayed out.
     */
    if (intervalTime <= fastest) {
        slow_down.attr("disabled", "true");
        slow_down.addClass("disabled");
    }
    /* If the slow down button has been clicked and the slideshow is moving at a slower speed,
     the (faster) button reappears.
     */
    if (intervalTime <= slowest)
    {
        speed_up.removeAttr("disabled");
        speed_up.removeClass("disabled");
    }
}   // End of slowSlideshow

/**
 * This will stop the slideshow by clearing the interval object.
 **/
function stopSlideshow() {
    $('#play').show();
    $('#pause').hide();
    interval = clearInterval(interval);
}   // End of stopSlideshow

/**
 * When the buttons on the side of the thumbnails are clicked, the thumbnails will scroll over.
 * @param forwardBack -whether to scroll forward or back
 **/
function scroll(forwardBack) {
    var toScroll;
    //Thirty pixels is special.
    if (forwardBack == "forward") {
        if ($(thumbContainer)[0].scrollWidth - $(thumbContainer).width() - 30 == $(thumbContainer).scrollLeft()) {
            toScroll = "0";
        } else {
            toScroll = "+=750";
        }
    }
    if (forwardBack == "back") {
        if ($(thumbContainer).scrollLeft() == 0) {
            toScroll = "+" + $(thumbContainer)[0].scrollWidth;
        }
        else {
            toScroll = "-=750";
        }
    }
    $(thumbContainer).animate({
        scrollLeft: toScroll
    }, 1000, "linear", function() {
        if (down) {
            scroll(forwardBack);
        }
    });
}   // End of scroll

/**
 * This gets the necessary information to save to the database.
 **/
function saveConfiguration() {
    LOOMA.prompt("<p>" + LOOMA.generateTranslatableSpans("What would you like to name this slideshow?",
            "कस्तो तपाईं स्लाइड शो नाम गर्न चाहनुहुन्छ?") + "</p>", function (response) {
        if (response) {
            $.get("looma-slideshow-save.php", {"dn": response}, function (id) {
                if (/\S/.test(id)) {
                    LOOMA.confirm("<p>" + LOOMA.generateTranslatableSpans("There is a already a slideshow with this name. Overwrite?",
                            "यो नामको एक पहिले नै स्लाइड शो छ। अधिलेखन?") + "</p>", function () {
                        sendConfiguration(id, response);
                    }, function () {
                    });
                } else {
                    sendConfiguration(false, response);
                }
            });
        }
    }, function() {});
}  // End of saveConfiguration

/**
 * This sends a request to looma-slideshow-save.php to save to the database.
 **/
function sendConfiguration(id, dn) {
    var tosend = [];
    console.log(id);
    $('#img-thumbs .img-thumbnail img').each(function () {
        var caption = $(this).data("caption");
        if (caption == undefined) {
            caption = "";
        }
        tosend.push(
            {
                "src": $(this).attr("data-fp"),
                "caption": caption
            });
    });
    if (id) {
        $.post("looma-slideshow-save.php", {_id: id, order: tosend, dn: dn}, function(response) {
        });
        alertWithLink(id);
    } else {
        $.post("looma-slideshow-save.php", {order: tosend, dn: dn}, function (newId) {
            alertWithLink(newId);
        });
    }
}   // End of sendConfiguration

/**
 * This alerts the user of he permanent link to their slideshow.
 **/
function alertWithLink(id) {
    LOOMA.alert("<p>" + LOOMA.generateTranslatableSpans("The slideshow has been saved. You can show the slideshow " +
            "<a href='./looma-slideshow.php?id=" + id + "'>here</a>",
            "गर्नुहोस कि स्लाइड शो बचत गरीएको छ. शो पाउन सक्नुहुन्छ  तपाईं " +
            "<a href='./looma-slideshow.php?id=" + id + "'>यहाँ</a> स्लाइड शो") + "</p>");
}   // End of alertWithLink

/**
 * Deletes an image from the slideshow
 **/
function deleteImage() {
    console.log("I am displaying");
    LOOMA.confirm(LOOMA.generateTranslatableSpans("Are you sure you want to delete this image?", "तपाईं यो तस्बिर हटाउन चाहनुहुन्छ निश्चित हुनुहुन्छ?"),
        function () {
            var todelete = $('.active');
            displayImage("next");
            todelete.remove();
        }, function () {});
}   // End of deleteImage

/**
 * toggleEdit shows and hides the editing functions accordingly.
 */
function toggleEdit() {
    if (edit_mode)
    {
        $('.captions-div').show();
        $('#extend').show();
        $("#edit").show();
        $("#delete").show();
        edit_mode = false;
        $("#save").show();
        $("#editor").hide();
        $('#retract').hide();
    }
    else
    {
        hideOtherImages();
        $('.captions-div').hide();
        $('#caption-text').show();
        $('#extend').hide();
        $("#edit").hide();
        $("#delete").hide();
        edit_mode = true;
        $("#save").hide();
        $("#editor").show();
        $('#retract').hide();
    }
}       // End of toggleEdit

/**
 * This function is called whenever the carrot is clicked. It pops out the other images. All elements are shifted over and the retract
 * button becomes visible. The images are draggable into the slideshow
 */
function showOtherImages() {
    $('#otherImageCol').addClass('col-md-2').removeClass('col-md-1').addClass('imageDropZone');
    $('#extend').hide();
    $('#retract').show();
    $('#controllers').addClass('col-md-offset-1');
    $('#delete').addClass('extendTrash').removeClass('nonExtendTrash');
    $('.captions-div').addClass('captions-div-end').removeClass('captions-div-start');
    $('#thumbnail-div-first-col').removeClass('col-md-offset-1').addClass('col-md-offset-2');
    $('div.thumbnail-div-first-col').addClass("shown");
    $($('.individualResult li')).draggable({
        connectToSortable: "#img-thumbs",
        helper: "clone",
        containment: "#img-thumbs",
        start: function(event, ui) {
            $(ui.helper).css("z-index", "10000").find("img").css("height", "15vh").css("width", "auto"); //Sometimes will display under buttons
            $('#img-thumbs').sortable("option", "scroll", false);
        },
        stop: function(event, ui) {
            var newElem = $(ui.helper);
            if ($(thumbContainer).has($(newElem)).length > 0) {
                $('#img-thumbs').sortable("option", "scroll", true);
                $("#thumb-div").removeAttr("style");
                $(newElem).removeAttr("style").removeClass("ui-draggable").removeClass("ui-draggable-handle")
                    .removeClass("ui-draggable-disabled").addClass("ui-sortable-handle");
                $(newElem).find("img").removeAttr("style");
                $(newElem).data("caption", "");
                $(newElem).click(function () {
                    displayThumbnail(this);
                });
            }
        }
    });
}   // End of showOtherImages

/**
 * This function is called whenever the carrot is clicked. The inverse of showOtherImages- pops the additional images
 * back in.
 */
function hideOtherImages() {
    $('#otherImageCol').removeClass('col-md-2').addClass('col-md-1').removeClass('imageDropZone');
    $('#extend').show();
    $('#delete').removeClass('extendTrash').addClass('nonExtendTrash');
    $('#retract').hide();
    $('#controllers').addClass('col-md-offset-1');
    $('.captions-div').removeClass('captions-div-end').addClass('captions-div-start');
    $('#thumbnail-div-first-col').addClass('col-md-offset-1').removeClass('col-md-offset-2');
    $('div.thumbnail-div-first-col').removeClass("shown");
    $('#controllers').removeClass('col-md-offset-1');
}   // End of hideOtherImages