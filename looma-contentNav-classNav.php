<!--
Name: Ian
Email: ian.costello@menloschool.org
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2016 6
Revision: Looma 2.0.0
File: looma-contentNav-classNav.php
Description:  Button Groups To Select Class
-->
<html>
  <head>
   <!--
        <script src='js/looma-contentNav-classNav.js'></script>
    -->

    <style>
      .button-pressed {
        background-color: orange;
      }
    </style>
  </head>
  <body>
    <!-- Level Select NOTE: ID Relates To Position in Database -->
    <div class="btn-group btn-group-justified">
      <a href="#" id="class1" class="btn btn-default lvlSelect">1</a>
      <a href="#" id="class2" class="btn btn-default lvlSelect">2</a>
      <a href="#" id="class3" class="btn btn-default lvlSelect">3</a>
      <a href="#" id="class4" class="btn btn-default lvlSelect">4</a>
      <a href="#" id="class5" class="btn btn-default lvlSelect">5</a>
      <a href="#" id="class6" class="btn btn-default lvlSelect">6</a>
      <a href="#" id="class7" class="btn btn-default lvlSelect">7</a>
      <a href="#" id="class8" class="btn btn-default lvlSelect">8</a>
    </div>

    <!-- Level Select NOTE: ID Relates To Position in Database -->
    <div id="subjectSelect" class="btn-group btn-group-justified">
      <a href="#" id="english" class="btn btn-default classSelect">English</a>
      <a href="#" id="math" class="btn btn-default classSelect">Math</a>
      <a href="#" id="science" class="btn btn-default classSelect">Science</a>
      <a href="#" id="social studies" class="btn btn-default classSelect">Social Studies</a>
    </div>

    <button id="unassignButton" type="button" class="btn btn-default"> Remove </button>
    <button id="searchLessonButton" type="button" class="btn btn-default"> Search </button>

    <div id="lessonSelect"> </div>
  </body>
</hmtl>
