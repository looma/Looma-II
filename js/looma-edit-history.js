/*
LOOMA javascript file
Filename: looma-edit-history.js
Description: editor for user-created history timelines.

    UX: you land on a blank timeline (the real viewer format: yellow line, events
    alternating above/below) and start adding events right away. Tap a "+" insert slot
    to add an event, or tap an event to edit it in the Event modal (title, date,
    description, + optional Nepali). No linked activities. On SAVE, an untitled timeline
    opens the Timeline Details modal (title, Nepali title, cover image) to collect its
    details, then saves; after that SAVE writes silently. The toolbar "Timeline Details"
    button reopens that modal to edit the title/cover anytime.

    Data model (in the 'histories' collection):
        { dn, ft:'history', title, ndn, thumb, events:[ event, ... ] }
    each event:
        { title, date, popup:[description], ndn?, ndate?, npopup:[nepaliDescription]?, images?:[url,...] }
        images: up to 2 Looma-Library image URLs, rendered inline in the viewer's popup.

    IMPORTANT: reads/writes the 'histories' collection, alongside the curated
    approved timelines.

Owner: VillageTech Solutions (villagetechsolutions.org)
Revision: Looma 7.x
 */

'use strict';

var DEFAULT_THUMB = 'images/logos/LoomaLogoTransparent.png';

var loginname, loginlevel, loginteam;
var savedSignature = "";

// --- source of truth ---
var timeline = { ndn: "", thumb: "" };   // title is kept in `currentname` (the File-menu name)
var events = [];                          // array of {title, ndn, date, ndate, desc, ndesc, images:[url,...]}

var editingIndex = null;                  // event index being edited (null => creating new)
var insertIndex  = 0;                     // where a new event will be inserted
var pendingThumb = "";                    // cover image chosen in the Timeline modal (data-URL or url)
var eventImages  = [];                    // up to 2 Library image URLs for the event being edited
var timelineSaveMode = false;             // Timeline modal opened as the first-save gate (Done -> save)
var timelineSaveThen = null;              // optional fn to run after a successful first-save (e.g. leave)


//////////////////////////////////
///////   RENDER TIMELINE  ////////
//////////////////////////////////

function renderTimeline() {
    var $ol = $('#timeline-ol');
    if ($ol.hasClass('ui-sortable')) $ol.sortable('destroy');   // rebuilt below, so drop the old instance
    $ol.empty();

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
    $ol.append(insertSlot(events.length, true));   // prominent "Add event" after the last event
    enableSort();
}

// index = where a click inserts; prominent = the big "Add event" slot after the last event
function insertSlot(index, prominent) {
    var $li = prominent
        ? $('<li class="insert-slot add-after"><button class="insert-btn add-event-btn">&#43; Add event</button></li>')
        : $('<li class="insert-slot"><button class="insert-btn" title="Insert event here">&#43;</button></li>');
    return $li.find('.insert-btn').attr('data-index', index).end();
}

// drag an event card onto another to reorder; rebuild events[] from the new DOM order
function enableSort() {
    var $ol = $('#timeline-ol');
    if (events.length < 2) return;
    $ol.sortable({
        items:     '> li.event',
        distance:  8,               // small moves stay clicks (tap-to-edit), not drags
        tolerance: 'pointer',
        axis:      'x',
        stop: function() {
            var reordered = [];
            $ol.children('li.event').each(function() {
                reordered.push(events[parseInt($(this).attr('data-index'), 10)]);
            });
            events = reordered;
            renderTimeline();
        }
    });
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

// saveAfter: opened by SAVE on an untitled timeline -> Done captures details, then saves.
// thenFn: optional callback run after that first save completes (used by quit -> Save & leave).
function openTimelineModal(saveAfter, thenFn) {
    timelineSaveMode = !!saveAfter;
    timelineSaveThen = thenFn || null;
    $('#tl-title').val(currentname || '');
    $('#tl-ntitle').val(timeline.ndn || '');
    pendingThumb = timeline.thumb || '';
    showCoverPreview(pendingThumb);
    setNepali('tl-nepali', !!timeline.ndn);     // expand only if a Nepali title already exists
    $('#timeline-modal').addClass('open');
    $('#tl-title').focus();
}

// show/collapse the Nepali translation fields for a modal
function setNepali(targetId, expand) {
    var $fields = $('#' + targetId);
    var $btn = $('.nepali-toggle[data-target="' + targetId + '"]');
    if (expand) { $fields.addClass('show');   $btn.html('&minus; Hide Nepali translation'); }
    else        { $fields.removeClass('show'); $btn.html('&#43; Add Nepali translation'); }
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

    var ndn   = $.trim($('#tl-ntitle').val());
    var thumb = pendingThumb || '';

    function commit() {
        currentname    = title;
        timeline.ndn   = ndn;
        timeline.thumb = thumb;
        setname(currentname, loginname);
        $('#timeline-modal').removeClass('open');
    }

    // plain edit via the toolbar "Timeline Details" button: just apply the changes
    if (!timelineSaveMode) { commit(); return; }

    // first save: reject a title already taken (mirrors the other Looma editors), then save
    timelineExists(title)
        .then(function(obj) {
            LOOMA.alert('A timeline named "' + obj.name + '" already exists (owned by ' +
                        obj.author + '). Please choose another title.', 6, true);
        })
        .catch(function() {
            var thenFn = timelineSaveThen;
            timelineSaveMode = false;
            timelineSaveThen = null;
            owner = true;
            commit();
            var p = editor_save(currentname);
            if (p && p.then && thenFn) p.then(thenFn);
        });
}

// resolve(found-doc) if a timeline of this name already exists, reject(name) if it's free.
// mirrors fileexists() in looma-filecommands.js (endpoint echoes a JSON string).
function timelineExists(name) {
    return new Promise(function(resolve, reject) {
        $.post('looma-database-utilities.php',
            { cmd: 'exists', collection: currentcollection, ft: currentfiletype, dn: LOOMA.escapeHTML(name) },
            'json')
            .then(function(result) {
                var a = JSON.parse(result);
                if (a['_id'] == '') reject(name);   // name is free
                else                resolve(a);      // name is taken
            });
    });
}


//////////////////////////////////
///////     EVENT MODAL    ////////
//////////////////////////////////

function openEventModal(index, isNew) {
    if (isNew) {
        editingIndex = null;
        insertIndex  = index;
        eventImages  = [];
        $('#event-modal-title').text('Add Event');
        $('#ev-delete').attr('hidden', true);
        $('#ev-title, #ev-ntitle, #ev-date, #ev-ndate, #ev-desc, #ev-ndesc').val('');
        setNepali('ev-nepali', false);
    } else {
        editingIndex = index;
        var e = events[index];
        eventImages  = (e.images || []).slice();
        $('#event-modal-title').text('Edit Event');
        $('#ev-delete').removeAttr('hidden');
        $('#ev-title').val(e.title  || '');
        $('#ev-ntitle').val(e.ndn   || '');
        $('#ev-date').val(e.date    || '');
        $('#ev-ndate').val(e.ndate  || '');
        $('#ev-desc').val(e.desc    || '');
        $('#ev-ndesc').val(e.ndesc  || '');
        setNepali('ev-nepali', !!(e.ndn || e.ndate || e.ndesc));  // expand only if Nepali content exists
    }
    renderEventImages();
    $('#event-modal').addClass('open');
    $('#ev-title').focus();
}

// draw the current event's image thumbnails (each with a remove button); hide "Add" once 2 are chosen
function renderEventImages() {
    var $list = $('#ev-images-list').empty();
    eventImages.forEach(function(src, i) {
        var $slot = $('<div class="ev-img-slot"></div>');
        $('<img alt="event image">').attr('src', src).appendTo($slot);
        $('<button type="button" class="ev-img-remove" title="Remove image">&times;</button>')
            .attr('data-i', i).appendTo($slot);
        $list.append($slot);
    });
    $('#ev-add-image').toggle(eventImages.length < 2);
}

function saveEventModal() {
    var title = $.trim($('#ev-title').val());
    if (!title) { LOOMA.alert('Please enter an event title.', 5); return; }

    var e = {
        title:  title,
        ndn:    $.trim($('#ev-ntitle').val()),
        date:   $.trim($('#ev-date').val()),
        ndate:  $.trim($('#ev-ndate').val()),
        desc:   $('#ev-desc').val(),
        ndesc:  $.trim($('#ev-ndesc').val()),
        images: eventImages.slice()
    };

    if (editingIndex !== null) events[editingIndex] = e;
    else                       events.splice(insertIndex, 0, e);

    $('#event-modal').removeClass('open');
    renderTimeline();
}

function deleteEvent() {
    if (editingIndex !== null) events.splice(editingIndex, 1);
    $('#event-modal').removeClass('open');
    renderTimeline();
}


//////////////////////////////////
///////   IMAGE SEARCH     ////////
//////////////////////////////////
// Reuses the shared Looma search panel (includes/looma-search.php + js/looma-search.js).
// That code calls the globals displayResults() and clearResults() defined here, and
// posts results into #results-div.

var IMAGE_TYPES = { image:1, jpg:1, jpeg:1, png:1, gif:1 };

var imgSearchTarget = 'event';   // 'event' or 'cover' - where a picked Library image goes

function openImageSearch(target) {
    imgSearchTarget = (target === 'cover') ? 'cover' : 'event';
    if (imgSearchTarget === 'event' && eventImages.length >= 2) {
        LOOMA.alert('An event can have at most 2 images.', 5); return;
    }
    $('#image-checkbox').prop('checked', true);   // constrain the shared search to pictures
    $('#results-div').empty();
    $('#imgsearch-modal').addClass('open');
    $('#search-term').val('').focus();
}

// called by looma-search.js with the raw search response
function displayResults(result) {
    var $div = $('#results-div').empty();
    var list = (result && result.list) ? result.list : [];
    var pics = list.filter(function(it) { return IMAGE_TYPES[(it.ft || '').toLowerCase()]; });

    if (!pics.length) { $div.html('<p class="imgsearch-empty">No images found.</p>'); return; }

    pics.forEach(function(it) {
        var fp    = it.fp || '';
        var fn    = it.fn || it.nfn || '';
        var full  = fp + fn;                                        // full-size image (see looma-play-image.php)
        var thumb = LOOMA.thumbnail(fn, fp, it.ft, it.thumb) || full;
        var dn    = it.dn || it.ndn || fn;

        var $tile = $('<button type="button" class="imgresult"></button>')
            .attr('data-src', full).attr('title', dn);
        $('<img alt="">').attr('src', thumb)
            .on('error', function() { $(this).off('error').attr('src', full); })  // fall back to full image
            .appendTo($tile);
        $('<span class="imgresult-dn"></span>').text(dn).appendTo($tile);
        $div.append($tile);
    });
}

// looma-search.js clears results through this hook
function clearResults() { $('#results-div').empty(); }

function addSelectedImage(src) {
    if (!src) return;
    if (imgSearchTarget === 'cover') {          // Timeline Details cover image
        pendingThumb = src;
        showCoverPreview(src);
        $('#imgsearch-modal').removeClass('open');
        return;
    }
    if (eventImages.length >= 2) { LOOMA.alert('An event can have at most 2 images.', 5); return; }
    eventImages.push(src);
    renderEventImages();
    $('#imgsearch-modal').removeClass('open');
}


//////////////////////////////////
///////   FILE COMMANDS    ////////
//////////////////////////////////

function editor_clear() {
    setname("");
    timeline = { ndn: "", thumb: "" };
    events = [];
    $('#timeline-modal, #event-modal').removeClass('open');
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
        if (e.ndn)                   ev.ndn    = e.ndn;
        if (e.ndate)                 ev.ndate  = e.ndate;
        if (e.ndesc)                 ev.npopup = [e.ndesc];
        if (e.images && e.images.length) ev.images = e.images;
        return ev;
    });
}

//  custom save: savefile() can't carry title/ndn/thumb, so post them directly.
//  returns the save promise (or undefined if the save was blocked) so callers can act after it.
function editor_save(name) {
    if (events.length === 0) { LOOMA.alert('Add at least one event before saving.', 5); return; }
    if (!name) name = currentname;

    return $.post("looma-database-utilities.php", {
        cmd:        "save",
        collection: "histories",
        db:         currentDB,
        ft:         "history",
        activity:   "true",           // index as an activity so it appears in the library search
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
            title:  ev.title || '',
            ndn:    ev.ndn   || '',
            date:   ev.date  || '',
            ndate:  ev.ndate || '',
            desc:   popup[0] || '',
            ndesc:  npopup[0] || '',
            images: Array.isArray(ev.images) ? ev.images : []
        };
    });

    renderTimeline();
    editor_checkpoint();
}

function quit() {
    // no unsaved edits -> just leave, no prompt
    if (!callbacks['modified']()) { window.history.back(); return; }

    // one Save / Don't save / Cancel prompt. Reuses the file-commands save panel but calls
    // editor_save directly, so there's no redundant second "confirm" dialog.
    var $panel = $('#filesave-panel');
    LOOMA.makeTransparent($('#main-container'));
    $panel.find('#filesave-message').text('Save your changes before leaving?');
    $panel.show();

    function closePanel() {
        $panel.hide();
        LOOMA.makeOpaque($('#main-container'));
        $panel.find('.dismiss').off('click');
        $('#filesave-nosave, #filesave-save').off('click');
    }
    $panel.find('.dismiss').off('click').on('click', function() { closePanel(); });                    // Cancel -> stay
    $('#filesave-nosave').off('click').on('click', function() { closePanel(); window.history.back(); }); // Don't save -> leave
    $('#filesave-save').off('click').on('click', function() {                                           // Save -> save, then leave
        closePanel();
        if (currentname === '') {                        // never titled -> collect details first, then leave
            openTimelineModal(true, function() { window.history.back(); });
            return;
        }
        var p = editor_save(currentname);
        if (p && p.then) p.then(function() { window.history.back(); });
        // if the save was blocked (e.g. empty timeline), stay so the user can fix it
    });
}


$(document).ready(function() {
    loginname  = LOOMA.loggedIn();
    loginlevel = LOOMA.readCookie('login-level');
    loginteam  = LOOMA.readCookie('login-team');

    // File commands operate on the histories collection ONLY
    currentname       = "";
    currentcollection = "histories";
    currentfiletype   = "history";
    currentDB         = 'loomalocal';

    $('.template-cmd').hide();   // no templates for history timelines

    // callbacks expected by looma-filecommands.js
    callbacks['clear']      = editor_clear;
    callbacks['save']       = editor_save;
    callbacks['display']    = editor_display;
    callbacks['modified']   = editor_modified;
    callbacks['checkpoint'] = editor_checkpoint;
    // New just clears to a blank timeline (editor_clear already re-renders); title is asked at SAVE
    callbacks['new']        = function() {};

    // SAVE: an untitled timeline collects its details in the Timeline modal first, then saves.
    // Mirrors looma-filecommands.js's #save branches, swapping its name prompt for our modal.
    $('#save').off('click').on('click', function() {
        if (events.length === 0) { LOOMA.alert('Add at least one event before saving.', 5); return; }
        if (currentname === '')  { openTimelineModal(true); return; }   // first save -> Timeline Details -> save
        if (!owner) {
            LOOMA.alert('You are not the owner of this file. Use SAVE-AS to make a copy of your own', 5, true);
            return;
        }
        if (callbacks['modified']()) editor_save(currentname);
    });

    // --- timeline surface ---
    $('#timeline-ol').on('click', '.insert-btn', function() {
        openEventModal(parseInt($(this).attr('data-index'), 10), true);
    });
    $('#timeline-ol').on('click', '.event', function() {
        openEventModal(parseInt($(this).attr('data-index'), 10), false);
    });

    // --- timeline modal ---
    // wrapper so the click event isn't passed as openTimelineModal's saveAfter arg
    $('#timeline-details-btn').on('click', function() { openTimelineModal(); });
    $('#tl-done').on('click', saveTimelineModal);
    $('#tl-choose-image').on('click', function() { openImageSearch('cover'); });
    $('#tl-remove-image').on('click', function() {
        pendingThumb = '';
        showCoverPreview('');
    });

    // --- event modal ---
    $('#ev-done').on('click', saveEventModal);
    $('#ev-delete').on('click', deleteEvent);

    // --- event images ---
    $('#ev-add-image').on('click', function() { openImageSearch('event'); });
    $('#ev-images-list').on('click', '.ev-img-remove', function() {
        eventImages.splice(parseInt($(this).attr('data-i'), 10), 1);
        renderEventImages();
    });
    $('#results-div').on('click', '.imgresult', function() {
        addSelectedImage($(this).attr('data-src'));
    });

    // close (X) buttons - just hide, no changes applied
    $('.modal-close').on('click', function() { $('#' + $(this).data('modal')).removeClass('open'); });

    // Nepali translation toggle (both modals)
    $('.nepali-toggle').on('click', function() {
        var t = $(this).data('target');
        setNepali(t, !$('#' + t).hasClass('show'));
    });

    // timeline scroll arrows
    $('#timelineLeft').on('click',  function() { $('#playground').animate({ scrollLeft: '-=300px' }, 500); });
    $('#timelineRight').on('click', function() { $('#playground').animate({ scrollLeft: '+=300px' }, 500); });

    // dismiss / back -> quit (prompts to save if modified)
    $('#dismiss').off('click').on('click', function() { quit(); });

    // land on a blank timeline; the user adds events right away and titles it at SAVE
    renderTimeline();
    editor_checkpoint();
});
