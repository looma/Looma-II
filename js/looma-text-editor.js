  /*
    LOOMA javascript file
    Filename: looma-text-editor.JS
    Description:

    NOTE: This JS is for looma-text-editor.php - the normal looma page for editing text files
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
  var loginname;

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

  function textcheckpoint() {         savedHTML =   $editor.html(); };
  function textundocheckpoint() {     $editor.html( savedHTML);     };  //not used now??
  function textmodified()   { return (savedHTML !== $editor.html());};


  function textclear() {
      setname("");
      //currentid = "";
      $editor.html("");
      textcheckpoint();
      $editor.focus();
  };

  function textdisplay(response) {
      $editor.html(response.data);
  };

  function textsave(name) {
      //$editor.cleanHtml(); wysiwyg.js has no "cleanHTML" function. NOTE: we should probably write our own
      savefile(name, currentcollection, currentfiletype, $editor.html(), "true");
  }; //end testsave()

  function texttemplatesave(name) {
      //$editor.cleanHtml(); wysiwyg.js has no "cleanHTML" function. NOTE: we should probably write our own
      savefile(name, currentcollection, currentfiletype + '-template', $editor.html(), "false");
  }; //end testsave()

  function textshowsearchitems() {
      $('#txt-chk').show();
      // for TEXT EDIT, only show "text", clicked and disabled
      $('#txt-chk input').attr('checked', true).css('opacity', 0.5);
      //$('#txt-chk input').prop('readonly'); //cant make 'readonly' work
      $('#txt-chk input').click(function() {
          return false;
      });
  };

  
  function openPreview (button) {
      $.post("looma-database-utilities.php",
      
          {cmd: "openByID", collection: currentcollection, id:$(button).data('id'), ft: 'text'},
          function(response) {
              $('#preview').html(response['data']).show();
          },
         'json'
      );
};
  
  $(document).ready(function() {

      $('#preview').hide();   // hide the preview window
      
      //show #preview area when hover over a filesearch-results button  [NOT WORKING YET]
      $('#filesearch-results').on('mouseover', 'button', function(){openPreview(this)});
      $('#filesearch-results').on('mouseout blur',  'button', function(){$('#preview').empty().hide();});

      $('#dismiss').off('click').click( function() { quit();});  //disable default DISMISS btn function and substitute QUIT()

      $editor = $('#editor'); //the DIV where the HTML is being edited
      $editor.wysiwyg();
      document.execCommand('styleWithCSS', false, true);
      document.execCommand('fontSize',     false, 5);
      document.execCommand('justifyCenter',false, true);
      
      textclear();
      document.execCommand('bold',         false, true); //has to be AFTER the TESTCLEAR() call
      document.execCommand('foreColor',    false, '#091F48');
      $editor.focus();

      loginname = LOOMA.loggedIn();
    
      if (loginname && (loginname == 'kathy' ||
                        loginname == 'david' ||
                        loginname == 'skip' ))
          $('.admin').show();

      
      //$('#main-container').disable();
      //LOOMA.makeTransparent($('#main-container'));
      
      $('#filecommands').trigger('click');
      
      if ($('#text_file_name').attr('data-dn')) openfile( decodeURIComponent($('#text_file_name').attr('data-dn')),'text_files', 'text');
  });
