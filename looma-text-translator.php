<?php
//function isLoggedIn() { return (isset($_COOKIE['login']) ? $_COOKIE['login'] : null);};
require_once('includes/looma-isloggedin.php');

// NOTE: this code sending "header" must be before ANY data is sent to client=side
$loggedin = loggedIn(); if (!$loggedin) header('Location: looma-login.php');
error_log("Starting Text Translate session. logged in as: " . $loggedin);
?>

<!doctype html>
<!--
LOOMA php code file
Filename: looma-text-translator.php
Description: popup php for translating text slides into native language

Programmer name: Skip
Owner: VillageTech Solutions (villagetechsolutions.org)
Date:Jul 2019
Revision: Looma 5.2

Comments: Uses wysiwyg.js to create, edit and store "text cards" for Looma [in lesson plans, edited videos, etc]
          Opens in an iFrame within another editor, like looma-lesson-plan.php
-->

<?php $page_title = 'Looma - text translator';
include ('includes/header.php');
?>
<link rel="stylesheet" href="css/tether.min.css">         <!-- needed by bootstrap.css -->
<link rel="stylesheet" href="css/bootstrap.min.css">
<link rel="stylesheet" href="css/font-awesome.min.css">
<link rel="stylesheet" href="css/bootstrap-looma-wysiwyg.css">
<!--
-->
<link rel="stylesheet" href="css/looma-edit-text.css">
<link rel="stylesheet" href="css/looma-text-display.css">
<link rel="stylesheet" href="css/looma-text-translator.css">


</head>

<body>
<div id="main-container">
    <div id="title">Translating: <span class="filename">&lt;none&gt;</span> </div>
    <div id="english"></div>

    <div class="container text-center">
        <h1>Looma Text Translator</h1>
        <div class="btn-toolbar"
             data-role="editor-toolbar"
             data-target="#editor">

            <!--            <div class="btn-group">
                            <a class="btn btn-default dropdown-toggle" data-toggle="dropdown" title="Font Size"><i class="fa fa-2x fa-text-height"></i>&nbsp;<b class="caret"></b></a>
                            <ul class="dropdown-menu">
                                <li><a data-edit="fontSize 4" >Tiny</a></li>
                                <li><a data-edit="fontSize 5" >Small</a></li>
                                <li><a data-edit="fontSize 6" >Normal</a></li>
                                <li><a data-edit="fontSize 7" >Large</L></a></li>
                            </ul>
                        </div>
            -->
            <div class="btn-group">
                <a class="btn btn-default dropdown-toggle" data-toggle="dropdown" title="Text Highlight Color"><i class="fa fa-2x fa-paint-brush"></i>&nbsp;<b class="caret"></b></a>
                <ul class="dropdown-menu">
                    <p>&nbsp;&nbsp;&nbsp;Text Highlight Color:</p>
                    <li><a data-edit="backColor #FFFFFF">White</a></li>
                    <li><a data-edit="backColor #FFFF00">Yellow</a></li>
                    <li><a data-edit="backColor #FF7F00">Orange</a></li>
                    <li><a data-edit="backColor #FF0000">Red</a></li>
                    <li><a data-edit="backColor #00FF00">Green</a></li>
                    <li><a data-edit="backColor #091F48">Looma Blue</a></li>
                </ul>
            </div>
            <div class="btn-group">
                <a class="btn btn-default dropdown-toggle" data-toggle="dropdown" title="Font Color"><i class="fa fa-2x fa-font"></i>&nbsp;<b class="caret"></b></a>
                <ul class="dropdown-menu">
                    <p>&nbsp;&nbsp;&nbsp;Font Color:</p>
                    <li><a data-edit="foreColor #FFFFFF">White</a></li>
                    <li><a data-edit="foreColor #FFFF00">Yellow</a></li>
                    <li><a data-edit="foreColor #FF7F00">Orange</a></li>
                    <li><a data-edit="foreColor #FF0000">Red</a></li>
                    <li><a data-edit="foreColor #30AD23">Green</a></li>
                    <li><a data-edit="foreColor #091F48">Blue</a></li>  <!-- 091F48 -->
                    <!-- <li><a data-edit="foreColor #000000">Black</a></li> -->
                </ul>
            </div>
            <div class="btn-group">
                <a class="btn btn-default btn-info" data-edit="bold"   title="Bold"><i class="fa fa-2x fa-bold"></i></a>
                <a class="btn btn-default" data-edit="italic" title="Italic"><i class="fa fa-2x fa-italic"></i></a>
                <!--
                    <a class="btn btn-default" data-edit="strikethrough" title="Strikethrough"><i class="fa fa-2x fa-strikethrough"></i></a>
                -->
                <a class="btn btn-default" data-edit="underline" title="Underline"><i class="fa fa-2x fa-underline"></i></a>
            </div>
            <div class="btn-group">
                <a class="btn btn-default" data-edit="insertunorderedlist" title="Bullet list"><i class="fa fa-2x fa-list-ul"></i></a>
                <a class="btn btn-default" data-edit="insertorderedlist"   title="Number list"><i class="fa fa-2x fa-list-ol"></i></a>
            </div>
            <div class="btn-group">
                <a class="btn btn-default" data-edit="outdent" title="Reduce indent"><i class="fa fa-2x fa-outdent"></i></a>
                <a class="btn btn-default" data-edit="indent"  title="Indent"><i class="fa fa-2x fa-indent"></i></a>
            </div>
            <div class="btn-group">
                <!-- add CLASS "btn-info" to pre-select a button-->
                <a class="btn btn-default btn-info" data-edit="justifyleft"   title="Align Left"><i class="fa fa-2x fa-align-left"></i></a>
                <a class="btn btn-default" data-edit="justifycenter" title="Center"><i class="fa fa-2x fa-align-center"></i></a>
                <a class="btn btn-default" data-edit="justifyright"  title="Align Right"><i class="fa fa-2x fa-align-right"></i></a>
                <!--
              <a class="btn btn-default" data-edit="justifyfull" title="Justify (Ctrl/Cmd+J)"><i class="fa fa-2x fa-align-justify"></i></a>
               -->
            </div>

            <div class="btn-group">
                <a class="btn btn-default" data-edit="undo" title="Undo"><i class="fa fa-2x fa-undo"></i></a>
                <a class="btn btn-default" data-edit="redo" title="Redo"><i class="fa fa-2x fa-repeat"></i></a>
            </div>
        </div>

        <?php
        if (isset($_REQUEST['dn'])) {
            $dn = $_REQUEST['dn'];
            echo "<div id='text_file_name' data-dn=" . rawurlencode($dn) . " hidden></div>";
        };
        ?>

        <div id="text-editor-container">
            <div id="editor" class="lead text-display" contenteditable="true"></div>
        </div>
    </div>
</div>
<div id="preview" class="text-display"></div>
<img id="padlock"
     draggable="false"
     src="  <?php echo loggedIn() ? "images/padlock-open.png" : "images/padlock-closed.png"; ?>" >

<p id="login-id" ><?php if (loggedIn()) echo "You are logged in as '" . $_COOKIE['login'] ."'" ?></p>



<button class='control-button' id='dismiss' ></button>

<?php   include ('includes/js-includes.php');
?>

<script src="js/jquery.hotkeys.js">           </script>
<script src="js/tether.min.js">  </script>
<script src="js/bootstrap.min.js">           </script>
<script src="js/bootstrap-wysiwyg.min.js">   </script>

<?php     include ('includes/looma-filecommands.php');
?>

<script src="js/looma-text-translator.js">   </script>
</body>
