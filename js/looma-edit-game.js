/*
LOOMA javascript file
Filename: looma-edit-game.js
Description: Looma Game Editor

Programmer name: Skip
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 06 2026
Revision: Looma 7
 */

'use strict';

var savedSignature = "";
var loginname, loginlevel, loginteam;

////////////////////////////////////////////
//////   functions used by filecommands/////
////////////////////////////////////////////

function editor_clear() {
    setname("");
    $('#game-title').val('');
    $('#game-lang').val('en');
    $('#game-cl-lo').val('1');
    $('#game-cl-hi').val('1');
    $('#game-subject').val('');
    $('#game-timelimit').val('60');
    $('#game-type').val('');
    $('#game-data-area').html('<p class="hint">Select a Presentation Type to enter game data</p>');
    editor_checkpoint();
}

function editor_showsearchitems() {
    // hide search items not relevant to game editor
}

function editor_checkpoint() { savedSignature = signature(); }

function editor_modified()   { return (signature() !== savedSignature); }

function signature() {
    var sig = '';
    sig += $('#game-title').val() || '';
    sig += $('#game-lang').val() || '';
    sig += $('#game-cl-lo').val() || '';
    sig += $('#game-cl-hi').val() || '';
    sig += $('#game-subject').val() || '';
    sig += $('#game-timelimit').val() || '';
    sig += $('#game-type').val() || '';
    sig += dataSignature();
    return sig;
}

function dataSignature() {
    var sig = '';
    var type = $('#game-type').val();
    if (type === 'matching' || type === 'concentration') {
        $('#game-data-area table tbody tr').each(function() {
            sig += $(this).find('input.prompt').val() || '';
            sig += $(this).find('input.response').val() || '';
        });
    } else if (type === 'multiple choice') {
        $('#game-data-area table tbody tr').each(function() {
            sig += $(this).find('input.question').val() || '';
            sig += $(this).find('input.correct-ans').val() || '';
            $(this).find('input.wrong-ans').each(function() {
                sig += $(this).val() || '';
            });
        });
    } else if (type === 'sort') {
        $('#bins-table tbody tr').each(function() {
            sig += $(this).find('input.bin-heading').val() || '';
            sig += $(this).find('input.bin-scope').val() || '';
        });
        $('#words-table tbody tr').each(function() {
            sig += $(this).find('input.word-text').val() || '';
            sig += $(this).find('select.word-bin').val() || '';
        });
    }
    return sig;
}

///////// editor_pack: collect form data into a game document /////////
function editor_pack() {
    var type = $('#game-type').val();
    var game = {
        title:             $('#game-title').val(),
        presentation_type: type,
        ft:                'game',
        lang:              $('#game-lang').val(),
        cl_lo:             parseInt($('#game-cl-lo').val()),
        cl_hi:             parseInt($('#game-cl-hi').val()),
        subject:           [$('#game-subject').val()],
        timeLimit:         parseInt($('#game-timelimit').val())
    };

    if (type === 'matching' || type === 'concentration') {
        game.prompts = [];
        game.responses = [];
        $('#game-data-area table tbody tr').each(function() {
            var p = $(this).find('input.prompt').val();
            var r = $(this).find('input.response').val();
            if (p || r) {
                game.prompts.push(p || '');
                game.responses.push(r || '');
            }
        });
    } else if (type === 'multiple choice') {
        game.prompts = [];
        $('#game-data-area table tbody tr').each(function() {
            var q = $(this).find('input.question').val();
            var c = $(this).find('input.correct-ans').val();
            var w = [];
            $(this).find('input.wrong-ans').each(function() {
                w.push($(this).val() || '');
            });
            if (q) {
                game.prompts.push({
                    question:   q,
                    correctAns: c || '',
                    wrongAns:   w
                });
            }
        });
    } else if (type === 'sort') {
        game.bins = [];
        game.words = [];
        $('#bins-table tbody tr').each(function(i) {
            var h = $(this).find('input.bin-heading').val();
            var s = $(this).find('input.bin-scope').val() || ('bin' + (i + 1));
            if (h) game.bins.push({ heading: h, scope: s });
        });
        $('#words-table tbody tr').each(function() {
            var w = $(this).find('input.word-text').val();
            var selIdx = $(this).find('select.word-bin')[0].selectedIndex;
            var binRow = $('#bins-table tbody tr').eq(selIdx);
            var scope = binRow.find('input.bin-scope').val() || ('bin' + (selIdx + 1));
            if (w) game.words.push({ en: w, bin: scope });
        });
    }

    return game;
}

///////// editor_display: populate editor from a loaded game /////////
function editor_display(response) {
    editor_clear();
    currentDB = response.db ? response.db : 'looma';

    setname(response.dn, response.author);

    // the response is the game document (fetched via getGame or openByID)
    var game = response.data ? response.data : response;

    $('#game-title').val(game.title || response.dn || '');
    $('#game-lang').val(game.lang || 'en');
    $('#game-cl-lo').val(game.cl_lo || '1');
    $('#game-cl-hi').val(game.cl_hi || '1');
    $('#game-subject').val(Array.isArray(game.subject) ? game.subject[0] : (game.subject || ''));
    $('#game-timelimit').val(game.timeLimit || 60);

    var type = game.presentation_type || '';
    $('#game-type').val(type).trigger('change');

    // populate data after the type-specific UI has been built
    setTimeout(function() {
        populateData(type, game);
        editor_checkpoint();
    }, 100);
}

function populateData(type, game) {
    if (type === 'matching' || type === 'concentration') {
        if (game.prompts && game.responses) {
            // clear default rows, add the right number
            $('#game-data-area table tbody').empty();
            for (var i = 0; i < game.prompts.length; i++) {
                addMatchingRow(game.prompts[i], game.responses[i]);
            }
        }
    } else if (type === 'multiple choice') {
        if (game.prompts) {
            $('#game-data-area table tbody').empty();
            for (var i = 0; i < game.prompts.length; i++) {
                var p = game.prompts[i];
                addMCRow(p.question, p.correctAns, p.wrongAns || ['','','']);
            }
        }
    } else if (type === 'sort') {
        if (game.bins) {
            $('#bins-table tbody').empty();
            for (var i = 0; i < game.bins.length; i++) {
                addBinRow(game.bins[i].heading, game.bins[i].scope);
            }
        }
        if (game.words) {
            $('#words-table tbody').empty();
            for (var i = 0; i < game.words.length; i++) {
                addWordRow(game.words[i].en, game.words[i].bin);
            }
        }
    }
}

///////// editor_save /////////
function editor_save(name) {
    if (!$('#game-subject').val()) {
        alert('Subject is required before saving.');
        return;
    }
    var data = editor_pack();
    savefile(name, 'games', 'game', data, "true", loginname);
}

//////////////////////////////////////////////
///// Build type-specific data entry UI //////
//////////////////////////////////////////////

function buildDataUI(type) {
    var $area = $('#game-data-area');
    $area.empty();

    if (type === 'matching' || type === 'concentration') {
        $area.append(
            '<table><thead><tr>' +
            '<th>#</th><th>Prompt</th><th>Response</th><th></th>' +
            '</tr></thead><tbody></tbody></table>' +
            '<button class="add-row" id="add-matching-row">+ Add Pair</button>'
        );
        // start with 4 empty rows
        for (var i = 0; i < 4; i++) addMatchingRow('', '');

    } else if (type === 'multiple choice') {
        $area.append(
            '<table><thead><tr>' +
            '<th>#</th><th>Question</th><th>Correct Answer</th><th>Wrong Answers (3)</th><th></th>' +
            '</tr></thead><tbody></tbody></table>' +
            '<button class="add-row" id="add-mc-row">+ Add Question</button>'
        );
        for (var i = 0; i < 3; i++) addMCRow('', '', ['','','']);

    } else if (type === 'sort') {
        $area.append(
            '<div class="sort-section"><h4>Bins (categories)</h4>' +
            '<table id="bins-table"><thead><tr>' +
            '<th>#</th><th>Heading</th><th>Scope</th><th></th>' +
            '</tr></thead><tbody></tbody></table>' +
            '<button class="add-row" id="add-bin-row">+ Add Bin</button></div>' +
            '<div class="sort-section"><h4>Words (items to sort)</h4>' +
            '<table id="words-table"><thead><tr>' +
            '<th>#</th><th>Word</th><th>Correct Bin</th><th></th>' +
            '</tr></thead><tbody></tbody></table>' +
            '<button class="add-row" id="add-word-row">+ Add Word</button></div>'
        );
        for (var i = 0; i < 3; i++) addBinRow('', '');
        for (var i = 0; i < 6; i++) addWordRow('', '');

    } else {
        $area.html('<p class="hint">Select a Presentation Type to enter game data</p>');
    }
}

function renumberRows(tableSelector) {
    $(tableSelector + ' tbody tr').each(function(i) {
        $(this).find('td:first').text(i + 1);
    });
}

function addMatchingRow(prompt, response) {
    var $tbody = $('#game-data-area table tbody');
    var n = $tbody.find('tr').length + 1;
    $tbody.append(
        '<tr><td>' + n + '</td>' +
        '<td><input type="text" class="prompt" value="' + escAttr(prompt) + '"></td>' +
        '<td><input type="text" class="response" value="' + escAttr(response) + '"></td>' +
        '<td><button class="remove-row">X</button></td></tr>'
    );
}

function addMCRow(question, correctAns, wrongAns) {
    var $tbody = $('#game-data-area table tbody');
    var n = $tbody.find('tr').length + 1;
    var w = wrongAns || ['','',''];
    $tbody.append(
        '<tr><td>' + n + '</td>' +
        '<td><input type="text" class="question" value="' + escAttr(question) + '"></td>' +
        '<td><input type="text" class="correct-ans" value="' + escAttr(correctAns) + '"></td>' +
        '<td><div class="wrong-answers">' +
        '<input type="text" class="wrong-ans" value="' + escAttr(w[0]) + '">' +
        '<input type="text" class="wrong-ans" value="' + escAttr(w[1]) + '">' +
        '<input type="text" class="wrong-ans" value="' + escAttr(w[2]) + '">' +
        '</div></td>' +
        '<td><button class="remove-row">X</button></td></tr>'
    );
}

function addBinRow(heading, scope) {
    var $tbody = $('#bins-table tbody');
    var n = $tbody.find('tr').length + 1;
    $tbody.append(
        '<tr><td>' + n + '</td>' +
        '<td><input type="text" class="bin-heading" value="' + escAttr(heading) + '"></td>' +
        '<td><input type="text" class="bin-scope" value="' + escAttr(scope) + '"></td>' +
        '<td><button class="remove-row">X</button></td></tr>'
    );
}

function addWordRow(word, bin) {
    var $tbody = $('#words-table tbody');
    var n = $tbody.find('tr').length + 1;
    var binOptions = buildBinOptions(bin);
    $tbody.append(
        '<tr><td>' + n + '</td>' +
        '<td><input type="text" class="word-text" value="' + escAttr(word) + '"></td>' +
        '<td><select class="word-bin">' + binOptions + '</select></td>' +
        '<td><button class="remove-row">X</button></td></tr>'
    );
}

function buildBinOptions(selectedBin) {
    var opts = '';
    $('#bins-table tbody tr').each(function(i) {
        var scope = $(this).find('input.bin-scope').val() || ('bin' + (i + 1));
        var heading = $(this).find('input.bin-heading').val() || ('Bin ' + (i + 1));
        var sel = (scope === selectedBin) ? ' selected' : '';
        opts += '<option value="' + escAttr(scope) + '"' + sel + '>' + heading + '</option>';
    });
    if (opts === '') opts = '<option value="bin1">Bin 1</option>';
    return opts;
}

function refreshWordBinSelects() {
    $('#words-table tbody tr').each(function() {
        var $sel = $(this).find('select.word-bin');
        var cur = $sel.val();
        $sel.html(buildBinOptions(cur));
    });
}

function escAttr(s) {
    if (!s) return '';
    return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

//////////////////////////////////////////////
/////////  document ready  ///////////////////
//////////////////////////////////////////////

$(document).ready(function() {

    loginname  = LOOMA.loggedIn();

    currentDB = 'loomalocal';
    currentcollection = 'games';
    currentfiletype = 'game';

    // set up filecommands callbacks
    callbacks['clear']           = editor_clear;
    callbacks['save']            = editor_save;
    callbacks['display']         = editor_display;
    callbacks['modified']        = editor_modified;
    callbacks['checkpoint']      = editor_checkpoint;
    callbacks['showsearchitems'] = editor_showsearchitems;

    // when presentation type changes, rebuild the data entry UI
    $('#game-type').on('change', function() {
        buildDataUI($(this).val());
    });

    // delegated click handlers for add/remove rows
    $('#game-data-area').on('click', '#add-matching-row', function() {
        addMatchingRow('', '');
    });

    $('#game-data-area').on('click', '#add-mc-row', function() {
        addMCRow('', '', ['','','']);
    });

    $('#game-data-area').on('click', '#add-bin-row', function() {
        addBinRow('', '');
        refreshWordBinSelects();
    });

    $('#game-data-area').on('click', '#add-word-row', function() {
        addWordRow('', 0);
    });

    $('#game-data-area').on('click', '.remove-row', function() {
        var $table = $(this).closest('table');
        $(this).closest('tr').remove();
        renumberRows('#' + ($table.attr('id') || 'game-data-area table'));
        if ($table.attr('id') === 'bins-table') refreshWordBinSelects();
    });

    // when bin headings or scopes change, update the word dropdowns
    $('#game-data-area').on('input', 'input.bin-heading, input.bin-scope', function() {
        refreshWordBinSelects();
    });

    // dismiss button
    $('#dismiss').click(function() { window.history.back(); });

    editor_clear();

}); //end document.ready
