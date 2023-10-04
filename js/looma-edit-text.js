  /*
    LOOMA javascript file
    Filename: looma-text-editor.JS
    Description:

    NOTE: This JS is for looma-edit-text.php - the normal looma page for editing text files
    NOTE: there is a different JS (looma-text-frame.js)
            for use in iframes when text editing is called from inside
            another editor [e.g. lesson-plan.php
            
    Programmer name: skip
    Owner: VillageTech Solutions (villagetechsolutions.org)
    Date: nov 2016
    Revision: Looma 2.4
     */

  'use strict';

  /*define functions here */

  var $editor; //the DIV where the HTML is being edited
  var savedHTML; //savedHTML is textcheckpoint of HTML for checking for modification
  var loginname, loginlevel, loginteam;
  var previewtimer;
  var author;
  var thumbrequest;
  
  /*  callback functions and assignments expected by looma-filecommands.js:  */
  callbacks['clear'] = textclear;
  callbacks['save'] = textsave;
  callbacks['savetemplate'] = texttemplatesave;
  //callbacks ['open']  = textopen;
  callbacks['display'] = textdisplay;
  callbacks['modified'] = textmodified;
  callbacks['showsearchitems'] = textshowsearchitems;
  callbacks['checkpoint'] = textcheckpoint;
  callbacks['undocheckpoint'] = textundocheckpoint;
  //callbacks ['quit'] not overridden - use default action from filecommands.js

  currentname = "";
  currentcollection = 'text_files';
  currentfiletype = 'text';
  currentDB = 'loomalocal';
  
  $('#collection').val('text');
  $('#filesearch-ft').val('text');
  
  function textcheckpoint() {         savedHTML =   $editor.html(); }
  function textundocheckpoint() {     $editor.html( savedHTML);     }  //not used now??
  function textmodified()   { return (savedHTML !== $editor.html());}
  
  function textclear() {
      setname("", "");
      //currentid = "";
      $editor.html("");
      $('#preview').empty().hide();
      textcheckpoint();
      $editor.focus();
  }
  
  function textdisplay(response) {
      textclear();
      setname(response['dn'], response['author']);
      author = response['author'];
      $editor.html(response.data);
      currentDB = response.db ? response.db : 'looma';
    
      textcheckpoint();
  }

  function textsave(name) {
      //$editor.cleanHtml(); wysiwyg.js has no "cleanHTML" function. NOTE: we should probably write our own
      savefile(name, currentcollection, currentfiletype, $editor.html(), "true",null);
  } //end testsave()

  function texttemplatesave(name) {
      //$editor.cleanHtml(); wysiwyg.js has no "cleanHTML" function. NOTE: we should probably write our own
      savefile(name, currentcollection, currentfiletype + '-template', $editor.html(), "false",null);
  } //end testsave()

  function textshowsearchitems() {
      $('#txt-chk').show();
      // for TEXT EDIT, only show "text", clicked and disabled
      $('#txt-chk input').attr('checked', true).css('opacity', 0.5);
      //$('#txt-chk input').prop('readonly'); //cant make 'readonly' work
      $('#txt-chk input').click(function() {
          return false;
      });
      
      // special case: if user wants OPEN TEMPLATE, do the search right away
      //    returns ALL the text templates
      if (currentcollection === 'text' && template) {
          $('#filesearch #filesearch-ft').val('text-template');
          $('#filesearch-collection').val(currentcollection);
          $('#filesearch-submit').trigger('click');
      };
  }  // end textshowsearchitems()

  
  function openPreview (button) {
      if (thumbrequest) thumbrequest.abort();
      thumbrequest = $.post("looma-database-utilities.php",
          {cmd: "openByID",
              collection: currentcollection,
              id:$(button).data('id'),
              db:$(button).data('db'),
              ft: 'text'},
          function(response) {
              $('#preview').html(response['data']).show();
             // previewtimer = setTimeout(function(){ closePreview(); }, 15000);
          },
         'json'
      );
};
  
  function closePreview() {
        $('#preview').hide();
        previewtimer = null;
  };
  
  $(document).ready(function() {

      $('#preview').hide();   // hide the preview window
      
      //show #preview area when hover over a filesearch-results button
      $('#filesearch-results').on('mouseover', 'button', function(){
          closePreview(); openPreview(this);
         // hovertimer = setTimeout(function(){ closePreview(); }, 15000);
      });
      $('#filesearch-results').on('mouseout ',  'button', function(){
          //hovertimer = null;
          closePreview();
      });
      $('.cancel-filesearch').click( closePreview ); // end cancelFilesearch()
      $('#filesearch-results').on('click', 'button', closePreview);
      
      $('#dismiss').off('click').click( function() { quit();});  //disable default DISMISS btn function and substitute QUIT()

      $editor = $('#editor .text-display'); //the DIV where the HTML is being edited
      $editor.wysiwyg();
      
      document.execCommand('styleWithCSS', false, true);
      document.execCommand('fontSize',     false, 5);
      document.execCommand('justifyCenter',false, true);
      
      textclear();
      document.execCommand('bold',         false, true); //has to be AFTER the TESTCLEAR() call
      document.execCommand('foreColor',    false, '#091F48');
      $editor.focus();

      loginname  = LOOMA.loggedIn();
      loginlevel = LOOMA.readCookie('login-level');
      loginteam  = LOOMA.readCookie('login-team');
      
      if (loginname && (loginlevel === 'admin' || loginlevel === 'exec')) $('.admin').show();
      if (loginlevel !== 'exec') $editor.on('paste',function(){ if (loginteam !== 'management') return false;});

      
      //$('#main-container').disable();
      //LOOMA.makeTransparent($('#main-container'));
      
      $('#filecommands').trigger('click');
    
      if ($('#text_file_name').attr('data-dn')) openfile( decodeURIComponent($('#text_file_name').attr('data-dn')),'text_files', 'text');
      if ($('#text_file_id').attr('data-id')) openfile( decodeURIComponent($('#text_file_id').attr('data-id')),'text_files', 'text');
    
      $('.file-cmd#saveas').click(function(){currentcollection = 'text_files';  currentDB = 'loomalocal'});
    
  });
