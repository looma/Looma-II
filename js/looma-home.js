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

var subjectnames = {
    'english' : 'English',
    'math'    : 'Maths',
    'science' : 'Science',
    'computer': 'Computer',
    'nepali'  : 'Nepali',
    'health'  : 'Health',
    'vocation'  : 'Vocation',
    'moral education'  : 'Moral',
    'math optional' : 'Opt. Maths',
    'english optional': 'Opt. English',
    'science optional' : 'Opt. Science',
    'social studies' : 'Social',
    'serofero' : 'Serofero',
    'environment' : 'Environment',
    'telugu' : 'Telugu',
    'biology' : 'Biology'
}
var nsubjectnames = {
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

/*
Full title English	Full title Nepali	Short title English	Short title Nepali
Mathematics	गणित	Math	गणित
Science	विज्ञान	Science	विज्ञान
English	अंग्रेजी	English	अंग्रेजी
Nepali	नेपाली	Nepali	नेपाली
Social Studies	सामाजिक शिक्षा	Social	सामाजिक
Vocational Education	प्राविधिक शिक्षा	Vocation	प्राविधिक
Health	स्वास्थ्य	Health	स्वास्थ्य
Moral Education	नैतिक शिक्षा	Moral	नैतिक
Optional Mathematics	ऐच्छिक गणित	Opt. Math	ऐ. गणित
Optional Science	ऐच्छिक विज्ञान	Opt. Sci.	ऐ. विज्ञान
 */

// SORT the books to display in consistent subject order
function orderSubjects(a, b) {
    
        const sortOrder = {
            "english": 1,
            "english optional": 2,
            "telugu":3,
            "nepali": 4,
            "math": 5,
            "math optional": 6,
            "science": 7,
            "science optional": 8,
            "biology":9,
            "computer": 10,
            "social studies": 11,
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
    
                    //  *********  special temporary code for CEHRD  *************
                    //
    
                    // if(LOOMA.readStore('theme', 'cookie') === 'CEHRD' && subjectname === 'Science') {
                    //   subjectname = 'Serofero';
                    //   nsubjectname = 'सेरोफेरो';
                    //};
                    //  ******** end special CEHRD code
    
                    if (book['subject'] === 'english') {
                        $newButton.append($("<p>" + subjectname + "</p>"));
                    } else if (book['subject'] === 'nepali') {
                        $newButton.append($("<p>" + nsubjectname + "</p>"));
        
                    } else {
                        $newButton.append($("<p class='english-keyword'>" + subjectname + "<p class='xlat'>" + nsubjectname + "</p></p>"));
                        $newButton.append($("<p class='native-keyword'>" + nsubjectname + "<p class='xlat'>" + subjectname + "</p></p>"));
                    }
                    //$newButton.append($('<p>' + book["dn"] +'</p>'));
    
                    var imgEn = (book['fn']) ?
                        tb_path + encodeURIComponent(book['fn'].substr(0, book['fn'].length - 4)) + '_thumb.jpg' :
                        'images/book_gray.png';
    
                    var imgNp = (book['nfn']) ?
                        tb_path + encodeURIComponent(book['nfn'].substr(0, book['nfn'].length - 4)) + '_thumb.jpg' :
                        'images/book_gray.png';
    
                    $newButton.append($('<img draggable="false" src="' + imgEn + '" />'));
                    $newButton.append($('<img draggable="false" src="' + imgNp + '" />'));
    
                    //  *********  special temporary code for CEHRD  *************
                    //
                    // if(LOOMA.readStore('theme', 'cookie') !== 'CEHRD' || subjectname !== 'Social')
                    $('#subjects').append($newButton);
                    //  ******** end special CEHRD code
                }
            });
            $("button.subject").click(subjectButtonClicked);
    
            subjectName = LOOMA.readStore('subject', 'session');
            activateSubject(subjectName);
    
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
