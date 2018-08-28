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

var className, subjectName, gradeName;

/* used when degbugging
 function playActivity(event) {
    var button = event.target;
    LOOMA.playMedia(button);
};  */

    /*
        <button type="button" class="subject  img" id="social studies" >
        <?php keyword('Social Studies') ?>    <br>
        <img class="en-tb" >  <img class="np-tb" ><br>
        </button>
    */

function displaySubjects (className) {
    
    $.post("looma-database-utilities.php",
        {cmd: "bookList",
            class: className},
        function(books) {
            books.forEach (function(book) {
                var tb_path = '../content/' + book['fp'] + '/';
                var $newButton =  $('<button type="button" class="subject" id="' + book["subject"] + '">');
                 $newButton.append($('<p>' + book["dn"] +'</p>'));

                var imgEn = (book['fn']) ?
                                tb_path + book['fn'].substr(0,book['fn'].length-4) + '_thumb.jpg' :
                                'images/book_gray.png';
    
                var imgNp = (book['nfn']) ?
                               tb_path + book['nfn'].substr(0,book['nfn'].length-4) + '_thumb.jpg' :
                               'images/book_gray.png';
               
                $newButton.append($('<img src="' + imgEn+ '" />' ));
                $newButton.append($('<img src="' + imgNp+ '" />' ));
                $('#subjects').append($newButton);
            });
            $("button.subject").click(subjectButtonClicked);
    
            subjectName = LOOMA.readStore('subject', 'session');
            //if (subjectName) { activateSubject (subjectName); };
            activateSubject(subjectName);
        },
        'json'
    );
}  //end displaySubjects()

/*
function displaySubjectsOLD(className) {
    var subject_names = ['Nepali', 'English', 'Math', 'Science', 'SocialStudies'];
    var tb_path = '../content/textbooks/' + LOOMA.capitalize(className) + '/';
    var classNumber = className.substr(className.length - 1); // get last character of CLASSNAME = class number
    var mask = $('#' + className).attr('data-mask');  //MASK is bitstring w/2 bits per class - '1' for text exists, '0' for no text,
    //for every BUTTON of class SUBJECT, set the SRC attr of the children of type IMG to textbook thumbnail
    $('.subject').show().each( function (i,button)
        {
            $(button).children('img').each( function (j, image)
                {
                    if (j == 0)       //left-hand IMG is for english language textbook thumbnail. set SRC and VISIBILITY
                    {    if (mask[2 * i + j] == 1)
                        $(image).attr('src', tb_path + subject_names[i] + '/' + subject_names[i] + '-' + classNumber + '_thumb.jpg').show();
                    else $(image).attr('src', '../Looma/images/book.png').attr('style', 'opacity:0.3;').show();
                    }
                    else if (j==1)      //right-hand IMG is for native language textbook thumbnail
                    {    if (mask[2 * i + j] == 1)
                        $(image).attr('src', tb_path + subject_names[i] + '/' + subject_names[i] + '-' + classNumber + '-Nepali_thumb.jpg').show();
                    else $(image).attr('src', '../Looma/images/book.png').attr('style', 'opacity:0.3;').show();
                    }
                }  //end EACH(j) function
            );
        }  //end EACH(i) function
    );
    

    //OLD code to read mongo to see which SUBJECT buttons to make visible:
    // var subjects = db.textbooks.find({'class': classButton});
    // var subjectButtons = document.getElementsByClassName("subject");
    // for (var i=0; i < COUNT(subjectsButtons); i++ {
    //        if (subjects.indexOf(subjectButton[i].getAttribute('subject')) != 0 )
    //            {subjectButton[i].setAttribute('class', 'active');}
    //        else {subjectButton[i].deleteAttribute('class', 'active');}}
    
}; //end displaySubjects()
*/
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
    
    if (subjectName) {
        //NOTE: getElementById below is used to get around problems with "id='social studies'" (the ID has a space)
        //       which causes "$('#' + subjectName) to fail when id='social studies'"
        var btn = document.getElementById(subjectName);
        $(btn).addClass('active');
    };
};  //end activateSubject

function classButtonClicked(){
    //called when a CLASS button is pressed
    className = this.getAttribute('id');
    gradeName = this.getAttribute('data-name');
    
    activateClass(className);              //activate this CLASS - highlights the button
    LOOMA.setStore("class", className, 'session');  //set a COOKIE for CLASS (lifetime = this browser session)
    
    $('#subjects').empty();
    displaySubjects(className);              // display SUBJECT buttons for this CLASS
    activateSubject(null);                  // de-activate all SUBJECTS
    
}; // end classButtonClicked()

function subjectButtonClicked(){
    //called when a SUBJECT button is pressed
    subjectName = this.getAttribute('id');
    LOOMA.setStore("subject", subjectName, 'session');  //set a COOKIE for SUBJECT (lifetime = this browser session)
    //send GET request to chapters.php with CLASS and SUBJECT values
    
    //set scroll position to top of page
    LOOMA.setStore('libraryScroll', 0), 'session';
    
    window.location = "looma-chapters.php?class=" + encodeURIComponent(className) +
        "&grade=" + encodeURIComponent(className.replace('class','Grade ')) +
        "&subject=" + encodeURIComponent(subjectName);
};  //  end subjectButtonClicked()



$(document).ready (function() {
    
    $("button.class").click(classButtonClicked);
    $("button.subject").click(subjectButtonClicked);
    
    //set scroll position to top of page
    LOOMA.setStore('libraryScroll', 0, 'session');
    
    className = LOOMA.readStore('class', 'session');
    if (!className) {
        className = 'class1';
        LOOMA.setStore('class', className, 'session');  //set a COOKIE for CLASS (lifetime = this browser session)
    };
    
    activateClass (className);
    displaySubjects(className);

    


}); //end of document.ready
