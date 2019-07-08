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

var className, subjectName, gradeName, prefix;

function displaySubjects (className) {
    
    $.post("looma-database-utilities.php",
        {cmd: "bookList",
            class: className},
        function(books) {
            books.forEach (function(book) {
                var tb_path = '../content/' + book['fp'];
                var $newButton =  $('<button type="button" class="subject" id="' + book["subject"] + '" data-prefix="' + book['prefix'] + '">');
              
               	$newButton.append($("<p class='english-keyword'>"+ book['dn'] + "<p class='xlat'>"+ book['ndn'] + "</p></p>"));
               	$newButton.append($("<p class='native-keyword'>"+ book['ndn'] + "<p class='xlat'>"+ book['dn'] + "</p></p>"));
               
                 //$newButton.append($('<p>' + book["dn"] +'</p>'));

                var imgEn = (book['fn']) ?
                                tb_path + encodeURIComponent(book['fn'].substr(0,book['fn'].length-4)) + '_thumb.jpg' :
                                'images/book_gray.png';
    
                var imgNp = (book['nfn']) ?
                               tb_path + encodeURIComponent(book['nfn'].substr(0,book['nfn'].length-4)) + '_thumb.jpg' :
                               'images/book_gray.png';
                
                $newButton.append($('<img draggable="false" src="' + imgEn+ '" />' ));
                $newButton.append($('<img draggable="false" src="' + imgNp+ '" />' ));
                $('#subjects').append($newButton);
            });
            $("button.subject").click(subjectButtonClicked);
    
            subjectName = LOOMA.readStore('subject', 'session');
            activateSubject(subjectName);
    
            var language;
            language = LOOMA.readStore('language', 'local');
            if (!language) {
                LOOMA.setStore('language', 'english', 'local');
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
    LOOMA.setStore("class", className, 'session');  //set a COOKIE for CLASS (lifetime = this browser session)
    
    $('#subjects').empty();
    displaySubjects(className);              // display SUBJECT buttons for this CLASS
    activateSubject(null);                  // de-activate all SUBJECTS
    
}; // end classButtonClicked()

function subjectButtonClicked(){
    subjectName = this.getAttribute('id');
    prefix = $(this).data('prefix');
    
    LOOMA.setStore("subject", subjectName, 'session');  //set a COOKIE for SUBJECT (lifetime = this browser session)
    
    //set scroll position to top of page
    //LOOMA.setStore('libraryScroll', 0), 'session';
    LOOMA.setStore('chapterScroll', 0), 'session';
    
    //send GET request to chapters.php with CLASS and SUBJECT values
    window.location = "looma-chapters.php?class=" + encodeURIComponent(className) +
        "&grade=" + encodeURIComponent(className.replace('class','Grade ')) +
        "&subject=" + encodeURIComponent(subjectName) +
        "&prefix=" + encodeURIComponent(prefix);
};  //  end subjectButtonClicked()



$(document).ready (function() {
    
    $("button.class").click(classButtonClicked);
    $("button.subject").click(subjectButtonClicked);
    
    //set scroll position to top of page
    LOOMA.setStore('chapterScroll', 0, 'session');
    
    className = LOOMA.readStore('class', 'session');
    if (!className) {
        className = 'class1';
        LOOMA.setStore('class', className, 'session');  //set a COOKIE for CLASS (lifetime = this browser session)
    };
    
    activateClass (className);
    displaySubjects(className);

    


}); //end of document.ready
