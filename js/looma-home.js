/*
 * Name: Skip
Email: skip@stritter.com
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2015 03
Revision: Looma 2.0.0

filename: looma-home.js
Description:
 */

'use strict';

    var className, subjectName;

    /* used when degbugging
     function playActivity(event) {
        var button = event.target;
        LOOMA.playMedia(button);
    };  */

    function displaySubjects(className) {
        var subject_names = ['Nepali', 'English', 'Math', 'Science', 'SocialStudies'];
        var tb_path = '../content/textbooks/' + LOOMA.capitalize(className) + '/';
        var classNumber = className.substr(className.length - 1); // get last character of CLASSNAME = class number
        var mask = $('#' + className).attr('data-mask');  //MASK is bitstring w/2 bits per class - '1' for text exists, '0' for no text,
        //for every BUTTON of class SUBJECT, set the SRC attr of the children of type IMG to textbook thumbnail
        $('.subject').show().each( function (i,button)
            {
                $(button).children('img').each( function (j, image)
                {
                    if (j == 0)       //first IMG is for english language textbook thumbnail. set SRC and VISIBILITY
                    {    if (mask[2 * i + j] == 1)
                             $(image).attr('src', tb_path + subject_names[i] + '/' + subject_names[i] + '-' + classNumber + '_thumb.jpg').show();
                        else $(image).attr('src', '../Looma/images/book.png').attr('style', 'opacity:0.3;').show();
                    }
                    else if (j==1)      //second IMG is for english language textbook thumbnail
                    {    if (mask[2 * i + j] == 1)
                             $(image).attr('src', tb_path + subject_names[i] + '/' + subject_names[i] + '-' + classNumber + '-Nepali_thumb.jpg').show();
                        else $(image).attr('src', '../Looma/images/book.png').attr('style', 'opacity:0.3;').show();
                }
                }  //end EACH(j) function
                );
            }  //end EACH(i) function
            );

        /*OLD code not using jQuery...
            var subjects = document.getElementsByClassName("subject");
            var en_tbs = document.getElementsByClassName("en-tb");
            var np_tbs = document.getElementsByClassName("np-tb");
            var mask = document.getElementById(className).getAttribute('data-mask');

            for (var i=0; i< mask.length; i++) {
                if (mask.charAt(i) == '0')  subjects[i].style.visibility='hidden';
                else {
                    subjects[i].style.visibility = 'visible';
                    //for each SUBJECT button, add IMG of textbook(s) cover(s) to the button

                    //NOTE: this code needs to handle the case where there is no THUMBNAIL or TEXTBOOK

                    en_tbs[i].setAttribute('src', tb_path + subject_names[i] + '/' + subject_names[i] + '-' + classNumber + '_thumb.jpg');
                    np_tbs[i].setAttribute('src', tb_path + subject_names[i] + '/' + subject_names[i] + '-' + classNumber + '-Nepali_thumb.jpg');
                    }
            }
        */

            //OLD code to read mongo to see which SUBJECT buttons to make visible:
            // var subjects = db.textbooks.find({'class': classButton});
            // var subjectButtons = document.getElementsByClassName("subject");
            // for (var i=0; i < COUNT(subjectsButtons); i++ {
             //        if (subjects.indexOf(subjectButton[i].getAttribute('subject')) != 0 )
             //            {subjectButton[i].setAttribute('class', 'active');}
             //        else {subjectButton[i].deleteAttribute('class', 'active');}}

    }; //end displaySubjects()

    function activateClass(className) {
            // de-activate all CLASS buttons
            $('.class').removeClass('active');
            // activate button for this CLASS
            $('#' + className).addClass('active');
    }; //end activateClass()

    function activateSubject(subjectName) {
             // de-activate all SUBJECT buttons
            $('.subject').removeClass('active');
             //  active button for this SUBJECT (unless called with 'null')
            if (subjectName) $('#' + subjectName).addClass('active');

    };  //end activateSubject

    function classButtonClicked(){
        //called when a CLASS button is pressed
        className = this.getAttribute('id');
        activateClass(className);              //activate this CLASS - highlights the button
        LOOMA.setStore("class", className, 'local');  //set a COOKIE for CLASS (lifetime = this browser session)
        displaySubjects(className);              // display SUBJECT buttons for this CLASS
        activateSubject(null);                  // de-activate all SUBJECTS

    }; // end classButtonClicked()

    function subjectButtonClicked(){
        //called when a SUBJECT button is pressed
        subjectName = this.getAttribute('id');
        LOOMA.setStore("subject", subjectName, 'local');  //set a COOKIE for SUBJECT (lifetime = this browser session)
        //send GET request to chapters.php with CLASS and SUBJECT values

        //set scroll position to top of page
        LOOMA.setStore('scroll', 0), 'session';

        window.location = "looma-chapters.php?class=" +
                            encodeURIComponent(className) +
                            "&subject=" +
                            encodeURIComponent(subjectName);
    };  //  end subjectButtonClicked()



$(document).ready (function() {

    $("button.class").click(classButtonClicked);
    $("button.subject").click(subjectButtonClicked);

    //set scroll position to top of page
    LOOMA.setStore('scroll', 0, 'local');

    className = LOOMA.readStore('class', 'local');
    if (className) {
        activateClass (className);
        displaySubjects(className);
        subjectName = LOOMA.readStore('subject', 'local');
        if (subjectName) {
            activateSubject (subjectName);
        }
    }
}); //end of document.ready
