/*
 * Name: Skip
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2020 08
Revision: Looma 2.0.0

filename: looma-games.js [NEW version]
Description:
 */

'use strict';

var className, subjectName, gradeName, prefix;

var nnames = {
    'science' : 'विज्ञान',
    'english' : 'अंग्रेजी',
    'math'    :  'गणित',
    'social studies' : 'सामाजिक शिक्षा' };

var displaynames = {
    'science' : 'Science',
    'english' : 'English',
    'math'    :  'Math',
    'social studies' : 'Social' };

function displaySubjects (className) {
    
    $.post("looma-database-utilities.php",
        {cmd: "gameSubjectList",
            class: className},
        function(subjects) {
            for (const index in subjects) {
          //  subjects.forEach (function(index, subject) {
                var name = subjects[index];
                var nname = nnames[name];
                var $newButton =  $('<button type="button" + ' +
                    'data-class="' + className + '"' +
                    'data-subject="' + subjects[index] + '"' +
                    'class="subject game" id="' + name + '">');
                
                var displayname = displaynames[name];
                $newButton.append($("<p class='english-keyword caps'>"+ displayname + "<p class='xlat'>"+ nname + "</p></p>"));
                $newButton.append($("<p class='native-keyword caps'>"+ nname + "<p class='xlat'>"+ displayname + "</p></p>"));
                
                $newButton.append($('<img draggable="false" src="images/games.png" />' ));
                
                $('#subjects').append($newButton);
            };
            $("button.subject").click(gameButtonClicked);
            
            //subjectName = LOOMA.readStore('subject', 'session');
            //activateSubject(subjectName);
            
            var language;
            language = LOOMA.readStore('language', 'cookie');
            if (!language) {
                LOOMA.setStore('language', 'english', 'cookie');
                language = 'english';
            };
            LOOMA.translate(language);
        },
        'json'
    );
}  //end displaySubjects()

function activateClass(className) {
    // de-activate all CLASS buttons
    $('.class').removeClass('active');
    // activate button for this CLASS
    $('#' + className).addClass('active');
}; //end activateClass()

function activateSubject(subjectName) {
    $('.subject').removeClass('active');  // de-activate all SUBJECT buttons
    if (subjectName) {  //  active button for this SUBJECT (unless called with 'null')
        var btn = document.getElementById(subjectName);
        $(btn).addClass('active');
    };
};  //end activateSubject

function classButtonClicked(){
    //called when a CLASS button is pressed
    className = this.getAttribute('id');
    //
    // gradeName = this.getAttribute('data-name');
    
    activateClass(className);              //activate this CLASS - highlights the button
    LOOMA.setStore("game-class", className, 'session');  //set a COOKIE for CLASS (lifetime = this browser session)
    
    $('#subjects').empty();
    displaySubjects(className);              // display SUBJECT buttons for this CLASS
    activateSubject(null);                  // de-activate all SUBJECTS
    
}; // end classButtonClicked()

function gameButtonClicked(){
    var subjectName = $(this).data('subject');
    var className = $(this).data('class');
    
    //LOOMA.setStore("subject", subjectName, 'session');  //set a COOKIE for SUBJECT (lifetime = this browser session)
    window.location = "looma-game-list.php?class=" + encodeURIComponent(className) +
                                             "&subject=" + encodeURIComponent(subjectName) ;
};  //  end gameButtonClicked()



$(document).ready (function() {
    
    $("button.class").click(classButtonClicked);
    $("button.subject").click(gameButtonClicked);
    
    //set scroll position to top of page
    //LOOMA.setStore('chapterScroll', 0, 'session');
    
    className = LOOMA.readStore('game-class', 'session');
    if (!className) {
        className = 'class1';
        LOOMA.setStore('game-class', className, 'session');  //set a COOKIE for CLASS (lifetime = this browser session)
    };
    
    activateClass (className);
    displaySubjects(className);
    
}); //end of document.ready
