/** 
* @param button: the button that is being clicked to change the theme
**/
var themeList = ["images/theme1.png", "images/them2.png"];
function changeTheme(button) {
  if(!localStorage.theme) {
    localStorage.theme = parseInt(Math.random() * themeList.length);
    document.getElementsByTagName('body')[0].background = localStorage.theme;
  }
  
}

function loadXMLDoc(dname) {
    if (window.XMLHttpRequest) {
        xhttp = new XMLHttpRequest();
    } else {
        xhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    xhttp.open("GET", dname, false);
    try {
        xhttp.responseType = "msxml-document"
    } catch (err) {} // Helping IE
    xhttp.send("");
    return xhttp;
}

function getQueryVariable(variable)
{
       var query = window.location.search.substring(1);
       var vars = query.split("&");
       for (var i=0;i<vars.length;i++) {
               var pair = vars[i].split("=");
               if(pair[0] == variable){return pair[1];}
       }
       return(false);
}