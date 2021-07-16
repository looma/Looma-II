<!doctype html>
<!--
Filename: looma-blockly.php
Description: looma PHP with Blockly Intepreter in Javascript
Contains 2 popups that show Javascript and run Blockly code 
All Categories of Blocks to chose and build code
Trashcan to delete blocks 

Blockly Editor

Author: Mitsuka
Owner:  Looma Education Company
Date:   2021
Revision: Looma 3
-->

<!-- change color of text for category, edit color theme for each category --> 

    <?php $page_title = 'Looma Blockly';
        require_once ('includes/header.php');
    ?>

    <link rel="stylesheet" href="css/looma-blockly.css">
</head>

<body>
    <div id="main-container-horizontal">
        <div id="fullscreen">
            <div id="blocklyArea">
                <h1 class="title">Blockly Editor with Javascript Interpreter</h1>
                <button id="show-js" class="js-control" onclick="showCode()">Show JavaScript</button>
                <button id="run-js"  class="js-control" onclick="runCode()"> Run JavaScript </button>

                <div id="blocklyDiv" style="height: 480px; width: 600px; margin:0 auto;"></div>

                <?php require_once('looma-blockly.xml')?>
            </div>
        </div>
    </div>

    <?php include ('includes/toolbar.php'); ?>
    <?php include ('includes/js-includes.php'); ?>

    <script src="js/blockly/blockly_compressed.js"></script>
    <script src="js/blockly/blocks_compressed.js"></script>
    <script src="js/blockly/javascript_compressed.js"></script>
    <script src="js/blockly/en.js"></script>

    <script src="js/looma-blockly.js"></script>

    <xml id="toolbox" style="display: none">
        <block type="controls_if"></block>
        <block type="controls_repeat_ext"></block>
        <block type="logic_compare"></block>
        <block type="math_number"></block>
        <block type="math_arithmetic"></block>
        <block type="text"></block>
        <block type="text_print"></block>
    </xml>

</body>
</html>



