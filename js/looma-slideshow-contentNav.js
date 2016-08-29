/*
Name: Ian
Email: ian.costello@menloschool.org
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2016 6
Revision: Looma 2.0.0
File: looma-slideshow-contentNav.js
Description:  Javascript for looma-contentNav.php

Edited by Thomas Woodside for use with Looma Picture Player.
*/
var resultsShown;

$(document).ready(function(){
  var page = 0;

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
  });
  $(':checkbox').change(function() {
    search($('#searchBar').val(), false, page);
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

      resultsShown = $("#resultsArea div").length;
    }
  };
  if (!append) {
    page = 0;
  }
  var toLoad = "looma-slideshow-contentNav-results.php?q=" + search + "&page=" + page;

  xmlhttp.open("GET", toLoad, true);
  xmlhttp.send();
}
