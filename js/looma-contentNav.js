$(document).ready(function(){
  var page = 0;
  $(".individualResult").click(function(){
    $(this).children(".fullResult").slideToggle("slow");
  });
  $(".lvlSelect").click(function(){
    $(".lvlSelect").removeClass("active");
    $(this).addClass("active");
  });
  $(".classSelect").click(function(){
    $(".classSelect").removeClass("active");
    $(this).addClass("active");
  });
  // $(document).scroll(function() {
  //   if (document).height() {
  //     alert("hello");
  //   }
  // })
  $('#loadMore').mouseover(function() {
    page +=1;
    search($("#searchArea").val(), true, page);
  });

  search("", false, page);
});

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
  xmlhttp.open("GET", "looma-contentNav-results.php?q=" + search + "&page=" + page, true);
  xmlhttp.send();
}

function classButtonClicked(){
  //called when a CLASS button is pressed
  className = this.getAttribute('id');
  activateClass(className);              //activate this CLASS - highlights the button
  LOOMA.setStore("class", className, 'local');  //set a COOKIE for CLASS (lifetime = this browser session)
  displaySubjects(className);              // display SUBJECT buttons for this CLASS
  activateSubject(null);                  // de-activate all SUBJECTS

}; // end classButtonClicked()

function subjectButtonClicked(){
  //called when a SUBJECT button is pressed
  subjectName = this.getAttribute('id');
  LOOMA.setStore("subject", subjectName, 'local');  //set a COOKIE for SUBJECT (lifetime = this browser session)
  //send GET request to chapters.php with CLASS and SUBJECT values

  //set scroll position to top of page
  LOOMA.setStore('scroll', 0), 'session';

  loadPage(className, subjectName);
};  //  end subjectButtonClicked()

//See contentNav for jQuery listeners
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
