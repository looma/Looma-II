'use strict';
var classNum;
var randClass;

function displaySubjects(classNum) {
    $('.subject').hide();;
    $('.quiz').hide();;

    //classNum = className.substring(5);
    console.log("clicked class: " + classNum)
    $(".subject[data-class='" + classNum + "']").show();;
} //end displaySubjects()

function displayQuizzes(classNum, subjName) {
    $('.quiz').hide();
    // var quizId = className.substring(5);
    // console.log(subj)
    $(".quiz[data-class='" + classNum + "'][data-subj='" + subjName + "']").show();;
    //$('.quiz.class-'+classNum+'.'+subjName).show();
}  // end displayQuizes()

function activateClass(classNum) {
        // de-activate all CLASS buttons
        $('.class').removeClass('active');
        // activate button for this CLASS
    $(".class[data-class='" + classNum + "']").addClass('active');
} //end activateClass()

function activateSubject(subjectName) {
         // de-activate all SUBJECT buttons
        $('.subject').removeClass('active');
         //  active button for this SUBJECT
    
    //BUG: next statement doesnt work sometimes bercuz there are duplicate IDs - e.g. id="#subj-Science"
       // $('#' + subjectName).addClass('active');
    $(".subject[data-subj='" + subjectName + "']").addClass('active');

}  //end activateSubject

function activateQuiz(quiz) {
         // de-activate all SUBJECT buttons
        $('.quiz').removeClass('active');
         //  active button for this SUBJECT
        //$('#' + quizName).addClass('active');
        $(quiz).addClass('active');

} 

function classButtonClicked(){
    //called when a CLASS button is pressed
    //hides or shows the SUBJECT buttons based on data-mask attribute of "this" button
    var className = $(this).data('class');
    activateClass(className);              //activate this CLASS - highlights the button
    displaySubjects(className);            // display SUBJECT buttons for this CLASS
    activateSubject(null);     // de-activate all SUBJECTS
    //$("#random").removeClass('active');
    //$(".random-class").hide();
    //$(".random-subj").hide();

}; // end showSubjectButtons()

function subjectButtonClicked(){
    //called when a SUBJECT button is pressed
    var classNum = $(this).data('class');
    var subjectName = $(this).data('subj');
    activateSubject(subjectName);              //activate this SUBJECT - highlights the button
    displayQuizzes(classNum, subjectName);
    activateQuiz(null);

};  //  end subjectButtonClicked()
function quizButtonClicked() {
    activateQuiz(this);
    var quizId = $(this).data('id');
    var quizSubj = $(this).data('subj');
    var quizClass = $(this).data('class');
    
    window.location = "looma-gameNEW.php?id=" + quizId + "&subj=" + quizSubj + "&class=" + quizClass;
}

function matchingRandomClicked() {
    $("#random").addClass('active');
    $(".class").removeClass('active');
    $("button.subject").hide();
    $("button.quiz").hide();
    $(".random-class").show();
}
function matchingRandomClassClicked(){
    $('.random-class').removeClass('active');
    $('#' + this.id).addClass('active');
    randClass = this.id;
    $(".random-subj").show();
}
function matchingRandomSubjectClicked() {
    var selectedClass = randClass.substring(13);
    var selectedSubj = (this.id).substring(12);
    window.location = "looma-gameNEW.php?type=randMatching&class=" + selectedClass + "&subj=" + selectedSubj;
}
$(document).ready (function() {
    //add listeners to all CLASS buttons
    $("button.class").click(classButtonClicked);

    // //add listeners to all SUBJECT buttons
    $("button.subject").click(subjectButtonClicked);
    
    $("button.quiz").click(quizButtonClicked);

    //for random matching game
    $("#random").click(matchingRandomClicked);
    $(".random-class").click(matchingRandomClassClicked);
    $(".random-subj").click(matchingRandomSubjectClicked);

    // var classCookie = LOOMA.readStore('arith-grade', 'session');
    // if (classCookie) {
    //     activateClass (classCookie);
    //     displaySubjects(classCookie);
    //     var subjectCookie = LOOMA.readStore('arith-subject', 'session');
    //     if (subjectCookie) {
    //         activateSubject (subjectCookie);
    //     };
    // }
}); //end of document.ready anonymous function
