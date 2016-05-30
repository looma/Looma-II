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
        //hides or shows the SUBJECT buttons based on data-mask attribute of "this" button

        var className = this.getAttribute('id');
        activateClass(className);              //activate this CLASS - highlights the button
        LOOMA.setStore("arith-grade", className, 'local');         //set a COOKIE for CLASS (lifetime = this browser session)
        displaySubjects(className);              // display SUBJECT buttons for this CLASS
        activateSubject(null);                  // de-activate all SUBJECTS

    }; // end showSubjectButtons()

    function subjectButtonClicked(){
        //called when a SUBJECT button is pressed
        var subjectName = this.getAttribute('id');
        activateSubject(subjectName);              //activate this CLASS - highlights the button
        LOOMA.setStore("arith-subject", subjectName, 'local');  //set a COOKIE for SUBJECT (lifetime = this browser session)

        //code here for 'remember subject visited'
        //$("button.subject").setAttribute('visit', false);
        //this.setAttribute('visit', true);
        // add CSS to color 'visit=true' different from 'visit=false'

        //send GET request to chapters.php with CLASS and SUBJECT values

        window.location = "looma-arith-problems.php";

        // code to pass class & subject without setting cookies:
        /*
         window.location = "looma-arith-problems.php?class=" +
                            encodeURIComponent(className) +
                            "&subject=" +
                            encodeURIComponent(subjectName);
        */

        // could use jQuery $.get here instead of window.location?

    };  //  end subjectButtonClicked()



$(document).ready (function() {
    //add listeners to all CLASS buttons
    $("button.class").click(classButtonClicked);

    //add listeners to all SUBJECT buttons
    $("button.subject").click(subjectButtonClicked);

    var classCookie = LOOMA.readStore('arith-grade', 'local');
    if (classCookie) {
        activateClass (classCookie);
        displaySubjects(classCookie);
        var subjectCookie = LOOMA.readStore('arith-subject', 'local');
        if (subjectCookie) {
            activateSubject (subjectCookie);
        };
    }
}); //end of document.ready anonymous function
