/*
LOOMA javascript file
Filename: looma-edit-history.js
Description: editor for user-created history timelines. Modeled on looma-edit-slideshow.js.

    A timeline is a document in the 'user_histories' collection with this shape:
        { dn, ft:'history', title, thumb, events: [ event, ... ] }
    where each event is:
        { title, date, popup:[description, activityId1, activityId2],
          ndn(optional), ndate(optional), npopup:[nepaliDescription](optional) }
    popup[0] is the English description; popup[1]/popup[2] are optional linked activity ids.

    IMPORTANT: this editor reads/writes ONLY the 'user_histories' collection.
    The curated, read-only 'histories' collection (the 11 approved timelines) is never referenced.

Owner: VillageTech Solutions (villagetechsolutions.org)
Revision: Looma 7.x
 */

'use strict';

var savedSignature = "";     //checkpoint of the timeline, for detecting modifications
var loginname, loginlevel, loginteam;
var $timeline;               //the #timelineDisplay element
var activeCard = null;       //the event card currently selected (target for 'Add activity')
var currentlyPreviewedActivity;

var searchName = 'history-editor-search';   //used by looma-search.js to save/restore search settings

////////////////////////////////////////////
//////   functions used by filecommands /////
////////////////////////////////////////////

///////// editor_clear  /////////
function editor_clear() {
    setname("");
    $timeline.empty();
    $timeline.removeData('thumb').removeData('history-id');
    activeCard = null;
    $("#preview").empty().hide();
    clearFilter();
    editor_checkpoint();
}

///////// editor_checkpoint /////////
function editor_checkpoint() { savedSignature = signature(); }

///////// editor_modified /////////
function editor_modified() { return (signature() !== savedSignature); }

///////// signature  /////////
//  build a string that changes whenever any event field changes, so filecommands can detect edits
function signature() {
    var sig = ($timeline.data('thumb') || "");
    $('#timelineDisplay .eventCard').each(function() {
        var $c = $(this);
        sig += '|' + $c.find('.ev-date').val()
             + '~' + $c.find('.ev-ndate').val()
             + '~' + $c.find('.ev-title').val()
             + '~' + $c.find('.ev-ntitle').val()
             + '~' + $c.find('.ev-desc').val()
             + '~' + $c.find('.ev-ndesc').val()
             + '~' + ($c.data('id1') || '')
             + '~' + ($c.data('id2') || '');
    });
    return sig;
}

///////// editor_pack  /////////
//  pack the event cards (in current DOM/timeline order) into the events[] array for storage
function editor_pack() {
    var events = [];
    $('#timelineDisplay .eventCard').each(function() {
        var $c = $(this);
        var title  = $.trim($c.find('.ev-title').val());
        var ntitle = $.trim($c.find('.ev-ntitle').val());
        var date   = $.trim($c.find('.ev-date').val());
        var ndate  = $.trim($c.find('.ev-ndate').val());
        var desc   = $c.find('.ev-desc').val() || "";
        var ndesc  = $.trim($c.find('.ev-ndesc').val());
        var id1    = $c.data('id1') || "";
        var id2    = $c.data('id2') || "";

        // popup: [description, id1?, id2?]   (keep positions so id2 stays at index 2)
        var popup = [desc];
        if (id1 || id2) popup.push(id1);
        if (id2)        popup.push(id2);

        var ev = { title: title, date: date, popup: popup };
        if (ntitle) ev.ndn    = ntitle;
        if (ndate)  ev.ndate  = ndate;
        if (ndesc)  ev.npopup = [ndesc];

        events.push(ev);
    });
    return events;
}

///////// editor_save  /////////
function editor_save(name) {
    if ($('#timelineDisplay .eventCard').length === 0) {
        LOOMA.alert('Add at least one event before saving.', 5);
        return;
    }
    // savefile(name, collection, filetype, data, activityFlag, author)
    savefile(name, currentcollection, currentfiletype, editor_pack(), "false", loginname);
    // NOTE: activityFlag 'false' - user timelines are NOT indexed as activities (stay out of library search)
}

///////// editor_display  ///////// (called by filecommands after a File-menu OPEN)
function editor_display(response) {
    editor_clear();
    setname(response.dn || response.title, response.author);
    if (response['_id']) {
        $timeline.data('history-id', response['_id']['$id'] || response['_id']['$oid']);
    }
    if (response.thumb) $timeline.data('thumb', response.thumb);

    var events = response.events || response.data || [];
    $(events).each(function(index, ev) { addEventCard(ev); });

    makesortable();
    editor_checkpoint();
}

// end FILE COMMANDS callbacks


//////////////////////////////////
///////   EVENT CARDS      ////////
//////////////////////////////////

///////// addEventCard  /////////
//  create one editable event card and append it to the timeline. ev may be undefined (blank new event).
function addEventCard(ev) {
    ev = ev || {};
    var popup  = ev.popup  || [];
    var npopup = ev.npopup || [];
    var desc   = popup[0]  || "";
    var id1    = popup[1]  || "";
    var id2    = popup[2]  || "";

    var $card = $(
        '<div class="eventCard">' +
        '  <div class="ev-head">' +
        '     <input class="ev-date"  type="text" placeholder="Date (e.g. 1543)">' +
        '     <button class="ev-remove" title="Delete this event">&times;</button>' +
        '  </div>' +
        '  <input    class="ev-ndate"  type="text" placeholder="मिति (Nepali date - optional)">' +
        '  <input    class="ev-title"  type="text" placeholder="Event title (English)">' +
        '  <input    class="ev-ntitle" type="text" placeholder="शीर्षक (Nepali title - optional)">' +
        '  <textarea class="ev-desc"   placeholder="Description (English)"></textarea>' +
        '  <textarea class="ev-ndesc"  placeholder="विवरण (Nepali description - optional)"></textarea>' +
        '  <div class="ev-activities"></div>' +
        '</div>'
    );

    $card.find('.ev-date').val(ev.date || "");
    $card.find('.ev-ndate').val(ev.ndate || "");
    $card.find('.ev-title').val(ev.title || "");
    $card.find('.ev-ntitle').val(ev.ndn || "");
    $card.find('.ev-desc').val(desc);
    $card.find('.ev-ndesc').val(npopup[0] || "");
    if (id1) $card.data('id1', id1);
    if (id2) $card.data('id2', id2);

    $card.appendTo('#timelineDisplay');
    renderActivitySlots($card);
    return $card;
}

///////// renderActivitySlots  /////////
//  show a chip for each linked activity (id1/id2). Looks up the activity name asynchronously.
function renderActivitySlots($card) {
    var $slots = $card.find('.ev-activities').empty();
    [['id1', 'name1'], ['id2', 'name2']].forEach(function(pair) {
        var id = $card.data(pair[0]);
        if (!id) return;
        var $chip = $('<span class="ev-chip">' +
                      '<span class="ev-chip-name">activity…</span>' +
                      '<button class="ev-chip-remove" title="Remove activity">&times;</button>' +
                      '</span>');
        $chip.data('slot', pair[0]);
        $slots.append($chip);

        var cached = $card.data(pair[1]);
        if (cached) { $chip.find('.ev-chip-name').text(cached); return; }

        // look up the activity display name to show on the chip
        $.post("looma-database-utilities.php",
            { cmd: "openByID", collection: "activities", id: id },
            function(result) {
                var nm = (result && result.dn) ? result.dn : ('[' + id + ']');
                $chip.find('.ev-chip-name').text(nm);
                $card.data(pair[1], nm);
            }, 'json');
    });
}

///////// attachActivityToActiveCard  /////////
//  called when the user clicks 'Add' on a search result - links that activity to the selected event
function attachActivityToActiveCard(item) {
    if (!activeCard || $(activeCard).closest('body').length === 0) {
        LOOMA.alert('Click an event first, then Add an activity to it.', 5);
        return;
    }
    var id = (item._id && (item._id.$id || item._id.$oid)) || item._id;
    var $c = $(activeCard);

    if      (!$c.data('id1')) { $c.data('id1', id); $c.data('name1', item.dn); }
    else if (!$c.data('id2')) { $c.data('id2', id); $c.data('name2', item.dn); }
    else { LOOMA.alert('An event can link at most 2 activities.', 5); return; }

    renderActivitySlots($c);
}

///////// setActiveCard  /////////
function setActiveCard(card) {
    if (activeCard === card) return;
    $('#timelineDisplay .eventCard').removeClass('activeCard');
    activeCard = card;
    if (card) $(card).addClass('activeCard');
}


//////////////////////////////////
///////   SEARCH RESULTS   ////////
//////////////////////////////////
//  (adapted from looma-edit-slideshow.js - renders the activities search into the results pane)

var clearFilter = function() {
    if ($('#collection').val() == 'activities') {
        $('#searchString').val("");
        $(".filter_dropdown").each(function() { this.selectedIndex = 0; });
        $(".filter_checkbox").each(function() { $(this).prop("checked", false); });
        var image = document.getElementById('image-checkbox'); if (image) image.checked = true;
    }
    $("#innerResultsMenu").empty();
    $("#innerResultsDiv").empty();
    $("#preview").empty();
};

// displayResults() is the callback invoked by looma-search.js after a search
function displayResults(results) {
    var activities = [];
    for (var i = 0; i < results.list.length; i++) {
        if (results.list[i]['ft'] !== 'chapter') activities.push(results.list[i]);
    }
    $('#innerResultsMenu, #innerResultsDiv').empty();

    var container = document.createElement("div");
    container.id = "actResultDiv";
    $('#innerResultsDiv').append(container);

    var title = document.createElement("h5");
    title.id = "activityTitle";
    title.innerHTML = "<a class='heading'>Activities (" + activities.length + (activities.length === 1 ? " Result)" : " Results)") + "</a>";
    container.appendChild(title);

    for (var j = 0; j < activities.length; j++) {
        container.appendChild(createActivityDiv(activities[j]));
    }
}

function thumbnail(item) {
    if (item.thumb) return item.thumb;
    return LOOMA.thumbnail(item.fn, item.fp, item.ft);
}

//  build a search-result row with an Add / Preview button (Delete hidden by CSS)
function createActivityDiv(item) {
    var div = document.createElement("div");
    div.className = "resultitem";

    var activityDiv = document.createElement("div");
    activityDiv.className = "activityDiv";
    $(activityDiv).data("id", (item['_id']['$id'] || item['_id']['$oid'] || item['_id']));
    $(activityDiv).data("type", item['ft']);
    item.collection = 'activities';
    $.data(activityDiv, 'mongo', item);

    var thumbnaildiv = document.createElement("div");
    thumbnaildiv.className = "thumbnaildiv";
    activityDiv.appendChild(thumbnaildiv);
    $("<img/>", { class: "resultsimg", src: thumbnail(item) }).appendTo(thumbnaildiv);

    var textdiv = document.createElement("div");
    textdiv.className = "textdiv";
    activityDiv.appendChild(textdiv);
    var dn = item.dn ? item.dn.substring(0, 24) : "";
    $("<p/>", { class: "result_dn", html: "<b>" + dn + "</b>" }).appendTo(textdiv);
    if ('ch_id' in item) $("<span/>", { class: "result_ID", html: "[" + item.ch_id + "]" }).appendTo(textdiv);

    var buttondiv = document.createElement("div");
    buttondiv.className = "buttondiv";
    activityDiv.appendChild(buttondiv);
    $("<button/>", { class: "add",     html: "Add" }).appendTo(buttondiv);
    $("<button/>", { class: "preview", html: "Preview" }).appendTo(buttondiv);

    div.appendChild(activityDiv);
    return div;
}

///////// preview_result  /////////
function preview_result(item) {
    $('#preview').show();
    $('#hints, .hint').hide();

    var $mongo   = $(item).data('mongo');
    var filetype = $(item).data('type');
    var filename = $mongo.fn;
    var dataID   = $(item).data('id');
    var filepath = ('fp' in $mongo) ? $mongo.fp : null;

    if (filetype == "jpg" || filetype == "gif" || filetype == "png" || filetype == "image") {
        if (!filepath) filepath = '../content/pictures/';
        document.querySelector("div#preview").innerHTML =
            '<img src="' + filepath + filename + '" id="displayImage" data-id="' + dataID + '">';
    } else if (filetype == "text") {
        $.post("looma-database-utilities.php",
            { cmd: "openByID", collection: "text", id: $mongo.mongoID ? ($mongo.mongoID.$id || $mongo.mongoID.$oid) : dataID },
            function(result) { document.querySelector("div#preview").innerHTML = result.data; },
            'json');
    } else {
        document.querySelector("div#preview").innerHTML =
            "<p class='hint'>No preview for this file type (" + LOOMA.typename(filetype) + ").</p>";
    }
}


/////////////////////////// SORTABLE UI ////////  requires jQuery UI  ///////////////////
//  reorder event cards along the timeline by dragging the date bar (.ev-head)
function makesortable() {
    $("#timelineDisplay").sortable({
        opacity: 0.7,
        axis: "x",
        scroll: true,
        handle: ".ev-head"
    }).disableSelection();
}
function refreshsortable() { makesortable(); }


///////// quit  ///////// (override so BACK/dismiss prompts to save)
function quit() {
    if (callbacks['modified']())
        savework(currentname, currentcollection, currentfiletype);
    else
        window.history.back();
}


$(document).ready(function() {
    $timeline = $('#timelineDisplay');

    loginname  = LOOMA.loggedIn();
    loginlevel = LOOMA.readCookie('login-level');
    loginteam  = LOOMA.readCookie('login-team');

    // File commands operate on the user_histories collection ONLY.
    currentname       = "";
    currentcollection = "user_histories";
    currentfiletype   = "history";
    currentDB         = 'loomalocal';   // File->New content is user/local content (matches other editors)

    // the content search bar (#search) searches ACTIVITIES, for linking into events
    $('#collection').val('activities');
    $('#includeLesson').val(false);
    var image = document.getElementById('image-checkbox'); if (image) image.checked = true;

    $('.template-cmd').hide();   // no templates for history timelines

    // callbacks expected by looma-filecommands.js
    callbacks['clear']      = editor_clear;
    callbacks['save']       = editor_save;
    callbacks['display']    = editor_display;
    callbacks['modified']   = editor_modified;
    callbacks['checkpoint'] = editor_checkpoint;
    callbacks['new']        = function() { addEventCard(); makesortable(); editor_checkpoint(); };
    // 'quit' overridden below via #dismiss / back-button

    // + Add Event
    $('#add-event').on('click', function() {
        var $card = addEventCard();
        makesortable();
        setActiveCard($card[0]);
        $('#timeline').animate({ scrollLeft: $('#timeline')[0].scrollWidth }, 300);
        $card.find('.ev-date').focus();
    });

    // selecting / removing event cards
    $('#timelineDisplay').on('mousedown focusin', '.eventCard', function() { setActiveCard(this); });
    $('#timelineDisplay').on('click', '.ev-remove', function() {
        var $card = $(this).closest('.eventCard');
        if ($card[0] === activeCard) setActiveCard(null);
        $card.remove();
        return false;
    });
    // remove a linked activity chip
    $('#timelineDisplay').on('click', '.ev-chip-remove', function() {
        var $chip = $(this).closest('.ev-chip');
        var $card = $chip.closest('.eventCard');
        var slot  = $chip.data('slot');
        $card.removeData(slot).removeData(slot === 'id1' ? 'name1' : 'name2');
        // if id1 removed but id2 exists, promote id2 -> id1 so positions stay compact
        if (slot === 'id1' && $card.data('id2')) {
            $card.data('id1', $card.data('id2')); $card.data('name1', $card.data('name2'));
            $card.removeData('id2').removeData('name2');
        }
        renderActivitySlots($card);
        return false;
    });

    // search-result buttons: Add -> link to active event; Preview -> show in preview panel
    $('#innerResultsDiv').on('click', '.add', function() {
        attachActivityToActiveCard($(this).closest('.activityDiv').data('mongo'));
        return false;
    });
    $('#innerResultsDiv').on('click', '.preview, .resultsimg', function() {
        preview_result($(this).closest('.activityDiv'));
        return false;
    });

    // timeline scroll arrows
    $('#timelineLeft').on('click',  function() { $('#timeline').animate({ scrollLeft: '-=250px' }, 500); });
    $('#timelineRight').on('click', function() { $('#timeline').animate({ scrollLeft: '+=250px' }, 500); });

    // dismiss / back -> quit (prompts to save if modified)
    $('#dismiss').off('click').click(function() { quit(); });

    editor_checkpoint();
});
