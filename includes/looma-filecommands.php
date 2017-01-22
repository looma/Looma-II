<!--
Name: Skip
Email: skip@stritter.com
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2016 11
Revision: Looma 2.4
File: includes/looma-filecommands.php
Description:  popup SEARCH panel for Looma pages
-->

  <link rel="stylesheet" href="css/looma-filecommands.css">


    <div id="commands">
        <div class="btn-group">
          <button type="button" id="cmd-btn" class="btn btn-info" data-toggle="dropdown" aria-expanded="false">
            &nbsp;File Commands &nbsp;
            <i class="fa fa-caret-down" aria-hidden="true"></i>
          </button>
          <div class="dropdown-menu">
            <button class="dropdown-item file-cmd" id="new">New</button><br>
            <button class="dropdown-item file-cmd" id="open">Open</button><br>
            <button class="dropdown-item file-cmd" id="save">Save</button><br>
            <button class="dropdown-item file-cmd" id="saveas">Save As</button><br>
            <button class="dropdown-item file-cmd" id="rename">Rename</button><br>
            <button class="dropdown-item file-cmd" id="delete">Delete</button><br>

            <div class="dropdown-divider"></div><br>

            <button class="dropdown-item file-cmd template-cmd" id="opentemplate">Open Template</button><br>
            <button class="dropdown-item file-cmd template-cmd admin" id="savetemplate">Save Template</button><br>
            <button class="dropdown-item file-cmd template-cmd admin" id="deletetemplate">Delete Template</button><br>

            <div class="dropdown-divider"></div><br>

            <button class="dropdown-item file-cmd" id="quit">Quit</button>
          </div>
        </div>
      </div>


    <script src="js/looma-filecommands.js">   </script>

<?php
?>