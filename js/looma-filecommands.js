/*
LOOMA javascript file
Filename: looma-filecommands.JS
Description:

Programmer name: skip
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: nov 2016
Revision: Looma 2.4
 */

'use strict';

/*define functions here */


// USAGE NOTES: to use looma-filecommands, include "includes/looma-filecommands.php" in your looma php
//      this will load the PHP, plus needed JS [this file] and CSS
//      the JS of the page using FILECOMMANDS must keep the values of currentname, currentfiletype and currentcollection updated
//      the JS of the page using FILECOMMANDS sets the "callbacks[]" array to custom functions to be used for:
//          clear: clear the currently open file
//          save:  save the data for the currently open file
//          savetemplate:
//          open:  open a new file
//          display: display the results of a file OPEN
//          modified: boolean function that indicates if changes have been made to the current file
//          checkpoint: record a checkpoint of the current contents [so that modified() will be FALSE until another change is made]
//          undocheckpoint: undo a checkpoint
//          showsearchitems:  hide/show the search elements appropriate for this context

var currentid;
var currentname;
var currentfiletype;
var currentcollection;

var cmd;

var callbacks = {
    clear:           doNothing,
    save:            doNothing,
    savetemplate:    doNothing,
    open:            doNothing,
    display:         doNothing,
    modified:        doNothing,
    checkpoint:      doNothing,
    showsearchitems: doNothing,
    undocheckpoint:  doNothing
};

function escapeHTML(text) {
  return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
};

function setname(newname) {
    currentname = newname;
    if (newname) $('.filename').text(newname); else $('.filename').text('<none>');
};

//checks for existing file with this name.
// if the file exists, execute yes(),
// if it doesnt exist, executes no()
function fileexists(name, collection, filetype, yes, no) {
         $.post("looma-database-utilities.php",
                {cmd: "exists", collection: collection, ft: filetype, dn: escapeHTML(name)},
                function(result) {
                    if (result['_id'] == "") no(name);  //file not found, execute NO() function
                    else                     yes(name); //file found, execute YES() function
                },
                'json'
              );
}; // end FILEEXISTS()

function savework(name, collection, filetype) {

        if (name == "") {
               LOOMA.prompt('Enter a file name to save current work: ',
                        function(savename) {callbacks['save'](savename);
                                            setname(savename);
                                            },
                        function(){   /* */  callbacks['undocheckpoint']();  return;},
                        false);
           }
         else LOOMA.confirm('Save current work in file: ' + name + '?',
                            function () {callbacks['save'](name);},
                            function () {   /* */  callbacks['undocheckpoint']();
                                         return;},
                            false);
 }; // end SAVEWORK()

function savefile(name, collection, filetype, data, activityFlag) {

         console.log('FILE COMMANDS: saving file (' + name + ') with data: ' + data);
         $.post("looma-database-utilities.php",
                {cmd: "save",
                 collection: collection,
                 dn: escapeHTML(name),
                 ft: filetype,
                 data: data,
                 activity:activityFlag}, //need to use escapeHtml() with POST??

                 function(response) {
                    callbacks['checkpoint']();
                    if (response['_id']) console.log("SAVE: upserted ID = ", response['_id']['$id']);
                 },
                 'json'
              );
}; //end SAVEFILE()

function renamefile(newname, oldname, collection, filetype)  {

         $.post("looma-database-utilities.php",
                {cmd: "rename", collection: collection,
                 dn: escapeHTML(oldname), ft: filetype,
                 newname: escapeHTML(newname)},
                function(response) {
                        console.log('response is ', response);
                        console.log("FILE COMMANDS - RENAMED ", oldname, ' to ', newname);
                    },
                'json'
              );};  // end RENAMEFILE()

function deletefile(deletename, collection, filetype)  {

         $.post("looma-database-utilities.php",
                {cmd: "delete", collection: collection,
                 dn: escapeHTML(deletename), ft: filetype},
                function(response) {
                        console.log('response is ', response);
                        console.log("DELETED ", deletename);
                    },
                'json'
              );};  // end DELETEFILE()

function openfile(openname, collection, filetype) {

        //OPEN from MONGO
        $.post("looma-database-utilities.php",
               {cmd: "open", collection: collection, dn: escapeHTML(openname), ft: filetype},
               function(response) {
                if (response['error'])
                    LOOMA.alert(response['error'] + ': ' + openname, 3, true);  //better if returned an error flag + err msg
                else {
                    console.log("OPEN (", filetype, "), from ",collection, ': ', response);

                    if (filetype.includes('-template')) setname('');
                    else setname(openname);

                    currentid = response['_id'];
                    callbacks['display'](response);   //need to return the full 'response' from the db
                    //$('#cancel-result').on('click', closesearch);
                    callbacks['checkpoint']();
                    }
               },
              'json'
            );
};  // end OPENFILE()

function doNothing(){return;};  //not actually called


$(document).ready(function ()
    {

  /* file commands NEW OPEN SAVE SAVEAS OPENTEMPLATE SAVETEMPLATE DELETE QUIT*/

  /*   NEW    */

     $('#new').click(function()      {
               console.log("FILE COMMANDS: clicked new");
               if (callbacks['modified']())
                   savework(currentname, currentcollection, currentfiletype);
              // else {
                   callbacks['clear']();
              // };
           });


  /*   OPEN    */
       $('#open').click(function()     {
           console.log("FILE COMMANDS: clicked open");
               if (callbacks['modified']())
                   savework(currentname, currentcollection, currentfiletype);
               else {

                    opensearch();

                    //NOTE: can't attach click handler to 'results' which dont exist yet
                    //      so add the ON handler to the DIV which will contain the result elements
                    $('#search-results').on('click',
                                            'button',
                                            function(){
                                                console.log ('FILE COMMANDS: clicked on SEARCH result');

                                                //event.preventDefault();

                                                closesearch();
                                                if ($(this).attr('id') !== 'cancel-results') //if file not found, dont call OPEN()
                                                    openfile($(this).prop('title'), currentcollection, currentfiletype);
                                            }
                    );

                    $('#cancel-search').on('click',
                                           function() {
                                                console.log ('FILE COMMANDS: canceled out of SEARCH');
                                                closesearch();
                                           }
                                       );

                };
       });

  /*   SAVE    */
       $('#save').click(function()     {
           console.log("FILE COMMANDS: clicked save");
           if (currentname == "") { //first save
               LOOMA.prompt('Enter a file name: ',
                        function(savename) { fileexists(savename,
                                             currentcollection,
                                             currentfiletype,
                                             function(savename) {LOOMA.alert('File already exists: ' + savename);},
                                             function(savename) {
                                                callbacks['save'](savename);
                                                setname(savename); }
                                            );},
                        function(){return;},
                        false);
           }


           else if (callbacks['modified']()) callbacks['save'](currentname);

       });

   /*   SAVE AS    */
      $('#saveas').click(function()   {
           console.log("FILE COMMANDS: clicked save as");
           LOOMA.prompt('Enter a file name: ',
                    function(savename) { fileexists(savename,
                                        currentcollection,
                                        currentfiletype,
                                        function(savename) {LOOMA.alert('File already exists: ' + savename);},
                                        function(savename) {
                                            callbacks['save'](savename);
                                            setname(savename); }
                                        );},
                    function(){return;},
                    false);
       });

   /*   RENAME    */
      $('#rename').click(function()   {
           console.log("FILE COMMANDS: clicked rename");
           LOOMA.prompt('Enter a file name: ',
                    function(newname) { fileexists(newname,
                                        currentcollection,
                                         currentfiletype,
                                         function(savename) {LOOMA.alert('File already exists: ' + savename);},
                                         function(newname) {
                                            renamefile(newname, currentname, currentcollection, currentfiletype);
                                            setname(newname); }
                                        );},
                    function(){return;},
                    false);
       });

    /*   DELETE    */
     $('#delete').click(function()
         {
           console.log("FILE COMMANDS: clicked delete");
           LOOMA.prompt('Enter a file name: ',
                    function(deletename) { fileexists(deletename,
                                           currentcollection,
                                           currentfiletype,
                                           function(deletename) { deletefile(deletename, currentcollection, currentfiletype);
                                                                if (currentname == deletename) callbacks['clear']();},
                                           function(deletename) {
                                             LOOMA.alert('File not found: ' + deletename); }
                                        );},
                    function(){return;},
                    false);
         });



   /*   TEMPLATE OPERATIONS    */
   /*   OPEN TEMPLATE    */

        $('#opentemplate').click(function()     {
           console.log("FILE COMMANDS: clicked open template");
               if (callbacks['modified']())
                   savework(currentname, currentcollection, currentfiletype);
               else {
                    opensearch();
                    // for TEMPLATE EDIT, only show "text template", clicked and disabled
                    $('#template-chk').show();
                    $('#template-chk input').attr('checked', true).css('opacity', 0.5);
                    $('#template-chk input').click(function() {return false;});

                    //NOTE: can't attach click handler to 'results' which dont exist yet
                    //      so add the ON handler to the DIV which will contain the result elements
                    $('#search-results').on('click',
                                            'button',
                                            function(event){
                                                console.log ('clicked on SEARCH result');

                                                //event.preventDefault();

                                                closesearch();
                                                if ($(this).attr('id') !== 'cancel-results') //if file not found, dont call OPEN()
                                                    openfile($(this).prop('title'), currentcollection, currentfiletype + '-template');
                                            }

                    );

                    $('#cancel-search').on('click',
                                            function() {
                                                console.log ('canceled out of SEARCH');
                                                closesearch();
                                           });
                };
       }); //end OPEN TEMPLATE


   /*   SAVE TEMPLATE    */
      $('#savetemplate').click(function() {
           console.log("FILE COMMANDS: clicked save template");
           // save with type = 'text-template'
           LOOMA.prompt('Enter a template name: ',
                        function(savename) { fileexists(savename,
                                             currentcollection,
                                             'text-template',
                                             function(savename) {LOOMA.alert('Template already exists: ' + savename);},
                                             function(savename) {
                                                 callbacks['savetemplate'](savename);
                                                //save(savename, currentcollection, currentfiletype + '-template', $editor.html());
                                                }
                                            );},
                        function(){return;},
                        false);
       });



   /*   DELETE TEMPLATE    */
      $('#deletetemplate').click(function() {
           console.log("FILE COMMANDS: clicked delete template");
           LOOMA.prompt('Enter a template name: ',
                    function(deletename) { fileexists(deletename,
                                         currentcollection,
                                         "text-template",
                                         function(deletename) { deletefile(deletename, currentcollection, currentfiletype + '-template'); },
                                         function(deletename) {
                                             LOOMA.alert('Template not found: ' + deletename); }
                                        );},
                    function(){return;},
                    false);
                });



    /*   QUIT    */
     $('#quit').click(function()
         {
           console.log("FILE COMMANDS: clicked quit");
           if (callbacks['modified']()) savework(currentname, currentcollection, currentfiletype);
           else window.history.back();  //race condition? savework() AJAX may not run??
         });


    /*   UNLOAD window    */

   //turn off('click') for looma toolbar BACK arrow
     //$('.back-button').off('click');
     $(".back-button").removeAttr("onclick"); //special code to remove "onclick" from toolbar back button


     $('.back-button').on('click', function()
         {
           console.log("FILE COMMANDS: toolbar BACK ARROW clicked");
           if (callbacks['modified']()) savework(currentname, currentcollection, currentfiletype);
           else window.history.back();
         });
    });