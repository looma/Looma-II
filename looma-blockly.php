<!doctype html>
<!--
Filename: looma-temp-blocklygen2.php
Description: looma PHP template with Blockly Intepreter in Javascript
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

<head>
    <?php $page_title = 'Looma Page Template';
        require_once ('includes/header.php');
        /* header.php imports: CSS: looma.css, looma-keyboard.css, bootstrap.css */
    ?>
    
    <script src="js/blockly/blockly_compressed.js"></script>
    <script src="js/blockly/blocks_compressed.js"></script>
    <script src="js/blockly/javascript_compressed.js"></script>
    <script src="js/blockly/en.js"></script>

    <link rel="stylesheet" href="css/looma-template.css"> 

</head>

<body>
    <div id="main-container-horizontal">
        <div id="fullscreen">
            <span><img src="images/logos/LoomaLogoTransparent.png" width="500"></span>
            <h2>Blockly Editor with Javascript Interpreter</h2>
            <p>&rarr; More info on <a href="https://developers.google.com/blockly/guides/configure/web/code-generators">Code Generators</a> and <a href="https://developers.google.com/blockly/guides/app-integration/running-javascript">Running JavaScript</a>.</p>
            <p>
                <button onclick="showCode()">Show JavaScript</button>
                <button onclick="runCode()">Run JavaScript</button>
            </p>

            <div id="blocklyDiv" style="height: 480px; width: 600px; margin:0 auto;"></div>
            <xml xmlns="https://developers.google.com/blockly/xml" id="toolbox" style="display: none">
                <!-- Logic --> 
                <category name="Logic" colour="%{BKY_LOGIC_HUE}">
                  <block type="controls_if"></block>
                  <block type="logic_compare"></block>
                  <block type="logic_operation"></block>
                  <block type="logic_negate"></block>
                  <block type="logic_boolean"></block>
                </category>
                <!-- Loops -->
                <category name="Loops" colour="%{BKY_LOOPS_HUE}">
                  <block type="controls_repeat_ext">
                    <value name="TIMES">
                      <block type="math_number">
                        <field name="NUM">10</field>
                      </block>
                    </value>
                  </block>
                  <block type="controls_ifols_whileUntil"></block>
                </category>
                <!-- Math --> 
                <category name="Math" colour="%{BKY_MATH_HUE}">
                  <block type="math_number" gap="32">
                    <field name="NUM">123</field>
                  </block>
                  <block type="math_arithmetic">
                    <value name="A">
                      <shadow type="math_number">
                        <field name="NUM">1</field>
                      </shadow>
                    </value>
                    <value name="B">
                      <shadow type="math_number">
                        <field name="NUM">1</field>
                      </shadow>
                    </value>
                  </block>
                  <block type="math_single">
                    <value name="NUM">
                      <shadow type="math_number">
                        <field name="NUM">9</field>
                      </shadow>
                    </value>
                  </block>
                  <block type="math_trig">
                    <value name="NUM">
                      <shadow type="math_number">
                        <field name="NUM">45</field>
                      </shadow>
                    </value>
                  </block>
                  <block type="math_constant"></block>
                  <block type="math_number_property">
                    <value name="NUMBER_TO_CHECK">
                      <shadow type="math_number">
                        <field name="NUM">0</field>
                      </shadow>
                    </value>
                  </block>
                  <block type="math_round">
                    <value name="NUM">
                      <shadow type="math_number">
                        <field name="NUM">3.1</field>
                      </shadow>
                    </value>
                  </block>
                  <block type="math_on_list"></block>
                  <block type="math_modulo">
                    <value name="DIVIDEND">
                      <shadow type="math_number">
                        <field name="NUM">64</field>
                      </shadow>
                    </value>
                    <value name="DIVISOR">
                      <shadow type="math_number">
                        <field name="NUM">10</field>
                      </shadow>
                    </value>
                  </block>
                  <block type="math_constrain">
                    <value name="VALUE">
                      <shadow type="math_number">
                        <field name="NUM">50</field>
                      </shadow>
                    </value>
                    <value name="LOW">
                      <shadow type="math_number">
                        <field name="NUM">1</field>
                      </shadow>
                    </value>
                    <value name="HIGH">
                      <shadow type="math_number">
                        <field name="NUM">100</field>
                      </shadow>
                    </value>
                  </block>
                  <block type="math_random_int">
                    <value name="FROM">
                      <shadow type="math_number">
                        <field name="NUM">1</field>
                      </shadow>
                    </value>
                  </block>
                </category>


                <!--Text --> 
                <category name="Text" colour="%{BKY_TEXTS_HUE}">
                  <block type="text"></block>
                    <block type="text_multiline"></block>
                    <block type="text_join"></block>
                    <block type="text_append">
                      <value name="TEXT">
                        <shadow type="text"></shadow>
                      </value>
                    </block>
                    <block type="text_length">
                      <value name="VALUE">
                        <shadow type="text">
                          <field name="TEXT">abc</field>
                        </shadow>
                      </value>
                    </block>
                    <block type="text_isEmpty">
                      <value name="VALUE">
                        <shadow type="text">
                          <field name="TEXT"></field>
                        </shadow>
                      </value>
                    </block>
                    <block type="text_indexOf">
                      <value name="VALUE">
                        <block type="variables_get">
                          <field name="VAR">text</field>
                        </block>
                      </value>
                      <value name="FIND">
                        <shadow type="text">
                          <field name="TEXT">abc</field>
                        </shadow>
                      </value>
                      </block>
                    <block type="text_charAt">
                      <value name="VALUE">
                        <block type="variables_get">
                          <field name="VAR">text</field>
                        </block>
                      </value>
                    </block>
                    <block type="text_getSubstring">
                      <value name="STRING">
                        <block type="variables_get">
                          <field name="VAR">text</field>
                        </block>
                      </value>
                    </block>
                    <block type="text_changeCase">
                      <value name="TEXT">
                        <shadow type="text">
                          <field name="TEXT">abc</field>
                        </shadow>
                      </value>
                    </block>
                    <block type="text_trim">
                      <value name="TEXT">
                        <shadow type="text">
                          <field name="TEXT">abc</field>
                        </shadow>
                      </value>
                    </block>
                    <block type="text_count">
                      <value name="SUB">
                        <shadow type="text"></shadow>
                      </value>
                      <value name="TEXT">
                        <shadow type="text"></shadow>
                      </value>
                    </block>
                    <block type="text_replace">
                      <value name="FROM">
                        <shadow type="text"></shadow>
                      </value>
                      <value name="TO">
                        <shadow type="text"></shadow>
                      </value>
                      <value name="TEXT">
                        <shadow type="text"></shadow>
                      </value>
                    </block>
                    <block type="text_reverse">
                      <value name="TEXT">
                        <shadow type="text"></shadow>
                      </value>
                    </block>
                    <label text="Input/Output:" web-class="ioLabel"></label>
                    <block type="text_print">
                      <value name="TEXT">
                        <shadow type="text">
                          <field name="TEXT">abc</field>
                        </shadow>
                      </value>
                    </block>
                    <block type="text_prompt_ext">
                      <value name="TEXT">
                        <shadow type="text">
                          <field name="TEXT">abc</field>
                        </shadow>
                      </value>
                    </block>
                </category>

                <!--Colour -->
                <category name="Colour" colour="%{BKY_COLOUR_HUE}"> 
                  <block type = "colour_picker"></block>
                  <block type = "colour_random"></block>
                  <block type = "colour_rgb">
                    <value name = "RED">
                      <shadow type = "math_number">
                        <field name = "NUM">100</field>
                      </shadow>
                    </value>
                    <value name="GREEN">
                        <shadow type="math_number">
                          <field name="NUM">50</field>
                        </shadow>
                    </value>
                    <value name="BLUE">
                      <shadow type="math_number">
                        <field name="NUM">0</field>
                      </shadow>
                    </value>
                  </block>
                  <block type = "colour_blend">
                    <value name="COLOUR1">
                      <shadow type="colour_picker">
                        <field name="COLOUR">#ff0000</field>
                      </shadow>
                    </value>
                    <value name="COLOUR2">
                      <shadow type="colour_picker">
                        <field name="COLOUR">#3333ff</field>
                      </shadow>
                    </value>
                    <value name="RATIO">
                      <shadow type="math_number">
                        <field name="NUM">0.5</field>
                      </shadow>
                    </value>
                  </block>
                </category>

                <!-- Lists -->
                <category name="Lists" colour="%{BKY_LISTS_HUE}">
                  <block type="createemptylist"></block>
                    <block type="lists_create_with">
                      <mutation items="0"></mutation>
                  </block>
                  <block type="lists_create_with"></block>
                  <block type="lists_repeat">
                    <value name="NUM">
                      <shadow type="math_number">
                        <field name="NUM">5</field>
                      </shadow>
                    </value>
                  </block>
                  <block type="lists_length"></block>
                  <block type="lists_isEmpty"></block>
                  <block type="lists_indexOf">
                    <value name="VALUE">
                      <block type="variables_get">
                        <field name="VAR">list</field>
                      </block>
                    </value>
                  </block>
                  <block type="lists_getIndex">
                    <value name="VALUE">
                      <block type="variables_get">
                        <field name="VAR">list</field>
                      </block>
                    </value>
                  </block>
                  <block type="lists_setIndex">
                    <value name="LIST">
                      <block type="variables_get">
                        <field name="VAR">list</field>
                      </block>
                    </value>
                  </block>
                  <block type="lists_getSublist">
                    <value name="LIST">
                      <block type="variables_get">
                        <field name="VAR">list</field>
                      </block>
                    </value>
                  </block>
                  <block type="lists_split">
                    <value name="DELIM">
                      <shadow type="text">
                        <field name="TEXT">,</field>
                      </shadow>
                    </value>
                  </block>
                  <block type="lists_sort"></block>
                  <block type="lists_reverse"></block>
                </category>

                <!-- Variables --> 
                <category name="Variables" colour="%{BKY_VARIABLES_HUE}"></category>

            </xml>

            <!-- What's already inside the Blockly editor --> 
            <xml xmlns="https://developers.google.com/blockly/xml" id="startBlocks" style="display: none">
                <block type="controls_if" inline="false" x="20" y="20">
                  <mutation else="1"></mutation>
                  <value name="IF0">
                    <block type="logic_compare" inline="true">
                      <field name="OP">EQ</field>
                      <value name="A">
                        <block type="math_arithmetic" inline="true">
                          <field name="OP">MULTIPLY</field>
                          <value name="A">
                            <block type="math_number">
                              <field name="NUM">6</field>
                            </block>
                          </value>
                          <value name="B">
                            <block type="math_number">
                              <field name="NUM">7</field>
                            </block>
                          </value>
                        </block>
                      </value>
                      <value name="B">
                        <block type="math_number">
                          <field name="NUM">42</field>
                        </block>
                      </value>
                    </block>
                  </value>
                  <statement name="DO0">
                    <block type="text_print" inline="false">
                      <value name="TEXT">
                        <block type="text">
                          <field name="TEXT">Don't panic</field>
                        </block>
                      </value>
                    </block>
                  </statement>
                  <statement name="ELSE">
                    <block type="text_print" inline="false">
                      <value name="TEXT">
                        <block type="text">
                          <field name="TEXT">Panic</field>
                        </block>
                      </value>
                    </block>
                  </statement>
                </block>
            </xml>

            <script>
                var demoWorkspace = Blockly.inject('blocklyDiv',
                    {media: 'https://unpkg.com/blockly/media/',
                     toolbox: document.getElementById('toolbox')});
                Blockly.Xml.domToWorkspace(document.getElementById('startBlocks'),
                                           demoWorkspace);

                function showCode() {
                  // Generate JavaScript code and display it.
                  Blockly.JavaScript.INFINITE_LOOP_TRAP = null;
                  var code = Blockly.JavaScript.workspaceToCode(demoWorkspace);
                  alert(code);
                }

                function runCode() {
                  // Generate JavaScript code and run it.
                  window.LoopTrap = 1000;
                  Blockly.JavaScript.INFINITE_LOOP_TRAP =
                      'if (--window.LoopTrap == 0) throw "Infinite loop.";\n';
                  var code = Blockly.JavaScript.workspaceToCode(demoWorkspace);
                  Blockly.JavaScript.INFINITE_LOOP_TRAP = null;
                  try {
                    eval(code);
                  } catch (e) {
                    alert(e);
                  }
                }
            </script>
        </div>
    </div>

    <?php include ('includes/toolbar.php'); ?>
    <?php include ('includes/js-includes.php'); ?>     <!-- js-includes.php imports JS: looma.js, looma-utilities.js, looma-screenfull.js,
                                                            looma-keyboard.js, jQuery -->

    <script src="js/looma-template.js"></script>        <!--  Javascript for this page-->
</body>
</html>



