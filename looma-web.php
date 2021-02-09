<!doctype html>
<!--
Author:

Filename: yyy.html
Date: x/x/2015
Description:
-->

	<?php  $page_title = 'Looma Web Page';
	include ('includes/header.php'); ?>
	<link rel="stylesheet" href="css/looma-web.css">
	</head>

	<body>
    <div id="main-container-horizontal">
        <div id="fullscreen">
            <?php include ('includes/looma-control-buttons.php');?>
            <div id="web-controls">
                <button class="left-control" id="back">
                    <img src="images/back-arrow.png"/>
                    <?php tooltip('Back');?>
                </button>
                <button class="left-control" id="forward">
                    <img src="images/forward-arrow.png"/>
                    <?php tooltip('Forward');?>
                </button>
                <input id="address-bar"/>
                <button class="right-control" id="submit"><?php keyword('Go');?></button>
            </div>

            <h1 class="credit"> Created by Akshay</h1>
            <!-- if internet is accessible, JS will load an external website (e.g. Bing) in the iframe -->
            <iframe id="frame" allowfullscreen sandbox="allow-scripts allow-same-origin"></iframe>
        </div>
    </div>

   	<?php include ('includes/toolbar.php'); ?>
   	<?php include ('includes/js-includes.php'); ?>

   	<script src="js/looma-web.js"></script>
</body>
