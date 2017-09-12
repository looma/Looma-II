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

  currentname = "";
  currentcollection = 'text';
  currentfiletype = 'text';

  $('#collection').val('text');

  function textcheckpoint() {
      savedHTML = $editor.html();
  };

  function textundocheckpoint() {
      $editor.html(savedHTML);
  }; //not used now??
  function textmodified() {
      return (savedHTML !== $editor.html());
  };

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

  $(document).ready(function() {

      //$('#dismiss').click( function() { quit();});

      $editor = $('#editor'); //the DIV where the HTML is being edited
      $editor.wysiwyg();
      textclear();

      loginname = LOOMA.loggedIn();
      if (loginname && (loginname == 'kathy' || loginname == 'david' ||
              loginname == 'vivian' || loginname == 'skip' || loginname ==
              'akshay')) $('.admin')
          .show();

  });
