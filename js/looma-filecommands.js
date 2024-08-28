/*
LOOMA javascript file
Filename: looma-filecommands.JS
Description:used by various looma pages to provide file commands like NEW, OPEN, SAVE, etc
            used by looma-text-edit, looma-edit-lesson, and looma-edit-video

Programmer name: skip
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: nov 2016, APR 2020

Revision: Looma 5.8
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
//          showsearchitems:  hide/show the search elements appropriate for this context
//
//
var currentname;       //set by calling program - name of file being edited
var currentfiletype;   //set by calling program - to 'text', 'lesson', etc
var currentcollection; //set by calling program - to 'lessons', 'local_lessons', 'slideshows', etc
var currentDB;         //set by calling program - to 'looma', or 'loomalocal'

var owner    = true;   //TRUE if current logged in user is the author of the currrent file. initially 'true' since editor opens with a new file
var author;
var template = false;  //if TRUE the file currently being edited is a template; else FALSE

var cmd;  //needed??

var callbacks = {      //re-set by calling program - to custom handler for each function
    clear:           doNothing,
    save:            doNothing,
    savetemplate:    doNothing,
    new:             doNothing,
    open:            doNothing,
    display:         doNothing,     // function to display a file OPEN file process
    modified:        doNothing,
    checkpoint:      doNothing,
    showsearchitems: doNothing,     // function to hide or show OPEN search form items
    quit:            quit           // default QUIT action is save work and the editor page. override in page's JS if needed
};

function doNothing() {

}  //default action - replaced by the calling program to do task specific actions
///////////////////////////////
//////    setname         /////
///////////////////////////////
function setname(newname,author) {
    currentname = newname;
    if (newname) $('.filename').text(newname + ' (' + author +')'); else $('.filename').text('<none>');
    if (template) $('.filename').append($('<span> (template) </span>'));
}
///////////////////////////////
//////  askToSaveWork      ////////
///////////////////////////////
function askToSaveWork (msg, name, collection, filetype) {
    return new Promise(/*async*/ (resolve, reject) => {
        LOOMA.makeTransparent ($('#main-container'));
        $('#filesave-panel #filesave-message').text(msg);
        $('#filesave-panel').show();
       
        $('.dismiss').off('click').click(function(){
             $('#filesave-panel').hide();
             LOOMA.makeOpaque($('#main-container'));
            reject('User canceled SAVE-1');
        });
        
        $('#filesave-nosave').off('click').click(function(){
             $('#filesave-panel').hide();
            LOOMA.makeOpaque($('#main-container'));
            resolve('User no save-2');
        });
   
        $('#filesave-save').off('click').click(function(){
            $('#filesave-panel').hide();
            LOOMA.makeOpaque($('#main-container'));
            savework(name, collection, filetype)
                .then (function () {resolve('User saved-1');})
                .catch(function () {   reject('User canceled-4a');});
            });
        });
}  // end askToSavWork()

///////////////////////////////
//////  SAVEWORK          /////
///////////////////////////////
function savework(name, collection, filetype) {  // filetype is base type (not type-template)
    return new Promise(/*async*/ (resolve, reject) => {
    
        if (name == "" || filetype === 'text-template') {
            LOOMA.prompt('Enter a file name to save current work: ',
                function (name) {
                    if (template) callbacks['savetemplate'](name);
                    else callbacks['save'](name);
                    setname(name, author);
                    resolve('User saved-2');
                },
                function () {
                    //this checkpoint call should not be used if quit worked correctly
                    callbacks['checkpoint']();
                    reject('User canceled-3');
                },
                false);
        } else if (true /*owner*/) LOOMA.confirm('Save current work in file: ' + name + '?',
            function () {
                if (template) callbacks['savetemplate'](name);
                else callbacks['save'](name);
                resolve('User saved-3');
            },
            function () {
                reject('User canceled-4');
                },
            false);
        else {  //NOT owner
            LOOMA.alert('You are not the owner of this file. Use SAVE-AS to make a copy of your own', 5, true);
            reject('not owner-5');
        }
    });
} // end SAVEWORK()
///////////////////////////////
//////   SAVEFILE         /////
///////////////////////////////
function savefile(name, collection, filetype, data, activityFlag, author) {  //filetype must be given as (e.g.) 'text' or 'text-template'
    
    if (name.length > 0) {
        if (data) {
            console.log('FILE COMMANDS: saving file (' + name + ') with ft: ' + filetype + 'and with data: ' + data);
            var options =  {
                cmd: "save",
                db: currentDB,
                collection: collection,
                dn: LOOMA.escapeHTML(name),
                ft: filetype,
                data: data,
                activity: activityFlag      // NOTE: this is a STRING, either "false" or "true"
            };
            options.author = author;
            if (editor) options.editor = editor;
            
            $.post("looma-database-utilities.php",
                 options,
                'json'
            ).then(
                function (response) {
                    if (JSON.parse(response)['item']) {
                        callbacks['checkpoint']();
                        LOOMA.alert('File ' + name + ' saved', 5);
                        //console.log("SAVE: upserted ID = ", JSON.parse(response['_id']['$id'] || response['_id']['$oid']));
                    } else {
                        LOOMA.alert('File ' + name + ' save failed', 5);
                        console.log("SAVE: didn't work?");
                    }
            });
        } else LOOMA.alert('No file contents - file not saved', 10);
    } else LOOMA.alert('Please specify a non-blank filename - file not saved',10);

} //end SAVEFILE()
//////////////////////////////////////////
//////   saveTextTranslation         /////
//////////////////////////////////////////
function saveTextTranslation(name, nepali) {
    
    if (name.length > 0) {
        if (nepali) {
            console.log('FILE COMMANDS: saving text translation (' + name + ')  and with nepali: ' + nepali);
            $.post("looma-database-utilities.php",
                {
                    cmd: 'save',
                    collection: 'text_files',
                    dn: LOOMA.escapeHTML(name),
                    db: currentDB,
                    ft: 'text',
                    translator: LOOMA.loggedIn(),
                    nepali: nepali,
                    activity: 'false'      // NOTE: this is a STRING, either "false" or "true"
                },
                
                function (response) {
                    if (response['_id']) {
                        callbacks['checkpoint']();
                        console.log("SAVE: upserted ID = ", (response['_id']['$id'] || response['_id']['$oid']));
                    } else {
                        console.log("SAVE: didn't work?");
                    }
                },
                'json'
            );
        } else LOOMA.alert('No translation contents - file not saved', 10);
    } else LOOMA.alert('Please specify a non-blank filenanme - file not saved',10);

} //end saveTextTranslation()
///////////////////////////////
//////     RENAMEFILE    /////
///////////////////////////////
function renamefile(newname, oldname, collection, filetype)  {  //only used for base files, not templates (for now)
    
    $.post("looma-database-utilities.php",
        {cmd: "rename",
            collection: collection,
            dn: LOOMA.escapeHTML(oldname),
            ft: filetype,
            activity: 'true',
            "db": currentDB,
            newname: LOOMA.escapeHTML(newname)},
        function(response) {
            console.log('response is ', response);
            console.log("FILE COMMANDS - RENAMED ", oldname, ' to ', newname);
        },
        'json'
    ).then(LOOMA.alert('File ' + oldname + ' renamed ' + newname, 5));
}  // end RENAMEFILE()
///////////////////////////////
//////   DELETEFILE       /////
///////////////////////////////
function deletefile(deletename, collection, filetype)  { //filetype must be given as 'text' or 'text-template'
    
    $.post("looma-database-utilities.php",
          {   cmd: "delete",
              collection: collection,
              activity:'true',
              db: currentDB,
              dn: LOOMA.escapeHTML(deletename),
              ft: filetype},
        function(response) {
            console.log('response is ', response);
            console.log("DELETED ", deletename);
        },
        'json'
    ).then(LOOMA.alert('File ' + deletename + ' deleted', 5));
}  // end DELETEFILE()

///////////////////////////////
//////     OPENFILE       /////
///////////////////////////////
function openfile(openId, db, collection, filetype) { //filetype must be given e.g. 'text' or 'text-template'
    
    //OPEN from MONGO
    $.post("looma-database-utilities.php",
        {cmd: "openByID", db: db, collection: collection, id:openId, ft: filetype},
        function(response) {
            if (response['error'])
                LOOMA.alert(response['error'] + ': ' + openname, 3, true);  //better if returned an error flag + err msg
            else {
                console.log("OPEN (ft: ", filetype, "), from ", collection, ' collection. response: ', response);
    
                // if (filetype.includes('-template')) setname('');
                // else
                setname(response['dn'], response['author']);
    
                //currentid = response['_id'];
                //currentauthor = response['author'];
                if ('author' in response) {
                    // set 'owner' to T/F based on these rules:
                    owner = (
                        (response['author'] === LOOMA.loggedIn())  //this user is the author
                        || (LOOMA.readCookie('login-level') === 'translator' && filetype === 'text')
                        || (LOOMA.readCookie('login-team') === 'teachers' && (filetype === 'text' || filetype === 'lesson'))
                        // next line lets team members edit each others' stuff [useful in summer teams]
                        //  || ((('team' in response) ? response['team'] : 'not_legal_team_name') === LOOMA.readCookie('login-team'))
                        || (LOOMA.loggedIn() === 'skip')
                        || (LOOMA.loggedIn() === 'david')
                        || (LOOMA.loggedIn() === 'kathy')
                        || (LOOMA.loggedIn() === 'kabin')
                    );
                    author = response['author'];
                }
                else owner = true; //was FALSE, but if there is no owner, OK to edit the file
                
                callbacks['display'](response);   //need to return the full 'response' from the db
                //$('#cancel-result').on('click', closesearch);
                
                // let calling programs checkpoint after OPEN, in case results are async
                //callbacks['checkpoint']();
            }
        },
        'json'
    );
}  // end OPENFILE()
///////////////////////////////
//////        QUIT        /////
///////////////////////////////
function  quit() {
    if (callbacks['modified']()) askToSaveWork('Save before quitting?',currentname, currentcollection, currentfiletype)
        .then(function(){window.history.back();})
        .catch(function() {});
    else window.history.back();  //race condition? savework() AJAX may not run??
}
///////////     SEARCH CODE    ////////////
///////////     SEARCH CODE    ////////////
///////////     SEARCH CODE    ////////////

///////////////////////////////
//////   opensearch       /////
///////////////////////////////
//open a file browse/search panel
function opensearch() {
    //make the main page transparentclear_button
    LOOMA.makeTransparent($('#main-container'));
    LOOMA.makeTransparent($('#commands'));
    LOOMA.closePopup();
    
    $('#cmd-btn').prop('disabled', true);
    // show SEARCH panel
    
    $('#filesearch-panel').show();
    $('#filesearch-bar').show();
    $('#filesearch-bar input').focus();
    $('#cancel-search').show();
    
    callbacks['showsearchitems']();
} //end opensearch()

///////////////////////////////
//////   performSearch       /////
///////////////////////////////
function performSearch(collection, ft) {
    if (ft.includes('-template')) template = true; else template = false;
    opensearch();
    
    // override file search FORM fields 'collection' and 'ft'
    $('#filesearch-collection').val(collection);
    $('#filesearch-ft').val(ft);
    
    //if( $('#collection').val() === 'text_files')   $('#collection').val('text');
    //$('#filesearch-ft').val('text');
    
    //NOTE: can't attach click handler to 'results' which dont exist yet
    //      so add the ON handler to the DIV which will contain the result elements
    $('#filesearch-results').on('click',
        'button',
        function(event) {
            console.log('FILE COMMANDS: clicked on SEARCH result');
            
            event.preventDefault();  //trying to prevent DOUBLE open that has been observed
            
            closesearch();
            if ($(this).attr('class') !== 'cancel-results') //if file not found, dont call OPEN()
            {
                //var db;
                if ($(this).data('db') === 'loomalocal') {
                    currentDB = $(this).data('db');
                } else currentDB = 'looma';
                openfile($(this).data('id'), currentDB, collection, ft);
                if (ft.includes('-template')) template = true; else template = false;
            }
        });
    
    $('#cancel-search').on('click',
        function() {
            console.log ('FILE COMMANDS: canceled out of SEARCH');
            closesearch();
        }
    );

} // end performSearch()
///////////////////////////////
//////     closesearch     /////
///////////////////////////////
//close the file search panel
function closesearch() {
    
    $('#filesearch-results').off('click'); //trying to prevent DOUBLE open that has been observed
    
    //restore file search FORM fields 'collection' and 'ft'
    $('#filesearch-collection').val(currentcollection);
    $('#filesearch-ft').val(currentfiletype);
    $('#filesearch-panel').hide();
    $('#filesearch-results').hide();
    $('#filesearch-results').off('click', 'button');  //remove ON CLICK handler for #search-results button
    $('#main-container').removeClass('all-transparent');
    $('#commands'                 ).removeClass('all-transparent');
    
    LOOMA.makeOpaque($('#main-container'));
    LOOMA.makeOpaque($('#commands'));
    
    $('#cmd-btn').prop('disabled', false);
    
    $('#filesearch-bar input').val('');
}  //end closesearch()
///////////////////////////////
//////  isFilesearchSet     /////
///////////////////////////////

function isFilesearchSet() {
    var set = false;
    
    if ($('#filesearch-collection').val() == 'activities') {
        if ($('#filesearch-term').val()) set = true;
        $("#filesearch-type .flt-chkbx").each( function() {
                if (this.checked) set = true;
            }
        );
    } else set=true;
    
    return set;
}  //  end isFilesearchSet()
///////////////////////////////
////  displayFileSearchResults ////
///////////////////////////////
function displayFileSearchResults(results)
{
    $('#filesearch-results').empty().append('<table></table>');
    var $display = $('#filesearch-results table');
    
    if (results['list'].length == 0) { //print empty button
        
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
        $.each(results['list'], function(index, value) {
            var author = value['author'] ? ("Author: " + value['author']) : "";
            var date = value['date'] ? ("  Date: " + value['date']) : "";
            
            var displayname =  $("<div/>").html(value['dn']).text();
            var master = value['master'] ? 'master' : '';
            
            $display.append(
                "<tr><td>" +
                "<button class='result' " + master +
                "data-id='" + (value['_id']['$id'] || value['_id']['$oid']) + "' " +
                "data-db='" + value['db'] + "' " +
                "data-ft='lesson' " +
                //"data-mongo='" + value + "' " +
                "title='" + displayname + "' " +
                "<h4> <b> " + displayname + " </b> </h4>" +
                "<h6>" + author + date + "</h6>" +
              
                "</button>" +
                "</td</tr>"
            ).show();
        });
        $display.append('</table>').show();
    
    }
} //end displayFileSearchResults()
$(document).ready(function () {
    /* file commands NEW OPEN SAVE SAVEAS OPENTEMPLATE SAVETEMPLATE DELETE QUIT*/


///////////////////////////////
//////   FILEEXISTS       /////
///////////////////////////////

//checks for existing file with this name.
// if the file exists, reject promise with {_id:_id, name:dn, author:author},
// if it doesnt exist, resolve promise with (dn)
    function fileexists(name, collection, filetype) {  //filetype must be given as 'text' or 'text-template'
        return new Promise(/*async*/ (resolve, reject) => {
            $.post("looma-database-utilities.php",
                {cmd: "exists", collection: collection, ft: filetype, dn: LOOMA.escapeHTML(name)},
                'json')
                .then( function(result) {
                    var a = JSON.parse(result);
                    
                    console.log('in fileexists: result is ' + a.name + ' and a is ' + a.author);
                    
                    if (a['_id'] == "") reject(name);  //file not found
                    else                resolve(a);    //file found
                });
        });
    } // end FILEEXISTS()
    
///////////////////////////////
//////   /*   NEW    */      //
///////////////////////////////
    
    $('#new').click(function()      {
        console.log("FILE COMMANDS: clicked new");
            if (callbacks['modified']()) askToSaveWork('Save before new?',currentname, currentcollection, currentfiletype)
                .then (function(msg){
                    callbacks['clear']();
                    template = false;
                    owner = true;
                    author = loginname;
                    currentDB = 'loomalocal';
                    callbacks['new']();
                })
                .catch(function() {});
    
            else {
            callbacks['clear']();
            template = false;
            currentDB = 'loomalocal';
            owner = true;
            author = loginname;
            callbacks['new']();
            }
    });

///////////////////////////////
//////    /*   OPEN    */   /////
///////////////////////////////
    
    $('#open').click(function()     {
        console.log("FILE COMMANDS: clicked open");
            if (callbacks['modified']()) askToSaveWork('Save before open?',currentname, currentcollection, currentfiletype)
                .then (function() {performSearch(currentcollection, currentfiletype);})
                .catch(function() {});
        else
            performSearch(currentcollection, currentfiletype);
        
    });

///////////////////////////////
//////   /*   SAVE    */   /////
///////////////////////////////
    
    $('#save').click(function()     {
        console.log("FILE COMMANDS: clicked save");
        if (currentname == "" || template) {
           // if (currentname == "" || template) { //first save
            LOOMA.prompt('Enter a name for this file: ',
                function(savename) { fileexists(savename, currentcollection, currentfiletype)
                    .then(function(obj) {LOOMA.alert('File with this name exists: ' + obj.name + ' owned by ' + obj.author);})
                    .catch((function(name) {
                        callbacks['save'](name);
                        callbacks['checkpoint']();
                        owner = true;
                        template = false;
                        setname(name, owner); }))
                },
                function(){}, //
                false);
        }
        else if (!owner) {
            LOOMA.alert('You are not the owner of this file. Use SAVE-AS to make a copy of your own', 5, true);
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
        LOOMA.prompt('Enter a name for this file: ',
            function(savename) { fileexists(savename, currentcollection, currentfiletype)
                //.then(function(a) {LOOMA.alert('File with this name exists: ' + a.name);})
                .then(function(obj) {LOOMA.alert('File with this name exists: ' + obj.name + ' owned by ' + obj.author);})
                .catch((function(name) {
                    callbacks['save'](savename);
                    callbacks['checkpoint']();
                    owner = true;
                    template = false;
                    setname(savename, author); }))
            },
            function(){}, //
            false);
    });

///////////////////////////////
//////  /*   RENAME    */   /////
///////////////////////////////
    
    $('#rename').click(function()   {//only used for base files, not templates (for now)
        console.log("FILE COMMANDS: clicked rename");
        if (!owner) LOOMA.alert('You are not the owner of this file. Use SAVE-AS to make a copy of your own', 5, false);
        else
            LOOMA.prompt('Enter a new file name for: ' + currentname,
                function(newname) { fileexists(newname, currentcollection, currentfiletype)
                    //.then(function(a) {LOOMA.alert('File with this name exists: ' + a.name);})
                    .then(function(obj) {LOOMA.alert('File with this name exists: ' + obj.name + ' owned by ' + obj.author);})
                    .catch((function(newname) {
                        if (currentname != '') renamefile(newname, currentname, currentcollection, currentfiletype);
                        setname(newname, author); }))
                },
                function(){}, //
                false);
    });

///////////////////////////////
//////  /*   DELETE    */   /////
///////////////////////////////
    
    $('#delete').click(function() {
        console.log("FILE COMMANDS: clicked delete");
        LOOMA.prompt('Enter the full name of the file to be deleted: ',
            
            function(deletename) {
                fileexists(deletename, currentcollection, currentfiletype)
                .then( function(a) {
                    if (owner)
                            {deletefile(a.name, currentcollection, currentfiletype);
                             if (currentname == a.name) callbacks['clear']();}
                    else LOOMA.alert('Delete failed. You are not the owner of this file - owner is ' + a.author, 5, true);// called if file exists
                     })
                .catch(( function(deletename) {    // called if file does not exist
                    LOOMA.alert('File not found: ' + deletename); }))
            },
            function(){},
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
        if (callbacks['modified']()) askToSaveWork('Save before open?',currentname, currentcollection, currentfiletype + '-template')
            .then (function() {performSearch(currentcollection, currentfiletype + '-template');})
            .catch(function() {});
        else
            performSearch(currentcollection, currentfiletype + '-template');
        
    });


///////////////////////////////
/////*   SAVE  TEMPLATE  */////
///////////////////////////////
    
    $('#savetemplate').click(function()     {
        console.log("FILE COMMANDS: clicked save template");
        if (currentname == "" || !template) { //first save
    
            LOOMA.prompt('Enter a template name: ',
                function(savename) { fileexists(savename, currentcollection,
                    currentfiletype + '-template')
                    //.then(function(a) {LOOMA.alert('File with this name exists: ' + a.name);})
                    .then(function(obj) {LOOMA.alert('File with this name exists: ' + obj.name + ' owned by ' + obj.author);})
                    .catch((function(name) {
                        callbacks['savetemplate'](name);
                        owner = true;
                        template = true;
                        setname(name, author); }))
                },
                function(){}, //
                false);
}
        
        else if (!owner) {
            LOOMA.alert('You are not the owner of this template. Use SAVE-AS to make a copy of your own', 5, true);
            //callbacks['checkpoint']();
        }
        
        else if (callbacks['modified']()) {
            callbacks['savetemplate'](currentname);
            template = true;
        }
    });

///////////////////////////////
/////*   SAVE AS TEMPLATE    *////
///////////////////////////////
    
    $('#saveastemplate').click(function() {
        console.log("FILE COMMANDS: clicked save as template");
        // save with type = currentfiletype + '-template'
        LOOMA.prompt('Enter a template name: ',
    
            function(savename) { fileexists(savename, currentcollection, currentfiletype + '-template')
                //.then(function(a) {LOOMA.alert('Template with this name exists: ' + a.name);})
                .then(function(obj) {LOOMA.alert('File with this name exists: ' + obj.name + ' owned by ' + obj.author);})
                .catch((function(name) {
                    callbacks['savetemplate'](name);
                    owner = true;
                    template = true;
                    setname(name, author); }))
            },
            function(){},
            false);
    });


///////////////////////////////
//////*   DELETE TEMPLATE    *////
///////////////////////////////
    
    $('#deletetemplate').click(function() {
        console.log("FILE COMMANDS: clicked delete template");
        LOOMA.prompt('Enter a template name: ',
    
            function(deletename) {
                fileexists(deletename, currentcollection, currentfiletype + '-template')
                    .then( function(a) {
                        if (a.author == LOOMA.loggedIn()
                            || LOOMA.loggedIn() == 'skip'
                            || LOOMA.loggedIn() == 'david'
                            || LOOMA.loggedIn() == 'kathy')
                        {deletefile(a.name, currentcollection, currentfiletype + '-template');
                            if (currentname == a.name) callbacks['clear']();}
                        else LOOMA.alert('Delete failed. You are not the owner of this file.', 5, true);// called if file exists
                    })
                    .catch(( function(deletename) {    // called if file does not exist
                        LOOMA.alert('Template not found: ' + deletename); }))
            },
            function(){},
            false);
    });



///////////////////////////////
//////    /*   QUIT    */  /////
///////////////////////////////
    
    $('#quit').click(function() {
        console.log("FILE COMMANDS: clicked quit");
        callbacks['quit']();
    });


///////////////////////////////
///////*   UNLOAD window    */ /////
///////////////////////////////
    
    
    //turn off('click') for looma toolbar BACK arrow
    //$('.back-button').off('click');
   // $(".back-button").removeAttr("onclick"); //special code to remove "onclick" from toolbar back button
  /*  this code displays the browser's "changes may be lost" alert
    window.onbeforeunload = function() {
        if (callbacks['modified']()) {
            console.log('modified')
            return "You have made changes on this page that you have not yet confirmed. If you navigate away from this page you will lose your unsaved changes";
        }
        else console.log('NOT modified');
    };
    */
    
    $( window ).on( 'beforeunload',  function(e){
        console.log('window unloading');
        //callbacks['quit']();
        if (callbacks['modified']()) return 'There is unsaved work. Do you want to leave without saving?';
        else return void (0);
        //e.preventDefault();
    });
    
    $('.back-button').off('click').on('click', callbacks['quit']);
    /*
    $('.back-button').on('click', function()
    {
        console.log("FILE COMMANDS: toolbar BACK ARROW clicked");
        if (callbacks['modified']()) askToSaveWork('Save before leaving page?',currentname, currentcollection, currentfiletype)
            .then(function(){window.history.back();})
            .catch(function() {});

        else window.history.back();
    });
    */
 /*   window.onbeforeunload = function(event) {
        event.preventDefault();
        // Chrome requires returnValue to be set.
        event.returnValue = '';
        
        console.log("FILE COMMANDS: toolbar 'beforeunload' event");
    
        // this beforeunload code doesnt work ??? unload happens first, then our popup flashes but is erased and unloaded
        if (callbacks['modified']()) askToSaveWork('Save before leaving page?',currentname, currentcollection, currentfiletype)
            .then(function(){window.history.back();})
            .catch(function() {});
    };
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
            
            ////////// $('#filesearch-collection').val(currentcollection);
            $.post( "looma-database-utilities.php",
                $("#filesearch").serialize(),
                function (result) {
                    loadingmessage.remove();
                    clearInterval(ellipsisTimer);
                    displayFileSearchResults(result)
                    ;},
                'json');
        }
        return false;
    });

///////////////////////////////
//////   clear-filesearch /////
///////////////////////////////
    $('.clear-filesearch').click(function() {
        $("#filesearch").trigger("reset");
        $('#filesearch-results').empty().hide();
        
        $('#filesearch-term').focus();
        
    }); // end clearFilesearch()

///////////////////////////////
//////   cancel-filesearch /////
///////////////////////////////
    $('.cancel-filesearch').click( closesearch ); // end cancelFilesearch()

    $(document.body).append("<div id='modified'><span class='modified'>Modified</span></div>");
    
        $('#modified').hover(
            function() {$('#modified span').show();},
            function() {$('#modified span').hide();});
     
        // check for 'mofified' and update the color of the modified dot
        // for a while this code was commented. why?
        setInterval(function(){
                if(callbacks['modified']()) {
                    $('#modified').css('background-color', 'red');
                    $('#modified span').text('File modified');
                }
                else {
                    $('#modified').css('background-color', 'green');
                    $('#modified span').text('File not modified');
                }},
            500);
            
      
});
