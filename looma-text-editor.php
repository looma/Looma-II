<!doctype html>
<!--
LOOMA php code file
Filename: looma-text-editor.php
Description: popup php for creating and editing text slides for Looma Lesson Planner/Edited Video/Slideshow

Programmer name: Skip
Owner: VillageTech Solutions (villagetechsolutions.org)
Date:Oct 2016
Revision: Looma 2.4

Comments:
-->

<?php $page_title = 'Looma - text editor';
	  include ('includes/header.php');

      if (!loggedin()) header('Location: looma-login.php');

?>
    <link rel="stylesheet" href="css/font-awesome.min.css">
    <link rel="stylesheet" href="css/bootstrap-wysiwyg.css">
    <link rel="stylesheet" href="css/looma-text-editor.css">

</head>

<body>
	<div id="main-container-horizontal">
    <div id="title">Editing: <span class="filename">&lt;none&gt;</span> </div>

       <div class="container text-center">
            <h1>Looma Text Editor</h1>
            <div class="btn-toolbar"
                 data-role="editor-toolbar"
                 data-target="#editor">
                <div class="btn-group">
                    <a class="btn btn-default dropdown-toggle" data-toggle="dropdown" title="Font Size"><i class="fa fa-2x fa-text-height"></i>&nbsp;<b class="caret"></b></a>
                    <ul class="dropdown-menu">
                        <li><a data-edit="fontSize 8" class="fs-Eight">Huge</a></li>
                        <li><a data-edit="fontSize 6" class="fs-Six">Normal</a></li>
                        <li><a data-edit="fontSize 4" class="fs-Four">Small</a></li>
                    </ul>
                </div>
                <div class="btn-group">
                    <a class="btn btn-default dropdown-toggle" data-toggle="dropdown" title="Text Highlight Color"><i class="fa fa-2x fa-paint-brush"></i>&nbsp;<b class="caret"></b></a>
                    <ul class="dropdown-menu">
                        <p>&nbsp;&nbsp;&nbsp;Text Highlight Color:</p>
                        <li><a data-edit="backColor #FFFFFF">none</a></li>
                        <li><a data-edit="backColor #00FFFF">Blue</a></li>
                        <li><a data-edit="backColor #00FF00">Green</a></li>
                        <li><a data-edit="backColor #FF7F00">Orange</a></li>
                        <li><a data-edit="backColor #FF0000">Red</a></li>
                        <li><a data-edit="backColor #FFFF00">Yellow</a></li>
                    </ul>
                </div>
                <div class="btn-group">
                    <a class="btn btn-default dropdown-toggle" data-toggle="dropdown" title="Font Color"><i class="fa fa-2x fa-font"></i>&nbsp;<b class="caret"></b></a>
                    <ul class="dropdown-menu">
                        <p>&nbsp;&nbsp;&nbsp;Font Color:</p>
                        <li><a data-edit="foreColor #000000">Black</a></li>
                        <li><a data-edit="foreColor #0000FF">Blue</a></li>
                        <li><a data-edit="foreColor #30AD23">Green</a></li>
                        <li><a data-edit="foreColor #FF7F00">Orange</a></li>
                        <li><a data-edit="foreColor #FF0000">Red</a></li>
                        <li><a data-edit="foreColor #FFFF00">Yellow</a></li>
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
           <div id="editor" class="lead" contenteditable="true">
           </div>
        </div>
	</div>

<?php     include ('includes/toolbar.php');
   		  include ('includes/js-includes.php');
?>
        <script src="js/jquery.hotkeys.js">           </script>
    <script src="js/tether.min.js">  </script>
        <!--<script src="js/popper.js">  </script>  -->
        <script src="js/bootstrap.min.js">           </script>
        <script src="js/bootstrap-wysiwyg.min.js">   </script>

<?php     include ('includes/looma-filecommands.php');
          include ('includes/looma-search.php');
?>

        <script src="js/looma-text-editor.js">   </script>
</body>
