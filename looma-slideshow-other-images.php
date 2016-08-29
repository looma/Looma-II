<!--
LOOMA php code file
Filename: looma-slideshow-other-images.php
Description: Shows SEARCH bar for images that can be included in the slideshow.
A modified version of the Looma activities navigator [Ian]
Programmer name: Thomas Woodside, Charlie Donnelly, and Sam Rosenberg
Email: thomas.woodside@gmail.com
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 6/22/16
Revision: 0.3
-->
<link rel="stylesheet" href="css/looma-slideshow-contentNav.css">
<div class="thumbnail-div-first-col">
  <div class="row navbar">
    <!-- Search and Nav-->
    <div class="row search">
      <div class="centerVert">
        <form role="form">
          <div class="form-group col-md-10">
            <input type="text" id="searchBar" class="form-control" placeholder="Search Activities" size="30"
                onkeyup="search(this.value, false, 0)">
          </div>
        </form>
      </div>
    </div>
  </div>
  <!-- results -->
  <div class="row">
    <div class="results" id="resultsArea"></div>
  </div>
</div>
<script src="js/jquery.js"></script>
<script src="js/looma-slideshow-contentNav.js"></script>
