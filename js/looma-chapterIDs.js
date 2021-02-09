/*
LOOMA javascript file
Filename: looma-chapterIDs.js

Programmer name: Skip
Owner: VillageTech Solutions (villagetechsolutions.org)
Revision: Looma 3.0
 */

'use strict';


$(document).ready(function() {
    
    loginname = LOOMA.loggedIn();
  
    // text books
    $("#grade-chng-menu").change(function() {
        showTextSubjectDropdown($('#grade-chng-menu'),
            $('#subject-chng-menu'),
            $('#chapter-chng-menu'),
            $("input:radio[name='lang']:checked").val());
    });  //end drop-menu.change()
    
    $("#subject-chng-menu").change(function() {
        showTextChapterDropdown($('#grade-chng-menu'),
            $('#subject-chng-menu'),
            $('#chapter-chng-menu'),
            $("input:radio[name='lang']:checked").val());
    });  //end drop-menu.change()
    
    $("input[type=radio][name='lang']").change(function() {
        $('#grade-chng-menu').prop('selectedIndex', 0); // reset grade select field
        $('#subject-chng-menu').empty(); $('#chapter-chng-menu').empty();
    });
    
    
 // change the following code to lookup the query in mongo
    $('#ch_id').change(function() {
      //  if (this.value.match(LOOMA.CH_IDregex)) $('#legal').text('legal'); else $('#legal').text('NOT legal');return false;
    
        $ajaxRequest = $.post("looma-database-utilities.php",
            {cmd:'chapterExists',collection:'chapters',_id:this.value},
            function (result) {
                if (result['_id'] === "") $('#legal').text('NOT legal')
                else                     $('#legal').text('legal');
    
            },
            'json');
        
    })
});
