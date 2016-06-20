<html>
  <head>
    <script src='js/looma-contentNav-classNav.js'></script>
    <style>
      .button-pressed {
        background-color: orange;
      }
    </style>
  </head>
  <body>
    <!-- Level Select -->
    <div class="btn-group btn-group-justified">
      <a href="#" id="button1" class="btn btn-default lvlSelect">1</a>
      <a href="#" id="button2" class="btn btn-default lvlSelect">2</a>
      <a href="#" id="button3" class="btn btn-default lvlSelect">3</a>
      <a href="#" id="button4" class="btn btn-default lvlSelect">4</a>
      <a href="#" id="button5" class="btn btn-default lvlSelect">5</a>
      <a href="#" id="button6" class="btn btn-default lvlSelect">6</a>
      <a href="#" id="button7" class="btn btn-default lvlSelect">7</a>
      <a href="#" id="button8" class="btn btn-default lvlSelect">8</a>
    </div>

    <!-- Class Select -->
    <div class="btn-group btn-group-justified" style="margin-top:10px;" onclick="classButtonClicked">
      <a href="#" id="nepaliButton" class="btn btn-default classSelect">Nepali</a>
      <a href="#" id="englishButton" class="btn btn-default classSelect">English</a>
      <a href="#" id="mathButton" class="btn btn-default classSelect">Math</a>
      <a href="#" id="scienceButton" class="btn btn-default classSelect">Science</a>
      <a href="#" id="socialStudiesButton" class="btn btn-default classSelect">Social Studies</a>
    </div>

    <div id="lessonSelect"> </div>
  </body>
</hmtl>
