/*
Filename: looma-game-list.js
Description: version 1 [SCU, Spring 2016]
Author: Skip
Date: 2020 08 27
Revision: Looma 3
 */

'use strict';

function gameButtonClicked() {
    var gameId =      $(this).data('id');
    var gameType =    $(this).data('type');
    var gameClass =   $(this).data('class');
    var gameSubject = $(this).data('subject');
 
    if       (gameType === 'vocab')
         window.location = "looma-vocab-flashcard.php?class=" + gameClass + "&subject=" + gameSubject + "&random=true";
    else if (gameType === 'arith')
         window.location = "looma-arith.php?class=" + gameClass;
    else if (gameType === 'sort')
        window.location = "looma-sort-game.php?id=" + gameId;
    else window.location = "game?id="      + gameId +
                                         "&class="   + gameClass +
                                         "&subject=" + gameSubject +
                                         "&type="    + gameType;
}

$(document).ready (function() {
    $("button.game").click(gameButtonClicked);
});