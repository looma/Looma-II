/*
 * Name: Skip
 * Email: skip@stritter.com
 * Owner: VillageTech Solutions (villagetechsolutions.org)
 * Date: 2015 10
 * Revision: Looma 2.0.0
 *
 * filename: looma-chapters.js
 * Description:
 */



function chapterButtonClicked(event){
    //called when a CHAPTER button is pressed
    var button = event.target;
    var chapter_id = this.getAttribute('data-ch');
    LOOMA.setStore('navChapter',  button.getAttribute('data-ch'), 'local');  //set a COOKIE for CHAPTER
    LOOMA.playMedia(button);
};

$(document).ready (function() {
    //add listeners to ACTIVITY and CHAPTER buttons
    $("button.activity").click(activityButtonClicked);
    $("button.chapter").click(chapterButtonClicked);

    // check cookies to see if there is an active CHAPTER
    // if so, add class='active' to all the buttons for this CHAPTER (if any)

    var chapterCookie = LOOMA.readStore('chapter', 'local');
    if (chapterCookie) {
        $('button.chapter[data-ch="' + chapterCookie + '"]').addClass('active');
        $('button.activity[data-ch="' + chapterCookie + '"]').addClass('active');
    };

    //scroll to prior scroll position
    $("#main-container-horizontal").scrollTop(LOOMA.readStore('scroll', 'session'));

}); //end of document.ready anonymous function
