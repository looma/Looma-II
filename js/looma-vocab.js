/*
 * Name: Skip
Email: skip@stritter.com
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2015 03
Revision: Looma 2.0.0

filename: looma-class-subject.js
Description:
 */

'use strict';

    var className, subjectName;

    function displaySubjects(className) {
        var subjects = document.getElementsByClassName("subject");
        var mask = document.getElementById(className).getAttribute('data-mask');
        for (var i=0; i< mask.length; i++) {
            if (mask.charAt(i) == '1')  subjects[i].style.visibility='visible';
            else                         subjects[i].style.visibility = 'hidden';
        }
    } //end displaySubjects()

    function activateClass(className) {
            // de-activate all CLASS buttons
            $('.class').removeClass('active');
            // activate button for this CLASS
            $('#' + className).addClass('active');
    } //end activateClass()

    function activateSubject(subjectName) {
             // de-activate all SUBJECT buttons
            $('.subject').removeClass('active');
             //  active button for this SUBJECT
            $('#' + subjectName).addClass('active');

    }  //end activateSubject

    function classButtonClicked(){
        //called when a CLASS button is pressed
        className = this.getAttribute('id');
        activateClass(className);              //activate this CLASS - highlights the button
        LOOMA.setStore("vocab-grade", className, 'local');         //set a COOKIE for CLASS (lifetime = this browser session)
        displaySubjects(className);              // display SUBJECT buttons for this CLASS
        activateSubject(null);                  // de-activate all SUBJECTS
        //code here for 'remember class visited'
        //$("button.class").setAttribute('visit', false);
        //this.setAttribute('visit', true);
        // add CSS to color 'visit=true' different from 'visit=false'

        //better code for which SUBJECT buttons to make visible:
        // var subjects = db.textbooks.find({'class': classButton});
        // var subjectButtons = document.getElementsByClassName("subject");
        // for (var i=0; i < COUNT(subjectsButtons); i++ {
         //        if (subjects.indexOf(subjectButton[i].getAttribute('subject')) != 0 )
         //            {subjectButton[i].setAttribute('class', 'active');}
         //        else {subjectButton[i].deleteAttribute('class', 'active');}}


        //hides or shows the SUBJECT buttons based on data-mask attribute of "this" button

    }; // end showSubjectButtons()

    function subjectButtonClicked(){
        //called when a SUBJECT button is pressed
        subjectName = this.getAttribute('id');
        LOOMA.setStore("vocab-subject", subjectName, 'local');  //set a COOKIE for SUBJECT (lifetime = this browser session)

        //code here for 'remember subject visited'
        //$("button.subject").setAttribute('visit', false);
        //this.setAttribute('visit', true);
        // add CSS to color 'visit=true' different from 'visit=false'

        //send GET request to chapters.php with CLASS and SUBJECT values
        window.location = "looma-vocab-flashcard.php?class=" +
                            encodeURIComponent(className) +
                            "&subject=" +
                            encodeURIComponent(subjectName);

        // could use jQuery $.get here instead of window.location?

    };  //  end subjectButtonClicked()



$(document).ready (function() {
    //add listeners to all CLASS buttons
    $("button.class").click(classButtonClicked);

    //add listeners to all SUBJECT buttons
    $("button.subject").click(subjectButtonClicked);

    //code here for coloring buttons for ACTIVE class and subject

    var classCookie = LOOMA.readStore('vocab-grade', 'local');
    if (classCookie) {
        className = classCookie;
        activateClass (classCookie);
        displaySubjects(classCookie);
        var subjectCookie = LOOMA.readStore('vocab-subject', 'local');
        if (subjectCookie) {
            subjectName = subjectCookie;
            activateSubject (subjectCookie);
        };
    LOOMA.setStore("vocab-count", "25", 'local');        //set a COOKIE for count [number of words requested] (lifetime = this browser session)
    LOOMA.setStore("vocab-random", "true", 'local');    //set a COOKIE for random ordering of word list (lifetime = this browser session)

    }
}); //end of document.ready anonymous function
