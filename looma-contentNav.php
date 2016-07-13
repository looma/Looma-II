<!--
Name: Ian
Email: ian.costello@menloschool.org
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2016 6
Revision: Looma 2.0.0
File: looma-contentNav.php
Description:  Provides a system for adding activities to the looma system
-->
<html>
<head>
  <title> Looma Content Navigation </title>

  <!-- JQuery -->
  <script src="https://ajax.googleapis.com/ajax/libs/jquery/1.12.2/jquery.min.js"></script>

  <meta name="viewport" content="width=device-width, initial-scale=1">

  <!-- Latest compiled and minified CSS -->
  <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css" integrity="sha384-1q8mTJOASx8j1Au+a5WDVnPi2lkFfwwEAa8hDDdjZlpLegxhjVME1fgjWPGmkzs7" crossorigin="anonymous">

  <!-- Optional theme -->
  <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap-theme.min.css" integrity="sha384-fLW2N01lMqjakBkx3l/M9EahuwpSfeNvV63J5ezn3uZzapT0u7EYsXMjQV+0En5r" crossorigin="anonymous">

  <!-- Latest compiled and minified JavaScript -->
  <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/js/bootstrap.min.js" integrity="sha384-0mSbJDEHialfmuBBQP6A4Qrprq5OVfW37PRR3j5ELqxss1yVqOtnepnHVP9aJ7xS" crossorigin="anonymous"></script>

  <link href="css/looma-contentNav-newDesign.css" type="text/css" rel="stylesheet">
</head>

<body>
  <div class="container-fluid">
    <div class="row navbar">
      <!-- Logo and Title -->
      <div class="row heading">
        <div class="col-sm-2">
          <img class="img-responsive logo" src="images/logos/LoomaLogoTransparentTrimmed.png" alt="Looma Logo"</img>
        </div>
        <div class="col-sm-8">
          <div id="headingTitle" class="title">Content Navigation: Assigning Activities</div>
        </div>
        <div class="col-sm-2"></div>
      </div>

      <!-- Search and Nav-->
      <div class="row search">
        <div class="centerVert">
          <div class="col-md-6">
            <!-- Search Bar -->
            <form role="form">
              <div class="form-group">
                <input type="text" id="searchBar" class="form-control" placeholder="Search Activities" size="30" onkeyup="search(this.value, false, 0)">
              </div>
            </form>
          </div>

          <!-- Content Filters All Below -->
          <div class="col-md-1 contentFilters">
            <input id="videosChecked" type="checkbox" name="fileType" value="videos" checked> Videos<br>
          </div>
          <div class="col-md-1 contentFilters">
            <input id="webpagesChecked" type="checkbox" name="fileType" value="webpages" checked> Webpages<br>
          </div>
          <div class="col-md-1 contentFilters">
            <input id="audioChecked" type="checkbox" name="fileType" value="audio" checked> Audio<br>
          </div>
          <div class="col-md-1 contentFilters">
            <input id="imagesChecked" type="checkbox" name="fileType" value="images" checked> Images<br>
          </div>
          <div class="col-md-1 contentFilters">
            <input id="pdfsChecked" type="checkbox" name="fileType" value="images" checked> Pdfs<br>
          </div>
          <div class="col-md-1">
            <button id="modeSelector" class="btn btn-secondary"> Editor </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Results -->
    <div class="row">
      <div class="col-sm-6 results" id="resultsArea"></div>
      <div class="col-sm-6">
        <div class="row preview" id="preview">
        </div>

        <!--  Edit Field -->
        <div class="row edit">
          Title: <input id="titleInput" type="text" name="firstname" value=""> <br>
          Current Class: <span id="currClass"></span> <br>
          <button id="chapterNavOpener" type="button" class="btn btn-primary" data-toggle="modal" data-target="#contentNavModal">Location To Add To</button><br>
          <button id="inputButton" class="btn btn-primary">Submit</button>
          <div id="outputField"></div>
        </div>
      </div>
    </div>

    <!-- Confirmation -->
    <div id="confirmationModal" class="modal fade" role="dialog">
      <div class="modal-dialog">
        <!-- Modal content-->
        <div class="modal-content">
          <div class="modal-header">
            <button type="button" class="close" data-dismiss="modal">&times;</button>
            <h4 class="modal-title">Confirm Location</h4>
          </div>
          <div class="modal-body">
            <div id="confirmation">Are you sure you want to add <span id="activityName"></span> to <span id="locationName"></span>?</div>
          </div>
          <div class="modal-footer">
            <button id="overrideButton" type="button" class="btn btn-default" data-dismiss="modal">Override Current</button>
            <button id="confirmButton" type="button" class="btn btn-default hidden" data-dismiss="modal">Duplicate Current</button>
            <button type="button" class="btn btn-default" data-dismiss="modal">Cancel</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Where To Add Activity To -->
    <div id="contentNavModal" class="modal fade" role="dialog">
      <div class="modal-dialog">
        <!-- Modal content-->
        <div class="modal-content">
          <div class="modal-header">
            <button type="button" class="close" data-dismiss="modal">&times;</button>
            <h4 class="modal-title">Location To Add To</h4>
          </div>
          <div class="modal-body">
            <div id="classSelect"> <?php include 'looma-contentNav-classNav.php' ?> </div>
            <div id="lessonSelect"> </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Init Script Last To Improve Load Time-->
  <script src="js/looma-contentNav.js"></script>
</body>
</html>
