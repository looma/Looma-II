/*
  LOOMA javascript file
  Filename: looma-text-translator.JS
  Description:

  NOTE: This JS is for looma-text-translator.php - the  looma page for translating text files to native language

  
  Programmer name: skip
  Owner: VillageTech Solutions (villagetechsolutions.org)
  Date: jul 2019
  Revision: Looma 5.2
   */

'use strict';

/*define functions here */

var $title;
var $english;
var $editor; //the DIV where the HTML is being edited
var savedHTML; //savedHTML is textcheckpoint of HTML for checking for modification
var loginname, loginlevel;
/*  callback functions and assignments expected by looma-filecommands.js:  */
callbacks['clear'] = textclear;
callbacks['save'] = textsave;
//callbacks ['open']  = textopen;
callbacks['display'] = textdisplay;
callbacks['modified'] = textmodified;
callbacks['showsearchitems'] = textshowsearchitems;
callbacks['checkpoint'] = textcheckpoint;
callbacks['undocheckpoint'] = textundocheckpoint;
//callbacks ['quit'] not overridden - use default action from filecommands.js

currentname = "";
currentcollection = 'text';
currentfiletype = 'text';

$('#collection').val('text');
$('#filesearch-ft').val('text');


/*
 function quit() {
     if (callbacks['modified']())
         savework(currentname, currentcollection, currentfiletype);
     else
         window.history.back();
 }
 */

function textcheckpoint() {         savedHTML =   $editor.html(); }
function textundocheckpoint() {     $editor.html( savedHTML);     }  //not used now??
function textmodified()   { return (savedHTML !== $editor.html());}


function textclear() {
    setname("");
    //currentid = "";
    $english.html("");
    $editor.html("");
    $('#preview').empty().hide();
    textcheckpoint();
    $editor.focus();
}

function textdisplay(response) {
    textclear();
    setname(response['dn']);
    $english.html(response.data);
    $editor.html( response.nepali);
}

function textsave(name) {
    //$editor.cleanHtml(); wysiwyg.js has no "cleanHTML" function. NOTE: we should probably write our own
    if (owner || loginlevel === 'translator'|| loginlevel === 'admin' || loginlevel === 'exec')
    saveTextTranslation(name, $editor.html());
    
} //end textsave()

function textshowsearchitems() {
    $('#txt-chk').show();
    // for TEXT EDIT, only show "text", clicked and disabled
    $('#txt-chk input').attr('checked', true).css('opacity', 0.5);
    //$('#txt-chk input').prop('readonly'); //cant make 'readonly' work
    $('#txt-chk input').click(function() {
        return false;
    });
}


function openPreview (button) {
    $.post("looma-database-utilities.php",
        
        {cmd: "openByID", collection: currentcollection, id:$(button).data('id'), ft: 'text'},
        function(response) {
            $('#preview').html(response['data']).show();
        },
        'json'
    );
}

$(document).ready(function() {
    
    $('#preview').hide();   // hide the preview window
    
    //show #preview area when hover over a filesearch-results button  [NOT WORKING YET]
    $('#filesearch-results').on('mouseover', 'button', function(){openPreview(this)});
    $('#filesearch-results').on('mouseout blur',  'button', function(){$('#preview').empty().hide();});
    
    $('#dismiss').off('click').click( function() { quit();});  //disable default DISMISS btn function and substitute QUIT()
    
    $title = $('#title'); //the DIV where the original (english) version is shown
    $english = $('#english'); //the DIV where the original (english) version is shown
    $editor = $('#editor'); //the DIV where the native (nepali) version is being edited
    $editor.wysiwyg();
    document.execCommand('styleWithCSS', false, true);
    document.execCommand('fontSize',     false, 5);
    document.execCommand('justifyCenter',false, true);
    
    textclear();
    document.execCommand('bold',         false, true); //has to be AFTER the TESTCLEAR() call
    document.execCommand('foreColor',    false, '#091F48');
    $editor.focus();
    
    loginname = LOOMA.loggedIn();
    loginlevel = LOOMA.readStore('login-level','cookie');
    
    //if (loginname && loginlevel === 'admin') $('.admin').show();
    
    
    //$('#main-container').disable();
    //LOOMA.makeTransparent($('#main-container'));
    
    // disable some file commands
    $('#new, #saveas, #rename, #delete, #opentemplate').prop('disabled', true).css('color', 'lightgray');
    
    $('#filecommands').trigger('click');
    
    if ($('#text_file_name').attr('data-dn')) openfile( decodeURIComponent($('#text_file_name').attr('data-dn')),'text_files', 'text');
});
