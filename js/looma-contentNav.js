$(document).ready(function(){
  var page = 0;
  var lvlSelected;
  $(".individualResult").click(function(){
    $(this).children(".fullResult").slideToggle("slow");
  });
  $(".lvlSelect").click(function(){
    $(".lvlSelect").removeClass("active");
    $(this).addClass("active");
    lvlSelected = this.id;
  });
  $(".classSelect").click(function(){
    $(".classSelect").removeClass("active");
    $(this).addClass("active");
    loadPage(lvlSelected, this.id);
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

  $("button.chapter").click(function() {
    //called when a CHAPTER button is pressed
    var button = event.target;
    var chapter_id = this.getAttribute('data-ch');
    alert(chapter_id);
  });

  //scroll to prior scroll position
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
  if (!append) {
    page = 0;
  }
  xmlhttp.open("GET", "looma-contentNav-results.php?q=" + search + "&page=" + page, true);
  xmlhttp.send();
}

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
