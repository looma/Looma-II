/*
Name: Ian
Email: ian.costello@menloschool.org
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2016 6
Revision: Looma 2.0.0
File: looma-contentNav.js
Description:  Javascript for looma-contentNav.php
*/
var resultsShown;

$(document).ready(function(){
  var page = 0;
  var lvlSelected;
  var chapter_id;

  //When a chapter/lesson is selected set the database id and close the modal
  $(document).on('click', '.individualResult', function(){
    db_id = $(this).attr("dbid");
    loadPreview(db_id);
  });

  //On Level Select Update the Selected level
  $(".lvlSelect").click(function(){
    $(".lvlSelect").removeClass("active");
    $(this).addClass("active");
    lvlSelected = this.id;
  });

  //On Class Select load the correct chapters
  $(".classSelect").click(function(){
    $(".classSelect").removeClass("active");
    $(this).addClass("active");
    loadPage(lvlSelected, this.id);
  });

  //When a chapter/lesson is selected set the database id and close the modal
  $(document).on('click', 'button.chapterButton', function(){
    var button = event.target;
    chapter_id = this.getAttribute('data-ch');
    $('#contentNavModal').modal('toggle');
  });

  //Infinite scroll
  $('#resultsArea').on('scroll', function() {
    //If There Are More Results To Show
    if (resultsShown%10 == 0) {
      //If They've Hit Bottom of Div
      if($(this)[0].scrollHeight <= $(this).scrollTop() + $(this).innerHeight()) {
        page +=1;
        search($("#searchBar").val(), true, page);
      }
    }
  })
  //Default Search
  search("", false, page);
});



//Search Function
function search(search, append, page) {
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function() {
    if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
      if (!append) {
        document.getElementById("resultsArea").innerHTML = xmlhttp.responseText;
      } else {
        document.getElementById("resultsArea").innerHTML += xmlhttp.responseText;
      }

      resultsShown = $("#resultsArea div").length;
    }
  };
  if (!append) {
    page = 0;
  }
  xmlhttp.open("GET", "looma-contentNav-results.php?q=" + search + "&page=" + page, true);
  xmlhttp.send();
}

//Load Preview
function loadPreview(db_id) {
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function() {
    if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
      document.getElementById("preview").innerHTML = xmlhttp.responseText;
    }
  };
  xmlhttp.open("GET", "looma-contentPreview.php?" + "dbid=" + db_id, true);
  xmlhttp.send();
}

//Loads all the chapters given a set className and subjectName
function loadPage(className, subjectName) {
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function() {
    if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
      document.getElementById("lessonSelect").innerHTML = xmlhttp.responseText;
    }
  };
  xmlhttp.open("GET", "looma-contentNav-lessonSelect.php?" + "class=" +
  encodeURIComponent(className) +
  "&subject=" +
  encodeURIComponent(subjectName), true);
  xmlhttp.send();
}
