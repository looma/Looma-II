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

    <div id="filecommands">
        <div class="btn-group">
          <button type="button" id="cmd-btn" class="btn btn-info" data-toggle="dropdown" aria-expanded="false">
            &nbsp;File Commands&nbsp;
            <i class="fa fa-caret-down" aria-hidden="true"></i>
          </button>
          <div class="dropdown-menu">
            <button class="dropdown-item file-cmd" id="new">New</button><br>
            <button class="dropdown-item file-cmd" id="open">Open</button><br>
            <button class="dropdown-item file-cmd" id="save">Save</button><br>
            <button class="dropdown-item file-cmd" id="saveas">Save As</button><br>
            <button class="dropdown-item file-cmd" id="rename">Rename</button><br>
            <button class="dropdown-item file-cmd" id="delete">Delete</button><br>
            <!-- added New Text File button to launch text card editor in iFrame.
                 this button initially hidden by css -->
            <button class="dropdown-item file-cmd" id="show_text">Edit a Text File</button><br>

            <div class="dropdown-divider"></div><br>

            <button class="dropdown-item file-cmd template-cmd"       id="opentemplate">Open Template</button><br>
            <button class="dropdown-item file-cmd template-cmd admin" id="savetemplate">Save Template</button><br>
            <button class="dropdown-item file-cmd template-cmd admin" id="saveastemplate">Save As Template</button><br>
            <button class="dropdown-item file-cmd template-cmd admin" id="deletetemplate">Delete Template</button><br>

            <div class="dropdown-divider"></div><br>

            <button class="dropdown-item file-cmd" id="quit">Quit</button>
          </div>
        </div>
      </div>


<?php
/**************  Search  *************

Description:  search code for Looma Editors to find lesson-plans, slideshows, etc
    this is separate from looma-search.php which is for searching for any activity file
*/
?>


<div id='filesearch-panel'>
    <p class='filesearch-collectionname'></p>

    <form id='filesearch' name='filesearch'>
        <input type='hidden' id='filesearch-collection' value='activities' name='collection'/>  <!-- JS must set "currentcollection"  -->
        <input type='hidden' id='filesearch-cmd' value='search' name='cmd'/>
        <input type='hidden' id='filesearch-ft' value='' name='type[]'/>

        <?php
        /**************************************/
        /************* Search Bar *************/
        /**************************************/
        echo "<div id='filesearch-bar' class='media-filter'>
            <input id='filesearch-term' type='text' class='media-input black-border' type='search' name='search-term' placeholder='Enter Search Term...'>&nbsp;
            <button id='filesearch-submit' class = 'filesearch' name='search' value='value' type='submit'>
            <button class='clear-filesearch' type='button'>Clear</button>
        </div>";


        /**************************************/
        /********** File Type Fields **********/
        /**************************************/

        ?>
        <button class='cancel-filesearch' type='button'>Cancel</button>
    </form>
</div>

<div id="filesearch-results"></div>

    <script src="js/looma-filecommands.js">   </script>
