<!doctype html>
<!--
LOOMA php code file
Filename: xxx.php
Description:

Programmer name:
Email:
Owner: VillageTech Solutions (villagetechsolutions.org)
Date:
Revision: Looma 2.0.x

Comments:
-->

<?php $page_title = 'Looma - put page title here';
      include ('includes/header.php');
      /*OPTIONAL*/ include ('includes/mongo-connect.php');
?>

<style>

@keyframes slide {
    from {right:-100%;}
    to {right:0}
}



    iframe {display:none;
            height:75%;
            width:60%;
            border:solid red;
            position: absolute;
            top:25%;
            right:0;
            animation-name: example;
            animation-duration: 2s;
        }
    #show {position: absolute;
           top:10%;
           right:10%;
           height:10vh;
           width:10vh;}
</style>
</head>

<body>
    <div id="main-container-horizontal">

        <img src="images/logos/LoomaLogoTransparent.png" class="looma-logo" width="75%"/>

<iframe  id="iframe" src="http://localhost/Aptana/Looma/looma-pdf.php?fn=English-2.pdf&fp=../content/textbooks/Class2/English/&pg=13&zoom=50">
</iframe>
    </div>
    <button id="show"><b>&lt;</b></button>

<?php
        /*include either, but not both, of toolbar.php or toolbar-vertical.php*/
          include ('includes/toolbar.php');
        /*include ('includes/toolbar-vertical.php'); */
          include ('includes/js-includes.php');
?>
        <script src="js/looma-test.js"> </script>
</body>
