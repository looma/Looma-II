/*
LOOMA javascript file
Filename: looma-edit-history.js
Description: editor for user-created history timelines.

    The editing surface mirrors the read-only viewer (looma-history.php): a horizontal timeline
    with events alternating above/below a line. Each event's TITLE and DATE are edited in place
    (tap and type). Everything else - Nepali title/date, description, and up to two linked
    activities - is edited in a per-event details panel (the pencil button).

    A timeline is a document in the 'user_histories' collection:
        { dn, ft:'history', title, events: [ event, ... ] }
    each event:
        { title, date, popup:[description, activityId1?, activityId2?],
          ndn?, ndate?, npopup:[nepaliDescription]? }

    IMPORTANT: this editor reads/writes ONLY the 'user_histories' collection. The curated,
    read-only 'histories' collection (the 11 approved timelines) is never referenced.
    File-menu / save-load / activity-search flow follows the Slideshow-editor patterns.

Owner: VillageTech Solutions (villagetechsolutions.org)
Revision: Looma 7.x
 */

'use strict';

var savedSignature = "";     //checkpoint for detecting modifications
var loginname, loginlevel, loginteam;
var $ol;                     //the #timeline-ol element
var currentLi = null;        //the event whose details panel is open

var searchName = 'history-editor-search';   //used by looma-search.js

//////////////////////////////////
///////   EVENT TIMELINE   ////////
//////////////////////////////////

///////// buildEventLi  /////////  create one editable event; ev may be undefined (blank)
function buildEventLi(ev) {
    ev = ev || {};
    var popup  = ev.popup  || [];
    var npopup = ev.npopup || [];

    var $li = $(
        '<li class="event">' +
          '<div class="timeline-description">' +
            '<div class="event-controls">' +
              '<button class="ev-move-left"  title="Move earlier">&#8249;</button>' +
              '<button class="ev-details"    title="Edit description / Nepali / activities">&#9998;</button>' +
              '<button class="ev-remove"     title="Delete event">&times;</button>' +
              '<button class="ev-move-right" title="Move later">&#8250;</button>' +
            '</div>' +
            '<div class="dropbtn"  contenteditable="true" data-placeholder="Event title"></div>' +
            '<div class="dropdate" contenteditable="true" data-placeholder="Date"></div>' +
            '<div class="ev-links"></div>' +
          '</div>' +
        '</li>'
    );

    $li.find('.dropbtn').text(ev.title || '');
    $li.find('.dropdate').text(ev.date || '');
    $li.data('ntitle', ev.ndn   || '');
    $li.data('ndate',  ev.ndate || '');
    $li.data('desc',   popup[0]  || '');
    $li.data('ndesc',  npopup[0] || '');
    if (popup[1]) $li.data('id1', popup[1]);
    if (popup[2]) $li.data('id2', popup[2]);

    renderLinks($li);
    return $li;
}

///////// addEvent  /////////
function addEvent(ev) {
    var $li = buildEventLi(ev);
    $ol.append($li);
    return $li;
}

///////// refreshEmptyHint  /////////
function refreshEmptyHint() {
    $('#empty-hint').toggle($ol.find('.event').length === 0);
}

///////// renderLinks  /////////  show a chip per linked activity on the event
function renderLinks($li) {
    var $links = $li.find('.ev-links').empty();
    [['id1', 'name1'], ['id2', 'name2']].forEach(function(p) {
        var id = $li.data(p[0]);
        if (!id) return;
        var $chip = $('<span class="ev-link-chip">activity&hellip;</span>');
        $links.append($chip);
        var nm = $li.data(p[1]);
        if (nm) { $chip.text('▶ ' + nm); return; }
        lookupActivityName(id, function(name) { $li.data(p[1], name); $chip.text('▶ ' + name); });
    });
}

///////// lookupActivityName  /////////
function lookupActivityName(id, cb) {
    $.post('looma-database-utilities.php',
        { cmd: 'openByID', collection: 'activities', id: id },
        function(r) { cb((r && r.dn) ? r.dn : ('[' + id + ']')); }, 'json');
}


//////////////////////////////////
///////   DETAILS PANEL    ////////
//////////////////////////////////

function openDetails($li) {
    currentLi = $li;
    $('.event').removeClass('editing');
    $li.addClass('editing');

    $('#d-title').val($li.find('.dropbtn').text());
    $('#d-ntitle').val($li.data('ntitle') || '');
    $('#d-date').val($li.find('.dropdate').text());
    $('#d-ndate').val($li.data('ndate') || '');
    $('#d-desc').val($li.data('desc') || '');
    $('#d-ndesc').val($li.data('ndesc') || '');

    renderDetailChips();
    $('#activity-search').attr('hidden', true);
    $('#event-details').removeAttr('hidden');
    $('#d-title').focus();
}

function closeDetails(save) {
    if (save && currentLi) {
        var $li = currentLi;
        $li.find('.dropbtn').text($.trim($('#d-title').val()));
        $li.find('.dropdate').text($.trim($('#d-date').val()));
        $li.data('ntitle', $.trim($('#d-ntitle').val()));
        $li.data('ndate',  $.trim($('#d-ndate').val()));
        $li.data('desc',   $('#d-desc').val());
        $li.data('ndesc',  $.trim($('#d-ndesc').val()));
        renderLinks($li);
    }
    $('.event').removeClass('editing');
    $('#event-details').attr('hidden', true);
    currentLi = null;
}

///////// renderDetailChips  /////////  chips (with remove) for linked activities in the panel
function renderDetailChips() {
    var $box = $('#d-activities').empty();
    if (!currentLi) return;
    [['id1', 'name1'], ['id2', 'name2']].forEach(function(p) {
        var id = currentLi.data(p[0]);
        if (!id) return;
        var nm = currentLi.data(p[1]) || ('[' + id + ']');
        var $chip = $('<span class="d-chip"></span>').text(nm);
        $('<button title="Remove">&times;</button>').data('slot', p[0]).appendTo($chip);
        $box.append($chip);
        if (!currentLi.data(p[1])) {
            lookupActivityName(id, function(name) {
                currentLi.data(p[1], name);
                $chip.contents().first().replaceWith(document.createTextNode(name));
            });
        }
    });
}

///////// attachActivity  /////////  link a searched activity to the event being edited
function attachActivity(id, dn) {
    if (!currentLi) return;
    if      (!currentLi.data('id1')) { currentLi.data('id1', id); currentLi.data('name1', dn); }
    else if (!currentLi.data('id2')) { currentLi.data('id2', id); currentLi.data('name2', dn); }
    else { LOOMA.alert('An event can link at most 2 activities.', 5); return; }
    renderDetailChips();
}


//////////////////////////////////
///////   ACTIVITY SEARCH  ////////
//////////////////////////////////
// displayResults() is the callback invoked by looma-search.js after a search
function displayResults(results) {
    var $box = $('#activity-results').empty();
    var acts = results.list.filter(function(x) { return x.ft !== 'chapter'; });
    if (!acts.length) { $box.text('No activities found.'); return; }

    acts.forEach(function(item) {
        var id = (item._id && (item._id.$id || item._id.$oid)) || item._id;
        var $row = $('<div class="resultitem"></div>');
        $('<img>').attr('src', LOOMA.thumbnail(item.fn, item.fp, item.ft)).appendTo($row);
        $('<p class="result_dn"></p>').text(item.dn || '').appendTo($row);
        $('<button>Add</button>').data('id', id).data('dn', item.dn).appendTo($row);
        $box.append($row);
    });
}


//////////////////////////////////
///////   FILE COMMANDS    ////////
//////////////////////////////////

function editor_clear() {
    setname("");
    $ol.empty();
    $ol.removeData('history-id');
    closeDetails(false);
    refreshEmptyHint();
    editor_checkpoint();
}

function editor_checkpoint() { savedSignature = signature(); }
function editor_modified()   { return (signature() !== savedSignature); }

function signature() {
    var sig = "";
    $ol.find('.event').each(function() {
        var $li = $(this);
        sig += '|' + $li.find('.dropbtn').text()
             + '~' + $li.find('.dropdate').text()
             + '~' + ($li.data('ntitle') || '')
             + '~' + ($li.data('ndate')  || '')
             + '~' + ($li.data('desc')   || '')
             + '~' + ($li.data('ndesc')  || '')
             + '~' + ($li.data('id1')    || '')
             + '~' + ($li.data('id2')    || '');
    });
    return sig;
}

//  pack the events (in current timeline order) into the events[] array for storage
function editor_pack() {
    var events = [];
    $ol.find('.event').each(function() {
        var $li    = $(this);
        var title  = $.trim($li.find('.dropbtn').text());
        var date   = $.trim($li.find('.dropdate').text());
        var ntitle = $.trim($li.data('ntitle') || '');
        var ndate  = $.trim($li.data('ndate')  || '');
        var desc   = $li.data('desc')  || '';
        var ndesc  = $.trim($li.data('ndesc') || '');
        var id1    = $li.data('id1') || '';
        var id2    = $li.data('id2') || '';

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

function editor_save(name) {
    if ($ol.find('.event').length === 0) {
        LOOMA.alert('Add at least one event before saving.', 5);
        return;
    }
    // savefile(name, collection, filetype, data, activityFlag, author)
    savefile(name, currentcollection, currentfiletype, editor_pack(), "false", loginname);
    // activityFlag 'false' - user timelines are NOT indexed as activities (stay out of library search)
}

// called by filecommands after a File-menu OPEN
function editor_display(response) {
    editor_clear();
    setname(response.dn || response.title, response.author);
    if (response['_id']) $ol.data('history-id', response['_id']['$id'] || response['_id']['$oid']);

    var events = response.events || response.data || [];
    $(events).each(function(i, ev) { addEvent(ev); });
    refreshEmptyHint();
    editor_checkpoint();
}

function quit() {
    if (callbacks['modified']()) savework(currentname, currentcollection, currentfiletype);
    else window.history.back();
}


$(document).ready(function() {
    $ol = $('#timeline-ol');

    loginname  = LOOMA.loggedIn();
    loginlevel = LOOMA.readCookie('login-level');
    loginteam  = LOOMA.readCookie('login-team');

    // File commands operate on the user_histories collection ONLY
    currentname       = "";
    currentcollection = "user_histories";
    currentfiletype   = "history";
    currentDB         = 'loomalocal';

    // the activity search (#search, inside the details panel) searches ACTIVITIES
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
    callbacks['new']        = function() { addEvent(); refreshEmptyHint(); editor_checkpoint(); };

    // + Add Event
    $('#add-event').on('click', function() {
        var $li = addEvent();
        refreshEmptyHint();
        $('#playground').animate({ scrollLeft: $('#playground')[0].scrollWidth }, 300);
        $li.find('.dropbtn').focus();
    });

    // per-event controls (delegated)
    $ol.on('click', '.ev-details', function() { openDetails($(this).closest('.event')); return false; });
    $ol.on('click', '.ev-remove', function() {
        var $li = $(this).closest('.event');
        if (currentLi && currentLi[0] === $li[0]) closeDetails(false);
        $li.remove(); refreshEmptyHint(); return false;
    });
    $ol.on('click', '.ev-move-left', function() {
        var $li = $(this).closest('.event'), $prev = $li.prev('.event');
        if ($prev.length) $li.insertBefore($prev);
        return false;
    });
    $ol.on('click', '.ev-move-right', function() {
        var $li = $(this).closest('.event'), $next = $li.next('.event');
        if ($next.length) $li.insertAfter($next);
        return false;
    });

    // details panel
    $('#details-done').on('click',  function() { closeDetails(true); });
    $('#details-close').on('click', function() { closeDetails(true); });
    $('#d-link-activity').on('click', function() {
        $('#activity-search').removeAttr('hidden');
        $('#search-term').focus();
    });
    $('#d-activities').on('click', 'button', function() {
        var slot = $(this).data('slot');
        currentLi.removeData(slot).removeData(slot === 'id1' ? 'name1' : 'name2');
        if (slot === 'id1' && currentLi.data('id2')) {   // keep positions compact
            currentLi.data('id1', currentLi.data('id2')); currentLi.data('name1', currentLi.data('name2'));
            currentLi.removeData('id2').removeData('name2');
        }
        renderDetailChips();
        return false;
    });
    $('#activity-results').on('click', 'button', function() {
        attachActivity($(this).data('id'), $(this).data('dn'));
        return false;
    });

    // timeline scroll arrows
    $('#timelineLeft').on('click',  function() { $('#playground').animate({ scrollLeft: '-=300px' }, 500); });
    $('#timelineRight').on('click', function() { $('#playground').animate({ scrollLeft: '+=300px' }, 500); });

    // dismiss / back -> quit (prompts to save if modified)
    $('#dismiss').off('click').on('click', function() { quit(); });

    refreshEmptyHint();
    editor_checkpoint();
});
