  var myHilitor;


  document.addEventListener("DOMContentLoaded", function() {
    myHilitor = new Hilitor2("playground");
    myHilitor.setMatchType("left");
  }, false);

  document.getElementById("keywords").addEventListener("keyup", function() {
    myHilitor.apply(this.value);
  }, false);


    function scrollUp() {
        //window.scrollBy(0,-100);
        $('#playground').animate({scrollTop: '-=150px'}, 800);
    }

    function scrollDown() {
        //window.scrollBy(0,100);
        $('#playground').animate({scrollTop: '+=150px'}, 800);
    }

    $('#playground').scroll(function() {
        if ($(this).scrollTop() >= 50) {        // If page is scrolled more than 50px
            $('#return-to-top').fadeIn(200);    // Fade in the arrow
        } else {
            $('#return-to-top').fadeOut(200);   // Else fade out the arrow
        }
    });

    $('.scrollButtonUp').click(scrollUp);
    $('.scrollButtonDown').click(scrollDown);

    $('.returnToTop').click(function() {      // When arrow is clicked
        $('#playground').animate({
            scrollTop : 0                       // Scroll to top of body
        }, 1000);
});