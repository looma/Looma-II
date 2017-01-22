  /*
LOOMA javascript file
Filename: looma-text-editor.JS
Description:

Programmer name: skip
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: nov 2016
Revision: Looma 2.4
 */

'use strict';

/*define functions here */

var id;
var name;
var cmd;
var collection = 'text';
var $editor;  //the DIV where the HTML is being edited
var savedHTML;   //savedHTML is checkpoint of HTML for checking for modification
var loginname;


function checkpoint() {         savedHTML =   $editor.html(); };
function undocheckpoint() {     $editor.html( savedHTML);     };  //not used now??
function modified()   { return (savedHTML !== $editor.html());};

function cleartext() {
       setname("");
       id="";
       $editor.html("");
       savedHTML = "";
       checkpoint();
       $editor.focus();
};


function savework() {

        if (name == "") {
               LOOMA.prompt('Enter a file name to save current work: ',
                        function(savename) {save(savename, 'text', $editor.html());
                                            setname(savename);
                                            },
                        function(){   /* */  undocheckpoint();  return;},
                        false);
           }
         else LOOMA.confirm('Save current work in file: ' + name + '?',
                            function () {save(name, 'text', $editor.html());},
                            function () {    /* */  undocheckpoint();  return;},  //may want to saveHTML or clear $editor.html() here
                            false);
 }; // end SAVEWORK()



$(document).ready(function ()
    {

        $('#editor').wysiwyg();
        $editor = $('#editor');  //the DIV where the HTML is being edited
        cleartext();

        loginname = LOOMA.loggedIn();
        if (loginname && (loginname == 'kathy' || loginname == 'david' || loginname== 'skip')) $('.admin').show();
});
