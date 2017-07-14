/*
Author: Alexa Thomases, Catie Cassani, May Li
Filename: looma-history.php
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

  $(document).ready (function() {
        //attach LOOMA.speak() to the '.speak' button
            $('button.speak').click(function(){
                var toString = window.getSelection().toString();
                console.log ('selected text is', toString);
                LOOMA.speak(toString);
            });
        });


    function handle(e){
        if(e.keyCode === 13){
            e.preventDefault(); // Ensure it is only this code that rusn

            scrollRight();
        }
    }

    function scrollLeft() {
        //window.scrollBy(0,-100);
        $('#playground').animate({scrollLeft: '-=500px'}, 700);
    }

    function scrollRight() {
        //window.scrollBy(0,100);
        $('#playground').animate({scrollLeft: '+=500px'}, 700);
    }

    $('#playground').scroll(function() {
        if ($(this).scrollLeft() >= 200) {        // If page is scrolled more than 50px
            $('.returnToLeftmost').fadeIn(200);    // Fade in the arrow
        } else {
            $('.returnToLeftmost').fadeOut(200);   // Else fade out the arrow
        }
    });

    $('.scrollButtonLeft').click(scrollLeft);
    $('.scrollButtonRight').click(scrollRight);

    $('.returnToLeftmost').click(function() {      // When arrow is clicked
        $('#playground').animate({
            scrollLeft : 0                       // Scroll to top of body
        }, 1000);
});
    //POPUP STUFF
    $('body').click(function(e) {

        var target = $(e.target);


        if (target.is('.dropbtn'))
        {
            var descrip = $(target).attr("data-msg");
            var historypopup = function(msg, notTransparent){


            if (!notTransparent) LOOMA.makeTransparent();
            $(document.body).append("<div class= 'popup'>" +
            "<button class='popup-button' id='dismiss-popup'><b>X</b></button>"+ msg + "</button></div>").hide().fadeIn(1000);

            var id1 = $(target).attr("data-id1");
            var id2 = $(target).attr("data-id2");

            if(id1 !== undefined && id1 !== null) {
                 LOOMA.makeActivityButton($(target).attr("data-id1"), $(".popup"));
            }
             if(id2 !== undefined && id2 !== null) {
                LOOMA.makeActivityButton($(target).attr("data-id2"), $(".popup"));
            }





             $('#dismiss-popup').click(function() {
             // $("#close-popup").off('click');
             //$("#dismiss-popup").off('click');
             LOOMA.closePopup();
            });
 /*   $('#dismiss-popup').click(function() {
        LOOMA.closePopup()
    });
*/
            };  //end alert()
            historypopup(descrip, false);
        }

    })


