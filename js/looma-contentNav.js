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
  var classSelected;
  var chapter_id;
  var selectedId;

  //When a chapter/lesson is selected set the database id and close the modal
  $(document).on('click', '.individualResult', function(){
    selectedId = $(this).attr('dbid');
    loadPreview(selectedId);
    $('#titleInput').val($(this).attr('title'));
  });

  //On Level Select Update the Selected level
  $('.lvlSelect').click(function(){
    $('.lvlSelect').removeClass('active');
    $(this).addClass('active');
    lvlSelected = this.id;
    if (classSelected != undefined) {
      loadPage(lvlSelected, classSelected)
    }
  });

  //On Class Select load the correct chapters
  $('.classSelect').click(function(){
    $('.classSelect').removeClass('active');
    $(this).addClass('active');
    classSelected = this.id
    if (lvlSelected != undefined) {
      loadPage(lvlSelected, classSelected);
    }
  });

  //On Class Select load the correct chapters
  $('#inputButton').click(function(){
    var titleText = $('#titleInput').val();
    if (titleText == undefined) {
      alert("Please Select An Activity First!")
    } else if (chapter_id == undefined) {
      alert("Please Select A Destination To Insert!")
    }  else {
      updateDatabase(selectedId, chapter_id, titleText);
    }
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
        search($('#searchBar').val(), true, page);
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
  // var videosChecked = document.getElementById("videosChecked").checked;
  // var webpagesChecked = document.getElementById("webpagesChecked").checked;
  // var audioChecked = document.getElementById("audioChecked").checked;
  // var imagesChecked = document.getElementById("imagesChecked").checked;
  if (!append) {
    page = 0;
  }
  var toLoad = "looma-contentNav-results.php?q=" + search + "&page=" + page;
  // toLoad = toLoad + "&videosChecked=" + videosChecked;
  // toLoad = toLoad + "&webpagesChecked=" + webpagesChecked;
  // toLoad = toLoad + "&audioChecked=" + audioChecked;
  // toLoad = toLoad + "&imagesChecked=" + imagesChecked;
  xmlhttp.open("GET", toLoad, true);
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


//Updates a given database entry
function updateDatabase(db_id, ch_id, title) {
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function() {
    if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
      window.alert("Activity " + title + " successfully updated!");
    }
  };
  xmlhttp.open("GET", "looma-contentNav-databaseUpdate.php?title=" + title + "&dbid=" + db_id + "&chid=" + ch_id);
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
