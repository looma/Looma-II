/*
 * Name: Skip
 * Email: skip@stritter.com
 * Owner: VillageTech Solutions (villagetechsolutions.org)
 * Date: 2015 10
 * Revision: Looma 2.0.0
 *
 * filename: looma-book.js
 * Description:
 */

'use strict';


function chapterButtonClicked(event){
    //called when a CHAPTER button is pressed
    var button = event.target;
    LOOMA.setStore('chapter',  button.getAttribute('data-ch'), 'session');  //set a COOKIE for CHAPTER
    //document.cookie = "chapter=" + button.getAttribute('data-ch');  //set a COOKIE for CHAPTER
    
    //remember scroll position
    LOOMA.setStore('chapterScroll', $("#main-container-horizontal").scrollTop(), 'session');
    
    LOOMA.playMedia(button);
};

function activityButtonClicked(){
    //called when a ACTIVITY button is pressed
    var chapter_id = this.getAttribute('data-ch');
    var chapter_dn = this.getAttribute('data-chdn');
    
    LOOMA.setStore('chapter', chapter_id, 'session');    //set a COOKIE for CHAPTER
    //remember scroll position
    LOOMA.setStore('chapterScroll', $("#main-container-horizontal").scrollTop(), 'session');
    
    var className = LOOMA.readStore("class", 'session');
    var subject = LOOMA.readStore("subject", 'session');
    
    //send GET request to looma-activities.php with CLASS,SUBJECT, CH_ID values
    chapter_id = encodeURIComponent(chapter_id);
    chapter_dn = encodeURIComponent(chapter_dn);
    window.location = "looma-activities.php?ch=" + chapter_id +
        "&chdn=" + chapter_dn +
        "&grade=" + className +
        "&subject=" + subject;
};  //  end activityButtonClicked()

function lessonButtonClicked(){
    //called when a LESSON button is pressed
    var chapter_id = this.getAttribute('data-ch');
    var mongo_id =   this.getAttribute('data-id');
    
    LOOMA.setStore('chapter', chapter_id, 'session');    //set a COOKIE for CHAPTER
    LOOMA.setStore('chapterScroll', $("#main-container-horizontal").scrollTop(), 'session'); //remember scroll position
    LOOMA.clearStore('lesson-plan-index','session');
    //send GET request to looma-lesson-present.php with mongo_id value
    mongo_id = encodeURIComponent(mongo_id);
    window.location = "looma-lesson-present.php?id=" + mongo_id;
};  //  end lessonButtonClicked()


$(document).ready (function() {
    //add listeners to ACTIVITY and CHAPTER buttons
    $("button.activities").click(activityButtonClicked);
    $("button.lesson").click(lessonButtonClicked);
    $("button.chapter").click(chapterButtonClicked);
    
    // check cookies to see if there is an active CHAPTER
    // if so, add class='active' to all the buttons for this CHAPTER (if any)
    
    var chapterCookie = LOOMA.readStore('chapter', 'session');
    if (chapterCookie) {
        $('button.chapter[data-ch="' + chapterCookie + '"]').addClass('active');
        $('button.activities[data-ch="' + chapterCookie + '"]').addClass('active');
        $('button.lesson[data-ch="' + chapterCookie + '"]').addClass('active');
    };
    
    //scroll to prior scroll position
    //$("#main-container-horizontal").scrollTop(LOOMA.readStore('chapterScroll', 'session'));
    
}); //end of document.ready anonymous function
