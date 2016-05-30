/*
http://www.javascripter.net/faq/screensi.htm

Determining the screen size in JavaScript

 Contents | JavaScript FAQ | Client & Browser Configuration FAQ	 	
Question: How do I get the screen size on the client machine?

Answer: To determine the screen size on the client machine, use the properties screen.width and screen.height supported in all major browsers.

If you need a reduced value (subtracting the screen portion occupied by toolbars etc.), use screen.availWidth and screen.availHeight.

Historical note: For Netscape Navigator 3 (with Java enabled), you could use a Java call to get the screen width and height (see the example below).

The following code sets the variables screenW and screenH to the actual width and height of the screen, and outputs the width and height values. If the user has an old browser, then screenW and screenH are set to 640 and 480, respectively.
*/
'use strict';

var screenW = 640, screenH = 480;
if (parseInt(navigator.appVersion)>3) {
 screenW = screen.width;
 screenH = screen.height;
}
else if (navigator.appName == "Netscape" 
    && parseInt(navigator.appVersion)==3
    && navigator.javaEnabled()
   ) 
{
 var jToolkit = java.awt.Toolkit.getDefaultToolkit();
 var jScreenSize = jToolkit.getScreenSize();
 screenW = jScreenSize.width;
 screenH = jScreenSize.height;
}

document.write(
 "Screen width = "+screenW+"<br>"
+"Screen height = "+screenH
);
