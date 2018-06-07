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

// USAGE NOTES: to use looma-filecommands, include "includes/looma-filecommands.php" in your looma php
//      this will load the PHP, plus needed JS [this file] and CSS [css/looma-filecommands.css]
//
//      the JS of the page using FILECOMMANDS must keep the values of currentname, currentfiletype and currentcollection updated
//
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
//
//
var currentname;       //set by calling program - name of file being edited
var currentfiletype;   //set by calling program - to 'text', 'lesson', etc
var currentcollection; //set by calling program - to 'lessons', 'slideshows', etc

var owner;             //TRUE if current logged in user is the author of the currrent file
var template = false;  //if TRUE the file currently being edited is a template; else FALSE

var cmd;

var callbacks = {      //re-set by calling program - to custom handler for each function
    clear:           doNothing,
    save:            doNothing,
    savetemplate:    doNothing,
    open:            doNothing,
    display:         doNothing,     // function to display a file OPEN file process
    modified:        doNothing,
    checkpoint:      doNothing,
    showsearchitems: doNothing,     // function to hide or show OPEN search form items
    //undocheckpoint:  doNothing,
    quit:            quit           // default QUIT action is save work and the editor page. override in page's JS if needed
};

function doNothing(){return;};  //not actually called

function escapeHTML(text) {
  return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
};

///////////////////////////////
//////    setname         /////
///////////////////////////////
function setname(newname) {
    currentname = newname;
    if (newname) $('.filename').text(newname); else $('.filename').text('<none>');
    if (template) $('.filename').append($('<span> (template) </span>'));
};


///////////////////////////////
//////   fileexists       /////
///////////////////////////////
//checks for existing file with this name.
// if the file exists, execute yes(),
// if it doesnt exist, executes no()
function fileexists(name, collection, filetype, yes, no) {  //filetype must be given as 'text' or 'text-template'
     //var ft = (template) ? filetype + '-template' : filetype;
     $.post("looma-database-utilities.php",
            {cmd: "exists", collection: collection, ft: filetype, dn: escapeHTML(name)},
            function(result) {
                if (result['_id'] == "") no(name);  //file not found, execute NO() function
                else                     yes(name, result['author']); //file found, execute YES() function
            },
            'json'
          );
}; // end FILEEXISTS()

///////////////////////////////
//////  SAVEWORK          /////
///////////////////////////////
function savework(name, collection, filetype) {  // filetype is base type (not type-template)

    if (name == "") {
           LOOMA.prompt('Enter a file name to save current work: ',
                function(savename) {if (template) callbacks['savetemplate'](savename);
                                    else          callbacks['save'](savename);
                                    setname(savename);
                                    },
                function(){
                    //callbacks['clear']();
                    callbacks['checkpoint']();
                  return;},
                false);
       }
     else if (owner) LOOMA.confirm('Save current work in file: ' + name + '?',
                function () {if (template) callbacks['savetemplate'](name);
                             else          callbacks['save'](name);
                             },
                function () {
                    callbacks['checkpoint']();
                    return;},
                false);
     else {  //NOT owner
    LOOMA.alert('You are not the owner of this file. Use SAVE-AS to make a copy you own', 5, true);
    callbacks['checkpoint']();
        }
 }; // end SAVEWORK()

///////////////////////////////
//////   SAVEFILE         /////
///////////////////////////////
function savefile(name, collection, filetype, data, activityFlag) {  //filetype must be given as (e.g.) 'text' or 'text-template'

         console.log('FILE COMMANDS: saving file (' + name + ') with ft: ' + filetype + 'and with data: ' + data);
         $.post("looma-database-utilities.php",
                {cmd: "save",
                 collection: collection,
                 dn: escapeHTML(name),
                 ft: filetype,
                 data: data,
                 activity:activityFlag}, // NOTE: this is a STRING, either "false" or "true"

                 function(response) {
                    callbacks['checkpoint']();
                    if (response['_id']) {
                       console.log("SAVE: upserted ID = ", response['_id']['$id']);
                    }
                    else {
                      console.log("SAVE: didn't work?");
                    }
                 },
                 'json'
              );
}; //end SAVEFILE()

///////////////////////////////
//////     RENAMEFILE    /////
///////////////////////////////
function renamefile(newname, oldname, collection, filetype)  {  //only used for base files, not templates (for now)

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

///////////////////////////////
//////   DELETEFILE       /////
///////////////////////////////
function deletefile(deletename, collection, filetype)  { //filetype must be given as 'text' or 'text-template'

     $.post("looma-database-utilities.php",
            {cmd: "delete", collection: collection,
             dn: escapeHTML(deletename), ft: filetype},
            function(response) {
                    console.log('response is ', response);
                    console.log("DELETED ", deletename);
                },
            'json'
          );};  // end DELETEFILE()

///////////////////////////////
//////     OPENFILE       /////
///////////////////////////////
function openfile(openname, collection, filetype) { //filetype must be given as 'text' or 'text-template'

        //OPEN from MONGO
        $.post("looma-database-utilities.php",
               {cmd: "open", collection: collection, dn: escapeHTML(openname), ft: filetype},
               function(response) {
                if (response['error'])
                    LOOMA.alert(response['error'] + ': ' + openname, 3, true);  //better if returned an error flag + err msg
                else {
                    console.log("OPEN (ft: ", filetype, "), from ", collection, ' collection. response: ', response);

                   // if (filetype.includes('-template')) setname('');
                   // else
                    setname(openname);

                    //currentid = response['_id'];
                    //currentauthor = response['author'];
                    if ('author' in response)
                        owner = (response['author'] == LOOMA.loggedIn()  || LOOMA.loggedIn() == 'skip');
                    else owner = false;

                    callbacks['display'](response);   //need to return the full 'response' from the db
                    //$('#cancel-result').on('click', closesearch);

                    // let calling programs checkpoint after OPEN, in case results are async
                    //callbacks['checkpoint']();
                    }
               },
              'json'
        );
};  // end OPENFILE()

///////////////////////////////
//////        QUIT        /////
///////////////////////////////
function  quit() {
    if (callbacks['modified']()) savework(currentname, currentcollection, currentfiletype);
    else window.history.back();  //race condition? savework() AJAX may not run??
};

///////////////////////////////
//////   opensearch       /////
///////////////////////////////
//open a file browse/search panel
function opensearch() {
    //make the main page transparent
    LOOMA.makeTransparent($('#main-container'));
    LOOMA.makeTransparent($('#commands'));
    $('#cmd-btn').prop('disabled', true);
    // show SEARCH panel
    $('#filesearch-panel').show();
    $('#filesearch-bar input').focus();
    $('#cancel-search').show();
    
    callbacks['showsearchitems']();
}; //end opensearch()

///////////////////////////////
//////     closesearch     /////
///////////////////////////////
//close the file search panel
function closesearch() {
    $('#filesearch-panel').hide();
    $('#filesearch-results').hide();
    $('#filesearch-results').off('click', 'button');  //remove ON CLICK handler for #search-results button
    $('#main-container').removeClass('all-transparent');
    $('#commands'                 ).removeClass('all-transparent');
    $('#cmd-btn').prop('disabled', false);

    $('#filesearch-bar input').val('');
};  //end closesearch()

///////////////////////////////
//////  isFilesearchSet     /////
///////////////////////////////

function isFilesearchSet() {
    var set = false;
    
    if ($('#collection').val() == 'activities') {
        if ($('#filesearch-term').val()) set = true;
        $("#filesearch-type .flt-chkbx").each( function() {
            if (this.checked) set = true;
            }
        );
    } else set=true;
    
    return set;
};  //  end isFilesearchSet()

$(document).ready(function ()
    {

  /* file commands NEW OPEN SAVE SAVEAS OPENTEMPLATE SAVETEMPLATE DELETE QUIT*/

///////////////////////////////
//////   /*   NEW    */      //
///////////////////////////////
    
     $('#new').click(function()      {
               console.log("FILE COMMANDS: clicked new");
               if (callbacks['modified']())
                   savework(currentname, currentcollection, currentfiletype);
               else { //NOTE: cant call 'clear()' immediately because the savework() call uses asynch code [e.g. LOOMA.confirm()]
                   callbacks['clear']();
                   template = false;
                   owner = true;
               };
           });
    
///////////////////////////////
//////    /*   OPEN    */   /////
///////////////////////////////
    
       $('#open').click(function()     {
           console.log("FILE COMMANDS: clicked open");
               if (callbacks['modified']())
                   savework(currentname, currentcollection, currentfiletype);
               else {

                   opensearch();

                    //NOTE: can't attach click handler to 'results' which dont exist yet
                    //      so add the ON handler to the DIV which will contain the result elements
                    $('#filesearch-results').on('click',
                                            'button',
                                            function(){
                                                console.log ('FILE COMMANDS: clicked on SEARCH result');

                                                //event.preventDefault();

                                                closesearch();
                                                if ($(this).attr('class') !== 'cancel-results') //if file not found, dont call OPEN()
                                                    {openfile($(this).prop('title'), currentcollection, currentfiletype);
                                                     template = false;
                                                 }
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

///////////////////////////////
//////   /*   SAVE    */   /////
///////////////////////////////
  
       $('#save').click(function()     {
           console.log("FILE COMMANDS: clicked save");
           if (currentname == "" || template) { //first save
               LOOMA.prompt('Enter a file name: ',
                        function(savename) { fileexists(savename,
                                             currentcollection,
                                             currentfiletype,
                                             function(savename) {LOOMA.alert('File already exists: ' + savename);},
                                             function(savename) {
                                                callbacks['save'](savename);
                                                owner = true;
                                                template = false;
                                                setname(savename);
                                             }
                                            );},
                        function(){return;},
                        false);
           }

           else if (!owner) {
               LOOMA.alert('You are not the owner of this file. Use SAVE-AS to make a copy you own', 5, true);
                //callbacks['checkpoint']();
            }

           else if (callbacks['modified']()) {
               callbacks['save'](currentname);
               template = false;
           }
       });

///////////////////////////////
////// /*   SAVE AS    */   /////
///////////////////////////////
   
      $('#saveas').click(function()   {
           console.log("FILE COMMANDS: clicked save as");
           LOOMA.prompt('Enter a file name: ',
                    function(savename) { fileexists(savename,
                                        currentcollection,
                                        currentfiletype,
                                        function(savename) {LOOMA.alert('File already exists: ' + savename);},
                                        function(savename) {
                                            callbacks['save'](savename);
                                            owner = true;
                                            template = false;
                                            setname(savename);
                                            }
                                        );},
                    function(){return;},
                    false);
       });

///////////////////////////////
//////  /*   RENAME    */   /////
///////////////////////////////
   
      $('#rename').click(function()   {//only used for base files, not templates (for now)
           console.log("FILE COMMANDS: clicked rename");

              if (!owner) LOOMA.alert('You are not the owner of this file. Use SAVE-AS to make a copy you own', 5, true);
              else
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
    
///////////////////////////////
//////  /*   DELETE    */   /////
///////////////////////////////
    
     $('#delete').click(function()
         {
           console.log("FILE COMMANDS: clicked delete");
                 LOOMA.prompt('Enter a file name: ',
                    function(deletename) { fileexists(deletename,
                                              currentcollection,
                                              currentfiletype,
                                              function(deletename, author) {
                                                  if (author == LOOMA.loggedIn() || LOOMA.loggedIn == 'skip' || LOOMA.loggedIn() == 'vivian') {
                                                     deletefile(deletename, currentcollection, currentfiletype);
                                                     if (currentname == deletename) callbacks['clear']();}
                                                  else LOOMA.alert('You are not the owner of this file. Use SAVE-AS to make a copy you own', 5, true);
                                                     },
                                              function(deletename) {
                                              LOOMA.alert('File not found: ' + deletename); }
                                        );},
                    function(){return;},
                    false);
         });
    
///////////////////////////////
//////  /*   SHOWTEXT    */   /////
///////////////////////////////
      $('#show_text').click(function()
          {
            console.log("FILE COMMANDS: clicked new text file");
            //LOOMA.makeTransparent($('#main-container-horizontal'));  //not needed since text-editor covers full screen
            //LOOMA.makeTransparent($('#filecommands'));
            $('#text-editor').show().focus();
          });

    
   /*   TEMPLATE OPERATIONS    */
   
///////////////////////////////
/////*   OPEN TEMPLATE    */////
///////////////////////////////
    
        $('#opentemplate').click(function()     {
           console.log("FILE COMMANDS: clicked open template");
               if (callbacks['modified']())
                   savework(currentname, currentcollection, currentfiletype);
               else {
                    opensearch();  //do OPENSEARCH first, then hide/show FILTER checkboxes below

                    $('.typ-chk input').attr('checked', false);
                    $('.typ-chk').hide();

                    if (currentfiletype == 'text') {
                        $('#text-template-chk').show();
                        $('#text-template-chk input').attr('checked', true).css('opacity', 0.5);
                        $('#text-template-chk input').click(function() {return false;});
                    }
                    else if (currentfiletype == 'lesson') {
                        $('#lesson-template-chk').show();
                        $('#lesson-template-chk input').attr('checked', true).css('opacity', 0.5);
                        $('#lesson-template-chk input').click(function() {return false;});
                    };

                    //NOTE: can't attach click handler to 'results' which dont exist yet
                    //      so add the ON handler to the DIV which will contain the result elements
                    $('#filesearch-results').on('click',
                                            'button',
                                            function(event){
                                                console.log ('clicked on SEARCH result');

                                                //event.preventDefault();

                                                closesearch();
                                                if ($(this).attr('class') !== 'cancel-results') //if file not found, dont call OPEN()
                                                    {openfile($(this).prop('title'), currentcollection, currentfiletype + '-template');
                                                     template = true;
                                                 }
                                            }

                    );

                    $('#cancel-search').on('click',
                                            function() {
                                                console.log ('canceled out of SEARCH');
                                                closesearch();
                                           });
                };
       }); //end OPEN TEMPLATE

///////////////////////////////
/////*   SAVE  TEMPLATE  */////
///////////////////////////////
  
       $('#savetemplate').click(function()     {
           console.log("FILE COMMANDS: clicked save template");
           if (currentname == "" || !template) { //first save
               LOOMA.prompt('Enter a template name: ',
                        function(savename) { fileexists(savename,
                                             currentcollection,
                                             currentfiletype + '-template',
                                             function(savename) {LOOMA.alert('File already exists: ' + savename);},
                                             function(savename) {
                                                callbacks['savetemplate'](savename);
                                                owner = true;
                                                template = true;
                                                setname(savename);
                                                }
                                            );},
                        function(){return;},
                        false);
           }

           else if (!owner) {
               LOOMA.alert('You are not the owner of this template. Use SAVE-AS to make a copy you own', 5, true);
                //callbacks['checkpoint']();
            }

           else if (callbacks['modified']()) {
               callbacks['savetemplate'](currentname);
               template = true;
           };
       });

///////////////////////////////
/////*   SAVE AS TEMPLATE    *////
///////////////////////////////
   
      $('#saveastemplate').click(function() {
           console.log("FILE COMMANDS: clicked save as template");
           // save with type = currentfiletype + '-template'
           LOOMA.prompt('Enter a template name: ',
                        function(savename) { fileexists(savename,
                                             currentcollection,
                                             currentfiletype + '-template',
                                             function(savename) {LOOMA.alert('Template already exists: ' + savename);},
                                             function(savename) {
                                                 callbacks['savetemplate'](savename);
                                                 owner = true;
                                                 template = true;
                                                 setname(savename);
                                                 }
                                            );},
                        function(){return;},
                        false);
       });


///////////////////////////////
//////*   DELETE TEMPLATE    *////
///////////////////////////////
   
      $('#deletetemplate').click(function() {
           console.log("FILE COMMANDS: clicked delete template");
           LOOMA.prompt('Enter a template name: ',
                    function(deletename) { fileexists(deletename,
                                         currentcollection,
                                         currentfiletype + '-template',
                                         function(deletename) { deletefile(deletename, currentcollection, currentfiletype + '-template'); },
                                         function(deletename) {
                                             LOOMA.alert('Template not found: ' + deletename); }
                                        );},
                    function(){return;},
                    false);
                });



///////////////////////////////
//////    /*   QUIT    */  /////
///////////////////////////////
   
     $('#quit').click(function()
         {
           console.log("FILE COMMANDS: clicked quit");
           callbacks['quit']();
         });


///////////////////////////////
///////*   UNLOAD window    */ /////
///////////////////////////////
   

   //turn off('click') for looma toolbar BACK arrow
     //$('.back-button').off('click');
     $(".back-button").removeAttr("onclick"); //special code to remove "onclick" from toolbar back button


     $('.back-button').on('click', function()
         {
           console.log("FILE COMMANDS: toolbar BACK ARROW clicked");
           if (callbacks['modified']()) savework(currentname, currentcollection, currentfiletype);
           else window.history.back();
         });

   /*    $(window).on("beforeunload", function() {
           //note Chrome doesnt use the custom message provided
           //note could check callbacks['modified']() but I couldnt get that to work in chrome
            return "Do you really want to close?";
        });
   */


///////////////////////////////
///////*  FILE SEARCH    */ /////
///////////////////////////////
       $('#filesearch').submit(function( event ) {
            event.preventDefault();
        
            $('#filesearch-results').empty().show();
        
       /*     //code to check for some search criteria being set - removed for now.
              //only necessary when searching ACTIVITIES collection
            if (!isFilesearchSet()) {
                $('#filesearch-results').html('please select at least 1 filter option before searching');
            } else
       */
       {
                var loadingmessage = $("<p/>Loading results<span id='ellipsis'>.</span>").appendTo('#filesearch-results');
            
                var ellipsisTimer = setInterval(
                    function () {
                        $('#ellipsis').text($('#ellipsis').text().length < 10 ? $('#ellipsis').text() + '.' : '');
                    },33 );
            
                $('#filesearch #collection').val(currentcollection);
                $.post( "looma-database-utilities.php",
                    $("#filesearch").serialize(),
                    function (result) {
                        loadingmessage.remove();
                        clearInterval(ellipsisTimer);
                        displayFileSearchResults(result)
                        //$('#filesearch-results').html(result)
                        ;},
                    'json');
            }
            return false;
        });
    
///////////////////////////////
////  displayFileSearchResults ////
///////////////////////////////
    function displayFileSearchResults(results)
        {
            $('#filesearch-results').empty().append('<table></table>');
            var $display = $('#filesearch-results table');
            
            if (results.length == 0) { //print empty button
            
                $display.append(
                    "<tr><td>" +
                    "<button class='cancel-results'>" +
                    "<h4> <b> No files found - Cancel</b> </h4>" +
                    "</button>" +
                    "</td></tr>"
                ).show();
                $('.cancel-results').click(function() {
                    $("#filesearch").trigger("reset");
                    $('#filesearch-results').empty().hide();
                });
                
            }
            else {
                $.each(results, function(index, value) {
                    var author = value['author'] ? ("Author: " + value['author']) : "";
                    var date = value['date'] ? ("  Date: " + value['date']) : "";
                    $display.append(
                        "<tr><td>" +
                        "<button class='result' " +
                        "data-id='" + value['_id']['$id'] + "' " +
                        "title='" + value['dn'] + "' " +
                        "<h4> <b> " + value['dn'] + " </b> </h4>" +
                        "<h6>" + author + date + "</h6>" +
                        "<div class='result-data'>" + value['data'] + "</div>" +
                        "</button>" +
                        "</td</tr>"
                    ).show();
                });
                $display.append('</table>').show();
    
            };
        }; //end displayFileSearchResults()

///////////////////////////////
//////   clear-filesearch /////
///////////////////////////////
    $('.clear-filesearch').click(function() {
        $("#filesearch").trigger("reset");
        $('#filesearch-results').empty().hide();
    }); // end clearFilesearch()
    
///////////////////////////////
//////   cancel-filesearch /////
///////////////////////////////
    $('.cancel-filesearch').click( closesearch ); // end cancelFilesearch()
   
});
