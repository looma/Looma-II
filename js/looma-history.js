/*
Author: Alexa Thomases, Catie Cassani, May Li
Filename: looma-history.js
Date: July 2017
Description: Handles features such as scrolling, searching, clicking on popups, and using the on-screen keyboard.
*/

var myHilitor;

document.addEventListener("DOMContentLoaded", function() {
    myHilitor = new Hilitor2("playground");
    myHilitor.setMatchType("left");
}, false);

document.getElementById("keywords").addEventListener("keyup", function() {
    myHilitor.apply(this.value);
}, false);



var searchIndex = -1; // searchIndex of the search value in the search array (highlightedlist)

// Variables used to have the page track where the timeline is after clicking an activity/button--
//    so upon returning to the timeline, it starts from where it was left rather than the very beginning
var scrollTimeout = null;
var scrollDebounce = 5000; //msec delay to debounce scroll stop

$(document).ready (function() {

    $('#playground').scroll(function() {
        if ($(this).scrollLeft() >= 300) {        // If page is scrolled more than 300
            $('.returnToLeftmost').fadeIn(200);    // Fade in the arrow (it is not displayed by default)
        }
        else {
            $('.returnToLeftmost').fadeOut(200);   // Else fade out the arrow
        }
    });

    //attach LOOMA.lookup() to the '.lookup' button
    //NOTE: this code is overwritten in looma-pdf.js because looma-pdf.php displays the PDF in an <iframe> so the current selection in in the iframe
    $('.lookup').off().click(function(){
        var toString = window.getSelection().toString();
        console.log ('selected text to lookup: "', toString, '"');
        LOOMA.popupDefinition(toString, 0); // “0” means don’t timeout the popup
    });


    // When characters are entered into the searchbar, set the clickcount to -1 and set the search value searchIndex to -1 as well
    $('#keywords').on('input', function(){
        $('#next').attr("clickcount",-1);
        searchIndex = parseInt($('#next').attr("clickcount"));

        // these buttons are originally set to display:none in the css, but once the user types in the search bar they fade in
        $('#next').fadeIn(500);
        $('#previous').fadeIn(500);

    });

    //('#search-button').click(function(){$('#keywords').trigger('change');});
    
    
    // Listens for clicks on the previous and next buttons for the search
    document.getElementById('previous').addEventListener('click', function (e) {
            myHilitor.apply($('#keywords').val());

            if (highlightedlist.length == 1) // only one instance of the searched term
            {
                prevItem().scrollIntoView();
            }
            else if (searchIndex == 0) // 1st instance (furthest left)
            {
                prevItem().scrollIntoView();
                moveRight(800, 700);
            }
            else
            {
                prevItem().scrollIntoView();
                moveLeft(800, 700);
            }

            highlightedlist[searchIndex].setAttribute("style","background-color: rgb(100, 255, 255); font-style: inherit; color: rgb(0, 0, 0);");
    });

    document.getElementById('next').addEventListener('click', function (e) {
                myHilitor.apply($('#keywords').val());

                var futurevalue = nextItem();
                console.log("future:" + searchIndex);
                if (highlightedlist.length == 1)
                {
                    futurevalue.scrollIntoView();
                }
                else if (futurevalue == highlightedlist[0]) // next instance is actually the first instance (wraps back to the start)
                {
                    futurevalue.scrollIntoView();
                    if ($('#playground').scrollLeft() != 0)
                    {
                        moveLeft(800, 700);
                    }
                }
                else // the next instance is NOT the first instance in the array
                {
                    futurevalue.scrollIntoView();
                    moveRight(800, 700);
                }
          highlightedlist[searchIndex].setAttribute("style","background-color: rgb(100, 255, 255); font-style: inherit; color: rgb(0, 0, 0);");
            //myHilitor.apply(highlightedlist[searchIndex]);
    });

    //POPUP STUFF
    $('.show-keyboard-button').on('click', function() { // when the show keyboard button is clicked

            document.getElementById('keyboard-hide').addEventListener('click', // we want to listen for a click
            function () {
                var wordvalue = $('#keywords').val();
                //console.log(wordvalue + " : HERE");
                myHilitor.apply(wordvalue);
                $('#next').attr("clickcount",-1);
                searchIndex = parseInt($('#next').attr("clickcount"));

                $('#next').fadeIn(500);
                $('#previous').fadeIn(500);
            }); //end inner function
    }); //end outer function

    $('.dropbtn').on('click', function(e){

            var target = $(e.target);   //The element that has been clicked
            var header = $(target).html();
            var descrip = $(target).attr("data-msg");   // The description of an event pulled from the json with looma-history.php

            // Defining the popup function--creates a function, inserts a description, and maybe ids if there are any
            var historypopup = function(msg, msgtitle, notTransparent){
                    console.log("HERE");
                    if (!notTransparent) {
                        LOOMA.makeTransparent();
                    };
                    $('#fullscreen').append("<div class= 'popup'>" +
                    "<button class='popup-button' id='dismiss-popup'><b>X</b></button>"+ "<div style='text-decoration: underline'>" + msgtitle + "</div>" + msg + "</button></div>").hide().fadeIn(1000);
                    var id1 = $(target).attr("data-id1");
                    var id2 = $(target).attr("data-id2");

                    if(id1 !== undefined && id1 !== null) {
                         LOOMA.makeActivityButton($(target).attr("data-id1"), "", $(".popup"));
                    }
                    if(id2 !== undefined && id2 !== null) {
                        LOOMA.makeActivityButton($(target).attr("data-id2"), "", $(".popup"));
                    }

                    $('#dismiss-popup').click(function() {
                        LOOMA.closePopup();
                    });

                    $('.popup').on('click', '.activity', null, function()
                    {
                        LOOMA.setStore('historyScroll', $("#playground").scrollLeft(), 'session'); // Store the scroll position
                    });
            };  //end history popup function

            LOOMA.closePopup();
            historypopup(descrip, header, true); // Creates a popup for the button

    }); // end dropbtn is clicked function

    // decreases the z index of each subsequent dropbtn so it is not obscured by the timeline-description (otherwise, parts of button aren't clickable)
    var timelineDescripArray = $(".timeline-description");
    timelineDescripArray.each(function(index, e){
            e.style.zIndex = timelineDescripArray.length - index;
    });
}); // end document.ready function

// Read the stored scroll position value and ready the page at that position
$("#playground").scrollLeft(LOOMA.readStore('historyScroll', 'session'));
LOOMA.setStore('historyScroll', 0, 'session'); // Reset the scroll position at the beginning of the timeline

// Animates the scrolling of the timeline when these functions are called
function moveLeft(time, distance) {
        $('#playground').animate({scrollLeft: '-=' + distance +'px'}, time);
}

function moveRight(time, distance) {
        $('#playground').animate({scrollLeft: '+=' + distance + 'px'}, time);
}

var highlightedlist = document.getElementsByTagName("EM");  // Array of the search values entered into the search bar--which are then highlighted in the timeline
searchIndex = parseInt($('#next').attr("clickcount")); // Defines the searchIndex as the clickcount of the next search button


// Returns the search value that should be shown in the viewpoint, if the next button is pressed
function nextItem() {
    if(searchIndex < highlightedlist.length-1)
    {
        searchIndex = searchIndex + 1; // increase searchIndex by one
        $('#next').attr("clickcount",searchIndex);
        return highlightedlist[searchIndex]; // give us back the item of where we are now
    }
    else
    {
        searchIndex = 0;
        return highlightedlist[searchIndex];
    }
}

// Returns the search value that should be shown in the viewpoint, if the previous button is pressed
function prevItem() {
    if (searchIndex === 0) { // searchIndex would become 0
        searchIndex = highlightedlist.length; // so put it at the other end of the array
    }
    searchIndex = searchIndex - 1; // decrease by one
    $('#next').attr("clickcount",searchIndex);
    return highlightedlist[searchIndex]; // give us back the item of where we are now
}

function moveLeftWrapper()
{
    moveLeft(1000, 1200)
}

// When the scroll buttons are clicked, scroll accordingly
$('.scrollButtonLeft').click(moveLeftWrapper);

function moveRightWrapper()
{
    moveRight(1000, 1200)
}

$('.scrollButtonRight').click(moveRightWrapper);

$('.returnToLeftmost').click(function() {      // When arrow is clicked
        $('#playground').animate({
            scrollLeft : 0                       // Scroll to leftmost position
        }, 1000);
});
