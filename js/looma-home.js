/*
 * Name: Skip

Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2015 03
Revision: Looma 2.0.0

filename: looma-home.js
Description:
 */

'use strict';

var className, subjectName, gradeName, prefix;
var cover;

var subjectnames = {
    'english' : 'English',
    'english1' : 'English 1',
    'english2' : 'English 2',
    'math'    : 'Maths',
    'math1'    : 'Maths 1',
    'math2'    : 'Maths 2',
    'science' : 'Science',
    'science1' : 'Science 1',
    'science2' : 'Science 2',
    'computer': 'Computer',
    'nepali'  : 'Nepali',
    'health'  : 'Health',
    'vocation'  : 'Vocation',
    'moral education'  : 'Moral',
    'math optional' : 'Opt. Maths',
    'english optional': 'Opt. English',
    'science optional' : 'Opt. Science',
    'social studies' : 'Social',
    'social studies1' : 'Social 1',
    'social studies2' : 'Social 2',
    'social studies3' : 'Social 3',
    'serofero' : 'Serofero',
    'environment' : 'Environment',
    'telugu' : 'Telugu',
    'biology' : 'Biology'
}
var nsubjectnames = {
    'english' : 'अंग्रेजी',
    'english' : 'अंग्रेजी',
    'english' : 'अंग्रेजी',
    'math'    : 'गणित',
    'science' : 'विज्ञान',
    'computer': 'कम्प्युटर विज्ञान',
    'nepali'  : 'नेपाली',
    'health'  : 'स्वास्थ्य',
    'vocation'  : 'प्राविधिक',
    'moral education'  : 'नैतिक',
    'english optional': 'Opt. English',
    'math optional' : 'ऐ. गणित',
    'science optional' : 'ऐ. विज्ञान',
    'social studies' : 'सामाजिक',
    'serofero' : 'सेरोफेरो'
}

// SORT the books to display in consistent subject order
function orderSubjects(a, b) {
    
        const sortOrder = {
            "english": 1,
            "english1": 1.1,
            "english2": 1.2,
            "english optional": 2,
            "telugu":3,
            "nepali": 4,
            "math": 5,
            "math1": 5.1,
            "math2": 5.2,
            "math optional": 6,
            "science": 7,
            "science1": 7.1,
            "science2": 7.2,
            "science optional": 8,
            "biology":9,
            "computer": 10,
            "social studies": 11,
            "social studies1": 11.1,
            "social studies2": 11.2,
            "social studies2": 11.3,
            "serofero": 12,
            "environment":13,
            "moral education": 14,
            "health": 15,
            "vocation": 16
        };
    
     if (a['subject'] == b['subject']) { return 0;}
        return (sortOrder[a['subject']] < sortOrder[b['subject']]) ? -1 : 1;
    };  // end orderSubjects()
    
function displaySubjects (className) {
    
    $.post("looma-database-utilities.php",
        {cmd: "textBookList",
            class: className},
        function(books) {
            
            books.sort(orderSubjects);
    
            books.forEach (function(book) {
                if ('fn' in book || 'nfn' in book) {
                    var tb_path = '../content/' + book['fp'];
                    var $newButton = $('<button type="button" class="subject" id="' + book["subject"] + '" data-prefix="' + book['prefix'] + '">');
    
                    var subjectname = subjectnames[book['subject']];
                    var nsubjectname = nsubjectnames[book['subject']];
 
 /*               // these <p> elements showing the subject name, are hidden by CSS for now
                    if (book['subject'] === 'english') {
                        $newButton.append($("<p>" + subjectname + "</p>"));
                    } else if (book['subject'] === 'nepali') {
                        $newButton.append($("<p>" + nsubjectname + "</p>"));
        
                    } else {
                        $newButton.append($("<p class='english-keyword'>" + subjectname + "<p class='xlat'>" + nsubjectname));
                        $newButton.append($("<p class='native-keyword'>" + nsubjectname + "<p class='xlat'>" + subjectname));
                    }
*/
                // show textbook covers, in correct language, on subject buttons
                        var coverNP = (book['nfn']) ?
                            tb_path + encodeURIComponent(book['nfn'].substr(0, book['nfn'].length - 4)) + '_thumb.jpg' :
                            tb_path + encodeURIComponent(book['fn'].substr(0, book['fn'].length - 4)) + '_thumb.jpg';
                        
                        var coverEN = (book['fn']) ?
                            tb_path + encodeURIComponent(book['fn'].substr(0, book['fn'].length - 4)) + '_thumb.jpg' :
                            tb_path + encodeURIComponent(book['nfn'].substr(0, book['nfn'].length - 4)) + '_thumb.jpg';
                    
                    $newButton.append($('<img class="english" id="imgEN'+subjectname+'" draggable="false" src="' + coverEN + '" />'));
                    $newButton.append($('<img class="native"  id="imgNP'+subjectname+'" draggable="false" src="' + coverNP + '" />'));
    
                    $('#subjects').append($newButton);
    
                  //  $('button.subject#'+book["subject"]+ 'img').hide();
                    
                    if (language === 'native') {
                        $('button.subject img.native').show();
                        $('button.subject img.english').hide();
                    }
                    else                       {
                        $('button.subject img.english').show();
                        $('button.subject img.native').hide();
                    }
                };
            });
            $("button.subject").click(subjectButtonClicked);
    
            //subjectName = LOOMA.readStore('subject', 'session');
            //activateSubject(subjectName);
        },
        'json'
    );
}  //end displaySubjects()

function activateClass(className) {
    // de-activate all CLASS buttons
    $('.class').removeClass('active');
    // activate button for this CLASS
    if ($('#' + className).is(':enabled')) $('#' + className).addClass('active');
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
    LOOMA.setStore('chapterScroll', 0, 'session');
    
    //send GET request to chapters.php with CLASS and SUBJECT values
    window.location = "chapters?class=" + encodeURIComponent(className) +
        "&grade=" + encodeURIComponent(className.replace('class','Grade ')) +
        "&subject=" + encodeURIComponent(subjectName) +
        "&prefix=" + encodeURIComponent(prefix);
};  //  end subjectButtonClicked()



$(document).ready (function() {
    
    $("button.class").click(classButtonClicked);
    $("button.subject").click(subjectButtonClicked);
    
  //  $('#translate').click(classButtonClicked);
    
    //set scroll position to top of page
    LOOMA.setStore('chapterScroll', 0, 'session');
    
    className = LOOMA.readStore('class', 'session');
    if (!className) {
        className = 'class1';
        LOOMA.setStore('class', className, 'session');  //set a COOKIE for CLASS (lifetime = this browser session)
    };
    
    activateClass (className);
    displaySubjects(className);
    
    toolbar_button_activate ("home");


}); //end of document.ready
