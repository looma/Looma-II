/*
LOOMA javascript file
Filename: looma-edit-keywords.js

Programmer name: Skip
Date: AUG 2021
Revision:
 */

/**************
 Future features:
    Add DELETE keywood option - only leaf nodes
    Add RENAME keyword option
 **************/

'use strict';

var loginname, loginlevel, loginteam;
var level, newkeyword, key1, key2, key3, key4;

function nullFunction(){return;};

function showKeywordInput (event) {
    var next = {'key1':'key2',
                'key2':'key3',
                'key3':'key4',
                'key4': null};
    
    // clear and hide new keyword inputs
    // show only the current level's new keyword input
    // set  level, newkeyword, key1, key2, key3, key4
    
    level = event.target.name;
    $('.key-change').prop('disabled', true).removeClass('enabled').addClass('disabled');
    
    if (event.target.selectedIndex === 0)
         $('#' +  level      + '-change').prop('disabled', false).removeClass('disabled').addClass('enabled');
    else $('#' + next[level] + '-change').prop('disabled', false).removeClass('disabled').addClass('enabled');
    
} // end showKeywordInput

function submitChange (event) {  //check the form entries and submit to backend

    event.preventDefault();
    
    //validate input
    // rule 1: only add leaf nodes (enforced by hiding INPUTS for other levels)
    // rule 2: there is no existing key with same name

   var newkey = $('input.key-change.enabled').val();
   var level =  $('input.key-change.enabled').data('key');
   
   var existing = $.map($('#' + level + '-changes-menu option'),
       function (e) {return $(e).val().toLowerCase();});
   
   if (existing.indexOf(newkey.toLowerCase()) !== -1)
        LOOMA.alert('cannot use existing key name', 10);
    // get user confirmation and submit changes
   else LOOMA.confirm('Add key ' + newkey + ' to ' + key1 + '/' + key2 + '/' + key3 + '/',
                  function() {changeKeyword(level, newkey, key1, key2, key3);},
                  nullFunction);
   
}  //  end submitChanges()

function changeKeyword(level, newkey, key1, key2, key3) {
    // POST cmd=keywordAdd
    $.post("looma-database-utilities.php",
        {cmd: "keywordAdd",
         level:level,
         key1:key1,
         key2:key2,
         key3:key3,
         newkeyword:newkey},
         function(newkeyresult) {
            console.log(newkeyresult);
            LOOMA.alert('Added ' + newkey + ' at level ' + level,7,true, function(){$('#new-keyword-clear').click();});
         },
         'json'
    );
}; // end changeKeyword()

function clearSettings() {  // clears all the settings. used after a new SEARCH
    $('#keyword-clear').click();
    $('#new-keyword-clear').click();
} // end clearSettings()

/////////////////////////////////
//////////// ONLOAD /////////////
$(document).ready(function() {
    level = newkeyword = key1 = key2 = key3 = key4 = '';
    
    loginname = LOOMA.loggedIn();
    
    $(".keyword-changes").change(showKeywordDropdown);
    $(".keyword-changes").change(showKeywordInput);
    
    $('#new-keyword-clear').click(       function(e) {
        e.preventDefault();
        $('.key-change').val("");
        level = newkeyword = key1 = key2 = key3 = key4 = '';
    });
    
    $('#submit-changes').click( submitChange );

});
