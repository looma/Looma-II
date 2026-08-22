/*
 * Name: Skip
 *
 * Owner: VillageTech Solutions (villagetechsolutions.org)
 * Date: 2015 10
 * Revision: Looma 2.0.0
 *
 * filename: looma-chapters.js
 * Description:
 */

'use strict';


// Build a stable identifier for a specific chapter/lesson/lessons/
// activities button — a composite of chapter id, language, and button
// type. Used to persist which resource the user last opened so we can
// highlight it with the .last-visited class when they return.
function chapterButtonKey(btn) {
    var $btn = $(btn);
    var ch   = $btn.attr('data-ch')   || '';
    var lang = $btn.attr('data-lang') || '';
    var type = '';
    // Detect the logical button type. We can't rely on the base class
    // (chapter/lesson/lessons/activities) alone because a chapter title
    // button gets its base class from the Mongo `ft` field — which may
    // be "section", "html", "pdf", etc. instead of "chapter" — so those
    // rows would miss detection. Fall back to the language-specific
    // classes (en-chapter/np-chapter/en-lesson/np-lesson/en-activities/
    // np-activities) which are ALWAYS present regardless of file type.
    //
    // Order matters: check 'lessons' (plural) FIRST — a plural-lesson
    // button has class="lessons en-lesson" so both en-lesson and lessons
    // match, and we want it classified as 'lessons'.
    if      ($btn.hasClass('lessons'))                                          type = 'lessons';
    else if ($btn.hasClass('en-activities') || $btn.hasClass('np-activities')) type = 'activities';
    else if ($btn.hasClass('en-lesson')     || $btn.hasClass('np-lesson'))     type = 'lesson';
    else if ($btn.hasClass('en-chapter')    || $btn.hasClass('np-chapter'))    type = 'chapter';
    return ch + '|' + lang + '|' + type;
}

// Mark the given button as the last-visited resource. Removes the marker
// from any previously-marked button so only one shows the highlight.
function markAsLastVisited(btn) {
    var key = chapterButtonKey(btn);
    LOOMA.setStore('lastVisitedButton', key, 'session');
    $('button.last-visited').removeClass('last-visited');
    $(btn).addClass('last-visited');
}

function chapterButtonClicked(event){
    //called when a CHAPTER button is pressed
    var button = event.target;
    if (button.getAttribute('data-ft') === 'section' && button.getAttribute('data-len') == 0) return false;
    markAsLastVisited(button);
    LOOMA.setStore('chapter',  button.getAttribute('data-ch'), 'session');  //set a COOKIE for CHAPTER
    //document.cookie = "chapter=" + button.getAttribute('data-ch');  //set a COOKIE for CHAPTER

    //remember scroll position
    LOOMA.setStore('chapterScroll', $("#main-container-horizontal").scrollTop(), 'session');

    LOOMA.playMedia(button);
};

function activityButtonClicked(){
        //called when a ACTIVITY button is pressed
        markAsLastVisited(this);
        var chapter_id = this.getAttribute('data-ch');
    var chapter_dn = this.getAttribute('data-chdn');
    var chapter_ndn = this.getAttribute('data-chndn');
        var chapter_lang = this.getAttribute('data-lang');

        LOOMA.setStore('chapter', chapter_id, 'session');    //set a COOKIE for CHAPTER
        //remember scroll position
        LOOMA.setStore('chapterScroll', $("#main-container-horizontal").scrollTop(), 'session');

        var className = LOOMA.readStore("class", 'session');
        var subject = LOOMA.readStore("subject", 'session');

        //send GET request to looma-activities.php with CLASS,SUBJECT, CH_ID values
        chapter_id = encodeURIComponent(chapter_id);
    chapter_dn = encodeURIComponent(chapter_dn);
    //chapter_ndn = encodeURIComponent(chapter_ndn);
        window.location = "activities?ch=" + chapter_id +
                                                "&chdn=" + chapter_dn +
                                                "&chndn=" + chapter_ndn +
                                                "&chapter_lang=" + chapter_lang +
                                                "&grade=" + className +
                                                "&subject=" + subject;
    };  //  end activityButtonClicked()

function lessonButtonClicked(){
        //called when a LESSON button is pressed
    markAsLastVisited(this);
    var chapter_id = this.getAttribute('data-ch');
    var mongo_id =   this.getAttribute('data-id');
    var chapter_lang = this.getAttribute('data-lang');

    LOOMA.setStore('chapter', chapter_id, 'session');    //set a COOKIE for CHAPTER
    LOOMA.setStore('chapterScroll', $("#main-container-horizontal").scrollTop(), 'session'); //remember scroll position
    LOOMA.clearStore('lesson-plan-index','session');
    //send GET request to looma-play-lesson.php with mongo_id value
    mongo_id = encodeURIComponent(mongo_id);
    window.location = "looma-play-lesson.php?id=" + mongo_id + "&lang=" + chapter_lang;
};  //  end lessonButtonClicked()

function lessonsButtonClicked() {
    markAsLastVisited(this);
    var chapter =   this.getAttribute('data-ch');
    var chapter_lang = this.getAttribute('data-lang');
    window.location = "looma-lessons.php?ch_id=" + chapter + "&lang=" + chapter_lang;
};  // end lessonsButtonClicked()

function showSummary() {
    LOOMA.alert('summary here',5);
}

$(document).ready (function() {
    //add listeners to ACTIVITY and CHAPTER buttons
    $("button.activities").click(activityButtonClicked);
    $("button.lesson").click(lessonButtonClicked);
    $("button.lessons").click(lessonsButtonClicked);
    $("button.chapter, button.section").click(chapterButtonClicked);

    //    $("button.chapter, button.section").on('contextmenu',chapterButtonRightClicked);

    // check cookies to see if there is an active CHAPTER
    // if so, add class='active' to all the buttons for this CHAPTER (if any)

    var chapterCookie = LOOMA.readStore('chapter', 'session');
    if (chapterCookie) {
        $('button.chapter[data-ch="' + chapterCookie + '"]').addClass('active');
        $('button.activities[data-ch="' + chapterCookie + '"]').addClass('active');
        $('button.lesson[data-ch="' + chapterCookie + '"]').addClass('active');
    };

    // Restore the .last-visited marker to whichever button the user most
    // recently clicked before leaving the page. Key format: "ch|lang|type"
    // e.g. "1M01|en|activities" — the composite parts uniquely identify
    // a single button so only that one lights up.
    //
    // We rebuild the CSS selector from LANGUAGE-specific classes rather
    // than the base class, because chapter title buttons don't always
    // have class "chapter" (they get their base class from the Mongo `ft`
    // field, which is often "section" or "html"). Language classes are
    // always present, so this reliably finds every button.
    var lastKey = LOOMA.readStore('lastVisitedButton', 'session');
    if (lastKey) {
        var parts = lastKey.split('|');
        if (parts.length === 3 && parts[2]) {
            var ch = parts[0], lang = parts[1], type = parts[2];
            var selector = '';
            if      (type === 'chapter')    selector = 'button.' + lang + '-chapter:not(.heading)';
            else if (type === 'lesson')     selector = 'button.lesson.'  + lang + '-lesson';
            else if (type === 'lessons')    selector = 'button.lessons.' + lang + '-lesson';
            else if (type === 'activities') selector = 'button.' + lang + '-activities:not(.heading)';
            if (selector) {
                $(selector + '[data-ch="' + ch + '"]').addClass('last-visited');
            }
        }
    }

    //scroll to prior scroll position
    $("#main-container-horizontal").scrollTop(LOOMA.readStore('chapterScroll', 'session'));

    $(".chapter .info").hover(function(){showSummary()});

    toolbar_button_activate("home");

}); //end of document.ready anonymous function
