/*
LOOMA javascript file
Filename: looma-edit-history.js
Description: editor for user-created history timelines.

    UX: a Timeline modal (title, Nepali title, cover image) opens on entry / File-New.
    Then a blank timeline in the real viewer format (yellow line, events alternating
    above/below). Tap a "+" insert slot to add an event, or tap an event to edit it in
    the Event modal (title, date, description, + optional Nepali). No linked activities.

    Data model (in the 'user_histories' collection):
        { dn, ft:'history', title, ndn, thumb, events:[ event, ... ] }
    each event:
        { title, date, popup:[description], ndn?, ndate?, npopup:[nepaliDescription]? }

    IMPORTANT: reads/writes ONLY the 'user_histories' collection. The curated, read-only
    'histories' collection (the 11 approved timelines) is never referenced.

Owner: VillageTech Solutions (villagetechsolutions.org)
Revision: Looma 7.x
 */

'use strict';

var DEFAULT_THUMB = 'images/logos/LoomaLogoTransparent.png';

var loginname, loginlevel, loginteam;
var savedSignature = "";

// --- source of truth ---
var timeline = { ndn: "", thumb: "" };   // title is kept in `currentname` (the File-menu name)
var events = [];                          // array of {title, ndn, date, ndate, desc, ndesc}

var editingIndex = null;                  // event index being edited (null => creating new)
var insertIndex  = 0;                     // where a new event will be inserted
var pendingThumb = "";                    // cover image chosen in the Timeline modal (data-URL or url)


//////////////////////////////////
///////   RENDER TIMELINE  ////////
//////////////////////////////////

function renderTimeline() {
    var $ol = $('#timeline-ol').empty();

    if (events.length === 0) {
        $ol.append(
            '<li class="insert-slot first">' +
            '<button class="insert-btn" data-index="0">&#43; Insert first event</button>' +
            '</li>'
        );
        return;
    }

    for (var i = 0; i < events.length; i++) {
        $ol.append(insertSlot(i));
        $ol.append(eventCard(i));
    }
    $ol.append(insertSlot(events.length));
}

function insertSlot(index) {
    return $('<li class="insert-slot"><button class="insert-btn" title="Insert event here">&#43;</button></li>')
        .find('.insert-btn').attr('data-index', index).end();
}

function eventCard(i) {
    var e = events[i];
    var $li = $(
        '<li class="event">' +
          '<div class="timeline-description">' +
            '<div class="dropbtn"></div>' +
            '<div class="dropdate"></div>' +
          '</div>' +
        '</li>'
    );
    $li.addClass(i % 2 === 0 ? 'above' : 'below');
    $li.attr('data-index', i);
    $li.find('.dropbtn').text(e.title || '');
    $li.find('.dropdate').text(e.date || '');
    return $li;
}


//////////////////////////////////
///////   TIMELINE MODAL   ////////
//////////////////////////////////

function openTimelineModal() {
    $('#tl-title').val(currentname || '');
    $('#tl-ntitle').val(timeline.ndn || '');
    $('#tl-cover-url').val('');
    pendingThumb = timeline.thumb || '';
    showCoverPreview(pendingThumb);
    $('#timeline-modal').removeAttr('hidden');
    $('#tl-title').focus();
}

function showCoverPreview(src) {
    if (src) {
        $('#tl-cover-preview').attr('src', src).removeAttr('hidden');
        $('#tl-remove-image').removeAttr('hidden');
    } else {
        $('#tl-cover-preview').attr('src', '').attr('hidden', true);
        $('#tl-remove-image').attr('hidden', true);
    }
}

function saveTimelineModal() {
    var title = $.trim($('#tl-title').val());
    if (!title) { LOOMA.alert('Please enter a timeline title.', 5); return; }

    var urlVal = $.trim($('#tl-cover-url').val());
    if (urlVal) pendingThumb = urlVal;    // a pasted URL overrides

    currentname   = title;
    timeline.ndn  = $.trim($('#tl-ntitle').val());
    timeline.thumb = pendingThumb || '';
    setname(currentname, loginname);

    $('#timeline-modal').attr('hidden', true);
}

// read a chosen image file, downscale it to a small data-URL (no server upload needed)
function loadImageToThumb(file, cb) {
    var reader = new FileReader();
    reader.onload = function(ev) {
        var img = new Image();
        img.onload = function() {
            var max = 400, w = img.width, h = img.height;
            if (w > h && w > max)      { h = Math.round(h * max / w); w = max; }
            else if (h >= w && h > max){ w = Math.round(w * max / h); h = max; }
            var c = document.createElement('canvas');
            c.width = w; c.height = h;
            c.getContext('2d').drawImage(img, 0, 0, w, h);
            cb(c.toDataURL('image/jpeg', 0.8));
        };
        img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
}


//////////////////////////////////
///////     EVENT MODAL    ////////
//////////////////////////////////

function openEventModal(index, isNew) {
    if (isNew) {
        editingIndex = null;
        insertIndex  = index;
        $('#event-modal-title').text('Add Event');
        $('#ev-delete').attr('hidden', true);
        $('#ev-title, #ev-ntitle, #ev-date, #ev-ndate, #ev-desc, #ev-ndesc').val('');
    } else {
        editingIndex = index;
        var e = events[index];
        $('#event-modal-title').text('Edit Event');
        $('#ev-delete').removeAttr('hidden');
        $('#ev-title').val(e.title  || '');
        $('#ev-ntitle').val(e.ndn   || '');
        $('#ev-date').val(e.date    || '');
        $('#ev-ndate').val(e.ndate  || '');
        $('#ev-desc').val(e.desc    || '');
        $('#ev-ndesc').val(e.ndesc  || '');
    }
    $('#event-modal').removeAttr('hidden');
    $('#ev-title').focus();
}

function saveEventModal() {
    var title = $.trim($('#ev-title').val());
    if (!title) { LOOMA.alert('Please enter an event title.', 5); return; }

    var e = {
        title: title,
        ndn:   $.trim($('#ev-ntitle').val()),
        date:  $.trim($('#ev-date').val()),
        ndate: $.trim($('#ev-ndate').val()),
        desc:  $('#ev-desc').val(),
        ndesc: $.trim($('#ev-ndesc').val())
    };

    if (editingIndex !== null) events[editingIndex] = e;
    else                       events.splice(insertIndex, 0, e);

    $('#event-modal').attr('hidden', true);
    renderTimeline();
}

function deleteEvent() {
    if (editingIndex !== null) events.splice(editingIndex, 1);
    $('#event-modal').attr('hidden', true);
    renderTimeline();
}


//////////////////////////////////
///////   FILE COMMANDS    ////////
//////////////////////////////////

function editor_clear() {
    setname("");
    timeline = { ndn: "", thumb: "" };
    events = [];
    $('#timeline-modal, #event-modal').attr('hidden', true);
    renderTimeline();
    editor_checkpoint();
}

function editor_checkpoint() { savedSignature = signature(); }
function editor_modified()   { return (signature() !== savedSignature); }

function signature() {
    return JSON.stringify({ n: currentname || '', t: timeline, e: events });
}

//  pack events into the stored shape
function packEvents() {
    return events.map(function(e) {
        var ev = { title: e.title, date: e.date, popup: [e.desc || ''] };
        if (e.ndn)   ev.ndn    = e.ndn;
        if (e.ndate) ev.ndate  = e.ndate;
        if (e.ndesc) ev.npopup = [e.ndesc];
        return ev;
    });
}

//  custom save: savefile() can't carry title/ndn/thumb, so post them directly
function editor_save(name) {
    if (events.length === 0) { LOOMA.alert('Add at least one event before saving.', 5); return; }
    if (!name) name = currentname;

    $.post("looma-database-utilities.php", {
        cmd:        "save",
        collection: "user_histories",
        db:         currentDB,
        ft:         "history",
        activity:   "false",          // NOT indexed as an activity (stays out of library search)
        dn:         LOOMA.escapeHTML(name),
        title:      LOOMA.escapeHTML(name),
        ndn:        timeline.ndn || '',
        thumb:      timeline.thumb || DEFAULT_THUMB,
        author:     loginname,
        editor:     loginname,
        data:       packEvents()
    }).then(function() {
        editor_checkpoint();
        LOOMA.alert('Timeline "' + name + '" saved', 5);
    });
}

// called by filecommands after a File-menu OPEN
function editor_display(response) {
    editor_clear();
    setname(response.dn || response.title, response.author);

    timeline.ndn   = response.ndn   || '';
    timeline.thumb = response.thumb || '';

    events = (response.events || response.data || []).map(function(ev) {
        var popup  = ev.popup  || [];
        var npopup = ev.npopup || [];
        return {
            title: ev.title || '',
            ndn:   ev.ndn   || '',
            date:  ev.date  || '',
            ndate: ev.ndate || '',
            desc:  popup[0] || '',
            ndesc: npopup[0] || ''
        };
    });

    renderTimeline();
    editor_checkpoint();
}

function quit() {
    if (callbacks['modified']()) savework(currentname, currentcollection, currentfiletype);
    else window.history.back();
}


$(document).ready(function() {
    loginname  = LOOMA.loggedIn();
    loginlevel = LOOMA.readCookie('login-level');
    loginteam  = LOOMA.readCookie('login-team');

    // File commands operate on the user_histories collection ONLY
    currentname       = "";
    currentcollection = "user_histories";
    currentfiletype   = "history";
    currentDB         = 'loomalocal';

    $('.template-cmd').hide();   // no templates for history timelines

    // callbacks expected by looma-filecommands.js
    callbacks['clear']      = editor_clear;
    callbacks['save']       = editor_save;
    callbacks['display']    = editor_display;
    callbacks['modified']   = editor_modified;
    callbacks['checkpoint'] = editor_checkpoint;
    callbacks['new']        = function() { openTimelineModal(); };

    // --- timeline surface ---
    $('#timeline-ol').on('click', '.insert-btn', function() {
        openEventModal(parseInt($(this).attr('data-index'), 10), true);
    });
    $('#timeline-ol').on('click', '.event', function() {
        openEventModal(parseInt($(this).attr('data-index'), 10), false);
    });

    // --- timeline modal ---
    $('#timeline-details-btn').on('click', openTimelineModal);
    $('#tl-done').on('click', saveTimelineModal);
    $('#tl-choose-image').on('click', function() { $('#tl-cover-file').click(); });
    $('#tl-cover-file').on('change', function() {
        if (this.files && this.files[0]) {
            loadImageToThumb(this.files[0], function(dataUrl) {
                pendingThumb = dataUrl;
                $('#tl-cover-url').val('');
                showCoverPreview(dataUrl);
            });
        }
    });
    $('#tl-cover-url').on('input', function() {
        var v = $.trim($(this).val());
        if (v) { pendingThumb = v; showCoverPreview(v); }
    });
    $('#tl-remove-image').on('click', function() {
        pendingThumb = '';
        $('#tl-cover-url').val('');
        $('#tl-cover-file').val('');
        showCoverPreview('');
    });

    // --- event modal ---
    $('#ev-done').on('click', saveEventModal);
    $('#ev-delete').on('click', deleteEvent);

    // close (X) buttons - just hide, no changes applied
    $('.modal-close').on('click', function() { $('#' + $(this).data('modal')).attr('hidden', true); });

    // timeline scroll arrows
    $('#timelineLeft').on('click',  function() { $('#playground').animate({ scrollLeft: '-=300px' }, 500); });
    $('#timelineRight').on('click', function() { $('#playground').animate({ scrollLeft: '+=300px' }, 500); });

    // dismiss / back -> quit (prompts to save if modified)
    $('#dismiss').off('click').on('click', function() { quit(); });

    renderTimeline();
    editor_checkpoint();

    // on entry with a fresh timeline, open the Timeline modal first
    openTimelineModal();
});
