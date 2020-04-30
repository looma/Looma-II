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
      /*OPTIONAL include ('includes/mongo-connect.php');*/
?>

<style>
    #pdf {height:100%;
            width:100%;
            border:solid red;
        }
</style>
</head>

<body>
    <!--<div id="main-container-horizontal">-->
    <div id="main-container-vertical">

        <object id="pdf" data="../content/textbooks/Class2/Nepali/Nepali-2.pdf" type="application/pdf">
            <embed src="../content/textbooks/Class2/English/English-2.pdf" type="application/pdf">
               <p>This browser does not support PDFs</p>
            </embed>
        </object>

    </div>


<?php
        /* include ('includes/toolbar.php');*/
         include ('includes/toolbar-vertical.php');
          include ('includes/js-includes.php');
?>
        <!--<script src="js/looma-test.js"> </script>-->
</body>
