$(document).ready(function(){
    $(".individualResult").click(function(){
        $(this).children(".fullResult").slideToggle("slow");
    });
});

function search(search) {
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
            document.getElementById("resultsArea").innerHTML = xmlhttp.responseText;
        }
    };
    xmlhttp.open("GET", "looma-contentNav-results.php?q=" + search, true);
    xmlhttp.send();
}
