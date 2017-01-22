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

var id;
var name;
var cmd;

var savedHTML;   //savedHTML is checkpoint of HTML for checking for modification

function escapeHTML(text) {
  return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
};

function setname(newname) {
    name = newname;
    if (newname) $('#filename').text(newname); else $('#filename').text('<none>');
};

function cleartext() {
       setname("");
       id="";
       $editor.html("");
       savedHTML = "";
       checkpoint();
       $editor.focus();
};

function fileexists(name, texttype, yes, no) { //checks for existing file with this name. if exists, alerts; if doesnt exist, executes no()
         $.post("looma-database-utilities.php",
                {cmd: "exists", collection: collection, ft: texttype, dn: escapeHTML(name)},
                function(result) {
                    if (result['_id'] == "") no(name);   //file 'name' not found, execute NO() function
                    else                     yes(name); //file 'name' found, execute YES() function
                },
                'json'
              );
}; // end FILEEXISTS()

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

function save(name, texttype, html) {

        //DEBUG
        console.log('saving html: ' + html);
         //SAVE to MONGO
         $.post("looma-database-utilities.php",
                {cmd: "save", collection: collection, dn: escapeHTML(name), ft: texttype, html: html}, //need to use escapeHtml() with POST??
                function(response) {
                    checkpoint();
                    if (response['_id']) console.log("TEXT EDIT - SAVE: upserted ID = ", response['_id']['$id']);
                },
                'json'
              );
}; //end SAVE()

function rename(newname, oldname)  {
         $.post("looma-database-utilities.php",
                {cmd: "rename", collection: collection, dn: escapeHTML(oldname), ft: 'text', newname: escapeHTML(newname)},
                function(response) {
                        console.log('response is ', response);
                        console.log("TEXT EDIT - RENAMED ", oldname, ' to ', newname);
                    },
                'json'
              );};  // end RENAME()

function deletetext(deletename, texttype)  {
         $.post("looma-database-utilities.php",
                {cmd: "delete", collection: collection, dn: escapeHTML(deletename), ft: texttype},
                function(response) {
                        console.log('response is ', response);
                        console.log("TEXT EDIT - DELETED ", deletename);
                    },
                'json'
              );};  // end DELETE()

function open(openname, texttype) {

        //OPEN from MONGO
        $.post("looma-database-utilities.php",
               {cmd: "open", collection: collection, dn: escapeHTML(openname), ft: texttype},
               function(response) {
                if (response['error']) LOOMA.alert(response['error'] + ': ' + openname, 3, true);  //better if returned an error flag + err msg
                else {
                    console.log("TEXT EDIT - OPEN (", texttype, "): ", response);
                    if (texttype == 'text') setname(openname);
                    else                    setname('');
                    id = response['_id'];
                    $editor.html(response['html']);
                    //$('#cancel-result').on('click', closesearch);
                    checkpoint();
                    }
               },
              'json'
            );
};  // end OPEN()

function doNothing(){return;};

function opensearch() {
        //make the main page transparent
        LOOMA.makeTransparent($('#main-container-horizontal'));
        LOOMA.makeTransparent($('#commands'));
        $('#cmd-btn').prop('disabled', true);
        // show SEARCH panel
        $('#search-panel').show();
        $('#collection').val('text');
        $('#search-filter, #search-criteria').show();
        $('#search-bar input').focus();
        $('#cancel-search').show();
        $('.typ-chk').attr('checked', false).hide(); //hide all type checkboxes - local code will show() the ones we want
       // $('#cancel-search').show();
};

function closesearch() {
        $('#search-panel').hide();
        $('#search-results').hide();
        $('#search-results').off('click', 'button');       //remove ON CLICK handler for #search-results button
        $('#main-container-horizontal').removeClass('all-transparent');
        $('#commands'                 ).removeClass('all-transparent');
        $('#cmd-btn').prop('disabled', false);

        //$('.typ-chk').off('click').attr('checked', false).hide();

        $('#txt-chk input').off('click');
        $('#txt-chk input').attr('checked', false);
        $('#txt-chk').hide();

        $('#template-chk input').off('click');
        $('#template-chk input').attr('checked', false);
        $('#template-chk').hide();

        $('#search-bar input').val('');
};

$(document).ready(function ()
    {

  /* file commands NEW OPEN SAVE SAVEAS OPENTEMPLATE SAVETEMPLATE DELETE QUIT*/

  /*   NEW    */

     $('#new').click(function()      {
               console.log("TEXT EDITOR: clicked new");
               if (modified())
                   savework();
               else {
                   cleartext();
               };
           });

  /*   OPEN    */
       $('#open').click(function()     {
           console.log("TEXT EDITOR: clicked open");
               if (modified())
                   savework();
               else {

                    opensearch();
                   // also SHOW checkboxes in #search-filter that we want
                    $('#txt-chk').show();
                    // for TEXT EDIT, only show "text", clicked and disabled
                    $('#txt-chk input').attr('checked', true).css('opacity', 0.5);
                    //$('#txt-chk input').prop('readonly'); //cant make 'readonly' work
                    $('#txt-chk input').click(function() {return false;});

                    //NOTE: can't attach click handler to 'results' which dont exist yet
                    //      so add the ON handler to the DIV which will contain the result elements
                    $('#search-results').on('click',
                                            'button',
                                            function(){
                                                console.log ('clicked on SEARCH result');

                                                //event.preventDefault();

                                                closesearch();
                                                if ($(this).attr('id') !== 'cancel-results') //if file not found, dont call OPEN()
                                                    open($(this).prop('title'), 'text');
                                            }
                    );

                    $('#cancel-search').on('click',
                                           function() {
                                                console.log ('canceled out of SEARCH');
                                                closesearch();
                                           }
                                       );

                };
       });

  /*   SAVE    */
       $('#save').click(function()     {
           console.log("TEXT EDITOR: clicked save");
           if (name == "") { //first save
               LOOMA.prompt('Enter a file name: ',
                        function(savename) { fileexists(savename,
                                             "text",
                                             function(savename) {LOOMA.alert('File already exists: ' + savename);},
                                             function(savename) {
                                                save(savename, 'text', $editor.html());
                                                setname(savename); }
                                            );},
                        function(){return;},
                        false);
           }


           else if (modified()) save(name, 'text', $editor.html());

       });

   /*   SAVE AS    */
      $('#saveas').click(function()   {
           console.log("TEXT EDITOR: clicked save as");
           LOOMA.prompt('Enter a file name: ',
                    function(savename) { fileexists(savename,
                                         "text",
                                        function(savename) {LOOMA.alert('File already exists: ' + savename);},
                                        function(savename) {
                                            save(savename, 'text', $editor.html());
                                            setname(savename); }
                                        );},
                    function(){return;},
                    false);
       });

   /*   RENAME    */
      $('#rename').click(function()   {
           console.log("TEXT EDITOR: clicked rename");
           LOOMA.prompt('Enter a file name: ',
                    function(newname) { fileexists(newname,
                                         "text",
                                         function(savename) {LOOMA.alert('File already exists: ' + savename);},
                                         function(newname) {
                                            rename(newname, name);
                                            setname(newname); }
                                        );},
                    function(){return;},
                    false);
       });

    /*   DELETE    */
     $('#delete').click(function()
         {
           console.log("TEXT EDITOR: clicked delete");
           LOOMA.prompt('Enter a file name: ',
                    function(deletename) { fileexists(deletename,
                                         "text",
                                         function(deletename) { deletetext(deletename, 'text');
                                                                if (name == deletename) cleartext();},
                                         function(deletename) {
                                             LOOMA.alert('File not found: ' + deletename); }
                                        );},
                    function(){return;},
                    false);
         });

   /*   TEMPLATE OPERATIONS    */
   /*   OPEN TEMPLATE    */

        $('#opentemplate').click(function()     {
           console.log("TEXT EDITOR: clicked open template");
               if (modified())
                   savework();
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
                                                    open($(this).prop('title'), 'text-template');
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
           console.log("TEXT EDITOR: clicked save template");
           // save with type = 'text-template'
           LOOMA.prompt('Enter a template name: ',
                        function(savename) { fileexists(savename,
                                             'text-template',
                                             function(savename) {LOOMA.alert('Template already exists: ' + savename);},
                                             function(savename) {
                                                save(savename, 'text-template', $editor.html());
                                                }
                                            );},
                        function(){return;},
                        false);
       });



   /*   DELETE TEMPLATE    */
      $('#deletetemplate').click(function() {
           console.log("TEXT EDITOR: clicked delete template");
           LOOMA.prompt('Enter a template name: ',
                    function(deletename) { fileexists(deletename,
                                         "text-template",
                                         function(deletename) { deletetext(deletename, 'text-template'); },
                                         function(deletename) {
                                             LOOMA.alert('Template not found: ' + deletename); }
                                        );},
                    function(){return;},
                    false);
                });

    /*   QUIT    */
     $('#quit').click(function()
         {
           console.log("TEXT EDITOR: clicked quit");
           if (modified()) savework();
           else window.history.back();  //race condition? savework() AJAX may not run??
         });


    /*   UNLOAD window    */

   //turn off('click') for looma toolbar BACK arrow
     //$('.back-button').off('click');
     $(".back-button").removeAttr("onclick"); //special code to remove "onclick" from toolbar back button


     $('.back-button').on('click', function()
         {
           console.log("TEXT EDITOR: toolbar BACK ARROW clicked");
           if (modified()) savework();
           else window.history.back();
         });
    });