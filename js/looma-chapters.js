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

'use strict';


function chapterButtonClicked(event){
    //called when a CHAPTER button is pressed
    var button = event.target;
    LOOMA.setStore('chapter',  button.getAttribute('data-ch'), 'local');  //set a COOKIE for CHAPTER
    //document.cookie = "chapter=" + button.getAttribute('data-ch');  //set a COOKIE for CHAPTER

    //remember scroll position
    LOOMA.setStore('scroll', $("#main-container-horizontal").scrollTop(), 'session');

    LOOMA.playMedia(button);
};

function activityButtonClicked(){
        //called when a ACTIVITY button is pressed
        var chapter_id = this.getAttribute('data-ch');
        var chapter_dn = this.getAttribute('data-chdn');
        LOOMA.setStore('chapter', chapter_id, 'local');    //set a COOKIE for CHAPTER
        //document.cookie = "chapter=" + chapter_id;  //set a COOKIE for CHAPTER

        //remember scroll position
        LOOMA.setStore('scroll', $("#main-container-horizontal").scrollTop(), 'session');

        var className = LOOMA.readStore("class", 'local');
        var subject = LOOMA.readStore("subject", 'local');
        //activities = JSON.stringify(activities);
        //send GET request to chapters.php with CLASS and SUBJECT values
        chapter_id = encodeURIComponent(chapter_id);
        chapter_dn = encodeURIComponent(chapter_dn);
        window.location = "looma-activities.php?ch=" + chapter_id +
                                                "&chdn=" + chapter_dn +
                                                "&class=" + className +
                                                "&subject=" + subject;
        // could use jQuery $.get here instead of window.location?
    };  //  end activityButtonClicked()

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
