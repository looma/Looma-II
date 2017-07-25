/*
Author: Alexa Thomases, Catie Cassani, May Li
Filename: looma-history.js
Date: July 2017
Description: Creates a timeline with search and hover functions. Information accessed through database.
*/

var myHilitor;

var rect = document.getElementById("keywords").getBoundingClientRect(); 

document.addEventListener("DOMContentLoaded", function() {
    myHilitor = new Hilitor2("playground");
    myHilitor.setMatchType("left");
}, false);

document.getElementById("keywords").addEventListener("keyup", function() {
    myHilitor.apply(this.value);
}, false);



  var i = -1; // Index of the search value in the search array (highlightedlist)

  // Variables used to have the page track where the timeline is after clicking an activity/button--
  //    so upon returning to the timeline, it starts from where it was left rather than the very beginning
  var scrollTimeout = null;
  var scrollDebounce = 5000; //msec delay to debounce scroll stop

  $('#next').fadeOut(200); 
  $('#previous').fadeOut(200); 

  $(document).ready (function() {

                //attach LOOMA.speak() to the '.speak' button
                $('button.speak').off('click').click(function(){
                    var toString = window.getSelection().toString();
                    console.log ('selected text is', toString);
                    LOOMA.speak(toString);
                });


            // When characters are entered into the searchbar, set the clickcount to -1 and set the search value index to -1 as well
            $('#keywords').on('input', function(){
                $('#next').attr("clickcount",-1);
                i = parseInt($('#next').attr("clickcount"));

                $('#next').fadeIn(500); 
                $('#previous').fadeIn(500); 

            });

            // Read the stored scroll position value and ready the page at that position
            $("#playground").scrollLeft(LOOMA.readStore('scroll', 'session'));
            LOOMA.setStore('scroll', 0, 'session'); // Reset the scroll position at the beginning of the timeline
            
    //attach LOOMA.lookup() to the '.lookup' button
    //NOTE: this code is overwritten in looma-pdf.js because looma-pdf.php displays the PDF in an <iframe> so the current selection in in the iframe
    $('.lookup').off().click(function(){
        var toString = window.getSelection().toString();
        console.log ('selected text to lookup: "', toString, '"');
       // LOOMA.lookupWord(toString);
        LOOMA.popupDefinition(toString, 0); // “0” means don’t timeout the popup
    });

});

  function handle(e){
    if(e.keyCode === 13){
            e.preventDefault(); // Ensure it is only this code that rusn
            moveRight();
        }
    }

    // Animates the scrolling of the timeline when these functions are called
    function moveLeft() {
        //window.scrollBy(0,-100);
        $('#playground').animate({scrollLeft: '-=500px'}, 700);
    }

    function moveRight() {
        //window.scrollBy(0,100);
        $('#playground').animate({scrollLeft: '+=500px'}, 700);
    }

    $('#playground').scroll(function() {
        if ($(this).scrollLeft() >= 200) {        // If page is scrolled more than 200
            $('.returnToLeftmost').fadeIn(200);    // Fade in the arrow
        } else {
            $('.returnToLeftmost').fadeOut(200);   // Else fade out the arrow
        }
    });



var highlightedlist = document.getElementsByTagName("EM");  // Array of the search values entered into the search bar--which are then highlighted in the timeline
i = parseInt($('#next').attr("clickcount")); // Defines the index as the clickcount of the next search button


    // Listens for clicks on the previous and next buttons for the search
    window.addEventListener('load', function () {
        document.getElementById('previous').addEventListener(
        'click', // we want to listen for a click
        function (e) { // the e here is the event itself
            //nextItem();
            //highlightedlist[i].setAttribute("style", "background-color: rgb(255, 255, 102); font-style: inherit; color: rgb(0, 0, 0);");
            //prevItem();
            myHilitor.apply($('#keywords').val());

            if (i == 0) // 1st instance (furthest left)
            {
                prevItem().scrollIntoView();
                moveRight();
            }
            else
            {
                prevItem().scrollIntoView();
                moveLeft();
            }

            highlightedlist[i].setAttribute("style","background-color: rgb(100, 255, 255); font-style: inherit; color: rgb(0, 0, 0);");


        }
        );

        document.getElementById('next').addEventListener(
            'click', 
            function (e) { 
            //prevItem();
            //highlightedlist[i].setAttribute("style", "background-color: rgb(255, 255, 102); font-style: inherit; color: rgb(0, 0, 0);");
            //nextItem();
            myHilitor.apply($('#keywords').val());

            var futurevalue = nextItem();
            if (futurevalue == highlightedlist[0]) // next instance is actually the first instance (wraps back to the start)
            {
                futurevalue.scrollIntoView();
                moveLeft();
            }
            else
            {
              futurevalue.scrollIntoView();
              moveRight();
          }
          highlightedlist[i].setAttribute("style","background-color: rgb(100, 255, 255); font-style: inherit; color: rgb(0, 0, 0);");
            //myHilitor.apply(highlightedlist[i]);
        }
        );
    }); // end on load

// Returns the search value that should be shown in the viewpoint, if the next button is pressed
function nextItem() {
    if(i < highlightedlist.length-1)
    {
        i = i + 1; // increase i by one
        $('#next').attr("clickcount",i);
        return highlightedlist[i]; // give us back the item of where we are now
    }
    else
    {
        i = 0;
        return highlightedlist[i];
    }
}

// Returns the search value that should be shown in the viewpoint, if the previous button is pressed
function prevItem() {
    if (i === 0) { // i would become 0
        i = highlightedlist.length; // so put it at the other end of the array
    }
    i = i - 1; // decrease by one
    $('#next').attr("clickcount",i);
    return highlightedlist[i]; // give us back the item of where we are now
}

    // When the scroll buttons are clicked, scroll accordingly
    $('.scrollButtonLeft').click(moveLeft);
    $('.scrollButtonRight').click(moveRight);

    $('.returnToLeftmost').click(function() {      // When arrow is clicked
        $('#playground').animate({
            scrollLeft : 0                       // Scroll to top of body
        }, 1000);
    });

    //POPUP STUFF
    $('body').click(function(e) {

        var target = $(e.target);   //The element that has been clicked

        if (target.is('.show-keyboard-button'))
        {
            document.getElementById('keyboard-hide').addEventListener('click', // we want to listen for a click
            function (e) { // the e here is the event itself 
                var wordvalue = $('#keywords').val();
                console.log(wordvalue + " : HERE");
                myHilitor.apply(wordvalue);
                $('#next').attr("clickcount",-1);
                i = parseInt($('#next').attr("clickcount"));

                $('#next').fadeIn(500); 
                $('#previous').fadeIn(500); 
            });
        }
        if (target.is('.dropbtn'))
        {
                //LOOMA.setStore('scroll', $("#playground").scrollLeft(), 'session'); // Store the scroll position
                var header = $(target).html();
                var descrip = $(target).attr("data-msg");   // The description of an event pulled from the json with looma-history.php

                // Defining the popup function--creates a function, inserts a description, and maybe ids if there are any
                var historypopup = function(msg, msgtitle, notTransparent){
                    console.log("HERE");
                    if (!notTransparent) LOOMA.makeTransparent();
                    $(document.body).append("<div class= 'popup'>" +
                        "<button class='popup-button' id='dismiss-popup'><b>X</b></button>"+ "<div style='text-decoration: underline'>" + msgtitle + "</div>" + msg + "</button></div>").hide().fadeIn(1000);
                    var id1 = $(target).attr("data-id1");
                    var id2 = $(target).attr("data-id2");

                    if(id1 !== undefined && id1 !== null) {
                       LOOMA.makeActivityButton($(target).attr("data-id1"), $(".popup"));
                    }
                    if(id2 !== undefined && id2 !== null) {
                        LOOMA.makeActivityButton($(target).attr("data-id2"), $(".popup"));
                    }
                    
                    $('#dismiss-popup').click(function() {
                        LOOMA.closePopup();
                    });

                    $('.popup').on('click', '.activity', null, function()
                    {
                        LOOMA.setStore('scroll', $("#playground").scrollLeft(), 'session'); // Store the scroll position
                    });  

                };  //end history popup function\

                LOOMA.closePopup();
                historypopup(descrip, header, false); // Creates a popup for the button
                
        };

        })