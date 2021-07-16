/*
LOOMA javascript file
Filename: looma-template.js
Description: supports looma-xxx.php
/

Programmer name: Skip
Owner: Looma Education Company
Date: xxx  2017
Revision: Looma 3.0
*/

'use strict';

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
    }
    
 /*       $(document).ready(function () {
            var demoWorkspace = Blockly.inject('blocklyDiv',
                {
                    media: 'https://unpkg.com/blockly/media/',
                    toolbox: document.getElementById('toolbox')
                });
            Blockly.Xml.domToWorkspace(document.getElementById('startBlocks'),
                demoWorkspace);
        
            try { eval(code);  } catch (e) { alert(e); }
        });
*/


$(document).ready( function() {
    var blocklyArea = document.getElementById('blocklyArea');
    var blocklyDiv = document.getElementById('blocklyDiv');
    var workspace = Blockly.inject(blocklyDiv,
        {
            media: 'https://unpkg.com/blockly/media/',
            toolbox: document.getElementById('toolbox')
        });
    var onresize = function(e) {
        // Compute the absolute coordinates and dimensions of blocklyArea.
        var element = blocklyArea;
        var x = 0;
        var y = 0;
        do {
            x += element.offsetLeft;
            y += element.offsetTop;
            element = element.offsetParent;
        } while (element);
        // Position blocklyDiv over blocklyArea.
        blocklyDiv.style.left = x + 'px';
        blocklyDiv.style.top = y + 'px';
        blocklyDiv.style.width = blocklyArea.offsetWidth + 'px';
        blocklyDiv.style.height = blocklyArea.offsetHeight + 'px';
        Blockly.svgResize(workspace);
    };
    window.addEventListener('resize', onresize, false);
    onresize();
    Blockly.svgResize(workspace);
});
