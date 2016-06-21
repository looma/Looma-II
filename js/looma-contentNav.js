/*
Name: Ian
Email: ian.costello@menloschool.org
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2016 6
Revision: Looma 2.0.0
File: looma-contentNav.js
Description:  Javascript for looma-contentNav.php
*/

$(document).ready(function(){
  var page = 0;
  var lvlSelected;
  var chapter_id;

  //Expand Result To Show Full Result
  $(".individualResult").click(function(){
    $(this).children(".fullResult").slideToggle("slow");
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

  //On Hover Grab the next 10 results
  $('#loadMore').mouseover(function() {
    page +=1;
    search($("#searchArea").val(), true, page);
  });

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
    }
  };
  if (!append) {
    page = 0;
  }
  xmlhttp.open("GET", "looma-contentNav-results.php?q=" + search + "&page=" + page, true);
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
