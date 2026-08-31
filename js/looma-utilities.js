 /*
 * Name: Skip

Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 2015 03
Revision: Looma 2.0.0

filename: looma-utilities.js
Description:
 */

'use strict';

// utility JS functions used by many LOOMA pages
/*defines:
 * LOOMA.playMedia()
 * LOOMA.makeActivityButton()
 * LOOMA.makeChapterButton()
 * LOOMA.filepath()
 * LOOMA.thumbnail()
 * LOOMA.typename()
 * LOOMA.capitalize()
 * LOOMA.setStore()
 * LOOMA.readStore()
 * LOOMA.readCookie()
 * LOOMA.saveForm()
 * LOOMA.restoreForm()
 * LOOMA.loggedIn()
 * LOOMA.translate()
 * LOOMA.translatableSpans()
 * LOOMA.lookup()
 * LOOMA.reverselookup()
 * LOOMA.defHTML()  // helper function, not called by other JS
 * LOOMA.define()
 * LOOMA.reversedefine()
 * LOOMA.popupDefinition()
 * LOOMA.wordlist()
 * LOOMA.picturewordlist()
 * LOOMA.dictionaryDelete()
 * LOOMA.dictionaryUpdate()
 * LOOMA.rtl()
 * LOOMA.setTheme()
 * LOOMA.changeTheme()
 * LOOMA.changeVoice()
 * LOOMA.ch_id()
 * LOOMA.parseCH_ID()
 * LOOMA.getCH_ID()
 * LOOMA.speak(text)
 * LOOMA.toggleFullscreen()
 * LOOMA.makeTransparent()
 * LOOMA.makeOpaque()
 * LOOMA.closePopup()
 * LOOMA.alert()
 * LOOMA.confirm()
 * LOOMA.prompt()
 * LOOMA.$_GET()
 * LOOMA.download()
 * LOOMA.clean()
 * LOOMA.escapeHTML()
 * LOOMA.redirect
 * LOOMA.date()
 */

 var icons = {
     "pdf":"images/pdf.png",
     "jpeg":"images/picture.png",
     "jpg":"images/picture.png",
     "png":"images/picture.png",
     "image":"images/picture.png",
     "game":"images/games.png",
     "history":"images/history.png",
     "lesson":"images/lesson.png",
     "video":"images/video.png",
     "mp4":"images/video.png",
     "mov":"images/video.png",
     "mp3":"images/audio.png",
     "audio":"images/audio.png",
     "book":"images/book.png",
     "html":"images/html.png",
     "EP":"images/ole-transparent.png",
     "map":"images/maps.png",
     "slideshow":"images/slideshow.png",
     "text":"images/textfile.png",
     "textfile":"images/textfile.png",
     "looma":"images/LoomaLogo_small.png",
     "chapter":"images/book.png"
 };

var LOOMA = (function() {

    //the LOOMA object defines a namespace "LOOMA" that allows us to define LOOMA.playMedia()
    // [and other LOOMA functions] that won't cause name conflicts

    // local VARs here

    // local FUNCTIONS here

    return {

/* Ask the server which file actually delivers a chapter: the HTML one if it
 * exists, otherwise the PDF the caller built.
 *
 * HTML always wins over PDF. looma-chapters.php enforces that when it renders
 * chapter buttons (they arrive already marked data-ft='htmlchapter'), but every
 * OTHER way into a chapter — library search, lesson plans, the assistant —
 * assembles a ".pdf" path in JavaScript and never checks the disk. Routing that
 * assembly through here makes the rule hold everywhere.
 *
 * On any failure it answers "chapter", so a chapter still opens as a PDF if this
 * request is slow, blocked or 404s. Never let the preference break the opening.
 */
resolveChapterFile : function(fp, fn, callback) {
    var fallback = { ft: 'chapter', fp: fp, fn: fn };
    try {
        $.ajax({
            url: 'looma-chapter-file.php',
            data: { fp: decodeURIComponent(fp), fn: decodeURIComponent(fn) },
            dataType: 'json',
            timeout: 4000
        }).done(function (resolved) {
            callback((resolved && resolved.ft) ? resolved : fallback);
        }).fail(function () {
            callback(fallback);
        });
    } catch (e) {
        callback(fallback);
    }
},

playMedia : function(button) {

    var fn    = encodeURIComponent(button.getAttribute('data-fn'));
    var nfn   = encodeURIComponent(button.getAttribute('data-nfn'));
    var fp    = encodeURIComponent(button.getAttribute('data-fp'));
    var nfp   = encodeURIComponent(button.getAttribute('data-nfp'));
    var dn    = encodeURIComponent(button.getAttribute('data-dn'));
    var ndn   = encodeURIComponent(button.getAttribute('data-ndn'));
    var ch_id = encodeURIComponent(button.getAttribute('data-ch_id'));
    var captions = encodeURIComponent(button.getAttribute('data-captions'));
    if ( ! captions || captions === 'undefined') captions = true;

    var lang  = encodeURIComponent(button.getAttribute('data-lang'));
    var language = LOOMA.readStore('language', 'cookie');
    if (! lang || lang === 'null' || lang === 'both') lang =  language==='native'?'np':'en';

    switch (button.getAttribute("data-ft").toLowerCase()) {
        case "video":
        case "mp4":
        case "m4v":
        case "mov":
            window.location = 'video?' +
                 'fn=' + fn +
                '&fp=' + fp +
                '&dn=' + dn +
                '&captions=' + captions;
            break;

        case "evi":
            //evi = edited video indicator
            //If you click on an edited video it sends the filename, location and the information
            //to looma-edited-video.php
            window.location = 'looma-play-edited-video.php?fn=' + fn +
            '&fp=' + fp +
            '&id=' + button.getAttribute('data-mongoid') +
            '&dn=' + dn;
            break;

        case "image":
        case "jpg":
        case "jpeg":
        case "png":
        case "gif":
            window.location = 'image?fn=' + fn + '&fp=' + fp;
            break;

        case "audio":
        case "mp3":
        case "m4a":
            window.location = 'audio?fn=' + button.getAttribute('data-fn') +
                '&fp=' + button.getAttribute('data-fp') +
                '&dn=' + button.getAttribute('data-dn');

            //window.location = 'audio?fn=' + fn + '&fp=' + fp + '&dn=' + dn;
            break;

        case "pdf":      //PDF
        case "document": //DOCUMENT (some PDFs)
        case "textbook":
            var pdfZoom =  button.getAttribute('data-zoom');
            if ( ! pdfZoom || pdfZoom === "undefined" || pdfZoom === "auto") pdfZoom = '2.3';
            var pdfPage =  button.getAttribute('data-page') ? button.getAttribute('data-page') : 1;
            var pdfLen =  button.getAttribute('data-len') ? button.getAttribute('data-len') : 1000;
            var altFn  = button.getAttribute('data-nfn') || '';
            var altPage = button.getAttribute('data-npage') || '';
            var pdfChId = button.getAttribute('data-ch')      || '';
            var pdfChDn = button.getAttribute('data-chdn')    || button.getAttribute('data-dn') || '';
            var pdfGrade = button.getAttribute('data-class')  || '';
            var pdfSubj = button.getAttribute('data-subject') || '';
                    window.location = 'pdf?' +
                    'fn=' + encodeURIComponent(button.getAttribute('data-fn')) +
                    '&fp=' + encodeURIComponent(button.getAttribute('data-fp')) +
                    '&lang=' + lang +
                    '&zoom=' + pdfZoom +
                    '&len=' + pdfLen +
                    '&page=' + pdfPage +
                    '&nfn=' + encodeURIComponent(altFn) +
                    '&npage=' + encodeURIComponent(altPage) +
                    '&ch=' + encodeURIComponent(pdfChId) +
                    '&chdn=' + encodeURIComponent(pdfChDn) +
                    '&grade=' + encodeURIComponent(pdfGrade) +
                    '&subject=' + encodeURIComponent(pdfSubj);
            break;

        case "chapter":  //CHAPTER
        case "section":  //textbook SECTIONs are 'played' if len > 0

        if ( button.getAttribute('data-source') === 'useTextbooks')

       { // load whole textbook PDF and display only this chapter's pages
          var pdfZoom =  button.getAttribute('data-zoom');
            if ( ! pdfZoom || pdfZoom === "undefined") pdfZoom = '2.3';
            var pdfPage =  button.getAttribute('data-page') ? button.getAttribute('data-page') : 1;
            var pdfLen =  button.getAttribute('data-page') ? button.getAttribute('data-len') : 100;
            var chFn  = button.getAttribute('data-fn');
            var chNfn = button.getAttribute('data-nfn');
            var chNPage = button.getAttribute('data-npage') || '';
            var chId  = button.getAttribute('data-ch')      || '';
            var chDn  = button.getAttribute('data-chdn')    || button.getAttribute('data-dn') || '';
            var chGrade = button.getAttribute('data-class') || '';
            var chSubj  = button.getAttribute('data-subject') || '';
                    window.location = 'pdf?' +
                    'fn=' + encodeURIComponent(chFn) +
                    '&fp=' + encodeURIComponent(button.getAttribute('data-fp')) +
                    '&lang=' + lang +
                    '&zoom=' + pdfZoom +
                    '&len=' + pdfLen +
                    '&page=' + pdfPage +
                    '&nfn=' + encodeURIComponent(chNfn || '') +
                    '&npage=' + encodeURIComponent(chNPage) +
                    '&ch=' + encodeURIComponent(chId) +
                    '&chdn=' + encodeURIComponent(chDn) +
                    '&grade=' + encodeURIComponent(chGrade) +
                    '&subject=' + encodeURIComponent(chSubj);
       }
        else {  // load only the chapter PDF
          var pdfZoom =  button.getAttribute('data-zoom');
            if ( ! pdfZoom || pdfZoom === "undefined") pdfZoom = '2.3';
            var pdfPage = 1;
            var pdfLen  = 100;

            var folder, suffix;
            if (button.getAttribute('data-lang') === 'np') {
                folder = 'np';
            }
            else {
                folder = 'en';
            }
            var chapter_subject = button.getAttribute('data-subject');
            if (chapter_subject === 'Social studies') chapter_subject = 'SocialStudies';

            var chapterFP = '../content/chapters/' + button.getAttribute('data-class') + '/' +
                chapter_subject + '/' + folder + '/';

            var chapterFN = encodeURIComponent(button.getAttribute('data-ch')) +
                ((folder==='np') ? '-nepali' : '') +
                '.pdf';

            // Alternate-language file is the same chapter id with the opposite suffix.
            var altFolder = (folder === 'np') ? 'en' : 'np';
            var alt_chapterFP = '../content/chapters/' + button.getAttribute('data-class') + '/' +
                chapter_subject + '/' + altFolder + '/';
            var alt_chapterFN = encodeURIComponent(button.getAttribute('data-ch')) +
                ((altFolder === 'np') ? '-nepali' : '') +
                '.pdf';

            var chDn  = button.getAttribute('data-chdn') || button.getAttribute('data-dn') || '';

            var pdfUrl = 'pdf?' +
                'fn='  + chapterFN +
                '&fp=' + chapterFP +
                    '&lang=' + lang +
                    '&zoom=' + pdfZoom +
                    '&len=' + pdfLen +
                    '&page=' + pdfPage +
                    '&nfn=' + alt_chapterFN +
                    '&nfp=' + alt_chapterFP +
                    '&ch=' + encodeURIComponent(button.getAttribute('data-ch') || '') +
                    '&chdn=' + encodeURIComponent(chDn) +
                    '&grade=' + encodeURIComponent(button.getAttribute('data-class') || '') +
                    '&subject=' + encodeURIComponent(chapter_subject || '');

            // HTML WINS. This path builds a .pdf name without ever looking at the
            // disk, and it is the path every entry point other than the chapters
            // page uses (library search, lesson plans, the assistant). So ask the
            // server whether the same chapter also exists as HTML, and prefer it.
            LOOMA.resolveChapterFile(chapterFP, chapterFN, function (resolved) {
                if (resolved && resolved.ft === 'htmlchapter') {
                    window.location = 'html?fp=' + resolved.fp + '&fn=' + resolved.fn;
                } else {
                    window.location = pdfUrl;
                }
            });
            }
            break;

        case "text":
            var id = encodeURIComponent(button.getAttribute('data-mongoId'));
            var db = button.getAttribute('data-db') === 'loomalocal' ? 'loomalocal' : 'looma';
            window.location = 'text?id=' + id + '&db=' + db + '&lang=' + ((language==='native') ? 'np' : 'en');
            break;

        case "htmlchapter":
            // A chapter delivered as an HTML page instead of a PDF. Open it in the
            // HTML viewer with the file resolved server-side (looma-chapters.php).
            // Unlike the generic "html" case below, the file to open is always
            // this button's own data-fp/data-fn (one language per button), so
            // there is no en/np alternate to disambiguate.
            window.location = 'html?fp=' + fp + '&fn=' + fn;
            break;

        case "html":
            var kbd = encodeURIComponent(button.getAttribute('data-dn')) === 'ePaath' ? "keyboard" : "";
            if ( lang === 'en' || nfn === 'null' || nfp === 'null')
                 window.location = 'html?fp='  + fp + '&fn='  + fn + '&ep=' + kbd;
            else window.location = 'html?fp=' + nfp + '&fn=' + nfn + '&ep=' + kbd;
            break;

        case "book":
            var fp = encodeURIComponent(button.getAttribute('data-fp'));
            var dn = button.getAttribute('data-dn');
            var ndn = button.getAttribute('data-ndn');
            var prefix = button.getAttribute('data-prefix');
            window.location = 'book?fp=' + fp + '&prefix=' + prefix + '&dn=' + dn + '&ndn=' + ndn;
            break;

        case "looma":
            var fp = encodeURIComponent(button.getAttribute('data-fp'));
            window.location = fp;
            break;

        case "epaath":
        case "ep":
            if (button.getAttribute("data-epversion") == 2015) {
                fp = encodeURIComponent(button.getAttribute('data-fp'));
                fn = encodeURIComponent(button.getAttribute('data-fn') +
                    '/start.html');
                window.location = 'epaath?epversion=2015&fp=' + fp + '&fn=' + fn;
            } else  if (button.getAttribute("data-epversion") == 2019) {
                window.location = 'epaath?epversion=2019' +
                    '&ole=' + button.getAttribute("data-ole") +
                    '&lang=' + lang +
                    '&grade=' + button.getAttribute("data-grade").substr(5,);
            } else { // version is 2022
                window.location = 'epaath?epversion=2022' +
                    '&ole=' + button.getAttribute("data-ole") +
                    '&lang=' + lang +
                    '&grade=' + button.getAttribute("data-grade").substr(5,);
            }
            break;

        case "lesson":
            LOOMA.clearStore('lesson-plan-index', 'session');
            window.location = 'lesson?id=' + button.getAttribute('data-mongoid') +
                '&db=' + button.getAttribute('data-db') +
                '&lang=' + ((language==='native') ? 'np' : 'en');
            break;

        case "game":
             window.location = 'game?id=' + button.getAttribute('data-mongoid') +
                 '&class=' + button.getAttribute('data-class') +
                 '&subject=' + button.getAttribute('data-subject') +
                 '&ch_id=' + button.getAttribute('data-ch_id') +
                 '&type=' + button.getAttribute('data-type');
             break;

        case "map":
            window.location = 'map?id=' + button.getAttribute('data-mongoid');
            break;

            /*

        case "map":
            var fn = encodeURIComponent(button.getAttribute('data-fn'));
            var url = encodeURIComponent(button.getAttribute('data-url'));
            if (url) window.location = url;
            else     window.location = 'looma-maps-' + fn + '.php';
            break;

             */
        case "slideshow":
            window.location = 'slideshow?id=' + button.getAttribute("data-mongoid");
            break;

        case "history":
            window.location = 'history?id=' + button.getAttribute("data-mongoid");
            break;

            /*case "history":
            window.location = 'looma-history.php?title=' + button.getAttribute('data-dn');
            break;
            */

        case "exercise":
            // AI-generated chapter exercises — open the standalone player.
            // We pass ch_id (used by /quiz_data) and the chapter context so
            // the player can fall back to on-demand generation when needed.
            window.location = 'looma-play-exercise.php' +
                '?ch_id='    + encodeURIComponent(button.getAttribute('data-ch') || '') +
                '&mongoID='  + encodeURIComponent(button.getAttribute('data-mongoid') || '') +
                '&grade='    + encodeURIComponent(button.getAttribute('data-grade') || '') +
                '&subject='  + encodeURIComponent(button.getAttribute('data-subject') || '') +
                '&language=' + encodeURIComponent(button.getAttribute('data-lang') || '');
            break;

        case "vocab":
        case "voc":
            // Legacy "Key Vocabulary" game — same destination the Resources
            // page button uses, so AI/Resources behave identically.
            var kvGrade = button.getAttribute('data-grade') || '';
            window.location = 'looma-game.php?type=keywords' +
                '&class='   + encodeURIComponent('Class ' + kvGrade) +
                '&subject=' + encodeURIComponent(button.getAttribute('data-subject') || '') +
                '&ch_id='   + encodeURIComponent(button.getAttribute('data-ch') || button.getAttribute('data-mongoid') || '');
            break;

        default:
            console.log("ERROR: in LOOMA.playMedia(), unknown type: " +
                button.getAttribute("data-ft"));
    } //end SWITCH
}, //end LOOMA.playMedia()

        makeActivityButton : function(result, id, db, mongoID, appendToDiv) {
             var thumbfile;
             var mongoID;

            //var fp = (result.fp) ? 'data-fp=\"' + result.fp + '\"' : null;
            if (result) var fp = ("fp" in result && result.fp) ? result.fp : LOOMA.filepath(result.ft);

            var lang;
            if (result.lang) lang = result.lang;
            else {
                var cookie = LOOMA.readStore('language', 'cookie');
                lang = cookie !== 'english' ? 'np' : 'en';
            }

            var fn = (result.fn) ? result.fn : result.nfn;
            var db = (result.db) ? result.db : 'looma';
            var ft =  result.ft;

            if (result.ID && result.ft === 'chapter') {
                fp = LOOMA.filepath('chapter') +
                     LOOMA.parseCH_ID(result.ID)['currentGradeFolder'] + '/' +
                     LOOMA.parseCH_ID(result.ID)['currentSubjectFull'] + '/' +
                    lang + '/';
                fn = result.ID + '.pdf';
                ft='pdf';
            }

            //var captions = result['play-captions'];
            if (result.mongoID) {mongoID = result.mongoID.$oid;}

            var $newButton = $(
                '<button class="activity play img" ' +
                'data-id="' + result._id          + '" ' +
                'data-fn="' + fn   + '" ' +
                'data-fp="' + fp          + '" ' +
                'data-db="' + db          + '" ' +
                'data-ft="' + ft   + '" ' +
                'data-lang="' +  lang     + '" ' +
                'data-dn="' + result.dn   + '" ' +
                'data-ndn="' + result.ndn   + '" ' +
                'data-prefix="' + result.prefix   + '" ' +

                'data-zoom="' + result.zoom + '" ' +
                'data-url="' + result.url + '" ' +

                'data-grade="' + result.grade + '" ' +
                'data-class="' + result.class + '" ' +
                'data-subject="' + result.subject + '" ' +
                'data-type="' + result.presentation_type + '" ' +

                'data-epversion="' + result.version + '" ' +
                'data-ole="' + result.oleID + '" ' +
                'data-ID="' + result.ID + '" ' +
                'data-captions="' + result['play-captions'] + '" ' +
                'data-mongoID="'  + mongoID    + '" >'

                // add key1, key2, key3, key4, thumb, src, mondoID, url and ch_id data-fields  ???
                //
            );

            //    $newButton.append($('<img class="icon" src="images/alert.jpg">'));

            //var fn = (language === 'native') ? result.nfn : result.fn;
            if ( ! ('fn' in result) && ('nfn' in result)) fn = result.nfn;
            else if ('fn' in result) fn = result.fn;
            else fn = null;

            thumbfile = LOOMA.thumbnail(fn, result.fp, result.ft, result.thumb);
            /*
                              if      (result.ft == 'EP'       && result.thumb)
                                                     thumbfile = '../ePaath/' + result.thumb;

                              else if (result.thumb) thumbfile = result.fp + result.thumb ;
                              else if (fn)                  thumbfile = LOOMA.thumbnail(fn, result.fp, result.ft);

          */
            if (thumbfile) {
                // Many files — especially images — have no generated *_thumb.jpg,
                // which would leave a broken image in the card. Attach a per-image
                // fallback chain: original file (for images), then a folder
                // placeholder. NOTE: the `error` event does not bubble, so this
                // MUST be bound on the <img> itself — a delegated handler on a
                // parent would never fire.
                var $thumb = $('<img alt="" loading="lazy" draggable="false">');
                (function ($img, ftype, filePath, fileName) {
                    var chain = [];
                    if (/^(image|jpe?g|png|gif)$/i.test(ftype || '') && filePath && fileName) {
                        chain.push(filePath + fileName);          // the original image
                    }
                    if (filePath) chain.push(filePath + 'thumbnail.png');  // folder placeholder
                    $img.on('error', function () {
                        var next = null;
                        while (chain.length) {
                            var candidate = chain.shift();
                            if (candidate && candidate !== this.getAttribute('src')) { next = candidate; break; }
                        }
                        if (next) this.src = next;
                        else this.onerror = null;                 // give up — stop the loop
                    });
                })($thumb, ft, fp, fn);
                $thumb.attr('src', thumbfile);   // set src AFTER binding so a cached 404 still triggers the handler
                $newButton.append($thumb);
            }

            //                   ' onerror="this.onerror=null;this.src="' + result.fp + 'thumbnail.png" />'));

            /*this idea is from: https://stackoverflow.com/questions/980855/inputting-a-default-image-in-case-the-src-attribute-of-an-html-img-is-not-vali
                   $newButton.append($('<object draggable="false" data="' + thumbfile + '" type="image/png">' +
                                        '<img alt="" src="' + result.fp + 'thumbnail.png">' +
                                        '</object>'));
             */


            var displayname;
            if (language==='english') displayname = ('dn' in result) ? result.dn : result.ndn;
            else displayname = ('ndn' in result) ? result.ndn : result.dn;



            //var displayname = ((language === 'native' || (! 'dn' in result)) && result.ndn )  ? result.ndn : result.dn;
            $newButton.append($('<span class="dn">').text(displayname));

            $newButton.append($('<img class="icon" src="' + icons[result.ft] + '">'));

            $newButton.click(function() {LOOMA.playMedia(this);});
            $newButton.appendTo(appendToDiv);
        }, // end makeActivityButton()


        makeActivityButtonFromId: function (id, db, mongoID, appendToDiv) {
    // given an ID for an activity in the activities collection in mongo,
    // attach a button [clickable button that launches that activity] to "appendToDiv"

        // NOTE: probably want to attach ALL the attributes of the activity (as data-xxx fields) to the Activity Button

    //post to looma-database-utilities.php with cmd='openByID' and id=id
    // and result function makes a DIV and calls "succeed(div)"
             $.post("looma-database-utilities.php",
                {cmd: 'openByID',
                 db: db,
                 collection: 'activities',
                 id: id},
                 function(result) {
                    LOOMA.makeActivityButton(result, id, db, mongoID, appendToDiv)
            },
                'json'
              );
        }, //end makeActivityButtonFromID()

makeChapterButton: function (id, appendToDiv) {
        $.post("looma-database-utilities.php",
            {cmd: 'openByID', collection: 'chapters', id: id},
            function(result) {
                console.log(result);
                var chElements = LOOMA.parseCH_ID(id);
                var subj = chElements['currentSubjectFull'], grade = chElements['currentGradeNumber'];

                var fn = subj + "-" + grade;
                var fp = LOOMA.filepath('textbook') + "Class" + grade + "/" + subj + "/";
                var pn = (result['pn']) ? result['pn'] : result['npn'];
                var len = (result['len']) ? result['len'] : result['nlen'];

                var $newButton = $(
                    '<button class="chapter play img" ' +
                    'data-fn="' + fn +'.pdf" ' +
                    'data-fp="' + fp + '" ' +
                    'data-ft="chapter" ' +
                    'data-zoom="100" ' +
                    'data-page"' + pn + '" ' +
                    'data-len"'  + len + '" ' +
                    'data-pg="'  + pn + '" >'
                );

                var thumbEnd = (result['pn']) ? "_thumb.jpg" : "-Nepali_thumb.jpg";
                var thumb = fp + fn + thumbEnd;

                $newButton.append($('<img alt="" draggable="false" src="' + thumb + '">'));
                $newButton.append($('<span>').text(result.dn));
                $newButton.click(function() {
                    saveState();
                    LOOMA.playMedia(this);});
                $newButton.appendTo(appendToDiv);
            },
            'json'
        );
    },//end makeChapterButton()

extension: function(filename) {
    return filename.substring(filename.lastIndexOf('.') + 1);
},

filepath: function(filetype) {
        var homedirectory = '../';
        var path;

        switch (filetype) {
            case "mp3": //audio
            case "m4a": //audio
            case "audio": //audio
                path = homedirectory + "content/audio/";
                break;

            case "mp4": //video
            case "video":
            case "m4v":
            case "mov":
            case "mp5":
                path = homedirectory + "content/videos/";
                break;

            case "jpg": //picture
            case "jpeg":
            case "gif":
            case "png":
            case "image":
                path = homedirectory + "content/pictures/";
                break;

            case "pdf": //pdf
                path = homedirectory + "content/pdfs/";
                break;

            case "epaath":
            case "EP":
                path = homedirectory + "content/epaath/activities/";
                break;

            case "html": //html
                path = homedirectory + "content/html/";
                break;
            case "textbook":
                path = homedirectory + "content/textbooks/";
            case "chapter":
                path = homedirectory + "content/chapters/";
                break;

            default:
                path = "";
        }
        return path;
}, //end filepath()


thumbnail: function (filename, filepath, filetype, thumb) {
            //builds a filepath/filename for the thumbnail of this "filename" based on type and source

                            /*
                                if      (result.ft == 'EP'       && result.thumb)
                                                     thumbfile = '../ePaath/' + result.thumb;
                                else if ((result.ft === 'history' || result.ft === 'slideshow' || result.ft === 'map') && result.thumb)
                                                     thumbfile = result.thumb;
                                else if (result.thumb) thumbfile = result.fp + result.thumb ;
                                else if (fn)                  thumbfile = LOOMA.thumbnail(fn, result.fp, result.ft);
                                else thumbfile = null;
                             */

            var thumbnail_prefix, path;
            var imgsrc = null;
            var homedirectory = '../';

            if (filetype) {

                filetype = filetype.toLowerCase();

                if (filetype === 'chapter') {
                  imgsrc = homedirectory + "content/" + filepath + filename.replace(/\.pdf$/i, "") + "_thumb.jpg";
                  //  thumbnail_prefix = filename.substr(0, filename.lastIndexOf('.'));
                  //  imgsrc = homedirectory + "content/" + filepath + thumbnail_prefix + "_thumb.jpg";
                }
                else if (filepath && filepath.indexOf('/Khan/') >= 0) {
                    imgsrc = homedirectory + 'content/Khan/thumbnail.png';
                }
                else if (filepath && filepath.indexOf('/W4S/') >= 0) {
                    imgsrc = homedirectory + 'content/W4S/thumbnail.png';
                }
                else if (filepath && filepath.indexOf('/W4S2013/') >= 0) {
                    imgsrc = homedirectory + 'content/W4S2013/thumbnail.png';
                }
                else if (filetype == "mp3" || filetype == "m4a" || filetype == "audio") {  //audio
                    if (filepath) path = filepath; else path = homedirectory + 'content/audio/';
                    imgsrc = path + "thumbnail.png";
                }
                else if (filetype == "mp4" || filetype == "mp5" || filetype == "m4v" || filetype == "mov" || filetype == "video") { //video
                    thumbnail_prefix = filename.substr(0, filename.lastIndexOf('.'));
                    if (filepath) path = filepath; else path = homedirectory + 'content/videos/';
                    imgsrc = path + thumbnail_prefix + "_thumb.jpg";
                }
                else if (filetype == "jpg"  || filetype == "jpeg"  || filetype == "gif" || filetype == "png" || filetype == "image" ) { //picture
                    thumbnail_prefix = filename.substr(0, filename.lastIndexOf('.'));
                    if (filepath) path = filepath; else path = homedirectory + 'content/pictures/';
                    imgsrc = path + thumbnail_prefix + "_thumb.jpg";
                }
                else if (filepath && filepath.indexOf('Hesperian') >= 0) { //keep this before filetype===pdf
                    imgsrc = filepath + "thumbnail.png";
                }
                else if (filetype == "pdf" || filetype === "textbook") { //pdf - we dont use Document type any more
                    thumbnail_prefix = filename.substr(0, filename.lastIndexOf('.'));
                    if (filepath) path = filepath; else path = homedirectory + 'content/pdfs/';
                    imgsrc = path + thumbnail_prefix + "_thumb.jpg";
                }
                else if (filetype == "html") { //html
                    thumbnail_prefix = filename.substr(0, filename.lastIndexOf('.'));
                    if (filepath) path = filepath; else path = homedirectory + 'content/html/';
                    imgsrc = path + thumbnail_prefix + "_thumb.jpg";
                }
                else if (filetype == "EP" || filetype == "ep" || filetype == "epaath") {
                    if (filepath === "../content/epaath/activities/")
                         imgsrc = filepath + filename + "/thumbnail.jpg";
                    else imgsrc = "images/logos/ole-nepal.jpg";
                }
                else if (filetype == "text" || filetype == "text-template") {
                    imgsrc = "images/textfile.png";
                }
                else if (filetype == "lesson") {
                    imgsrc = "images/lesson2.png";
                }
                /*fix by looking up DN in mongo*/
                else if (filetype == "evi") {
                    imgsrc = "images/video.png";
                }
                else if (filetype == "history") {
                    imgsrc = thumb;
                }
                else if (filetype == "map") {
                    imgsrc = thumb;
                }
                else if (filetype == "game") {
                    imgsrc = "images/games.png";
                }
                else if (filetype == "slideshow") {
                    imgsrc = thumb;
                }
                else if (filetype == "looma") {
                    imgsrc =  thumb;
                }
            }

            return imgsrc;
        }, //end thumbnail()

//returns an english describing the file type, given a FT
typename: function(ft) {
    var names = {
        mp4: 'video',
        mov: 'video',
        mp5: 'video',
        m4v: 'video',
        jpg: 'image',
        png: 'image',
        gif: 'image',
        JPG: 'image',
        pdf: 'pdf',
        mp3: 'audio',
        m4a: 'audio',
        EP:  'ePaath',
        html:'HTML',
        looma:'Looma Page',
        chapter:'Chapter',
        text: 'Text File'
    };

    return (ft in names) ? names[ft] : ft;
},

capitalize : function(string) {
    if (string) return string.charAt(0).toUpperCase() + string.slice(1);
    else return string;
}, //end capitalize()


//use localStore, type='local' or type='session' instead of cookies when the data doesnt have to be sent to the server
/*current COOKIES, LOCALstorage and SESSIONstorage used:
 * COOKIES: theme, voice, login
 * LOCAL: language
 * SESSION: libararyScroll, chapterScroll, historyScroll, class, subject, chapter, arith-grade, arith-subject,
 * vocab-grade, vocab-subject, vocab-count, vocab-random, lesson-plan-index
 */
setStore : function(name, value, type) {
    if (type == 'local') localStorage.setItem(name, value);
    else if (type == 'session') sessionStorage.setItem(name, value);
    else if (type == 'cookie') document.cookie = name + '=' + encodeURIComponent(value)+'; path=/';
    else if (type == 'session-cookie') document.cookie = name + '=' + encodeURIComponent(value)+'; expires=0; path=/';
    else console.log('LOOMA.utilities.setStore: unknown localStore type: ' +
        type);
},

readStore : function(name, type) {
    if (type == 'local') return localStorage.getItem(name);
    else if (type == 'session') return sessionStorage.getItem(name);
    else if (type == 'cookie') return LOOMA.readCookie(name);
    else if (type == 'session-cookie') return LOOMA.readCookie(name);
    else {
        console.log('LOOMA.utilities.readStore: unknown localStore type: ' +
            type);
        return null;
    }
},

clearStore : function (name, type) {
    if (type == 'local') return localStorage.removeItem(name);
    else if (type == 'session') return sessionStorage.removeItem(name);
    else if (type == 'cookie') document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    else if (type == 'session-cookie') document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    else console.log('LOOMA.utilities.readStore: unknown localStore type: ' + type);
},

readCookie : function(name) {
    // look up COOKIE with KEY = name, return its value, or null if cookie doesnt exist
    var cookies = document.cookie.split(';'); //OK if no cookie? YES
    // iterate through all the cookies to find "name=..." cookie, return its value
    for (var i = 0, count = cookies.length; i < count; i++) {
        // remove leading spaces inserted by some browsers
        var cookie = (cookies[i].slice(0, 1) == ' ' ? cookies[i].slice(1) :
            cookies[i]);
        cookie = decodeURIComponent(cookie);
        cookie = cookie.split('=');
        if (cookie[0] == name) return cookie[1]; //return the value of cookie with key "name"
    }
    return null; // if cookie with key "name" is not found, return NULL
}, // end readCookie()

saveForm : function(form, name) {  // save the settings of 'form' sessionStore'
                            // 'form' is a jQuery object representing the form (e.g. $('#formName))
    var formArray = form.serializeArray();
    LOOMA.setStore( name,
                    JSON.stringify(formArray),  //NOTE: use JSON.stringify(x.serializeArray() here, not x.serialize()
                    'session');

    console.log('saving: ' + JSON.stringify(form.serializeArray()));
}, //end saveForm()

restoreForm : function(form, name) {  // restore the settings of 'form' from sessionStore
                                      // 'form' is a jQuery object representing the form (e.g. $('#formName))
    // load FORM values from sessionStore
    var formSettings = JSON.parse(LOOMA.readStore(name, 'session'));
    if (formSettings && formSettings.length > 0) {
        // get the name, value pairs from formSettings and restore them in 'form'
        $.each(formSettings, function (i, item) {
            if (['key1','key2','key3','key4'].indexOf(item.name) === -1 ) {
                var field = form[0].elements[item.name];
                if (!field) return true;

                if (field.length && !field.tagName) {
                    var restoredChoice = false;
                    $.each(field, function(j, option) {
                        if (option.type === 'checkbox' || option.type === 'radio') {
                            restoredChoice = true;
                            if (option.value === item.value) option.checked = true;
                        }
                    });
                    if (!restoredChoice && typeof field.value !== 'undefined') field.value = item.value;
                } else if (field.type === 'checkbox' || field.type === 'radio') {
                    field.checked = true;
                } else {
                    field.value = item.value;
                }
            }
        });
    }
    return formSettings;   //passes the saved form settings back to caller for further processing if neeeded
},  //end restoreForm()

loggedIn : function() {
    return LOOMA.readCookie('login');
}, //end loggedIn()

translate : function(language) {
    // based on the value of LANGUAGE, hide or show all KEYWORDs and TIPs
    if (language == 'native') {

        //.css( "color", "red" );
        //$('.english-keyword, .english').hide();
        //$('.native-keyword,  .native').show();

       // $('.english-keyword, .english').css('display','none');
       // $('.native-keyword,  .native').css('display','');
        $('.english-keyword, .english').hide();
        $('.native-keyword,  .native').show();
        $('.english-tip').removeClass('yes-show');
        $('.native-tip').addClass('yes-show');
    } else /*english*/ {
        //$('.english-keyword, .english').show();
        //$('.native-keyword,  .native').hide();

        //$('.english-keyword, .english').css('display','');
        //$('.native-keyword,  .native').css('display','none');
        $('.english-keyword, .english').show();
        $('.native-keyword,  .native').hide();
        $('.english-tip').addClass('yes-show');
        $('.native-tip').removeClass('yes-show');
    }
    //change toolbar TRANSLATE icon to the flag of the OTHER language (not being currently shown)
    if (language == 'english') $('#flag').attr('src', 'images/native-flag.png');
    else /*native*/            $('#flag').attr('src', 'images/english-flag.png');

}, // end translate()

    /**
     * Generates translatable spans given english and native translations. You will need to know the native translation;
     * this program doesn't do any translation. For building translatable HTML on client side, e.g. from JS
     * @param english  - the english phrase
     * @param native   - the translation of the english phrase
     * */
    translatableSpans : function(english, native){
        var language = LOOMA.readStore('language', 'cookie');

        // rewrite to generate the spans once, then set hidden on the correct span
        if (language == "english") {
            return "<span class='english-keyword style='display:inline-block''>" + english +
                "<span class='xlat'>" + native + "</span>" + "</span>" +
                "<span class='native-keyword' style='display:none'>" + native +
                "<span class='xlat'>" + english + "</span>" +
                "</span>";
        } else
            return "<span class='english-keyword' style='display:none'>" + english +
                "<span class='xlat'>" + native + "</span>" + "</span>" +
                "<span class='native-keyword' style='display:inline-block'>" + native +
                "<span class='xlat'>" + english + "</span>" +
                "</span>";
    }, //end translatableSpan()


//***********  USING THE LOOMA DICTIONARY ***************
//***********  functions are LOOKUP, REVERSELOOKUP which return a JSON dictionary entry,
//                           DEFINE, REVERSEDEFINE, POPUPDEFINITION which a displayable HTML of the dictionary entry
//                           WORDLIST, PICTUREWORDLIST which generate a filtered list of words or list of words with pictures
//    and these functions only used by the dictionary editor:  dictionaryDelete, dictionaryUpdate
//
//when you need a word looked up in the dictionary, call LOOMA.lookup() with these parameters:
//            word: the word to look up
//            succeed: a FUNCTION to be called when the definition comes back from the dictionary server
//                the parameter of the call to "succeed" is an object with these properties:
//                    result.en = english word
//                    result.np = nepali translation [may be ""]
//                    result.rw = root word if result.,en is a verb form, plural or contraction
//                    result.part = part of speech
//                    result.def = english definition [may be ""]
//                optional properties:
//                    result.plural = plural of the word
//                    result.ch_id = code for textbook chapter the word first appears in [may be ""]
//                typically, succeed() would display the translation (result.np), the definition (result.def) and
//                the picture (result.img) somewhere on the webpage
//                NOTE: if the lookup request is processed, but the word is not found in the dictionary, the request will "succeed"
//                      and the result will be result.defn = "Word not found"
//            fail: a FUNCTION to be called if the lookup request fails (for instance if the Looma server is down)
//                typically, fail() would display "Dictionary lookup request failed" somewhere on the webpage

lookup : function(word, succeed, fail) {

    console.log('LOOMA.lookup: looking up "' + word + '"');

    var hasOtel = !!(window.LOOMA && LOOMA.otel && LOOMA.otel.withSpan);
    var run = function (ctx) {
        return new Promise(function (resolve) {
            //returns OBJECT result == {en:english, np:nepali, def:definition, ch_id:chapter}
            $.ajax(
                "looma-dictionary-utilities.php", //Looma Odroid
                {
                    type: 'POST',
                    cache: false,
                    crossDomain: true,
                    dataType: "json",
                    data: "cmd=lookup&word=" + encodeURIComponent(word.toLowerCase()),
                    error: function (jqXHR, textStatus, errorThrown) {
                        if (ctx) {
                            ctx.setAttr('http.response.status_code', jqXHR && jqXHR.status);
                            ctx.error(errorThrown || textStatus || 'lookup failed');
                        }
                        try { fail && fail(jqXHR, textStatus, errorThrown); } catch (e) {}
                        resolve();
                    },
                    success: function (result) {
                        if (ctx) {
                            ctx.setAttr('looma.dictionary.found', !!(result && result.en && result.def !== 'Word not found'));
                            if (result && result.np) ctx.setAttr('looma.dictionary.np', String(result.np).slice(0, 64));
                            if (result && result.ch_id) ctx.setAttr('looma.chapter_id', String(result.ch_id).slice(0, 32));
                        }
                        try { succeed && succeed(result); } catch (e) {}
                        resolve();
                    },
                });
        });
    };
    if (hasOtel) {
        LOOMA.otel.withSpan('dictionary.lookup', {
            'looma.endpoint':       'looma-dictionary-utilities.php',
            'looma.dictionary.cmd': 'lookup',
            'looma.dictionary.lang': 'en',
            'looma.word':            String(word || '').slice(0, 64),
        }, run);
    } else {
        run(null);
    }
    return false;
}, //end lookup

reverselookup : function(nepali, succeed, fail) {

    console.log('LOOMA.reverselookup: looking up "' + nepali + '"');

    var hasOtel = !!(window.LOOMA && LOOMA.otel && LOOMA.otel.withSpan);
    var run = function (ctx) {
        return new Promise(function (resolve) {
            //returns OBJECT result == {en:english, np:nepali, phon:phonetic, def:definition, img:picture, ch_id:chapter}
            $.ajax(
                "looma-dictionary-utilities.php", //Looma Odroid
                {
                    type: 'POST',
                    cache: false,
                    crossDomain: true,
                    dataType: "json",
                    data: "cmd=reverselookup&word=" + encodeURIComponent(nepali.toLowerCase()),
                    error: function (jqXHR, textStatus, errorThrown) {
                        if (ctx) {
                            ctx.setAttr('http.response.status_code', jqXHR && jqXHR.status);
                            ctx.error(errorThrown || textStatus || 'reverselookup failed');
                        }
                        try { fail && fail(jqXHR, textStatus, errorThrown); } catch (e) {}
                        resolve();
                    },
                    success: function (result) {
                        if (ctx) {
                            ctx.setAttr('looma.dictionary.found', !!(result && result.en && result.def !== 'Word not found'));
                            if (result && result.en) ctx.setAttr('looma.dictionary.en', String(result.en).slice(0, 64));
                        }
                        try { succeed && succeed(result); } catch (e) {}
                        resolve();
                    },
                });
        });
    };
    if (hasOtel) {
        LOOMA.otel.withSpan('dictionary.reverselookup', {
            'looma.endpoint':       'looma-dictionary-utilities.php',
            'looma.dictionary.cmd': 'reverselookup',
            'looma.dictionary.lang': 'np',
            'looma.word':            String(nepali || '').slice(0, 64),
        }, run);
    } else {
        run(null);
    }
    return false;
}, //end REVERSELOOKUP

// function ONLINELOOKUP fetches an English definition from the internet,
//   used ONLY as a fallback when a word is missing from Looma's own
//   dictionary. The actual network request runs server-side
//   (looma-dictionary-utilities.php?cmd=onlinelookup, which calls
//   api.dictionaryapi.dev) so it works behind the Looma box and is safe
//   to call in the background.
//        word:    the word to look up
//        succeed: called with {en, def, part, phon, source:'online', found:true}
//        fail:    called when there is no online definition (offline / not found)
//   This NEVER triggers speech and never blocks — callers fire it after the
//   local lookup has already been shown to the user.
onlineLookup : function (word, succeed, fail) {
    word = (word == null ? '' : String(word)).trim();
    if (!word) { if (fail) fail(null); return false; }

    // Quick offline shortcut so we don't even attempt a request with no network.
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        if (fail) fail(null);
        return false;
    }

    $.ajax('looma-dictionary-utilities.php', {
        type: 'GET',
        cache: false,
        dataType: 'json',
        timeout: 9000,
        data: { cmd: 'onlinelookup', word: word },
        success: function (result) {
            if (result && result.found && result.def) {
                if (succeed) succeed(result);
            } else {
                if (fail) fail(result || null);
            }
        },
        error: function (jqXHR, textStatus, errorThrown) {
            if (fail) fail(null, textStatus, errorThrown);
        }
    });
    return false;
}, //end onlineLookup

defHTML: function (definition, rwdef) {  // helper function for utilities.js, not called by other JS
        var def;
        var $div = $('<div />');
        var $english = $('<div id="english"/>');
        var $nepali = $('<div id="nepali"/>');
        var $pos = $('<div id="partOfSpeech"/>');
        var $def = $('<div id="definition"/>');

        $english.text(definition.en);
        $nepali.text(definition.np);
        if ('part' in definition) $pos.html('<i>' + definition.part + '</i>');

        // "Word not found" path: if the server provided close-match suggestions,
        // render them as clickable buttons that re-run the dictionary lookup.
        if (definition.def === 'Word not found' &&
            Array.isArray(definition.suggestions) && definition.suggestions.length) {
            var $sugWrap = $('<div id="dict-suggestions" style="margin-top:10px;font-size:0.95em"/>');
            $sugWrap.append($('<div/>').text('Did you mean:'));
            var $list = $('<div class="suggestion-list" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:6px"/>');
            definition.suggestions.forEach(function (term) {
                var $btn = $('<button type="button" class="suggestion-btn"/>')
                    .text(term)
                    .css({ padding: '4px 10px', cursor: 'pointer', borderRadius: '4px' })
                    .on('click', function () {
                        var $input = $('#input');
                        if ($input.length) {
                            $input.val(term);
                            $('#lookup').trigger('submit');
                        }
                    });
                $list.append($btn);
            });
            $sugWrap.append($list);
            $div.append($english, $pos, $def, $sugWrap);
            $def.text('Word not found.');
            return $div;
        }

        if ('def' in definition && definition.def) def = definition.def.toLowerCase();
        else {
            def = '';
            for (var i=0; i < definition.meanings.length; i++)
            def += '(' + definition.meanings[i].part + ') ' +  definition.meanings[i].def + '<br>';

        }

        if (   (def === 'past tense of')
            || (def === 'comparative form of')
            || (def === 'superlative form of')
            || (def === 'past participle of')
            || (def === 'present participle of')
            || (def === 'past tense and past participle of')
            || (def === 'third person singular of'))
            def += ' ' + definition.rw;

        //def = def.replace(/\;/g, ";</p><\p>");

        $def.html(def);

    if (definition.img) {
        var imgName = definition.img + ".jpg";
        var $img = $('<img id="definitionThumb" alt="" src="../content/dictionary\ images/' + imgName + '"/>');
    }

    $div.append($english, $nepali, $pos, $def, $img);

        if (rwdef) {
            var $rwdef = $('<div id="rwdef"/>');
            rwdef.def = rwdef.def.replace(/\;/g, "</p><\p>");
            $rwdef.html(rwdef.def);
            $div.append($rwdef);
        }

        var len = def.length;
        if (rwdef) len += rwdef.length;
        if (len < 70) $def.addClass('largeWord');
        else if (len < 150) $def.addClass('mediumWord');
        else $def.addClass('smallWord');

        return $div;
    }, //end LOOMA.defHTML()

// function DEFINE looks up the word and returns HTML containing
//                 the word, translation, definition, and rootword definition
define : function(word, succeed, fail) {
    LOOMA.lookup(word, found, notfound);

    function found(def) {
        console.log("lookup of " +  def['en'] + " succeeded [np is " + def['np'] + "]");
        if (def.rw) {
            function rwfound(rwdef) {
                succeed(LOOMA.defHTML(def, rwdef));
            }
            function rwnotfound() {
                succeed(LOOMA.defHTML(def));
            }
            LOOMA.lookup(def.rw, rwfound, rwnotfound);
        } else {
            succeed(LOOMA.defHTML(def));
        }
    }
    function notfound() {
        fail();
    }
}, //end LOOMA.define()

// function reverseDEFINE looks up the word and returns HTML containing
//                 the word, translation, definition, and rootword definition
reversedefine : function(word, succeed, fail) {
            LOOMA.reverselookup(word, found, notfound);

            function found(def) {
                console.log("lookup of " +  def['np'] + " succeeded [en is " + def['en'] + "]");
                    succeed(LOOMA.defHTML(def));
             }
            function notfound() {
                LOOMA.alert("Word not found");
                fail();
            }
        }, //end LOOMA.reversedefine()

/*

// function DEFINITION_ONLY looks up the word and returns HTML containing
//                 the word, translation, definition, and rootword definition
definition_only : function(word, succeed, fail) {
    LOOMA.lookup(word, found, notfound);
    function found(definition) {
        if (definition.rw) {
            function rwfound(rwdef) {
                if (   (definition.def === 'past tense of')
                    || (definition.def === 'comparative form of')
                    || (definition.def === 'superlative form of')
                    || (definition.def === 'past participle of')
                    || (definition.def === 'present participle of')
                    || (definition.def === 'past tense and past participle of')
                    || (definition.def === 'third person singular of')) {
                    succeed(definition['def'] +' '+definition['rw'])
                } else {
                    succeed(definition['def']);

                }
            }
            function rwnotfound() {
                succeed(definition['def']);
            }
            LOOMA.lookup(definition.rw, rwfound, rwnotfound);
        } else {
            // succeed(LOOMA.defHTML(def));
            succeed(definition['def']);
        }
    }
    function notfound() {
        fail();
    }
}, //end LOOMA.definition_only()
*/

//  function POPUPDEFINITION looks up the word and displays its definition in a popup for 'time' seconds
//          used by LOOKUP button in PDF, history, and looma.js
popupDefinition : function (word, time, lang) {

      function show(html) {
          $('#popup').remove();
          var $popup =  $('<div id="popup"/>');
          $popup.append(html);
          LOOMA.alert($popup.html(), time, true);
      }; //end show()
    function fail() {};
    if (lang === 'np')
         LOOMA.reversedefine(word, show, fail);
    else LOOMA.define(word, show, fail);

    },   //end popupDefinition()


//when you need a list of words from the dictionary, call LOOMA.wordlist() with these parameters:
//            class: the class level of the words [optional], should be in the format "class1", "class2", etc.
//            subj: the textbook subject of the words [optional], should be in this format, ("math", "english", "nepali", "science", "socialstudies")
//            count: number of words requested. [optional, defaults to 25]
//            random: use "true" for a randomly ordered word list, "false" for an alpha ordered word list, [optional, set to "false" by default]
//                    NOTE: 'random' is a string, not a boolean
//            succeed: a FUNCTION to be called when the definition comes back from the dictionary server
//                the parameter to 'succeed' is an array of [english] words
//            fail: a FUNCTION to be called if the word list request fails (for instance if the Looma server is down)
//                typically, fail() would display "Dictionary lookup request failed" somewhere on the webpage
wordlist : function(grade, subj, ch_id, count, random, succeed, fail) {

    var parameters = "cmd=list";
            if (grade) parameters  += "&class="  + encodeURIComponent(grade);
            if (subj) parameters   += "&subject="   + encodeURIComponent(subj);
            if (ch_id) parameters  += "&ch_id="   + encodeURIComponent(ch_id);
            if (count) parameters  += "&count="  + count.toString();
            if (random) parameters += "&random=" + encodeURIComponent(random);
    console.log(parameters);
    $.ajax(
        "looma-dictionary-utilities.php",
        {
            type: 'GET',
            cache: false,
            crossDomain: true,
            dataType: "json", //jQ will convert the response back into JS, dont need parseJSON()
            data: parameters,
            error: fail,
            success: succeed //NOTE: provide a 'succeed' function which takes an argument "result" which will hold the translation/definition/image
        });

    return false;
}, //end WORDLIST

picturewordlist : function(grade, subj, ch_id, count, random, succeed, fail) {

    var parameters = "cmd=list&picturesonly=true";
    if (grade) parameters  += "&class="  + encodeURIComponent(grade);
    if (subj) parameters   += "&subject="   + encodeURIComponent(subj);
    if (ch_id) parameters  += "&ch_id="   + encodeURIComponent(ch_id);
    if (count) parameters  += "&count="  + count.toString();
    if (random) parameters += "&random=" + encodeURIComponent(random);
    console.log(parameters);
    $.ajax(
        "looma-dictionary-utilities.php",
        {   type: 'GET',
            cache: false,
            crossDomain: true,
            dataType: "json", //jQ will convert the response back into JS, dont need parseJSON()
            data: parameters,
            error: fail,
            success: succeed //NOTE: provide a 'succeed' function which takes an argument "result" which will hold the translation/definition/image
        });

    return false;
}, //end PICTUREWORDLIST

dictionaryDelete : function(word, succeed, fail) {

    //returns array of objects
    $.ajax(
        "looma-dictionary-utilities.php",
        {
            type: 'GET',
            cache: false,
            crossDomain: true,
            dataType: "json",
            data: "cmd=delete&wordID=" + encodeURIComponent(word),
            error: fail,
            success: succeed //NOTE: provide a 'succeed' function which takes an argument "result" which will hold the translation/definition/image
        });

    return false;
}, //end DICTIONARYDELETE

dictionaryUpdate : function(word, succeed, fail) {

    //returns array of objects
    $.ajax(
        "looma-dictionary-utilities.php",
        {
            type: 'GET',
            cache: false,
            crossDomain: true,
            dataType: "json",
            data: "cmd=update&wordID=" + encodeURIComponent(word[0]) + "&wordEn=" + encodeURIComponent(word[1])
                + "&wordNp=" + encodeURIComponent(word[2]) + "&wordPart=" + encodeURIComponent(word[3])
                + "&wordPlural=" + encodeURIComponent(word[4]) + "&wordRw=" + encodeURIComponent(word[5])
                + "&wordCh_id=" + encodeURIComponent(word[6]) + "&wordDef=" + encodeURIComponent(word[7]),
            error: fail,
            success: succeed //NOTE: provide a 'succeed' function which takes an argument "result" which will hold the translation/definition/image
        });

    return false;
}, //end DICTIONARYUPDATE


rtl : function(element) { //enables Right-to-left input for numbers in looma-arith-problems.js
      if (element.setSelectionRange) element.setSelectionRange(0, 0);
    },


// ************** LOOMA THEME FUNCTIONS *******************
// ************** functions are SETTHEME and CHANGETHEME *****

//         THEMES are defined in 'looma-theme-themename.css' files
//        pressing a theme change button (in footer or looma-settings.php) calls changeTheme() which
//            resets the 'theme' cookie and calls setTheme()
//        setTheme () reads the 'theme' cookie to get 'newthemename'
//            and changes the HREF of the LINK element with ID='theme' to point to the file 'looma-theme-newthemename.css

setTheme : function() {

    var theme = LOOMA.readStore('theme', 'session-cookie'); //get the currently used theme, if any
    if (!theme) theme = 'looma'; //default THEME is "looma"

    $('#theme-stylesheet').attr('href', 'css/looma-theme-' + theme + '.css');
    location.reload(); //some browsers need RELOAD to show the new THEME [??]
    // changes the HREF attribute of the LINK with ID 'theme-stylesheet' based on the 'theme' COOKIE value
    return theme;
}, //end LOOMA.setTheme()

changeTheme : function(newTheme) { //theme change button has been pressed
    LOOMA.setStore('theme', newTheme, 'session-cookie');
    LOOMA.setTheme(); //change currently used theme
}, //end LOOMA.changeTheme()

changeVoice : function(newvoice) { //voice change button has been pressed
    LOOMA.setStore('voice', newvoice, 'cookie');
    console.log('LOOMA.changeVoice() voice changed to ', newvoice);
}, //end LOOMA.changeVoice()


    //utility functions to construct and de-construct CH_IDs

    // format for CH_IDs is "1M01" or "9SS02.09", etc  one letter grade in {1..8}, one or two letter subject
    // in {M, EN, S, NP, SS} optional two-digit unit number with ".", required two-digit chapter number
    // regex: /^[1-8](M|N|S|SS|EN|H|V)([0-9][0-9]\.)?[0-9][0-9]$/g

ch_id   :  function (grade, subject, unit, chapter) {

        //UNTESTED

        var subjects = { 'math'    : 'M',
                         'science' : 'S',
                         'english' : 'EN',
                         'nepali'  : 'NP',
                         'socialstudies' : 'SS',
                         'vocation': 'V',
                         'health'  : 'H'};

        ch_id = '';
        if (grade >= 1 && grade <= 8)         ch_id = grade;
        else return "";

        if (subjects.indexOf (subject) >= 0 ) ch_id += subjects[subject];
        else return "";

        if (unit) {  //unit is optional
            if (unit >= 1 && unit <= 9)       ch_id += '0' + unit + '.';
            else if (unit <= 99)              ch_id += unit + '.';
            else return "";
        }
    if (chapter >= 1 && chapter <= 9)     ch_id += '0' + chapter;
        else if (chapter <= 99)               ch_id += chapter;
        else return "";

        return ch_id;
    },

    //LOOMA parseCH_ID(s)
    //  m=s.match(/^([1-8])(M|N|S|SS|EN|H|V)([0-9][0-9])(\.[0-9][0-9])?$/);
    //  then if m != null, m[0] is the ch_id,
    //                     m[1] is the class digit,
    //                     m[2] is the subj letter(s),
    //                     m[3] is the chapter/unit, and m[4] is null or chapter#
    //       e.g. "8N01.04".match(regex) is ["8N01.04", "8", "N", "01", ".04"]
    /* */
 parseCH_ID : function (ch_id) {
        var elements = {
            currentSection: null,
            currentChapter: null,
            currentSubject: null,
            currentGradeNumber: null,
            currentGradeFolder: null,
            currentSubjectFull: null,
            chprefix: null};
        var folderNames = {
            EN: "English",
            N:  "Nepali",
            M:  "Math",
            Ma:  "Math",
            S:  "Science",
            Sa:  "Science",
            SS: "SocialStudies",
            SSa: "SocialStudies",
            H:  "Health",
            V:  "Vocation"};

        if (ch_id) {
            var pieces = ch_id.toString().match(/^([1-9]|10)(Ma|M|N|Sa|S|SSa|SS|EN|H|V)([0-9][0-9])(\.[0-9][0-9])?$/);

            if (pieces) {
                elements['currentGradeNumber'] = pieces[1];
                elements['currentSubject']     = pieces[2];
                elements['currentSection']     = pieces[4] ? pieces[3] : null;
                elements['currentChapter']     = pieces[4] ? pieces[4].substr(1) : pieces[3];
                elements['currentGradeFolder'] = 'Class' + pieces[1];
                elements['currentSubjectFull'] = folderNames[pieces[2]];
                elements['chprefix']           = pieces[1] + pieces[2];
            }
        }
     return elements;
    },    //end parseCH_ID

        //these functions not used. to implement them, call parseCH_ID()
        ch_idGrade   :  function (ch_id) {},
        ch_idSubject :  function (ch_id) {},
        ch_idUnit    :  function (ch_id) {},
        ch_idChapter :  function (ch_id) {},

    // LOOMA ch_idFilepath
    //
        ch_idFilepath : function(ch_id, lang) {
            var parts = LOOMA.parseCH_ID(ch_id);
            if (lang === 'np') ch_id = ch_id + '-nepali';
            return '../content/chapters/Class' +
                parts['currentGradeNumber'] + '/' +
                parts['currentSubjectFull'] + '/' +
                lang + '/' ;
        },

    // LOOMA ch_idName
    //
        ch_idName : function(ch_id, lang) {
            //var parts = LOOMA.parseCH_ID(ch_id);
            if (lang === 'np') ch_id = ch_id + '-nepali';
            return  ch_id + '.pdf';
        }



    };  //end RETURN public functions
}()); //IIEF immediately instantianted function expression


 /**  LOOMA.getCH_ID()
 /**
 * Prompts the user to select Class, Subject and Chapter and returns the corresponding ch_id
 * @param msg - The message the user is presented, prompting them to enter text.
 * @param confirmed - A function where the user's text response will be sent.
 * @param canceled - function called if user cancels the dialog
 * $param notTransparent: F means grey out the background, T means dont
 * */
LOOMA.getCH_ID = function(msg, confirmed, canceled, notTransparent) {
    LOOMA.closePopup();
    if (!notTransparent) LOOMA.makeTransparent();

    $(document.body).append("<div class='popup textEntry' id='ch_id_popup'>" +
        "<button class='popup-button dismiss-popup'><b>X</b></button>" + msg +
        "<button id='close-popup' class='popup-button'>" + LOOMA.translatableSpans("cancel", "रद्द गरेर") + "</button>" +

        "<div id='ch_id'>" +
            "<span> Class: </span>" +
            "<select id='classSelect'>" +
                "<option value=''></option>" +
                "<option value='1'>1</option>" +
                "<option value='2'>2</option>" +
                "<option value='3'>3</option>" +
                "<option value='4'>4</option>" +
                "<option value='5'>5</option>" +
                "<option value='6'>6</option>" +
                "<option value='7'>7</option>" +
                "<option value='8'>8</option>  " +
            "</select> " +
            "<span> Subject: </span>" +
            "<select id='subjectSelect'>" +
                "<option value=''></option>" +
                "<option value='EN'>English</option>" +
                "<option value='M'>Math</option>" +
                "<option value='N'>Nepali</option>" +
                "<option value='S'>Science</option>" +
                "<option value='SS'>Soc.Studies</option>" +
            "</select> " +

            "<span> Chapter: </span> <select id='chapterSelect'></select>" +
        "</div>" +

        "<button id='confirm-popup' class='popup-button'>" +
        LOOMA.translatableSpans("OK", "ठिक छ") +"</button></div>").hide().fadeIn(1000) ;

    $("#classSelect, #subjectSelect").change( function(){
        $('#chapterSelect').empty();
        if ( ($('#classSelect').val() != '') && ($('#subjectSelect').val() != ''))
            $.post("looma-database-utilities.php",
                {cmd: "textChapterList",
                 class: $('#classSelect').val(),
                 subject:   $('#subjectSelect').val()},

                 function(response) {
                     console.log(response);
                    $('#chapterSelect').append(response);
                 },
                 'html'
              );
    });

    $('#confirm-popup').click(function() {
       //$("#confirm-popup").off('click');
       var ch_id = $('#ch_id #chapterSelect').val();
       console.log('select CH_ID returned ', ch_id);
       LOOMA.closePopup();
       confirmed(ch_id);
    });

    $('.dismiss-popup, #close-popup').click(function() {
        //$("#close-popup").off('click');
        //$("#dismiss-popup").off('click');
        LOOMA.closePopup();
        canceled();
   });
};  //end getCH_ID()


 //LOOMA.sound
 // param is HTML 'embed' element with src=wav file
 // in the HTML have
 //    <embed src="xxx.wav" autostart="false" width='0" height="0" id="sound_object" enablejavascript="true">
 // call with LOOMA.sound( $('#sound_object")[0] )
 LOOMA.sound = function(sound) { sound.Play();}

/* Characters a digit is never legitimately embedded in: LOWERCASE Latin, plus
 * Devanagari (which has no case) minus its own digits at U+0966-U+096F.
 *
 * Uppercase is deliberately left out. "H2O", "CO2" and "SO4" fill the science
 * textbooks, and a rule that pulled those apart would do more damage than the
 * problem it fixes; a digit that turns up in the middle of ordinary lowercase
 * running text, on the other hand, is always the text layer's doing.
 */
LOOMA.isWordLetter = function (ch) {
    return /[a-zऀ-॥॰-ॿ]/.test(ch || '');
};

/* LOOMA.isAnyLetter(ch)
 * Like isWordLetter but ALSO counts UPPERCASE Latin. Used for the LEFT side of a
 * stray-digit test: a word can start with a capital ("Some"), so the letter
 * before an intra-word digit may be uppercase, while the RIGHT side still has to
 * be lowercase/Devanagari to tell "the word continues" (running text) apart from
 * "a chemical subscript" (H2O, Fe2O3, Na2SO4 — always followed by an UPPERCASE
 * element symbol or the word end). */
LOOMA.isAnyLetter = function (ch) {
    return /[A-Za-zऀ-॥॰-ॿ]/.test(ch || '');
};

LOOMA.isWordDigit = function (ch) {
    return /[0-9०-९]/.test(ch || '');
};

/* LOOMA.isReadableChar(ch)
 * True for a character that legitimately appears in Looma's text: Latin letters
 * (incl. accented Latin-1), Devanagari, digits of either script, ordinary
 * punctuation and whitespace.
 *
 * Everything else is treated as glyph garbage: characters from the Unicode
 * private-use area (U+E000–U+F8FF), the replacement char, C0/C1 control codes,
 * box-drawing, dingbats and stray symbol blocks. That garbage is precisely what
 * a PDF font with no ToUnicode map emits — the "weird characters" seen in a
 * selection, and the entire text layer pdf.js lays over an IMAGE. Matching a
 * conservative allow-list (rather than trying to enumerate the garbage) means a
 * codepoint we have never seen still gets dropped by default.
 *   !-~            = all printable ASCII (a-z A-Z 0-9 and ASCII punctuation)
 *   U+00A0–U+00FF  = Latin-1 supplement (accented letters)
 *   U+0900–U+097F  = Devanagari (letters, matras, digits, danda)
 *   U+2010–U+2027, U+2030–U+205E = general punctuation (dashes, quotes, …)
 */
LOOMA.isReadableChar = function (ch) {
    return /[\t\n\r\x20-\x7E\u00A0-\u00FF\u0900-\u097F\u2010-\u2027\u2030-\u205E]/.test(ch || '');
};

/* LOOMA.garbageCharIndexes(chars)
 * The indexes of every non-readable character in a char array — the companion
 * to strayDigitIndexes(). Both LOOMA.cleanSelectedText() (a string) and the
 * reading-highlight map builder drop the SAME characters through this one
 * function, so the spoken text and the on-page character map stay aligned.
 */
LOOMA.garbageCharIndexes = function (chars) {
    var drop = [];
    for (var i = 0; i < chars.length; i++) {
        if (!LOOMA.isReadableChar(chars[i])) drop.push(i);
    }
    return drop;
};

/* LOOMA.isGarbageText(text)
 * True when a string carries NO real letters or digits at all — a run of pure
 * symbol/garbage glyphs, which is what selecting a PDF image produces. This is
 * the signal to suppress the word card, TTS and highlight for an image
 * selection. A string with even one Latin/Devanagari letter or a digit is
 * treated as text (its stray garbage is cleaned out instead).
 */
LOOMA.isGarbageText = function (text) {
    var s = String(text == null ? '' : text);
    if (!s.trim()) return true;
    // Latin letters, or Devanagari vowels/consonants/extended letters, or a
    // digit of either script. Deliberately excludes Devanagari matras/danda so a
    // string of only combining marks still counts as garbage.
    return !/[A-Za-z\u00C0-\u024F\u0904-\u0939\u0958-\u0961\u0971-\u097F0-9\u0966-\u096F]/.test(s);
};

/* LOOMA.disableGarbageSpans(container)
 * Walk the direct children of a pdf.js text-layer container and make every span
 * that is pure glyph garbage (isGarbageText) unselectable. Those spans are the
 * ones pdf.js lays over an image, so this is what stops an image from being
 * "selected" into weird characters at the source. Real text spans are untouched.
 */
LOOMA.disableGarbageSpans = function (container) {
    if (!container || !container.children) return;
    var spans = container.children;
    for (var i = 0; i < spans.length; i++) {
        var el = spans[i];
        if (LOOMA.isGarbageText(el.textContent || '')) {
            el.style.userSelect = 'none';
            el.style.webkitUserSelect = 'none';
            el.style.pointerEvents = 'none';
            el.setAttribute('data-looma-garbage', '1');
        }
    }
};

/* LOOMA.strayDigitIndexes(chars)
 * Positions, in an array of single characters, of every digit run wedged INSIDE a
 * word — "so1me", "S01me". A run is dropped when there is a letter (of any case)
 * on the LEFT and the word CONTINUES in lowercase/Devanagari on the RIGHT.
 *
 * The asymmetry is deliberate and load-bearing:
 *   - LEFT may be uppercase, so a capitalised word at a sentence start ("Some"
 *     mangled to "S01me") is still cleaned.
 *   - RIGHT must be lowercase/Devanagari. Chemical subscripts are ALWAYS followed
 *     by an UPPERCASE element symbol or the word end (H2O, Fe2O3, Na2SO4, CO2),
 *     so requiring a lowercase right-neighbour keeps every formula intact while
 *     still catching ordinary running text.
 *   - A run with NO left letter is left alone, so ordinals ("2nd", "1st") and
 *     "COVID-19" / "Class 7" / "1051" survive.
 *
 * Both LOOMA.cleanSelectedText() (which works on a string) and the reading
 * highlight (which has to drop the same characters from its character->DOM map,
 * not just from a string) run this one function, so the text that is spoken and
 * the text that is matched against the page can never disagree.
 */
LOOMA.strayDigitIndexes = function (chars) {
    var drop = [];
    var i = 0;
    while (i < chars.length) {
        if (!LOOMA.isWordDigit(chars[i])) { i++; continue; }
        var end = i;
        while (end < chars.length && LOOMA.isWordDigit(chars[end])) end++;
        var left  = i > 0 ? chars[i - 1] : '';
        var right = end < chars.length ? chars[end] : '';
        if (LOOMA.isAnyLetter(left) && LOOMA.isWordLetter(right)) {
            for (var k = i; k < end; k++) drop.push(k);
        }
        i = end;
    }
    return drop;
};

/* LOOMA.cleanSelectedText(text)
 * Tidy a raw text selection before it is spoken, looked up or highlighted.
 *
 * The pdf.js text layer is a pile of absolutely positioned spans whose DOM order
 * is the PDF's content-stream order, not the order the words sit on the page.
 * Long words are split across several of those spans ("fin" + "e"), and anything
 * that merely falls BETWEEN the two ends of a selection in DOM order — a page
 * number, a running header, a figure label — is dragged along with it. The
 * result is a digit wedged into the middle of a word: "so" + "1" + "me".
 * looma-play-pdf.js now rebuilds PDF selections in reading order so this mostly
 * stops at the source; this is the safety net for whatever still gets through,
 * and for the same problem on non-PDF pages.
 *
 * It ALSO strips glyph garbage — the private-use / symbol characters a PDF font
 * with no ToUnicode map emits (the "weird characters"). A selection that is
 * ONLY garbage — which is what a PDF image's text layer is — cleans to '', so
 * an image cannot be spoken, looked up or highlighted. See LOOMA.isReadableChar
 * / LOOMA.isGarbageText.
 */
/* LOOMA.repairPdfTextArtifacts(text)
 * Repair the SYSTEMATIC letter mangling produced by a PDF whose text layer has a
 * broken ToUnicode map. The page renders correctly on the canvas (from the glyph
 * outlines), but the extracted Unicode is wrong in fixed, repeatable ways. The
 * dominant one in Looma's Nepali/English science textbooks is the letter "m"
 * coming out as "n1" or "1n" (e.g. "n1achine", "sn1ooth", "displacen1ent",
 * "1notion"). Neither "n1" nor "1n" glued to a letter ever occurs inside a real
 * English or Nepali word, so restoring "m" is safe. This MUST run before stray
 * digit removal, which would otherwise delete the "1" and leave "nachine".
 *
 * This only fixes the deterministic font-mapping artefacts. It cannot recover
 * genuinely random OCR noise from scanned insets (e.g. "co,Tered" for "covered"),
 * where the information is lost in the source PDF — that needs the PDF's text
 * layer regenerated, not a text-side fix.
 */
LOOMA.repairPdfTextArtifacts = function (text) {
    return String(text == null ? '' : text)
        // "m/s" — the speed unit that fills this physics textbook — comes out as
        // "n1/s". "n1/" is never legitimate, so this is context-free and safe.
        .replace(/n1\//g, 'm/')
        // "m" extracted as "n1" inside a word: mid-word (sn1ooth) and word-initial
        // (n1achine). The letter context avoids the rare "1"-as-"l" collision
        // (a hypothetical "on1ine" stays untouched rather than becoming "omine").
        .replace(/([A-Za-z])n1(?=[A-Za-z])/g, '$1m')
        .replace(/\bn1(?=[A-Za-z])/g, 'm')
        // "m" extracted as "1n": mid-word (i1nport) and word-initial (1notion).
        // The immediate-letter lookahead keeps "1n fact" ("In fact") out of it.
        .replace(/([A-Za-z])1n(?=[A-Za-z])/g, '$1m')
        .replace(/\b1n(?=[A-Za-z])/g, 'm');
};

/* LOOMA.fixMixedAlnum(text)
 * In a school textbook a real WORD is letters only and a real NUMBER is digits
 * (with a decimal separator) only — the two never mix inside one token. The PDF
 * text layer, though, glues them together in two different ways, handled here
 * per whitespace-delimited token:
 *
 *   1. A clean number stuck to its unit — "0.67m/s", "30m", "1800s". This is a
 *      real value that lost its space, so it is SPLIT: "0.67 m/s", "30 m",
 *      "1800 s" (and any stray digit left in the unit is dropped).
 *   2. A digit wedged into a word — "so1me", "grade7", "path7". The digit is
 *      extraction noise, so it is DELETED: "some", "grade", "path".
 *
 * A pure number keeps every digit, so decimals survive untouched: "1.1", "1,2",
 * "1,5" are all returned exactly as they came in. Devanagari digits (०-९) are
 * treated the same as Latin ones.
 */
LOOMA.fixMixedAlnum = function (text) {
    var DIGIT  = /[0-9०-९]/;
    var LETTER = /[A-Za-zऄ-हक़-ॡॱ-ॿ]/;
    return String(text == null ? '' : text).replace(/\S+/g, function (tok) {
        // Pure word, pure number/decimal, or punctuation — nothing mixed to fix.
        if (!LETTER.test(tok) || !DIGIT.test(tok)) return tok;
        // Case 1: a number (with optional decimal separators) glued to a unit.
        var m = tok.match(/^([0-9०-९]+(?:[.,][0-9०-९]+)*)([\s\S]+)$/);
        if (m && LETTER.test(m[2].charAt(0))) {
            return m[1] + ' ' + m[2].replace(/[0-9०-९]/g, '');
        }
        // Case 2: a digit wedged into a word — drop the digits.
        return tok.replace(/[0-9०-९]/g, '');
    });
};

LOOMA.cleanSelectedText = function (text) {
    // Repair the systematic ToUnicode artefacts (m -> n1/1n) first, while the "1"
    // is still glued to its letters and identifiable.
    text = LOOMA.repairPdfTextArtifacts(text);
    // Then unmix number/letter tokens (keeps decimals, splits values from units,
    // drops digits wedged into words). Supersedes the old stray-digit pass.
    text = LOOMA.fixMixedAlnum(text);
    var chars = String(text == null ? '' : text).replace(/\|/g, ' ').split('');
    // Drop glyph garbage — the private-use / symbol characters a PDF font with no
    // ToUnicode map emits (the "weird characters", and the whole of an image's
    // text layer).
    var garbage = LOOMA.garbageCharIndexes(chars);
    for (var g = garbage.length - 1; g >= 0; g--) chars.splice(garbage[g], 1);
    var cleaned = chars.join('').replace(/\s+/g, ' ').trim();
    // A selection that was ONLY garbage (an image, or a broken text run) cleans
    // to nothing readable — return '' so no card, no speech and no highlight.
    if (LOOMA.isGarbageText(cleaned)) return '';
    return cleaned;
};

// Clone selection snapshots because ranges can be invalidated once the DOM is highlighted/repainted.
LOOMA.speakCloneSnapshot = function (snapshot) {
    if (!snapshot) return null;
    var cloned = {
        text: snapshot.text || '',
        frameId: snapshot.frameId || null
    };
    if (snapshot.range && snapshot.range.cloneRange) {
        try {
            cloned.range = snapshot.range.cloneRange();
        } catch (e) {
            cloned.range = null;
        }
    } else cloned.range = null;
    return cloned;
};

/* LOOMA.speak()
 * Author: Akshay Srivatsan
 * Date: Summer 2015/2016
 *      revised JUN 2025 for 'piper' TTS
 * Description:  to use TTS import this file from your HTML file.
 * The call can specify a Piper voice.
 *
 * Uses the standard javascript object "speechSynthesis" if present [and browser !== Chromium],
 * otherwise, calls server-side looma-TTS.php, which uses piper to generate a wave file
 *
 * extended FEB 2023 by Skip to use larynx2 for Nepali TTS
 * extended JUN 2025 by Skip to use piper for Nepali TTS
 */
LOOMA.speak = function(text, engine, voice, rate) {
        //speak the TEXT,
        //using [optional] ENGINE (in {'piper', 'responsivevoice'})
        //using [optional] VOICE
        //using [optional] RATE sets the speed of speech. (rate > 1 is FASTER)
        //      in speechSynthesis  SpeachSynthesisUtterance.rate = rate ( e.g. if rate === 0.5 speak slower)
        //  for Looma in Nepal, use default rate = 2/3

    var speed;
    const defaultspeed = 2/3;

       // Speed is per-language now. `rate` may be a { en, np } map (chosen on the
       // Reading Settings page) or a single number/string (legacy callers). When
       // nothing is passed — e.g. the Speak button reading a text selection — the
       // per-language speeds saved on the Reading Settings page are used
       // (tts-rate-en / tts-rate-np cookies), falling back to the legacy single
       // tts-rate cookie, then to 2/3 (Looma's default for Nepal).
       function _validRate(r) { r = parseFloat(r); return (r > 0 && r <= 2) ? r : null; }
       var rateEn = null, rateNp = null;
       if (rate && typeof rate === 'object') {
           rateEn = _validRate(rate.en);
           rateNp = _validRate(rate.np);
       } else {
           rateEn = rateNp = _validRate(rate);
       }
       if (rateEn == null) rateEn = _validRate(LOOMA.readStore('tts-rate-en', 'cookie')) || _validRate(LOOMA.readStore('tts-rate', 'cookie')) || defaultspeed;
       if (rateNp == null) rateNp = _validRate(LOOMA.readStore('tts-rate-np', 'cookie')) || _validRate(LOOMA.readStore('tts-rate', 'cookie')) || defaultspeed;
       // Pick the speed for a given language ('ne'/'np' → Nepali) or piece of text.
       function rateForLang(lang) { return (lang === 'ne' || lang === 'np') ? rateNp : rateEn; }
       function rateForText(t)    { return rateForLang(LOOMA.speak.detectLanguage(t)); }
       // Keep the legacy scalar rate/speed (English) for the code paths that
       // still reference a single value (request keys, telemetry attributes …).
       rate = rateEn;
       speed = 1/rate;

    // When the caller does not name an engine — e.g. the Speak button reading a
    // text selection — fall back to the user's saved default TTS technology
    // (chosen on the Reading Settings page; stored in the tts-engine cookie).
    // Piper is ALWAYS the default: it is local, offline and works on every box.
    // ResponsiveVoice is used only when the teacher has explicitly selected it
    // on the Reading Settings page (which itself only offers it when the box has
    // internet). Even then, engine === 'responsivevoice' falls back to Piper on
    // its own if it fails to load/connect (see the ResponsiveVoice branch below)
    // — so reading never just goes silent when the connection drops mid-session.
    if (!engine) {
        engine = LOOMA.readStore('tts-engine', 'cookie') || 'piper';
        if (!voice) {
            var _ve = LOOMA.readStore('tts-voice-en', 'cookie');
            var _vn = LOOMA.readStore('tts-voice-np', 'cookie');
            if (_ve || _vn) voice = { en: _ve || '', np: _vn || '' };
            else voice = LOOMA.readStore('tts-voice', 'cookie') || voice;  // legacy single-voice cookie
        }
    }
    // The only supported engines are Piper (local/offline) and ResponsiveVoice
    // (cloud), so any stale/other value is coerced to Piper.
    if (engine !== 'piper' && engine !== 'responsivevoice') engine = 'piper';

    // `voice` may be a plain string (one voice for all text) or a per-language
    // map { en, np } chosen on the Reading Settings page. Resolve both forms so the
    // English voice reads Latin text and the Nepali voice reads Devanagari.
    var voiceEn = '', voiceNp = '';
    if (voice && typeof voice === 'object') {
        voiceEn = voice.en || ''; voiceNp = voice.np || '';
    } else if (voice) {
        voiceEn = voice; voiceNp = voice;
    }

    /* requires a special regex package, like xregexp [https://www.regular-expressions.info/xregexp.html]
         const devanagari = /p{Devanagari}/u;
         if (text.match(devanagari)) text = "I cannot speak Nepali";

     so, we use "if (text.match(/[\u0900-\u097F]/g))" instead for detecting devanagri unicode characters
    */

     // Replay uses the last known text/snapshot when the user presses Speak without a fresh selection.
     var replaySnapshot = null;
     text = (text || '').replace(/\s+/g, ' ').trim();
     if (!text && LOOMA.speak.currentSourceText) {
         text = LOOMA.speak.currentSourceText;
         // While paused, keep highlighting tied to the current in-memory reading.
         replaySnapshot = LOOMA.speakCloneSnapshot(LOOMA.speak.currentSourceSnapshot);
         if (replaySnapshot) replaySnapshot.range = null;
     }
     if (!text && LOOMA.speak.lastCompletedText) {
         text = LOOMA.speak.lastCompletedText;
         // After a finished reading, replay rebuilds highlight context from the saved text/frame.
         replaySnapshot = LOOMA.speakCloneSnapshot(LOOMA.speak.lastCompletedSnapshot);
         if (replaySnapshot) replaySnapshot.range = null;
     }

     if ( text !== "" ) {
         var playPromise;

       //  if (text.match(/[\u0900-\u097F]/g)) lang = "np";

             /* commented out: set default engine and default voice in backend TTS.php
                     if (!engine) {
                             engine = 'piper'; //default engine is piper
                             if (text.match(/[\u0900-\u097F]/g))
                                  voice = 'ne_NP-google-medium.onnx';
                             else voice = 'en_US-amy-medium.onnx';
                     }
               */
         //console.log('speaking : "' + text + '" using engine: ' + engine + ' and voice: ' + voice);

         var speechButton = LOOMA.speak.getButton();

         if (LOOMA.speak.animationsInProgress == null) {
             LOOMA.speak.animationsInProgress = 0;
         }
         if (LOOMA.speak.speechQueue == null) {
             LOOMA.speak.speechQueue = [];
         }
         if (LOOMA.speak.runId == null) {
             LOOMA.speak.runId = 0;
         }
         window.onbeforeunload = function () {
             console.log("Leaving this page. Stopping Audio");
             LOOMA.speak.cleanup();
         };

         /*
         * speak.activate() makes the "Speak" button opaque and larger,
         * to give feedback to the user while the TTS request is waiting.
         * Only called for server-side (Piper) audio.
         */
         LOOMA.speak.activate = function () {
             // Busy means audio is actively playing, not merely queued.
             LOOMA.speak.buttonActive = true;
             LOOMA.speak.buttonPending = false;
             LOOMA.speak.clearPendingButtonState();
             LOOMA.speak.applyBusyButtonState();
             LOOMA.speak.updateButtonAvailability();
         }; // end speak.activate()

         /*
          * speak.disable() makes the "Speak" button translucent and regular sized,
          * to show the user that the TTS is finished.
          * Only called for server-side (Piper) audio.
          */
         LOOMA.speak.disable = function () {
             // Reset button visuals after pause/stop/end/error.
             LOOMA.speak.buttonActive = false;
             LOOMA.speak.buttonPending = false;
             LOOMA.speak.clearBusyButtonState();
             LOOMA.speak.clearPendingButtonState();
             LOOMA.speak.updateButtonAvailability();
         }; // end speak.disable()

         /*
          * Resets the TTS and button to their original states.
          */
         LOOMA.speak.cleanup = function () {
             // A new run invalidates any old fetches, object URLs and highlight state.
             LOOMA.speak.runId += 1;
             // A reading held between two sentences is over as soon as anything
             // else starts — leaving these set would make the button offer to
             // resume a chain that no longer exists.
             LOOMA.speak.gapPaused = false;
             LOOMA.speak.resumeReading = null;
             LOOMA.speak.currentSourceKey = null;
             LOOMA.speak.currentSourceText = null;
             LOOMA.speak.currentSourceSnapshot = null;
             LOOMA.speak.clearBlockHighlight();
             if (LOOMA.speak.blockObjectUrls) {
                 LOOMA.speak.blockObjectUrls.forEach(function (objectUrl) {
                     try { URL.revokeObjectURL(objectUrl); } catch (e) {}
                 });
                 LOOMA.speak.blockObjectUrls = [];
             }
             if (LOOMA.speak.playbackPoller) {
                 clearInterval(LOOMA.speak.playbackPoller);
                 LOOMA.speak.playbackPoller = null;
             }
             // ResponsiveVoice plays inside its own script and owns no media
             // element, so it is invisible to the playingAudio branch below —
             // nothing here used to stop it, and the next reading talked over
             // the one still running.
             if (LOOMA.speak.rvState) {
                 LOOMA.speak.rvState = null;
                 try {
                     if (typeof responsiveVoice !== 'undefined' && responsiveVoice.cancel) {
                         responsiveVoice.cancel();
                     }
                 } catch (e) {}
             }
             if (speechSynthesis.speaking) speechSynthesis.pause();
             else {
                 if (LOOMA.speak.playingAudio) {
            // A new selection should cancel the old reading; otherwise the same button acts as pause/resume.
                     try {
                         if (LOOMA.speak.playingAudio.pause) LOOMA.speak.playingAudio.pause();
                     } catch (e) {}
                     if (LOOMA.speak.playingAudio.loomaObjectUrl) {
                         URL.revokeObjectURL(LOOMA.speak.playingAudio.loomaObjectUrl);
                     }
                     LOOMA.speak.playingAudio = null;
                 }
                 LOOMA.speak.speechQueue = [];
                 LOOMA.speak.disable();
             }
         }; // end speak.cleanup

         /*
          * Stop the WHOLE reading, from wherever the press landed.
          *
          * A reading is a chain of one-sentence clips, so at any moment it is in
          * one of three states: a clip is playing, a clip has just ended and the
          * next is still being synthesized, or nothing is playing yet because the
          * first one has not arrived. Only the first of those had a working
          * control — a press in either gap did nothing at all.
          *
          * That reads as "pause and stop are broken in Nepali", and the language
          * is only indirectly to blame: the Nepali voice is a `medium` model where
          * English uses `low`, so on an ODROID each sentence takes seconds to
          * synthesize and nearly every press lands in a gap. The same box in
          * English is fast enough that a clip is almost always playing.
          *
          * Stopping (not pausing) is the honest action here: there is no audio to
          * pause mid-gap. cleanup() bumps runId, which every step of the fetch/play
          * chain checks, so the sentences still in flight are abandoned instead of
          * starting up after the press. lastCompleted* is saved first — exactly as
          * finishBrowserPlayback() does — so the next press replays the passage.
          */
         LOOMA.speak.stopReading = function () {
             var stoppedText = LOOMA.speak.currentSourceText;
             var stoppedSnapshot = LOOMA.speak.currentSourceSnapshot;
             if (stoppedText) {
                 LOOMA.speak.lastCompletedText = stoppedText;
                 LOOMA.speak.lastCompletedSnapshot = LOOMA.speakCloneSnapshot(stoppedSnapshot);
             }
             LOOMA.speak.cleanup();
             LOOMA.speak.disable();
         }; // end speak.stopReading

         LOOMA.speak.clearBlockHighlight = function () {
             // Remove the PDF highlight bands (overlay divs — these never touched
             // the text, so nothing to restore and the map stays valid).
             var overlays = LOOMA.speak.highlightOverlays;
             LOOMA.speak.highlightOverlays = [];
             if (overlays && overlays.length) {
                 overlays.forEach(function (el) { if (el && el.parentNode) el.parentNode.removeChild(el); });
             }

             // Remove the temporary highlight spans and restore plain text nodes.
             var marks = LOOMA.speak.highlightMarks;
             LOOMA.speak.highlightMarks = [];
             if (!marks || !marks.length) return;

             var touchedParents = [];
             marks.forEach(function (mark) {
                 if (!mark || !mark.parentNode) return;
                 var ownerDocument = mark.ownerDocument || document;
                 var parent = mark.parentNode;
                 parent.replaceChild(ownerDocument.createTextNode(mark.textContent), mark);
                 if (touchedParents.indexOf(parent) === -1) touchedParents.push(parent);
             });

             // Glue the restored text back into single text nodes. Highlighting a
             // sentence carves its text node into three (before / mark / after), and
             // without this the original node stays detached for good — so every entry
             // the character map holds for it is dead, and the NEXT sentence can only
             // highlight whatever part of itself happens to live in a node no earlier
             // sentence touched. That is what left long sentences half-highlighted.
             touchedParents.forEach(function (parent) {
                 try { parent.normalize(); } catch (e) {}
             });

             // The map now points at nodes that no longer exist — force a rebuild.
             if (LOOMA.speak.highlightContext) LOOMA.speak.highlightContext.stale = true;
         };

         /* The spoken sentence and the text on screen are compared with ALL
          * whitespace removed, and with the same stray digits dropped from both.
          *
          * A PDF text layer splits one word across several spans ("fin" + "e"),
          * runs others together with no gap at all, and the sentence handed to the
          * TTS engine has already been re-spaced on the way out — so any rule that
          * tries to agree on where the spaces belong will disagree somewhere, and a
          * sentence that fails to match is a sentence that is read aloud with no
          * highlight at all. Ignoring spaces entirely makes the two sides line up
          * every time. */
         function normalizeForMatch(str) {
             // Clean FIRST (so fixMixedAlnum can see word/number token boundaries),
             // then lowercase, drop whitespace/"|", and drop ALL digits. Both sides
             // of the match drop every digit, so they can never disagree over a page
             // number or a standalone value the way "wedged vs standalone" would —
             // the match is driven by the (highly distinctive) letters alone.
             return LOOMA.cleanSelectedText(str)
                 .toLowerCase()
                 .replace(/[\s|]+/g, '')
                 .replace(/[0-9०-९]/g, '');
         }

         /* Walk the root and build the aggregate string plus its character -> DOM map.
          *
          * The walk covers the WHOLE root rather than just the selected range, so it
          * produces the identical string every time it runs. That is what makes the
          * context rebuildable after a highlight has rewritten the DOM without every
          * offset shifting underneath it; the range only marks out a
          * [windowStart, windowEnd) slice of that string to start reading from. */
         LOOMA.speak.refreshHighlightContext = function (context, range) {
             var ownerDocument = context && context.ownerDocument;
             var root = context && context.root;
             if (!root || !ownerDocument) return context;

             var ownerWindow = ownerDocument.defaultView || window;
             var NodeFilterRef = ownerWindow.NodeFilter || NodeFilter;

             var walker = ownerDocument.createTreeWalker(root, NodeFilterRef.SHOW_TEXT, {
                 acceptNode: function (node) {
                     var parent = node.parentElement;
                     if (!parent) return NodeFilterRef.FILTER_REJECT;
                     if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilterRef.FILTER_REJECT;
                     if (parent.closest('script, style, noscript, button, input, textarea, select, .toolbar, #toolbar-container')) return NodeFilterRef.FILTER_REJECT;
                     return NodeFilterRef.FILTER_ACCEPT;
                 }
             });

             function inRange(node, offset) {
                 if (!range) return false;
                 try { return range.isPointInRange(node, offset); } catch (e) { return false; }
             }

             var chars = [];
             var map = [];
             var windowStart = -1;
             var windowEnd = -1;
             var current;

             while ((current = walker.nextNode())) {
                 var raw = current.nodeValue;
                 for (var i = 0; i < raw.length; i++) {
                     var ch = raw[i];
                     // Skipped for the same reason normalizeForMatch() drops them.
                     if (/[\s|]/.test(ch)) continue;
                     // Drop glyph garbage here too, so the highlight character map
                     // stays aligned with the cleaned/spoken text. See
                     // LOOMA.cleanSelectedText() / LOOMA.isReadableChar().
                     if (!LOOMA.isReadableChar(ch)) continue;
                     if (range && inRange(current, i)) {
                         if (windowStart === -1) windowStart = chars.length;
                         windowEnd = chars.length + 1;
                     }
                     chars.push(ch.toLowerCase());
                     map.push({node: current, offset: i});
                 }
             }

             // Bring the aggregate into the SAME shape normalizeForMatch() produces
             // for the spoken text, keeping the char->DOM map aligned so a matched
             // sentence still points at live nodes. Two index-aligned passes:
             //   1. repair the "m"-as-"n1"/"1n" artefact (the 'n'/'1' keeps its DOM
             //      entry as the new 'm'; its partner char is dropped);
             //   2. drop every digit (matches normalizeForMatch dropping all digits).
             function dropAt(idx) {
                 chars.splice(idx, 1);
                 map.splice(idx, 1);
                 if (windowStart > idx) windowStart--;
                 if (windowEnd > idx) windowEnd--;
             }
             function isLetterLC(c) { return /[a-zऀ-ॿ]/.test(c || ''); }
             for (var r = 0; r < chars.length - 1; r++) {
                 var a = chars[r], b = chars[r + 1], nx = chars[r + 2];
                 if (a === 'n' && b === '1' && (isLetterLC(nx) || nx === '/')) { chars[r] = 'm'; dropAt(r + 1); }
                 else if (a === '1' && b === 'n' && isLetterLC(nx)) { chars[r] = 'm'; dropAt(r + 1); }
             }
             for (var d = chars.length - 1; d >= 0; d--) {
                 if (LOOMA.isWordDigit(chars[d])) dropAt(d);
             }

             context.aggregate = chars.join('');
             context.map = map;
             if (range) {
                 context.windowStart = windowStart === -1 ? 0 : windowStart;
                 context.windowEnd = windowEnd === -1 ? context.aggregate.length : windowEnd;
             }
             context.stale = false;
             return context;
         };

         LOOMA.speak.buildHighlightContext = function () {
             // Build a searchable text map so each spoken segment can be matched back to visible DOM text.
             function getSnapshotDocument(snapshot) {
                 // Rebuild highlights inside the correct iframe/document when replaying older text.
                 if (snapshot && snapshot.frameId) {
                     var frame = document.getElementById(snapshot.frameId);
                     if (frame && frame.contentDocument) return frame.contentDocument;
                 }
                 return document;
             }

             // Prefer the stored selection snapshot; fall back to the live selection for first-time reads.
             var snapshot = LOOMA.speak.selectionSnapshot || LOOMA.speak.captureSelectionSnapshot();
             if (!snapshot) return null;

             var ownerDocument = getSnapshotDocument(snapshot);
             var sourceRange = null;
             var root = null;

             if (snapshot.range && snapshot.range.cloneRange) {
                 try {
                     sourceRange = snapshot.range.cloneRange();
                     root = sourceRange.commonAncestorContainer;
                     if (root && root.nodeType === Node.TEXT_NODE) root = root.parentNode;
                     if (!root || !ownerDocument.contains(root)) { sourceRange = null; root = null; }
                 } catch (e) {
                     sourceRange = null;
                     root = null;
                 }
             }

             if (!root) {
                 // If the original range is no longer reliable, search inside the whole document and narrow below.
                 root = ownerDocument.body || ownerDocument.documentElement;
             }
             if (!root) return null;

             var context = {
                 root: root,
                 ownerDocument: ownerDocument,
                 normalizeText: normalizeForMatch,
                 aggregate: '',
                 map: [],
                 windowStart: 0,
                 windowEnd: 0,
                 searchIndex: 0,
                 stale: false
             };

             LOOMA.speak.refreshHighlightContext(context, sourceRange);

             if (!sourceRange) {
                 // Replay after clearing the selection uses the saved selected text to constrain the search window.
                 context.windowStart = 0;
                 context.windowEnd = context.aggregate.length;
                 var selectionTarget = snapshot.text ? normalizeForMatch(snapshot.text) : '';
                 var selectionStart = selectionTarget ? context.aggregate.indexOf(selectionTarget) : -1;
                 if (selectionStart !== -1) {
                     context.windowStart = selectionStart;
                     context.windowEnd = selectionStart + selectionTarget.length;
                 }
             }

             context.searchIndex = context.windowStart;
             return context;
         };

         /* Merge a Range's client rects (one per pdf.js word-span) into ONE band
          * per text line, bridging the gaps at spaces so a sentence reads as a
          * single continuous highlight rather than a row of separate boxes. */


         /* Highlight a PDF sentence with translucent yellow bands drawn BEHIND the
          * text (the visible glyphs live on the canvas). The text is never wrapped,
          * bolded or reflowed, so words keep their exact pdf.js spacing — and each
          * line gets one continuous band, not a box per word. */
         /* The colour of the reading highlight: the SAME one as the toolbar at the
          * bottom of the page (--looma-toolbar), so the page has one accent rather
          * than two nearly-equal yellows — and so the themes that repaint the
          * toolbar (CEHRD teal, INDIA orange) repaint the highlight with it.
          *
          * Read from the MAIN document on purpose: a chapter opened as HTML lives
          * in an iframe whose document knows nothing of Looma's CSS variables. */
         /* Height of the reading band, in em of the text it covers. Tall enough
          * to sit behind ascenders and descenders, short enough that it cannot
          * reach the line above or below at the line spacing chapters use. */
         LOOMA.speak.HIGHLIGHT_BAND_EM = 1.25;

         LOOMA.speak.highlightColor = function () {
             if (LOOMA.speak.cachedHighlightColor) return LOOMA.speak.cachedHighlightColor;
             var accent = '';
             try {
                 accent = (window.getComputedStyle(document.documentElement)
                                 .getPropertyValue('--looma-toolbar') || '').trim();
             } catch (e) { accent = ''; }
             LOOMA.speak.cachedHighlightColor = accent || 'yellow';
             return LOOMA.speak.cachedHighlightColor;
         };

         LOOMA.speak.renderPdfHighlight = function (range, layer) {
             LOOMA.speak.highlightOverlays = LOOMA.speak.highlightOverlays || [];
             var ownerDocument = layer.ownerDocument || document;
             var base = layer.getBoundingClientRect();   // the text layer is the positioning origin
             var lines = LOOMA.speak.mergeRectsByLine(range.getClientRects());
             var accent = LOOMA.speak.highlightColor();
             var made = [];
             lines.forEach(function (r) {
                 /* Height. The rect is the span's FONT box, which on these pages
                  * is taller than the gap to the next line — so a band drawn at
                  * rect height covers part of the lines around it, and two bands
                  * of a sentence that wraps overlap each other. Cap it at the
                  * measured line spacing less a small gutter, and centre what is
                  * left on the line, so a band can never touch its neighbours. */
                 var height = r.bottom - r.top;
                 var limit = LOOMA.speak.bandLimitAt(layer, r.top) || height * 0.76;
                 var band = Math.max(4, Math.min(height, limit));

                 var div = ownerDocument.createElement('div');
                 div.className = 'tts-pdf-highlight';
                 div.style.position = 'absolute';
                 div.style.left = (r.left - base.left) + 'px';
                 div.style.top = (r.top - base.top + (height - band) / 2) + 'px';
                 div.style.width = (r.right - r.left) + 'px';
                 div.style.height = band + 'px';
                 /* Colour set INLINE, like the HTML highlight: a converted chapter
                  * is its own document inside an iframe, carrying its own copy of
                  * this rule, and looma.css never reaches it. Inline wins over
                  * both, so the band is the toolbar colour everywhere.
                  *
                  * `multiply` is what a highlighter pen does — white paper turns
                  * the accent colour and the ink underneath STAYS BLACK. On a
                  * scanned page it is the only way to be opaque about the colour
                  * without hiding the words: they are pixels in the scan below. */
                 div.style.backgroundColor = accent;
                 div.style.mixBlendMode = 'multiply';
                 div.style.borderRadius = '0.15em';
                 div.style.pointerEvents = 'none';
                 layer.appendChild(div);
                 made.push(div);
             });
             LOOMA.speak.highlightOverlays = LOOMA.speak.highlightOverlays.concat(made);
             return made.length > 0;
         };

         LOOMA.speak.highlightBlock = function (blockText) {
             // Highlight only the sentence/block currently being read.
             LOOMA.speak.clearBlockHighlight();
             if (!blockText) return;

             var context = LOOMA.speak.highlightContext;
             if (context && context.stale) {
                 // The previous sentence's highlight rewrote the DOM. Re-walk the same
                 // root so the map points at live text nodes again — the text itself is
                 // unchanged, so the aggregate and the cursor into it still hold good.
                 LOOMA.speak.refreshHighlightContext(context, null);
             }
             if (!context) context = LOOMA.speak.buildHighlightContext();
             if (!context) return;
             LOOMA.speak.highlightContext = context;

             var target = context.normalizeText(blockText);
             if (!target) return;

             // Continue searching forward so repeated phrases highlight in reading order.
             function locate(ctx) {
                 var at = ctx.aggregate.indexOf(target, ctx.searchIndex || 0);
                 if (at === -1) at = ctx.aggregate.indexOf(target, ctx.windowStart || 0);
                 if (at === -1) at = ctx.aggregate.indexOf(target);
                 return at;
             }
             // Every character we are about to wrap must still point at a live text
             // node long enough to hold its offset. If any does not, the DOM moved
             // under the map since it was built, and wrapping now would highlight
             // ONLY the part of the sentence that stayed valid — the classic
             // half-highlighted sentence. Rebuild the map once (the text is
             // unchanged, so the aggregate/cursor still hold) and re-locate, so we
             // either highlight the whole sentence or, if it truly cannot be mapped,
             // nothing — never half.
             function rangeMapValid(ctx, from, to) {
                 for (var v = from; v <= to; v++) {
                     var e = ctx.map[v];
                     if (!e || !e.node || !e.node.parentNode) return false;
                     if (!e.node.nodeValue || e.offset >= e.node.nodeValue.length) return false;
                 }
                 return true;
             }

             var startIndex = locate(context);
             if (startIndex === -1) return;
             var endIndex = startIndex + target.length - 1;

             if (!rangeMapValid(context, startIndex, endIndex)) {
                 LOOMA.speak.refreshHighlightContext(context, null);
                 startIndex = locate(context);
                 if (startIndex === -1) return;
                 endIndex = startIndex + target.length - 1;
                 if (!rangeMapValid(context, startIndex, endIndex)) return;
             }

             context.searchIndex = startIndex + target.length;

             // PDF path: draw translucent bands behind the text instead of
             // wrapping it. On a pdf.js text layer each word is its own absolutely
             // positioned span, so wrapping produced a separate bold box per word
             // (crowded, fragmented). Bands from the range's client rects, merged
             // per line, give one continuous highlight and never touch the text.
             var startEntry = context.map[startIndex];
             var endEntry = context.map[endIndex];
             var startParent = startEntry && startEntry.node && startEntry.node.parentElement;
             var pdfLayer = startParent && startParent.closest ? startParent.closest('.pdf-text, .textLayer') : null;
             if (pdfLayer) {
                 try {
                     var pdfDoc = startEntry.node.ownerDocument || document;
                     var pdfRange = pdfDoc.createRange();
                     pdfRange.setStart(startEntry.node, startEntry.offset);
                     pdfRange.setEnd(endEntry.node, endEntry.offset + 1);
                     if (LOOMA.speak.renderPdfHighlight(pdfRange, pdfLayer)) return;
                 } catch (e) { /* fall through to the wrapping path below */ }
             }

             var perNode = new Map();

             for (var j = startIndex; j <= endIndex; j++) {
                 var entry = context.map[j];
                 if (!entry || !entry.node || !entry.node.parentNode) continue;
                 if (entry.offset >= entry.node.nodeValue.length) continue;
                 if (!perNode.has(entry.node)) perNode.set(entry.node, {start: entry.offset, end: entry.offset});
                 var segment = perNode.get(entry.node);
                 if (entry.offset < segment.start) segment.start = entry.offset;
                 if (entry.offset > segment.end) segment.end = entry.offset;
             }

             LOOMA.speak.highlightMarks = [];

             Array.from(perNode.entries()).map(function (pair) {
                 return {node: pair[0], start: pair[1].start, end: pair[1].end + 1};
             }).reverse().forEach(function (segment) {
                 var node = segment.node;
                 if (!node || !node.parentNode) return;

                 var ownerDocument = node.ownerDocument || document;
                 var text = node.nodeValue;
                 var before = text.slice(0, segment.start);
                 var middle = text.slice(segment.start, segment.end);
                 var after = text.slice(segment.end);
                 var fragment = ownerDocument.createDocumentFragment();

                 if (before) fragment.appendChild(ownerDocument.createTextNode(before));

                 // Wrap only the currently spoken text fragment so the highlight can be removed cleanly.
                 var mark = ownerDocument.createElement('span');
                 mark.className = 'tts-block-highlight';
                 mark.textContent = middle;
                 // The styles are set INLINE and not left to the .tts-block-highlight
                 // rule, because an HTML chapter is loaded inside an iframe and
                 // Looma's stylesheet does not reach into that document. The
                 // accent comes from the theme all the same — see highlightColor().
                 //
                 // The band is painted as a GRADIENT, not as background-color: an
                 // inline box's background fills the font's whole content area,
                 // which in Looma's comic font is taller than the line spacing of a
                 // typical chapter — so a plain background-color bled over the
                 // lines above and below. A gradient can be given a height
                 // (HIGHLIGHT_BAND_EM), so the band always stays inside its own
                 // line. `box-decoration-break: clone` makes each line fragment of
                 // a wrapped sentence paint its own band instead of one band
                 // stretched across the whole hypothetical box.
                 var bandColor = LOOMA.speak.highlightColor();
                 mark.style.backgroundImage = 'linear-gradient(' + bandColor + ',' + bandColor + ')';
                 mark.style.backgroundRepeat = 'no-repeat';
                 mark.style.backgroundSize = '100% ' + LOOMA.speak.HIGHLIGHT_BAND_EM + 'em';
                 mark.style.backgroundPosition = '0 50%';
                 mark.style.setProperty('-webkit-box-decoration-break', 'clone');
                 mark.style.setProperty('box-decoration-break', 'clone');
                 mark.style.color = '#000';        // ~19:1 on the toolbar yellow
                 mark.style.fontWeight = 'bold';   // the sentence being read stands out
                 mark.style.borderRadius = '0.1em';
                 fragment.appendChild(mark);

                 if (after) fragment.appendChild(ownerDocument.createTextNode(after));

                 node.parentNode.replaceChild(fragment, node);
                 LOOMA.speak.highlightMarks.push(mark);
             });
         };

    ////////////////////////////////
    //start of LOOMA.speak code: ///
    ////////////////////////////////

         // Shared by every engine that highlights as it reads (Piper and
         // ResponsiveVoice): short sentence-level chunks so the highlight can
         // follow along, instead of one giant utterance highlighted all at once
         // (or, before this fix, not highlighted at all — see the ResponsiveVoice
         // branch below).
         /* How much of the FIRST sentence to synthesize before playback starts.
          *
          * Nothing is heard until the first clip is ready, so the wait before a
          * reading begins is exactly "how long Piper takes on sentence one" — and
          * an ODROID synthesizes slower than real time, which turns a long opening
          * sentence into seconds of apparent deadness. Cutting only that first
          * segment down to a clause gets sound out roughly in proportion: a third
          * of the sentence, a third of the wait. Every later clip stays a whole
          * sentence, so prosody is untouched from the second one on, and by then
          * the fetch chain is already running ahead of playback.
          *
          * Never mid-word, and never when the sentence has no natural break. */
         var FIRST_SEGMENT_MAX = 80;   // characters
         var FIRST_SEGMENT_MIN = 25;   // don't leave an opening scrap too short to sound natural

         function splitFirstSegment(part) {
             if (part.length <= FIRST_SEGMENT_MAX) return [part];
             // Prefer a clause break (comma/semicolon/colon/dash, plus the
             // Devanagari comma), else any space. Scan forwards keeping the LAST
             // match, so the break lands as late as it can while under the cap.
             var window = part.slice(0, FIRST_SEGMENT_MAX + 1);
             var cut = -1;
             var clause = /[,;:\u2014\u2013\u0964]/g, m;
             while ((m = clause.exec(window)) !== null) {
                 if (m.index + 1 >= FIRST_SEGMENT_MIN) cut = m.index + 1;
             }
             if (cut < 0) {
                 var space = window.lastIndexOf(' ');
                 if (space >= FIRST_SEGMENT_MIN) cut = space;
             }
             if (cut < 0) return [part];          // no natural break: leave it whole
             var head = part.slice(0, cut).trim();
             var tail = part.slice(cut).trim();
             if (!head || !tail) return [part];
             return [head, tail];
         }

         function splitIntoPlaybackSegments(sourceText) {
             var normalized = sourceText
                 .replace(/\r/g, ' ')
                 .replace(/\n+/g, ' ')
                 .replace(/\s+/g, ' ')
                 .trim();
             if (!normalized) return [];

             // \u0964 danda and \u0965 DOUBLE danda both end a Devanagari sentence.
             // The double danda closes a verse or a stanza \u2014 common in the poetry
             // and scripture in Looma's Nepali chapters \u2014 and without it the whole
             // passage stayed ONE clip: nothing is heard until every line of it has
             // been synthesized, and pause has only one place to land.
             var sentences = (normalized.match(/[^.!?\u0964\u0965]+[.!?\u0964\u0965]?/g) || [normalized])
                 .map(function (part) { return part.replace(/\s+/g, ' ').trim(); })
                 .filter(function (part) { return part.length > 0; });

             if (sentences.length === 0) return sentences;
             return splitFirstSegment(sentences[0]).concat(sentences.slice(1));
         }

         if (engine === 'synthesis') {
             // we use synthesis if the user is running Safari or Chrome - any browser that has speechSynthesis installed
             // Firefox does have speechSynthesis, but be sure to set webspeech.synth.enabled=true in about:config
             // Chromium's speechSynthesis seems to be broken. (they dont load any voices, so TTS doesnt happen)
             if (speechSynthesis.speaking) {
                 if (speechSynthesis.paused)
                     speechSynthesis.resume();
                 else speechSynthesis.pause();
             } else {
                 // speechSynthesis usually accounts for latency itself, so there's no need to queue requests.
                 var speech = new SpeechSynthesisUtterance(text);
                 speech.rate = rateForText(text);   // per-language speed (e.g. 2/3 slows down)
                 // Use the voice the user picked on the Reading Settings page — the
                 // Nepali voice for Devanagari text, the English voice otherwise.
                 var synthVoiceName = /[ऀ-ॿ]/.test(text) ? voiceNp : voiceEn;
                 if (synthVoiceName) {
                     try {
                         var synthPick = (speechSynthesis.getVoices() || []).filter(
                             function (v) { return v.name === synthVoiceName; })[0];
                         if (synthPick) speech.voice = synthPick;
                     } catch (e) {}
                 }
                 // Browser-RUM span: speechSynthesis runs client-side, so it
                 // emits no server span. Time the call → first audio so the
                 // TTS dashboards get a real load-latency figure for it. We
                 // also send a `tts_speak` event to looma-telemetry.php so
                 // engine / voice / language / rate / source land in OpenSearch
                 // logs and Prometheus metrics behind the Grafana TTS panels.
                 var synthT0 = Date.now();
                 var synthLang = /[ऀ-ॿ]/.test(text) ? 'np' : 'en';
                 var synthVoiceUsed = (synthLang === 'np') ? voiceNp : voiceEn;
                 var synthSrc = (typeof location !== 'undefined' && location.pathname) || '';
                 var synthSpanAttrs = {
                     'tts.engine':     'synthesis',
                     'tts.voice':      synthVoiceUsed || '',
                     'tts.language':   synthLang,
                     'tts.rate':       rate,
                     'tts.text_chars': (text || '').length,
                     'tts.source':     synthSrc
                 };
                 var synthEventBase = {
                     tts_engine:     'synthesis',
                     tts_voice:      synthVoiceUsed || '',
                     tts_language:   synthLang,
                     tts_rate:       rate,
                     tts_text_chars: (text || '').length,
                     tts_source:     synthSrc
                 };
                 speech.addEventListener('start', function () {
                     try {
                         if (window.LOOMA && LOOMA.otel && LOOMA.otel.emitSpan) {
                             LOOMA.otel.emitSpan('tts.synthesis', synthT0, Date.now(), 1, synthSpanAttrs);
                         }
                     } catch (e) {}
                     try {
                         if (window.LOOMA && LOOMA.telemetry && LOOMA.telemetry.track) {
                             LOOMA.telemetry.track('tts_speak', Object.assign({ tts_status: 'ok' }, synthEventBase));
                         }
                     } catch (e) {}
                 });
                 speech.addEventListener('error', function (ev) {
                     var msg = String((ev && ev.error) || 'synthesis error');
                     try {
                         if (window.LOOMA && LOOMA.otel && LOOMA.otel.emitSpan) {
                             LOOMA.otel.emitSpan('tts.synthesis', synthT0, Date.now(), 1,
                                 Object.assign({ 'error.message': msg }, synthSpanAttrs),
                                 { statusCode: 2 });
                         }
                     } catch (e) {}
                     try {
                         if (window.LOOMA && LOOMA.telemetry && LOOMA.telemetry.track) {
                             LOOMA.telemetry.track('tts_speak',
                                 Object.assign({ tts_status: 'error', tts_error: msg }, synthEventBase));
                         }
                     } catch (e) {}
                 });
                 speechSynthesis.speak(speech);
             }
         }

         else if (engine === 'responsivevoice') {
             // ResponsiveVoice — cloud TTS that runs entirely client-side. Its
             // external script is loaded LAZILY (LOOMA.speak.ensureResponsiveVoice)
             // the first time the user presses Speak with this engine selected, so
             // pages that never use it make no request to responsivevoice.org. If
             // it cannot be loaded (typically: the box has no internet right now),
             // fall back to Piper instead of just going silent — a box that drops
             // offline mid-session must still be able to read aloud.
             //
             // Show the spinner NOW: loading responsivevoice.org and waiting for
             // the cloud to return audio takes seconds, and until onstart fires
             // the button gave no feedback at all (the Piper path below already
             // does this). onstart/onerror clear it via activate()/disable().
             // PIPER IS THE DEFAULT, and the only engine that works offline. When
             // the browser already knows it has no connection, don't spend seconds
             // fetching responsivevoice.org just to fail: read with Piper now.
             // (An `onLine` of true is only a hint — a LAN with no route out still
             // reports true — so the fallback inside the callback below stays.)
             if (typeof navigator !== 'undefined' && navigator.onLine === false) {
                 console.warn('offline — reading with Piper instead of ResponsiveVoice.');
                 // No voice: the voices held here are ResponsiveVoice NAMES
                 // ("UK English Female"), which mean nothing to Piper. Leaving it
                 // empty lets Piper pick its own default for each language.
                 LOOMA.speak(text, 'piper', { en: '', np: '' }, { en: rateEn, np: rateNp });
                 return;
             }

             LOOMA.speak.buttonPending = true;
             LOOMA.speak.applyPendingButtonState();
             LOOMA.speak.updateButtonAvailability();

             LOOMA.speak.ensureResponsiveVoice(function (rvAvailable) {
             if (!rvAvailable) {
                 console.warn('ResponsiveVoice is unavailable (needs internet + a valid key) — falling back to Piper.');
                 // Surface the outage in Grafana: emit an ERROR-status span on
                 // the same tts.responsivevoice series the dashboards already
                 // query, plus a tts_speak event for the logs side.
                 var rvUnavailSrc = (typeof location !== 'undefined' && location.pathname) || '';
                 var rvUnavailLang = (LOOMA.speak.detectLanguage(text) === 'ne') ? 'np' : 'en';
                 try {
                     if (window.LOOMA && LOOMA.otel && LOOMA.otel.emitSpan) {
                         var rvUnavailT = Date.now();
                         LOOMA.otel.emitSpan('tts.responsivevoice', rvUnavailT, rvUnavailT + 1, 1, {
                             'tts.engine':      'responsivevoice',
                             'tts.language':    rvUnavailLang,
                             'tts.text_chars':  (text || '').length,
                             'tts.source':      rvUnavailSrc,
                             'error.message':   'responsivevoice unavailable'
                         }, { statusCode: 2 });
                     }
                 } catch (e) {}
                 try {
                     if (window.LOOMA && LOOMA.telemetry && LOOMA.telemetry.track) {
                         LOOMA.telemetry.track('tts_speak', {
                             tts_engine:     'responsivevoice',
                             tts_language:   rvUnavailLang,
                             tts_text_chars: (text || '').length,
                             tts_source:     rvUnavailSrc,
                             tts_status:     'error',
                             tts_error:      'responsivevoice unavailable'
                         });
                     }
                 } catch (e) {}
                 // Hand the spinner over to the Piper path, which sets its own
                 // pending state — otherwise it would stay spinning from here.
                 LOOMA.speak.buttonPending = false;
                 LOOMA.speak.clearPendingButtonState();
                 // Same as the offline short-circuit above: hand Piper no voice
                 // rather than a ResponsiveVoice name it cannot use.
                 LOOMA.speak(text, 'piper', { en: '', np: '' }, rate);
             } else {
                 // Pressing Speak again while it is talking stops it (toggle),
                 // matching how the other engines behave.
                 var rvPlaying = false;
                 try { rvPlaying = (typeof responsiveVoice.isPlaying === 'function') && responsiveVoice.isPlaying(); } catch (e) {}
                 if (rvPlaying) {
                     responsiveVoice.cancel();
                     // Retire the run properly rather than just going quiet: a
                     // leftover rvState would make the button guard offer
                     // "resume" for a reading that no longer exists, and handing
                     // the text to lastCompleted* is what lets the next press
                     // repeat it. (Reached from callers that speak directly, such
                     // as the Reading Settings page — a press on the Speak
                     // control is intercepted by the button guard first.)
                     if (LOOMA.speak.rvState) {
                         LOOMA.speak.rvState = null;
                         LOOMA.speak.lastCompletedText = LOOMA.speak.currentSourceText || '';
                         LOOMA.speak.lastCompletedSnapshot =
                             LOOMA.speakCloneSnapshot(LOOMA.speak.currentSourceSnapshot);
                         LOOMA.speak.currentSourceKey = null;
                         LOOMA.speak.currentSourceText = null;
                         LOOMA.speak.currentSourceSnapshot = null;
                     }
                     LOOMA.speak.clearBlockHighlight();
                     LOOMA.speak.disable();
                 } else {
                     // ResponsiveVoice's rate runs ~0–1.5; clamp the Looma rate.
                     var rvRate = Math.min(1.5, Math.max(0, rateForText(text) || (2/3)));
                     // Browser-RUM span: ResponsiveVoice is a client-side cloud
                     // engine with no server span — time the call → first audio
                     // so its load latency shows in the TTS dashboards.
                     var rvT0 = Date.now();
                     // Devanagari text uses the Nepali voice, Latin text the
                     // English one — both chosen on the Reading Settings page.
                     // These are the PASSAGE-level values: the fallback voice, and
                     // what the telemetry below reports. The voice and speed each
                     // sentence is actually read with are picked per segment in
                     // speakNextRvSegment(), the same way the Piper path does it.
                     var rvLang = (LOOMA.speak.detectLanguage(text) === 'ne') ? 'np' : 'en';
                     var rvVoice = ((rvLang === 'np') ? voiceNp : voiceEn) || 'UK English Female';
                     var rvSrc = (typeof location !== 'undefined' && location.pathname) || '';
                     // Span + telemetry attributes shared by every outcome so a
                     // single tts.responsivevoice / tts_speak row in Grafana
                     // carries the engine, voice, language, rate, source.
                     var rvSpanAttrs = {
                         'tts.engine':     'responsivevoice',
                         'tts.voice':      rvVoice,
                         'tts.language':   rvLang,
                         'tts.rate':       rvRate,
                         'tts.text_chars': (text || '').length,
                         'tts.source':     rvSrc
                     };
                     var rvEventBase = {
                         tts_engine:     'responsivevoice',
                         tts_voice:      rvVoice,
                         tts_language:   rvLang,
                         tts_rate:       rvRate,
                         tts_text_chars: (text || '').length,
                         tts_source:     rvSrc
                     };
                     // Speak sentence-by-sentence (like Piper below) instead of
                     // handing the WHOLE text to ResponsiveVoice as one utterance —
                     // that old shape never called highlightBlock() at all, so the
                     // reading highlight only ever showed up with Piper, never with
                     // ResponsiveVoice. rvRunId (shared LOOMA.speak.runId counter,
                     // same one Piper uses) stops a stale chain the moment a
                     // new speak() call or cancel() supersedes it.
                     var rvRunId = ++LOOMA.speak.runId;
                     var rvSegments = splitIntoPlaybackSegments(text);
                     LOOMA.speak.highlightContext = LOOMA.speak.buildHighlightContext();

                     // The same playback bookkeeping the Piper path keeps (see the
                     // currentSourceText/Snapshot block further down). Without it a
                     // ResponsiveVoice reading was invisible to everything built on
                     // top of a reading: pause/resume, the press-and-hold restart and
                     // the "repeat" press all key off these fields, so with RV
                     // selected the button could only ever START something.
                     var rvSnapshot = replaySnapshot || LOOMA.speak.captureSelectionSnapshot();
                     LOOMA.speak.selectionSnapshot = LOOMA.speakCloneSnapshot(rvSnapshot);
                     LOOMA.speak.currentSourceKey = ['responsivevoice', rvVoice, rvRate,
                                                     LOOMA.speak.normalizeSpeakKey(text)].join('|');
                     LOOMA.speak.currentSourceText = text;
                     LOOMA.speak.currentSourceSnapshot = LOOMA.speakCloneSnapshot(rvSnapshot);
                     // RV exposes no media element to ask "are you paused?", so that
                     // flag is ours to keep. The watchdog below and the button guard
                     // both read it.
                     LOOMA.speak.rvState = { runId: rvRunId, paused: false };

                     // Mirrors finishBrowserPlayback() on the Piper side: hand the
                     // text and its highlight context over to lastCompleted* so the
                     // next press repeats this reading instead of finding nothing.
                     function finishRvPlayback() {
                         if (rvRunId !== LOOMA.speak.runId) return;
                         LOOMA.speak.rvState = null;
                         LOOMA.speak.lastCompletedText = LOOMA.speak.currentSourceText || text;
                         LOOMA.speak.lastCompletedSnapshot =
                             LOOMA.speakCloneSnapshot(LOOMA.speak.currentSourceSnapshot);
                         LOOMA.speak.currentSourceKey = null;
                         LOOMA.speak.currentSourceText = null;
                         LOOMA.speak.currentSourceSnapshot = null;
                         LOOMA.speak.clearBlockHighlight();
                         LOOMA.speak.disable();
                     }

                     function speakNextRvSegment(index) {
                         if (rvRunId !== LOOMA.speak.runId) return;
                         var segment = rvSegments[index];
                         if (!segment) {
                             finishRvPlayback();
                             return;
                         }

                         // Voice and speed follow the SENTENCE, exactly as they do
                         // on the Piper path. They used to be fixed for the whole
                         // passage from the first Devanagari character found
                         // anywhere in it, so one Nepali word made the Nepali voice
                         // read the English sentences too — and a chapter with a
                         // single English caption made the English voice read all
                         // the Nepali. Mixed pages are most of Looma's content.
                         var segLang = LOOMA.speak.detectLanguage(segment);
                         var segVoice = ((segLang === 'ne') ? voiceNp : voiceEn) || rvVoice;
                         // Same clamp as rvRate: ResponsiveVoice's rate runs ~0–1.5.
                         var segRate = Math.min(1.5, Math.max(0, rateForLang(segLang) || (2 / 3)));

                         // ResponsiveVoice does not always deliver onend — most
                         // reliably on the very FIRST utterance of a session,
                         // where RV/Chrome can drop the callback entirely. With
                         // the chain hanging off onend alone that silently ended
                         // the reading after sentence one. advance() is the single
                         // way forward, is idempotent, and is additionally driven
                         // by a watchdog that polls RV's own playing state, so a
                         // missing callback costs a short pause instead of the
                         // rest of the text.
                         var advanced = false;
                         var watchdog = null;
                         function stopWatchdog() {
                             if (watchdog) { clearInterval(watchdog); watchdog = null; }
                         }
                         function advance() {
                             if (advanced) return;
                             // A PAUSED reading must not roll on to the next
                             // sentence. RV reports "not playing" while paused —
                             // the very state the watchdog uses to detect a
                             // dropped onend — so without this, pausing would
                             // skip ahead a sentence a second later.
                             if (LOOMA.speak.rvState && LOOMA.speak.rvState.paused) return;
                             advanced = true;
                             stopWatchdog();
                             if (rvRunId !== LOOMA.speak.runId) return;
                             // Leave RV's own callback stack before starting the
                             // next utterance; speaking from inside onend can be
                             // swallowed while RV is still tearing the last one down.
                             setTimeout(function () { speakNextRvSegment(index + 1); }, 0);
                         }
                         function startWatchdog() {
                             stopWatchdog();
                             var idleTicks = 0;
                             watchdog = setInterval(function () {
                                 if (advanced || rvRunId !== LOOMA.speak.runId) { stopWatchdog(); return; }
                                 // Hold the count still while paused, so resuming
                                 // starts from a clean slate instead of advancing
                                 // on the idle ticks the pause itself produced.
                                 if (LOOMA.speak.rvState && LOOMA.speak.rvState.paused) { idleTicks = 0; return; }
                                 var playing;
                                 try {
                                     playing = (typeof responsiveVoice.isPlaying === 'function')
                                         ? responsiveVoice.isPlaying() : true;
                                 } catch (e) { playing = true; }
                                 // Require several consecutive idle reads: RV reports
                                 // "not playing" briefly between its own internal chunks.
                                 idleTicks = playing ? 0 : (idleTicks + 1);
                                 if (idleTicks >= 4) advance();
                             }, 250);
                         }
                         // If onstart never arrives either, the utterance was lost
                         // outright — move on rather than stopping the reading.
                         var startGuard = setTimeout(function () {
                             if (!advanced && rvRunId === LOOMA.speak.runId) advance();
                         }, 5000);

                         responsiveVoice.speak(segment, segVoice, {
                             rate: segRate,
                             onstart: function () {
                                 clearTimeout(startGuard);
                                 if (rvRunId !== LOOMA.speak.runId) return;
                                 startWatchdog();
                                 if (index === 0) {
                                     try {
                                         if (window.LOOMA && LOOMA.otel && LOOMA.otel.emitSpan) {
                                             LOOMA.otel.emitSpan('tts.responsivevoice', rvT0, Date.now(), 1, rvSpanAttrs);
                                         }
                                     } catch (e) {}
                                     try {
                                         if (window.LOOMA && LOOMA.telemetry && LOOMA.telemetry.track) {
                                             LOOMA.telemetry.track('tts_speak',
                                                 Object.assign({ tts_status: 'ok' }, rvEventBase));
                                         }
                                     } catch (e) {}
                                 }
                                 LOOMA.speak.activate();
                                 LOOMA.speak.buttonActive = true;
                                 LOOMA.speak.applyBusyButtonState();
                                 LOOMA.speak.updateButtonAvailability();
                                 LOOMA.speak.highlightBlock(segment);
                             },
                             onerror: function (ev) {
                                 clearTimeout(startGuard);
                                 advanced = true;   // an errored segment must not be retried by the watchdog
                                 stopWatchdog();
                                 if (rvRunId !== LOOMA.speak.runId) return;
                                 var msg = String((ev && (ev.error || ev.message)) || 'responsivevoice error');
                                 try {
                                     if (window.LOOMA && LOOMA.otel && LOOMA.otel.emitSpan) {
                                         LOOMA.otel.emitSpan('tts.responsivevoice', rvT0, Date.now(), 1,
                                             Object.assign({ 'error.message': msg }, rvSpanAttrs),
                                             { statusCode: 2 });
                                     }
                                 } catch (e) {}
                                 try {
                                     if (window.LOOMA && LOOMA.telemetry && LOOMA.telemetry.track) {
                                         LOOMA.telemetry.track('tts_speak',
                                             Object.assign({ tts_status: 'error', tts_error: msg }, rvEventBase));
                                     }
                                 } catch (e) {}
                                 LOOMA.speak.rvState = null;
                                 LOOMA.speak.clearBlockHighlight();
                                 LOOMA.speak.disable();
                             },
                             onend: function () {
                                 clearTimeout(startGuard);
                                 advance();
                             }
                         });
                     }

                     responsiveVoice.cancel();
                     if (rvSegments.length === 0) {
                         // Nothing to say: drop the run state again, or the button
                         // guard would offer to pause a reading that never started.
                         LOOMA.speak.rvState = null;
                         LOOMA.speak.currentSourceKey = null;
                         LOOMA.speak.currentSourceText = null;
                         LOOMA.speak.currentSourceSnapshot = null;
                         LOOMA.speak.disable();
                     } else {
                         speakNextRvSegment(0);
                     }
                 }
             }
             });
         }

         else { // default path is Flask/Piper
             // Re-fetch when the voice or the speed changes, not just when the text does.
             var textKey = LOOMA.speak.normalizeSpeakKey(text);
             var requestKey = [engine || 'piper', voiceEn + '~' + voiceNp, rate || '', textKey].join('|');
             var activeKey = LOOMA.speak.currentSourceKey || '';

             if (LOOMA.speak.playingAudio != null) {
                 if (requestKey && activeKey === requestKey) {
                     if (LOOMA.speak.playingAudio.paused) {
                         // Same text + paused audio means resume instead of starting a new fetch.
                         LOOMA.speak.playingAudio.play().then(function () {
                             // Highlight starts when audio playback actually starts, not when the request is sent.
                         LOOMA.speak.activate();
                         }).catch(function (error) {
                             console.log('Browser playback resume error: ', error);
                         });
                     } else {
                         LOOMA.speak.playingAudio.pause();
                         LOOMA.speak.disable();
                     }
                     return;
                 }
                 console.log("Stopping Audio");
                 LOOMA.speak.cleanup();
             } else if (LOOMA.speak.buttonPending) {
                 if (requestKey && activeKey === requestKey) return;
                 LOOMA.speak.cleanup();
             }

             {  //else start the new speech
                 var currentRunId = ++LOOMA.speak.runId;
                 // Keep the exact selection context that started this reading so highlight/replay can reuse it later.
                 var activeSnapshot = replaySnapshot || LOOMA.speak.captureSelectionSnapshot();
                 LOOMA.speak.selectionSnapshot = LOOMA.speakCloneSnapshot(activeSnapshot);
                 LOOMA.speak.highlightContext = LOOMA.speak.buildHighlightContext();
                 LOOMA.speak.currentSourceKey = requestKey;
                 LOOMA.speak.currentSourceText = text;
                 LOOMA.speak.currentSourceSnapshot = LOOMA.speakCloneSnapshot(activeSnapshot);
                 //console("Playing Audio: " + text);

                 var playbackSegments = splitIntoPlaybackSegments(text);
                 console.log("Speaking " + playbackSegments.length + " segments.");

                 if (playbackSegments.length === 0) return;

                 // `synthesis`/`speechsynthesis` uses the browser's Web Speech API.
                 // This keeps the same public LOOMA.speak() signature used across Looma.
                 // Note: because this runs on the client device, it does not generate server-side
                 // traces; it is intended for local/offline speech on supported browsers.
                 if (engine === 'synthesis' || engine === 'speechsynthesis') {
                     if (!('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') {
                         console.warn('speechSynthesis is not available in this browser.');
                         return;
                     }

                     var synthesisSegments = playbackSegments.slice(0);
                     window.speechSynthesis.cancel();

                     function speakNextSynthesisSegment() {
                         if (currentRunId !== LOOMA.speak.runId) return;
                         var segment = synthesisSegments.shift();
                         if (!segment) {
                             finishBrowserPlayback(null);
                             return;
                         }

                         var utterance = new SpeechSynthesisUtterance(segment);
                         utterance.rate = rateForLang(detectSegmentLanguage(segment));
                         utterance.lang = detectSegmentLanguage(segment) === 'ne' ? 'ne-NP' : 'en-US';
                         utterance.onstart = function () {
                             if (currentRunId !== LOOMA.speak.runId) return;
                             LOOMA.speak.activate();
                             LOOMA.speak.buttonActive = true;
                             LOOMA.speak.applyBusyButtonState();
                             LOOMA.speak.updateButtonAvailability();
                             LOOMA.speak.highlightBlock(segment);
                         };
                         utterance.onend = function () {
                             if (currentRunId !== LOOMA.speak.runId) return;
                             speakNextSynthesisSegment();
                         };
                         utterance.onerror = function (evt) {
                             console.warn('speechSynthesis error', evt);
                             if (currentRunId !== LOOMA.speak.runId) return;
                             finishBrowserPlayback(null);
                         };

                         // Choose a best-effort voice matching the utterance language.
                         try {
                             var voices = window.speechSynthesis.getVoices();
                             var preferred = voices.find(function (v) {
                                 return utterance.lang === 'ne-NP' ? /^ne[-_]/i.test(v.lang) : /^en[-_]/i.test(v.lang);
                             });
                             if (preferred) utterance.voice = preferred;
                         } catch (e) {}

                         window.speechSynthesis.speak(utterance);
                     }

                     // Voices may load asynchronously in some browsers.
                     if (window.speechSynthesis.getVoices().length === 0) {
                         window.speechSynthesis.onvoiceschanged = function () {
                             window.speechSynthesis.onvoiceschanged = null;
                             speakNextSynthesisSegment();
                         };
                         setTimeout(speakNextSynthesisSegment, 500);
                     } else {
                         speakNextSynthesisSegment();
                     }
                     return;
                 }

                 // Always call the Looma PHP endpoint, which proxies Piper (Flask).
                 // Calling http://127.0.0.1:5002/tts from the browser would hit the *client* machine, not the server/container.
                 var ttsEndpoint = 'looma-TTS.php';

                 // Mixed English/Nepali content is routed sentence-by-sentence to
                 // the right Piper worker. See LOOMA.speak.detectLanguage().
                 function detectSegmentLanguage(segment) {
                     return LOOMA.speak.detectLanguage(segment);
                 }

                 function finishBrowserPlayback(audio) {
                     // Save the just-finished selection context so replay can restore audio + highlight later.
                     if (audio && audio.loomaObjectUrl) {
                         URL.revokeObjectURL(audio.loomaObjectUrl);
                     }
                     if (currentRunId !== LOOMA.speak.runId) return;
                     LOOMA.speak.playingAudio = null;
                     LOOMA.speak.lastCompletedText = LOOMA.speak.currentSourceText || text;
                     LOOMA.speak.lastCompletedSnapshot = LOOMA.speakCloneSnapshot(LOOMA.speak.currentSourceSnapshot);
                     LOOMA.speak.currentSourceKey = null;
                     LOOMA.speak.currentSourceText = null;
                     LOOMA.speak.currentSourceSnapshot = null;
                     LOOMA.speak.clearBlockHighlight();
                     LOOMA.speak.disable();
                     console.log("Done with all phrases.");
                 }

                 function fetchSegmentAudio(segmentText) {
                     // Each segment is fetched independently so the first phrase can start while later ones are still loading.
                     var piperParams = {
                         text: segmentText,
                         engine: 'piper',
                         lang: detectSegmentLanguage(segmentText),
                         rate: rateForLang(detectSegmentLanguage(segmentText))
                     };
                     // A specific Piper voice (picked on the Reading Settings page)
                     // overrides the server's language-based default. Each segment uses
                     // the voice for its detected language; when omitted, the Piper
                     // server auto-selects the voice from the detected language.
                     var segVoice = (piperParams.lang === 'ne') ? voiceNp : voiceEn;
                     if (segVoice) piperParams.voice = segVoice;
                     var request = fetch(ttsEndpoint + '?' + $.param(piperParams));

                     return request.then(function (response) {
                         if (!response.ok) throw new Error('Browser TTS request failed: ' + response.status);
                         return response.blob();
                     }).then(function (audioBlob) {
                         var audioUrl = URL.createObjectURL(audioBlob);
                         if (!LOOMA.speak.blockObjectUrls) LOOMA.speak.blockObjectUrls = [];
                         LOOMA.speak.blockObjectUrls.push(audioUrl);
                         if (currentRunId !== LOOMA.speak.runId) {
                             URL.revokeObjectURL(audioUrl);
                             throw new Error('Stale TTS segment');
                         }
                         return {
                             blockText: segmentText,
                             objectUrl: audioUrl
                         };
                     });
                 }

                 function playPreparedBlock(preparedBlock, blockIndex) {
                     if (currentRunId !== LOOMA.speak.runId) {
                         if (preparedBlock && preparedBlock.objectUrl) URL.revokeObjectURL(preparedBlock.objectUrl);
                         return;
                     }

                     var audio = new Audio(preparedBlock.objectUrl);
                     audio.loomaObjectUrl = preparedBlock.objectUrl;
                     LOOMA.speak.playingAudio = audio;

                     audio.addEventListener('play', function () {
                         if (currentRunId !== LOOMA.speak.runId) return;
                         LOOMA.speak.activate();
                         LOOMA.speak.buttonActive = true;
                         LOOMA.speak.applyBusyButtonState();
                         LOOMA.speak.updateButtonAvailability();
                         LOOMA.speak.highlightBlock(preparedBlock.blockText);
                     }, {once: true});

                     audio.addEventListener('ended', function () {
                         if (audio.loomaObjectUrl) {
                             URL.revokeObjectURL(audio.loomaObjectUrl);
                             LOOMA.speak.blockObjectUrls = (LOOMA.speak.blockObjectUrls || []).filter(function (url) {
                                 return url !== audio.loomaObjectUrl;
                             });
                             audio.loomaObjectUrl = null;
                         }

                         // Chain the next segment only after this one ends to keep playback ordered.
                         var nextIndex = blockIndex + 1;
                         if (currentRunId !== LOOMA.speak.runId) return;

                         if (nextIndex >= playbackSegments.length) {
                             finishBrowserPlayback(audio);
                             return;
                         }

                         blockPromises[nextIndex].then(function (nextPreparedBlock) {
                             if (currentRunId !== LOOMA.speak.runId) return;
                             /* The press landed in the gap: this sentence was still
                              * being synthesized when the user asked for a pause, so
                              * hold it at the door rather than starting it. The next
                              * press calls resumeReading() and the passage carries on
                              * from here — which is what a paused reading has to do
                              * for the button to be allowed to show "resume". */
                             if (LOOMA.speak.gapPaused) {
                                 LOOMA.speak.resumeReading = function () {
                                     if (currentRunId !== LOOMA.speak.runId) return;
                                     LOOMA.speak.gapPaused = false;
                                     LOOMA.speak.resumeReading = null;
                                     playPreparedBlock(nextPreparedBlock, nextIndex);
                                 };
                                 // Waiting on the user now, not on Piper: no spinner.
                                 LOOMA.speak.buttonPending = false;
                                 LOOMA.speak.clearPendingButtonState();
                                 LOOMA.speak.updateButtonAvailability();
                                 return;
                             }
                             playPreparedBlock(nextPreparedBlock, nextIndex);
                         }).catch(function (error) {
                             console.log('Browser playback error: ', error);
                             // The sentence that was being held never arrived, so
                             // there is nothing left to resume — drop the hold or
                             // the button would keep offering a resume that only
                             // ever restarts the passage.
                             LOOMA.speak.gapPaused = false;
                             LOOMA.speak.resumeReading = null;
                             LOOMA.speak.playingAudio = null;
                             LOOMA.speak.disable();
                         });
                     }, {once: true});

                     audio.addEventListener('error', function () {
                         if (audio.loomaObjectUrl) {
                             URL.revokeObjectURL(audio.loomaObjectUrl);
                             LOOMA.speak.blockObjectUrls = (LOOMA.speak.blockObjectUrls || []).filter(function (url) {
                                 return url !== audio.loomaObjectUrl;
                             });
                             audio.loomaObjectUrl = null;
                         }
                         if (currentRunId !== LOOMA.speak.runId) return;
                         LOOMA.speak.playingAudio = null;
                         LOOMA.speak.currentSourceKey = null;
                         LOOMA.speak.currentSourceText = null;
                         LOOMA.speak.currentSourceSnapshot = null;
                         LOOMA.speak.clearBlockHighlight();
                         LOOMA.speak.disable();
                     }, {once: true});

                     return audio.play();
                 }

                 // Segments are fetched strictly in order through the single
                 // shared Piper worker. The first sentence therefore reaches
                 // Piper with zero lock contention — the fastest possible start —
                 // and the rest synthesize behind it while it is already playing.
                 var blockPromises = [];
                 var fetchChain = fetchSegmentAudio(playbackSegments[0]);
                 blockPromises.push(fetchChain);
                 for (var segIndex = 1; segIndex < playbackSegments.length; segIndex++) {
                     (function (segmentText) {
                         // Run the next segment whether the previous fetch resolved
                         // or failed, so one bad segment never stalls the queue.
                         fetchChain = fetchChain.then(
                             function () { return fetchSegmentAudio(segmentText); },
                             function () { return fetchSegmentAudio(segmentText); }
                         );
                         blockPromises.push(fetchChain);
                     })(playbackSegments[segIndex]);
                 }

                 // Pending is the gap between button click and the first audible playback.
                 LOOMA.speak.buttonPending = true;
                 LOOMA.speak.applyPendingButtonState();
                 LOOMA.speak.updateButtonAvailability();
                 console.log("Playing " + playbackSegments.length + " segments in browser using Piper");
                 playPromise = blockPromises[0].then(function (preparedBlock) {
                     return playPreparedBlock(preparedBlock, 0);
                 }).catch(function (error) {
                     console.log('Browser playback error: ', error);
                     LOOMA.speak.buttonPending = false;
                     LOOMA.speak.clearPendingButtonState();
                     if (LOOMA.speak.playingAudio && LOOMA.speak.playingAudio.loomaObjectUrl) {
                         URL.revokeObjectURL(LOOMA.speak.playingAudio.loomaObjectUrl);
                     }
                     LOOMA.speak.playingAudio = null;
                     LOOMA.speak.currentSourceKey = null;
                     LOOMA.speak.currentSourceText = null;
                     LOOMA.speak.currentSourceSnapshot = null;
                     LOOMA.speak.clearBlockHighlight();
                     LOOMA.speak.disable();
                 });

                 console.log('promise is ', playPromise);
             }
         }  //end of code that calls server-side Piper
     } // end if (text != "")
     LOOMA.speak.updateButtonAvailability();
 }; //end LOOMA.speak()

/* LOOMA.speak.ensureResponsiveVoice(cb)
 * ResponsiveVoice is a cloud TTS whose external script is intentionally NOT
 * loaded on page load. It is fetched on demand the first time the user presses
 * Speak with the ResponsiveVoice engine selected, so pages that never use it
 * make no call to responsivevoice.org. Subsequent presses reuse the loaded
 * engine. cb(available) is called with true once responsiveVoice.speak is ready,
 * or false if the script can't load (offline / blocked / missing key). Callers
 * that arrive while it is still downloading are queued and resolved together. */
LOOMA.speak.ensureResponsiveVoice = function (cb) {
    function ready() {
        if (!(typeof responsiveVoice !== 'undefined' && responsiveVoice &&
              typeof responsiveVoice.speak === 'function')) return false;
        return true;
    }

    // Chrome populates speechSynthesis.getVoices() asynchronously. An utterance
    // spoken while that list is still empty does play, but its onend never
    // fires — which is exactly why the FIRST reading of a session stopped after
    // one sentence while every later one was fine. So hold the first speak()
    // until the voice list exists. Browsers where the list never populates (RV
    // then serves its own cloud audio) must NOT be punished for it, so this is a
    // best-effort wait, not a requirement: see waitForVoices() below.
    function voicesReady() {
        try {
            if (typeof speechSynthesis === 'undefined' || !speechSynthesis ||
                typeof speechSynthesis.getVoices !== 'function') return true;
            var voices = speechSynthesis.getVoices();
            return !!(voices && voices.length);
        } catch (e) { return true; }
    }

    // Poll up to ~2s for the voice list, then continue regardless.
    function waitForVoices(done) {
        var tries = 0;
        (function poll() {
            if (voicesReady() || ++tries > 20) { done(); return; }
            setTimeout(poll, 100);
        })();
    }

    LOOMA.speak.rvWaiters = LOOMA.speak.rvWaiters || [];
    LOOMA.speak.rvWaiters.push(cb);
    if (LOOMA.speak.rvLoading) return;   // a load is already in flight
    LOOMA.speak.rvLoading = true;

    function settle(ok) {
        LOOMA.speak.rvLoading = false;
        var waiters = LOOMA.speak.rvWaiters || [];
        LOOMA.speak.rvWaiters = [];
        waiters.forEach(function (fn) { try { fn(ok); } catch (e) {} });
    }

    // The RV script is already loaded and only the voice list is missing —
    // don't re-inject it, just wait for the voices.
    if (ready()) { waitForVoices(function () { settle(true); }); return; }

    var src = window.LOOMA_RESPONSIVEVOICE_SRC ||
              'https://code.responsivevoice.org/responsivevoice.js?key=r2w8pU3y';
    var script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = function () {
        // ResponsiveVoice auto-initialises on the window 'load' event. When the
        // script is injected dynamically (after load), that event has already
        // fired, so init() never runs on its own and .speak() stays silent —
        // call it explicitly here. Harmless if RV already initialised.
        try {
            if (typeof responsiveVoice !== 'undefined' && responsiveVoice &&
                typeof responsiveVoice.init === 'function') {
                responsiveVoice.init();
            }
        } catch (e) {}
        // RV may need a tick to finish wiring after init; poll briefly (≈4s
        // ceiling) until responsiveVoice.speak is callable.
        var tries = 0;
        (function waitReady() {
            if (ready()) { waitForVoices(function () { settle(true); }); return; }
            if (++tries > 40) { settle(false); return; }
            setTimeout(waitReady, 100);
        })();
    };
    script.onerror = function () { settle(false); };
    document.head.appendChild(script);
};

/* ---- reading-band geometry on a converted chapter page --------------------
 *
 * A converted chapter is the scanned page as an image with a layer of
 * absolutely-positioned, transparent <span>s over it — one per line of print.
 * Both the reading band and the blue selection are sized from those spans, so
 * the two live here together and cannot drift apart.
 *
 * These are OUTSIDE the LOOMA.speak closure on purpose: the line fitter has to
 * run when a chapter loads, long before anything has been read aloud.
 */

/* How far apart the lines of THIS page actually are, in px.
 *
 * A band may never be taller than this or it reaches the line above and below.
 * The rect of a text span is its own line box and says nothing about the spacing
 * around it, so measure the page instead: take the top of every span in the text
 * layer and use the MEDIAN gap between consecutive lines. The median ignores
 * both the odd superscript sitting a couple of pixels off and the big jump
 * across a paragraph break.
 *
 * Cached on the layer and keyed by its width: these pages are responsive, so the
 * spacing only changes when the layer is re-laid out, and a width that no longer
 * matches is exactly when the cached value went stale.
 */
LOOMA.speak.lineMetricsFor = function (layer) {
    if (layer.loomaLineMetrics && layer.loomaLineMetricsWidth === layer.clientWidth) {
        return layer.loomaLineMetrics;
    }

    // Offsets from the layer's own top, NOT viewport coordinates: the page
    // scrolls, and a cached viewport position would be wrong the moment it does.
    var origin = layer.getBoundingClientRect().top;
    var tops = [];
    var heights = [];
    var spans = layer.querySelectorAll('span');
    for (var i = 0; i < spans.length; i++) {
        var box = spans[i].getBoundingClientRect();
        if (box.height > 0) { tops.push(box.top - origin); heights.push(box.height); }
    }
    tops.sort(function (a, b) { return a - b; });
    heights.sort(function (a, b) { return a - b; });

    // Several spans can sit on ONE line of print — the converter splits a line
    // wherever the font or size changes — and their tops differ by a pixel or
    // two. Cluster them, or every one of those little differences would read as
    // a line of its own and leave no room for any band at all.
    var medianHeight = heights.length ? heights[Math.floor(heights.length / 2)] : 0;
    var tolerance = Math.max(3, medianHeight * 0.5);

    var lineTops = [];      // one entry per line of print
    var gaps = [];
    for (var j = 0; j < tops.length; j++) {
        var last = lineTops.length ? lineTops[lineTops.length - 1] : null;
        if (last === null || tops[j] - last > tolerance) {
            if (last !== null) gaps.push(tops[j] - last);
            lineTops.push(tops[j]);
        }
    }
    gaps.sort(function (a, b) { return a - b; });

    layer.loomaLineMetrics = {
        tops: lineTops,
        spacing: gaps.length ? gaps[Math.floor(gaps.length / 2)] : 0
    };
    layer.loomaLineMetricsWidth = layer.clientWidth;
    return layer.loomaLineMetrics;
};

/* The tallest a band on THIS line may be, so it always keeps daylight between
 * itself and the lines around it.
 *
 * Measured against the nearest line above and below rather than the page median:
 * a page mixes loose and tight paragraphs, and the median leaves a band 0.2px
 * short of the next line inside a tight one — which reads as one solid slab.
 */
LOOMA.speak.bandLimitAt = function (layer, top) {
    var metrics = LOOMA.speak.lineMetricsFor(layer);
    var tops = metrics.tops;
    var offset = top - layer.getBoundingClientRect().top;
    if (!tops.length) return metrics.spacing ? metrics.spacing * 0.88 : 0;

    /* Snap to the line this band belongs to FIRST. The rect handed in comes from
     * a Range and starts a couple of pixels above the span's own box, so looking
     * straight for "the nearest top below" used to find the line's own top and
     * conclude the lines were 3px apart. */
    var index = 0;
    var best = Infinity;
    for (var i = 0; i < tops.length; i++) {
        var distance = Math.abs(tops[i] - offset);
        if (distance < best) { best = distance; index = i; }
    }

    var below = (index + 1 < tops.length) ? tops[index + 1] - tops[index] : Infinity;
    var above = (index > 0) ? tops[index] - tops[index - 1] : Infinity;

    var local = Math.min(below, above);
    if (!isFinite(local)) local = metrics.spacing;      // the only line on the page
    if (!(local > 0)) return 0;
    return local - Math.max(2, local * 0.12);
};

/* Group the rects of a range into ONE rect per line of print. */
LOOMA.speak.mergeRectsByLine = function (rects) {
    var arr = [];
    for (var i = 0; i < rects.length; i++) {
        var r = rects[i];
        if (r.width > 0 && r.height > 0) {
            arr.push({ left: r.left, top: r.top, right: r.right, bottom: r.bottom });
        }
    }
    arr.sort(function (a, b) { return (a.top - b.top) || (a.left - b.left); });

    var lines = [];
    arr.forEach(function (r) {
        var mid = (r.top + r.bottom) / 2;
        var tol = Math.max(4, (r.bottom - r.top) * 0.5);
        var line = null;
        for (var k = 0; k < lines.length; k++) {
            if (Math.abs((lines[k].top + lines[k].bottom) / 2 - mid) <= tol) { line = lines[k]; break; }
        }
        if (!line) {
            lines.push({ left: r.left, top: r.top, right: r.right, bottom: r.bottom });
        } else {
            line.left = Math.min(line.left, r.left);
            line.top = Math.min(line.top, r.top);
            line.right = Math.max(line.right, r.right);
            line.bottom = Math.max(line.bottom, r.bottom);
        }
    });
    return lines;
};

/* Draw the BLUE SELECTION as bands of our own, the same height as the reading
 * band.
 *
 * The browser sizes ::selection from the FONT's own ascent+descent, which on
 * these pages is taller than the gap to the next line — so selecting two
 * consecutive lines produced one solid blue slab that swallowed the lines around
 * it. That height cannot be styled (line-height does not move it, which is why
 * this is not a one-line CSS fix), so the only way to bound it is to stop the
 * browser painting the selection at all and draw it ourselves, through the very
 * same geometry the reading band uses.
 *
 * The selection itself is untouched — only its paint. Copying, the Speak button
 * and the word-definition card all still read window.getSelection() as before.
 */
LOOMA.speak.SELECTION_BAND_COLOR = 'rgba(0, 110, 255, 0.32)';   // as the pages' own ::selection was

LOOMA.speak.installSelectionBands = function (doc) {
    if (!doc || !doc.body || doc.loomaSelectionBands) return;
    if (!doc.querySelector('.tl')) return;          // not a converted chapter: leave it alone
    doc.loomaSelectionBands = true;

    var style = doc.createElement('style');
    style.textContent =
        '.tl span::selection{background:transparent}' +
        '.tl span::-moz-selection{background:transparent}' +
        '.looma-selection-band{position:absolute;pointer-events:none;z-index:2;' +
        'background:' + LOOMA.speak.SELECTION_BAND_COLOR + ';border-radius:.15em}';
    (doc.head || doc.documentElement).appendChild(style);

    var bands = [];

    function clearBands() {
        bands.forEach(function (el) { if (el.parentNode) el.parentNode.removeChild(el); });
        bands = [];
    }

    function layerOf(node) {
        var el = node && node.nodeType === 3 ? node.parentNode : node;
        while (el && el !== doc && !(el.classList && el.classList.contains('tl'))) el = el.parentElement;
        return (el && el.classList && el.classList.contains('tl')) ? el : null;
    }

    function drawBands() {
        clearBands();

        var win = doc.defaultView;
        var selection = win && win.getSelection ? win.getSelection() : null;
        if (!selection || selection.isCollapsed || !selection.rangeCount) return;

        var range = selection.getRangeAt(0);
        var layer = layerOf(range.startContainer) || layerOf(range.endContainer);
        if (!layer) return;     // selected something else on the page: browser's job

        // Bands go on the BODY, in document coordinates, so a selection running
        // across two pages is one set of bands rather than one set per layer.
        var scrollX = win.scrollX || 0;
        var scrollY = win.scrollY || 0;

        LOOMA.speak.mergeRectsByLine(range.getClientRects()).forEach(function (r) {
            var height = r.bottom - r.top;
            var limit = LOOMA.speak.bandLimitAt(layer, r.top);
            var band = limit ? Math.max(4, Math.min(height, limit)) : height;
            var div = doc.createElement('div');
            div.className = 'looma-selection-band';
            div.style.left = (r.left + scrollX) + 'px';
            div.style.top = (r.top + scrollY + (height - band) / 2) + 'px';
            div.style.width = (r.right - r.left) + 'px';
            div.style.height = band + 'px';
            doc.body.appendChild(div);
            bands.push(div);
        });
    }

    doc.addEventListener('selectionchange', drawBands);

    var redrawTimer = null;
    (doc.defaultView || window).addEventListener('resize', function () {
        clearTimeout(redrawTimer);
        redrawTimer = setTimeout(drawBands, 200);
    });
};

LOOMA.speak.getButtons = function () {
    return Array.prototype.slice.call(document.querySelectorAll('button.speak'));
};

LOOMA.speak.getButton = function () {
    return LOOMA.speak.getButtons()[0] || null;
};

LOOMA.speak.getSelectedText = function () {
    function readSelection(win) {
        if (!win || !win.getSelection) return '';
        var selection = win.getSelection();
        if (!selection || !selection.toString) return '';
        return selection.toString().trim();
    }

    var text = readSelection(window);

    ['iframe', 'epaath_iframe'].forEach(function (id) {
        if (text) return;
        var frame = document.getElementById(id);
        if (!frame || !frame.contentWindow) return;
        try {
            text = readSelection(frame.contentWindow);
        } catch (e) {
            text = text || '';
        }
    });

    // Never hand on a word with a digit wedged into it — see LOOMA.cleanSelectedText().
    return LOOMA.cleanSelectedText(text);
};

/* LOOMA.speak.normalizeSpeakKey(text)
 *
 * The one answer to "are these two strings the same passage?". Every control
 * that has to tell a PAUSE press apart from a NEW SELECTION press keys off it:
 * hasNewSelection on the Piper and ResponsiveVoice paths, justRead in
 * updateButtonAvailability, and the currentSourceKey request key.
 *
 * It compares two strings that reach it down DIFFERENT pipelines, and that is
 * why the zero-width characters go. What the page hands to LOOMA.speak() is the
 * RAW selection (looma-html.js reads the iframe selection straight out of the
 * DOM); what the button guard compares it against on the next press is
 * LOOMA.speak.getSelectedText(), which has been through cleanSelectedText().
 * That cleaner drops anything outside its readable allow-list — and U+200C ZWNJ
 * and U+200D ZWJ are outside it, because they sit just past the end of the
 * Devanagari block at U+097F.
 *
 * Devanagari uses those two joiners to write conjuncts and half-forms, so
 * Nepali text is full of them and English has none at all. The two sides came
 * out different for every Nepali selection carrying one, every press counted as
 * "the user picked something else", and pause restarted the reading from the
 * top instead of pausing it — in Nepali only, which is exactly how it was
 * reported. (The same mismatch made a finished Nepali reading show the play
 * icon rather than repeat.)
 *
 * Stripping them HERE and nowhere else is deliberate: this function only ever
 * compares and keys, so the word card still looks up the cleaned form, the
 * reading highlight keeps its character map aligned, and Piper is still asked
 * to say exactly the text the page holds. Nothing about the reading changes.
 */
LOOMA.speak.normalizeSpeakKey = function (text) {
    return (text || '')
        // ZWSP, ZWNJ, ZWJ, LRM, RLM, word joiner, BOM — invisible, and never a
        // reason to call two selections different passages.
        .replace(/[\u200B-\u200F\u2060\uFEFF]/g, '')
        .replace(/\s+/g, ' ').trim().toLowerCase();
};

/* LOOMA.speak.detectLanguage(text) -> 'ne' | 'en'
 *
 * Which of Looma's two languages a piece of text is written in — the one
 * answer every engine asks for, to pick a voice and a reading speed.
 *
 * ONE definition on purpose. There used to be several, and they disagreed:
 * Piper weighed the two scripts against each other per sentence, while
 * ResponsiveVoice asked only "is there any Devanagari in the whole passage?"
 * — so a single Nepali word anywhere made the Nepali voice read the English
 * sentences too. Mixed chapters are full of exactly that.
 *
 * (The `engine === 'synthesis'` block still carries the old whole-text test.
 * That branch is unreachable — LOOMA.speak() coerces every engine that is not
 * 'responsivevoice' to 'piper' before it — so it was left alone rather than
 * half-modernised; it wants deleting, not fixing.)
 *
 * Whichever script the text is mostly written in wins, at any length: a stray
 * danda in an English sentence loses to the Latin letters around it, and a
 * two-character Nepali word with no Latin at all is still Nepali.
 *
 * KNOWN LIMIT — one voice per sentence. A sentence written in BOTH scripts is
 * read entirely by one of them, so the other half comes out mispronounced; the
 * split above works on sentences, not words. Devanagari also writes a word in
 * fewer codepoints than Latin does, so counting characters under-counts the
 * Nepali side: "यो Looma हो।" is 5 against 5 and goes to the English voice.
 * Counting WORDS instead would call that one Nepali, at the cost of changing
 * how every other mixed sentence is routed — a content decision, not a bug fix,
 * so it is left as it is and written down here.
 */
LOOMA.speak.detectLanguage = function (text) {
    var devanagariCount = ((text || '').match(/[ऀ-ॿ]/g) || []).length;
    var latinCount = ((text || '').match(/[A-Za-z]/g) || []).length;
    return (devanagariCount > 0 && devanagariCount > latinCount) ? 'ne' : 'en';
};

LOOMA.speak.captureSelectionSnapshot = function () {
    // Capture both plain text and a DOM range so audio playback and highlighting share the same selection.
    function getSnapshot(win, frameId) {
        if (!win || !win.getSelection) return null;
        var selection = win.getSelection();
        if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return null;

        var text = selection.toString().trim();
        if (!text) return null;

        try {
            return {
                text: text,
                range: selection.getRangeAt(0).cloneRange(),
                frameId: frameId || null
            };
        } catch (e) {
            return {text: text, range: null, frameId: frameId || null};
        }
    }

    var snapshot = getSnapshot(window, null);
    if (snapshot) {
        LOOMA.speak.selectionSnapshot = snapshot;
        return snapshot;
    }

    ['iframe', 'epaath_iframe'].forEach(function (id) {
        if (snapshot) return;
        var frame = document.getElementById(id);
        if (!frame || !frame.contentWindow) return;
        try {
            snapshot = getSnapshot(frame.contentWindow, id);
        } catch (e) {
            snapshot = snapshot || null;
        }
    });

    if (snapshot) LOOMA.speak.selectionSnapshot = snapshot;
    return snapshot;
};

LOOMA.speak.refreshSelectionState = function () {
    // Button availability follows the current live selection unless playback is already in progress.
    var snapshot = LOOMA.speak.captureSelectionSnapshot();
    var selectedText = snapshot ? snapshot.text : '';
    if (selectedText) {
        LOOMA.speak.lastSelectedText = selectedText;
        LOOMA.speak.selectionActive = true;
    } else if (!LOOMA.speak.buttonActive) {
        LOOMA.speak.lastSelectedText = '';
        LOOMA.speak.selectionActive = false;
    }

};

LOOMA.speak.applyBusyButtonState = function () {
    // Busy styling stays on the original Speak button while audio is actively playing.
    LOOMA.speak.getButtons().forEach(function (button) {
        button.style.setProperty('transform', 'scale(1.2)', 'important');
        button.style.setProperty('transform-origin', 'center center', 'important');
        button.style.setProperty('opacity', '1', 'important');
        button.style.setProperty('border', '0.35em solid #ffd400', 'important');
        button.style.setProperty('outline', '0.2em solid #ffd400', 'important');
        button.style.setProperty('outline-offset', '0.08em', 'important');
        button.style.setProperty('box-shadow', '0 0 1.4em rgba(255, 212, 0, 1)', 'important');
        button.style.setProperty('pointer-events', 'auto', 'important');
        button.style.setProperty('animation', 'ttsSpeakPulse 0.9s ease-in-out infinite', 'important');
        button.style.setProperty('z-index', '2147483646', 'important');
    });
};

LOOMA.speak.clearBusyButtonState = function () {
    LOOMA.speak.getButtons().forEach(function (button) {
        ['transform', 'transform-origin', 'opacity', 'border', 'outline', 'outline-offset', 'box-shadow', 'pointer-events', 'animation', 'z-index']
            .forEach(function (property) {
                button.style.removeProperty(property);
            });
    });
};

LOOMA.speak.applyPendingButtonState = function () {
    // Pending styling shows that a click was accepted even before audio starts.
    LOOMA.speak.getButtons().forEach(function (button) {
        button.classList.add('tts-pending');
    });
    LOOMA.speak.emitStateChange();
};

LOOMA.speak.clearPendingButtonState = function () {
    LOOMA.speak.getButtons().forEach(function (button) {
        button.classList.remove('tts-pending');
    });
    LOOMA.speak.emitStateChange();
};

/* LOOMA.speak.onStateChange(cb) / emitStateChange()
 *
 * The pending/busy visuals above only ever reach `button.speak` — the floating
 * Speak control. Pages with their own Speak buttons (the Reading Settings page
 * has one per engine) got no feedback at all while waiting, which is worst
 * exactly where the wait is longest: ResponsiveVoice has to fetch its script
 * from responsivevoice.org and then wait on the cloud for audio, several seconds
 * in which nothing on screen moved. Those pages subscribe here instead of
 * reaching into LOOMA.speak's internals.
 *
 * cb({pending, busy}) — `pending` is "asked for, no audio yet" (show a spinner),
 * `busy` is "audio is sounding". Fired only when the pair actually changes.
 */
LOOMA.speak.stateListeners = [];

LOOMA.speak.onStateChange = function (cb) {
    if (typeof cb !== 'function') return;
    LOOMA.speak.stateListeners.push(cb);
    try { cb({pending: !!LOOMA.speak.buttonPending, busy: !!LOOMA.speak.buttonActive}); } catch (e) {}
};

LOOMA.speak.emitStateChange = function () {
    var state = {pending: !!LOOMA.speak.buttonPending, busy: !!LOOMA.speak.buttonActive};
    var signature = state.pending + '|' + state.busy;
    if (signature === LOOMA.speak.lastStateSignature) return;
    LOOMA.speak.lastStateSignature = signature;
    LOOMA.speak.stateListeners.forEach(function (cb) {
        try { cb(state); } catch (e) {}
    });
};

LOOMA.speak.hasSelection = function () {
    LOOMA.speak.refreshSelectionState();
    return !!LOOMA.speak.selectionActive;
};

/* LOOMA.speak.isPaused()
 *
 * Is a reading halted with somewhere to carry on from — i.e. would the next
 * press RESUME it? The three engines pause in three different ways, and the
 * button has to recognise all of them or it goes back to offering "read it
 * again" over a passage that is merely paused:
 *
 *   Piper / browser audio — a real <audio> element, paused and not finished
 *   between two sentences — no element to pause, so the CHAIN is held instead
 *   ResponsiveVoice       — its own flag; RV plays inside its script and owns
 *                           no media element for us to look at
 *
 * An ENDED clip also reports paused === true, which is why `ended` is excluded:
 * that one is the gap, and gapPaused is what says whether the gap is a pause.
 */
LOOMA.speak.isPaused = function () {
    if (LOOMA.speak.gapPaused) return true;
    if (LOOMA.speak.rvState && LOOMA.speak.rvState.paused) return true;
    var audio = LOOMA.speak.playingAudio;
    return !!(audio && audio.paused && !audio.ended);
};

LOOMA.speak.updateButtonAvailability = function () {
    // The button stays usable for live selection, paused audio and replay of the last completed reading.
    var isBusy = !!LOOMA.speak.buttonActive;
    var isPending = !!LOOMA.speak.buttonPending;
    var selectable = LOOMA.speak.hasSelection() || !!LOOMA.speak.currentSourceText || !!LOOMA.speak.lastCompletedText;

    /* Which icon the button shows — it should say what pressing it will do:
     *   pause   reading right now
     *   play    text is selected, or a reading is paused and can resume
     *   repeat  the last reading finished and can be played again
     *   idle    nothing selected and nothing read yet
     * Selecting new text always wins over "repeat", so picking a fresh sentence
     * after one finished puts the button back on play. While a segment is still
     * being fetched the icon stays on play and the spinner (.tts-pending) shows
     * the wait — the audio is not sounding yet, so pause would be a lie. */
    // A finished reading usually leaves its text STILL SELECTED, so "is something
    // selected?" alone would show play again the moment it ends. Compare the
    // selection with what was just read: the same text means "repeat", different
    // text means the user picked something new and it is a fresh play.
    var justRead = '';
    try {
        var selectedNow = LOOMA.speak.getSelectedText ? LOOMA.speak.getSelectedText() : '';
        if (selectedNow && LOOMA.speak.lastCompletedText &&
            LOOMA.speak.normalizeSpeakKey(selectedNow) ===
            LOOMA.speak.normalizeSpeakKey(LOOMA.speak.lastCompletedText)) {
            justRead = selectedNow;
        }
    } catch (e) { justRead = ''; }

    // PAUSED beats every "repeat" test below it. A passage that is only halted
    // has somewhere to carry on from, so the button must offer to resume it —
    // and the two tests would otherwise disagree, because pausing leaves the
    // text SELECTED and a reading of text that was read once before matches
    // lastCompletedText exactly. That is what turned the pause button into the
    // circular "start again" arrow the moment a teacher paused a repeat.
    var iconState = 'idle';
    if (isBusy) iconState = 'pause';
    else if (LOOMA.speak.isPaused()) iconState = 'play';
    else if (justRead) iconState = 'repeat';
    else if (LOOMA.speak.hasSelection() || LOOMA.speak.currentSourceText) iconState = 'play';
    else if (LOOMA.speak.lastCompletedText) iconState = 'repeat';

    LOOMA.speak.getButtons().forEach(function (speechButton) {
        var $button = $(speechButton);
        $button.toggleClass('tts-busy', isBusy);
        $button.toggleClass('tts-pending', isPending && !isBusy);
        $button.toggleClass('tts-state-play', iconState === 'play');
        $button.toggleClass('tts-state-pause', iconState === 'pause');
        $button.toggleClass('tts-state-repeat', iconState === 'repeat');

        if (isBusy) {
            speechButton.disabled = false;
            $button.removeClass('tts-disabled');
            speechButton.setAttribute('aria-disabled', 'false');
            return;
        }

        if (isPending) {
            speechButton.disabled = false;
            $button.removeClass('tts-disabled');
            speechButton.setAttribute('aria-disabled', 'false');
            return;
        }

        speechButton.disabled = !selectable;
        speechButton.setAttribute('aria-disabled', selectable ? 'false' : 'true');
        $button.toggleClass('tts-disabled', !selectable);
    });

    LOOMA.speak.emitStateChange();
};

LOOMA.speak.installSelectionWatcher = function () {
    if (LOOMA.speak.selectionWatcherBound) return;
    LOOMA.speak.selectionWatcherBound = true;

    ['selectionchange', 'mouseup', 'keyup'].forEach(function (eventName) {
        document.addEventListener(eventName, function () {
            LOOMA.speak.refreshSelectionState();
            LOOMA.speak.updateButtonAvailability();
        });
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            LOOMA.speak.updateButtonAvailability();
            LOOMA.speak.installSelectionMirrors();
            LOOMA.speak.installButtonGuard();
        });
    } else {
        LOOMA.speak.updateButtonAvailability();
        LOOMA.speak.installSelectionMirrors();
        LOOMA.speak.installButtonGuard();
    }
};

LOOMA.speak.installSelectionMirrors = function () {
    if (LOOMA.speak.selectionMirrorsInstalled) return;
    LOOMA.speak.selectionMirrorsInstalled = true;

    ['iframe', 'epaath_iframe'].forEach(function (id) {
        var frame = document.getElementById(id);
        if (!frame) return;

        function bindFrameSelection() {
            try {
                var doc = frame.contentDocument;
                if (!doc || doc._loomaSpeakWatchBound) return;
                doc._loomaSpeakWatchBound = true;

                // Mirror iframe selections back to the main page so the shared Speak button updates correctly.
                ['selectionchange', 'mouseup', 'keyup'].forEach(function (eventName) {
                    doc.addEventListener(eventName, function () {
                        LOOMA.speak.refreshSelectionState();
                        LOOMA.speak.updateButtonAvailability();
                    });
                });
            } catch (e) {}
        }

        frame.addEventListener('load', bindFrameSelection);
        bindFrameSelection();
    });
};

/* LOOMA.speak.restart()
 *
 * Start the CURRENT reading again from its first sentence. Used by the
 * press-and-hold gesture on the Speak button (see installButtonGuard below).
 *
 * cleanup() drops currentSourceText/Snapshot, so the text and its highlight
 * context are captured first and then handed back through lastCompleted* —
 * the same pair the "repeat" press already replays, which is why calling
 * LOOMA.speak() with no argument here reads the very same text with the very
 * same highlighting instead of whatever happens to be selected now.
 */
LOOMA.speak.restart = function () {
    var text = LOOMA.speak.currentSourceText || LOOMA.speak.lastCompletedText || '';
    var snapshot = LOOMA.speakCloneSnapshot(
        LOOMA.speak.currentSourceSnapshot || LOOMA.speak.lastCompletedSnapshot);

    LOOMA.speak.cleanup();

    if (text) {
        LOOMA.speak.lastCompletedText = text;
        LOOMA.speak.lastCompletedSnapshot = snapshot;
        LOOMA.speak();
        return true;
    }

    // Nothing has been read yet: hold acts on the live selection, if any, so the
    // gesture never feels dead. mousedown/pointerdown preventDefault keeps that
    // selection alive through the whole press.
    if (LOOMA.speak.hasSelection && LOOMA.speak.hasSelection()) {
        LOOMA.speak();
        return true;
    }
    return false;
};

LOOMA.speak.installButtonGuard = function () {
    // Global guard gives Speak one consistent meaning before page-specific handlers run.
    if (LOOMA.speak.buttonGuardInstalled) return;
    LOOMA.speak.buttonGuardInstalled = true;

    function findSpeakButton(target) {
        // Some clicks land on nested text nodes/icons inside the button, so walk up to the real button element.
        var node = target && target.nodeType === 3 ? target.parentNode : target;
        while (node && node !== document) {
            if (node.matches && node.matches('button.speak')) return node;
            node = node.parentNode;
        }
        return null;
    }

    /* ---- press and hold to restart -------------------------------------
     *
     * A short press keeps every meaning it always had (play / pause / repeat).
     * HOLDING the button for two and a half seconds restarts the reading from the top.
     *
     * While the button is held it shows the STOP glyph and the same ring the
     * button already draws while it waits for audio — except this one is not a
     * spinner: it fills up over those 2.5 seconds, so the countdown is visible
     * and letting go early is an obvious way out. The fill is driven by the
     * --tts-hold custom property (0 → 1) on the button, updated per frame.
     */
    var HOLD_RESTART_MS = 2500;
    var HOLD_TICK_MS = 60;             // ~16 fps: smooth enough for a 2.5s sweep
    var holdButton = null;
    var holdStartedAt = 0;
    var holdTimer = null;

    function paintHold(progress) {
        if (!holdButton) return;
        holdButton.style.setProperty('--tts-hold', Math.max(0, Math.min(1, progress)));
    }

    function endHold() {
        if (holdTimer) { clearInterval(holdTimer); holdTimer = null; }
        if (holdButton) {
            holdButton.classList.remove('tts-holding');
            holdButton.style.removeProperty('--tts-hold');
        }
        holdButton = null;
        holdStartedAt = 0;
    }

    /* A plain interval, not requestAnimationFrame: rAF is tied to painting and
       stops being served whenever the page is not being composited, which would
       freeze the countdown mid-press and never restart anything. Elapsed time is
       read from the clock each tick, so a throttled interval still completes at
       the right moment instead of counting ticks. */
    function tickHold() {
        if (!holdButton) return;
        var elapsed = Date.now() - holdStartedAt;
        paintHold(elapsed / HOLD_RESTART_MS);

        if (elapsed >= HOLD_RESTART_MS) {
            endHold();
            // Swallow the click that the release is about to fire, so the
            // restart is not immediately followed by a pause/replay press.
            LOOMA.speak.holdRestartFired = true;
            try { LOOMA.speak.restart(); } catch (e) { console.log('TTS restart failed: ', e); }
        }
    }

    function beginHold(event) {
        var button = findSpeakButton(event.target);
        // Only a primary press starts a hold; a disabled button has nothing to restart.
        if (!button || button.disabled || (event.button !== undefined && event.button !== 0)) return;
        if (holdButton === button) return;   // touch + mouse can both fire for one press

        endHold();
        holdButton = button;
        holdStartedAt = Date.now();
        button.classList.add('tts-holding');
        paintHold(0);
        holdTimer = setInterval(tickHold, HOLD_TICK_MS);
    }

    function endHoldFromEvent(event) {
        if (!holdButton) return;
        // A release anywhere ends the hold, but a "left the element" event only
        // counts when it is the held button itself being left — those fire for
        // any element the pointer leaves and would otherwise cancel at once.
        var type = event && event.type;
        if ((type === 'pointerleave' || type === 'mouseleave') && event.target !== holdButton) return;
        endHold();
    }

    ['pointerdown', 'touchstart'].forEach(function (name) {
        document.addEventListener(name, beginHold, true);
    });
    ['pointerup', 'pointercancel', 'pointerleave', 'touchend', 'touchcancel', 'mouseup', 'mouseleave']
        .forEach(function (name) {
            document.addEventListener(name, endHoldFromEvent, true);
        });
    window.addEventListener('blur', endHold);

    // A long press on a touch screen (and a right-click) would otherwise raise
    // the context menu on top of the gesture.
    document.addEventListener('contextmenu', function (event) {
        if (findSpeakButton(event.target)) event.preventDefault();
    });

    document.addEventListener('click', function (event) {
        var button = findSpeakButton(event.target);
        if (!button) return;

        // The press that just restarted the reading ends in a click — drop it
        // here, in the capture phase, before any page handler sees it.
        if (LOOMA.speak.holdRestartFired) {
            LOOMA.speak.holdRestartFired = false;
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            return false;
        }

        /* ResponsiveVoice plays inside its own script and never sets
           playingAudio, so the branch below could not see an RV reading at all:
           every press fell through to a fresh LOOMA.speak(), which is why pause
           did nothing with RV selected. Handle it on its own terms first — RV
           exposes pause()/resume(), a real pause rather than the
           cancel-and-forget the engine used to do. */
        var rvState = LOOMA.speak.rvState;
        if (rvState && rvState.runId === LOOMA.speak.runId && typeof responsiveVoice !== 'undefined') {
            var rvSelected = (LOOMA.speak.getSelectedText ? LOOMA.speak.getSelectedText() : '');
            var rvSelectedKey = LOOMA.speak.normalizeSpeakKey
                ? LOOMA.speak.normalizeSpeakKey(rvSelected) : (rvSelected || '').toLowerCase();
            var rvCurrent = LOOMA.speak.currentSourceText || '';
            var rvCurrentKey = LOOMA.speak.normalizeSpeakKey
                ? LOOMA.speak.normalizeSpeakKey(rvCurrent) : rvCurrent.toLowerCase();

            // Picking new text mid-reading starts that text, exactly as it does
            // for Piper — only a press with the SAME (or no) selection pauses.
            if (rvSelectedKey && rvCurrentKey && rvSelectedKey !== rvCurrentKey) {
                LOOMA.speak.cleanup();
                return;
            }

            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();

            var rvCanPause = typeof responsiveVoice.pause === 'function' &&
                             typeof responsiveVoice.resume === 'function';
            if (!rvCanPause) {
                // An RV build without pause/resume: stopping is the honest
                // fallback, and lastCompleted* still lets the next press repeat.
                try { responsiveVoice.cancel(); } catch (e) {}
                LOOMA.speak.rvState = null;
                LOOMA.speak.lastCompletedText = rvCurrent;
                LOOMA.speak.lastCompletedSnapshot =
                    LOOMA.speakCloneSnapshot(LOOMA.speak.currentSourceSnapshot);
                LOOMA.speak.disable();
                return false;
            }

            if (rvState.paused) {
                rvState.paused = false;
                try { responsiveVoice.resume(); } catch (e) {}
                LOOMA.speak.activate();
            } else {
                rvState.paused = true;
                try { responsiveVoice.pause(); } catch (e) {}
                LOOMA.speak.disable();
            }
            return false;
        }

        // Nothing is playing YET: the press landed while Piper is still synthesizing
        // the first sentence. The block below only handles a live audio element, so
        // this fell through to a fresh LOOMA.speak() — which sees the same request
        // already pending and returns, leaving the press with no effect at all.
        // On a slow board that window is seconds long (and longer in Nepali, whose
        // voice is a `medium` model), so this is most of what a teacher presses.
        // A press while pending means "I changed my mind": cancel the fetch.
        if (!LOOMA.speak.playingAudio && LOOMA.speak.buttonPending) {
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            LOOMA.speak.stopReading();
            return false;
        }

        if (LOOMA.speak.playingAudio) {
            var selectedText = (LOOMA.speak.getSelectedText ? LOOMA.speak.getSelectedText() : '');
            var selectedKey = LOOMA.speak.normalizeSpeakKey ? LOOMA.speak.normalizeSpeakKey(selectedText) : (selectedText || '').toLowerCase();
            // Compare TEXT with TEXT. This used to test the selection against
            // currentSourceKey, which is not a text at all but the composite
            // request key ("piper|voices|rate|text") — so the two could never be
            // equal, every press while reading counted as "new selection", and
            // the pause button restarted the reading from the top instead of
            // pausing it. The mousedown handler below deliberately keeps the
            // selection alive, so this fired on every single press.
            var currentText = LOOMA.speak.currentSourceText || '';
            var currentTextKey = LOOMA.speak.normalizeSpeakKey ? LOOMA.speak.normalizeSpeakKey(currentText) : currentText.toLowerCase();
            var hasNewSelection = !!selectedKey && !!currentTextKey && selectedKey !== currentTextKey;

            if (hasNewSelection) {
                LOOMA.speak.cleanup();
                return;
            }

            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();

            /* Between two clips the finished one is still the "current" audio
             * while the next is being fetched, and an ENDED clip reports
             * paused === true. Calling play() on it would replay the sentence
             * just read while the next one starts too — two voices at once.
             *
             * So pause the CHAIN instead of the element: the sentence in flight
             * is held (see the `ended` handler in playPreparedBlock) and the next
             * press carries on from there. This used to call stopReading(), which
             * ended the whole passage — a press that looked like pause acted like
             * stop, and the button turned into "start again" instead of "resume".
             * On this board that is most of what a teacher presses: each sentence
             * takes seconds to synthesize, and longer in Nepali — noticeably so
             * even on the default ne_NP-google-x_low voice, and more again for
             * anyone who picks ne_NP-google-medium on the Reading Settings page. */
            if (LOOMA.speak.playingAudio.ended) {
                if (LOOMA.speak.gapPaused) {
                    // Resume. If the held sentence has already arrived, start it;
                    // if Piper is still working on it, just lift the hold — the
                    // fetch's own handler plays it the moment it resolves, and the
                    // spinner goes back on to show the wait is Piper's again.
                    var resume = LOOMA.speak.resumeReading;
                    LOOMA.speak.gapPaused = false;
                    LOOMA.speak.resumeReading = null;
                    if (resume) {
                        resume();
                    } else {
                        LOOMA.speak.buttonPending = true;
                        LOOMA.speak.applyPendingButtonState();
                        LOOMA.speak.updateButtonAvailability();
                    }
                    return false;
                }
                LOOMA.speak.gapPaused = true;
                LOOMA.speak.disable();
                return false;
            }

            if (LOOMA.speak.playingAudio.paused) {
                LOOMA.speak.playingAudio.play().then(function () {
                    LOOMA.speak.activate();
                }).catch(function (error) {
                    console.log('Browser playback resume error: ', error);
                });
            } else {
                try {
                    LOOMA.speak.playingAudio.pause();
                } catch (e) {}
                LOOMA.speak.disable();
            }
            return false;
        }
    }, true);

    $(document).on('mousedown', 'button.speak', function (event) {
        // Prevent the click from clearing the browser selection before we capture it for TTS/highlight.
        event.preventDefault();
        // If ResponsiveVoice is the chosen reading engine, kick off its lazy load
        // + init NOW, on this user gesture (mousedown), so it is ready and audio
        // is unlocked by the time the click fires LOOMA.speak(). Without this the
        // first press would race the async download and Chrome's autoplay policy
        // and stay silent. No-op (and no network call) for any other engine.
        try {
            // Mirrors LOOMA.speak()'s own engine resolution (saved cookie, else
            // Piper) so the preload kicks in only when the click would actually
            // end up using ResponsiveVoice — i.e. when the teacher explicitly
            // selected it. With no saved preference nothing is preloaded and no
            // request to responsivevoice.org is made at all.
            var _rvWillRun = LOOMA.readStore('tts-engine', 'cookie') || 'piper';
            if (_rvWillRun === 'responsivevoice') {
                LOOMA.speak.ensureResponsiveVoice(function () {});
            }
        } catch (e) {}
    });

    $(document).on('click', 'button.speak', function (event) {
        LOOMA.speak.refreshSelectionState();

        if (this.disabled || (!LOOMA.speak.buttonActive && !LOOMA.speak.selectionActive && !LOOMA.speak.currentSourceText && !LOOMA.speak.lastCompletedText)) {
            event.preventDefault();
            event.stopImmediatePropagation();
            return false;
        }
    });
};

LOOMA.speak.installSelectionWatcher();



 LOOMA.toggleFullscreen = function() {
     var fs =      document.getElementById('video-fullscreen');
     if (!fs) fs = document.getElementById('fullscreen');

     if (document.fullscreenElement || document.webkitFullscreenElement || document.mozFullscreenElement || document.msFullscreenElement) {
        leaveFS(fs);
    } else {
        enterFS(fs);
    }
 }; //end toggleFullscreen()

 /*
//toggle fullscreen display of the element with id="fullscreen"
LOOMA.toggleFullscreen = function() {
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.webkitExitFullscreen) { //chrome, safare
        document.webkitExitFullscreen();
    } else if (document.mozExitFullScreen) { // firefox
        document.mozExitFullScreen();
    } else if (document.msExitFullScreen) { // IE/Edge
        document.msExitFullScreen();
    }
    //if (window.fullScreen) document.exitFullscreen();
    else
    {
        var fs =      document.getElementById('video-fullscreen');
        if (!fs) fs = document.getElementById('fullscreen');
       // if (document.fullscreenElement || document.webkitFullscreenElement || document.mozFullscreenElement || document.msFullscreenElement)
       //    leaveFS(fs);
     //  else
        //fs.requestFullscreen();
            enterFS(fs);
    }
}; //end LOOMA.toggelFullscreen()
*/

 function enterFS(elem) {
            if (elem.requestFullscreen) {
                elem.requestFullscreen();
     } else if (elem.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
                elem.webkitRequestFullscreen();
     } else if (elem.mozRequestFullScreen) { /* Firefox */
                elem.mozRequestFullScreen();
     } else if (elem.msRequestFullscreen) { /* IE/Edge */
                elem.msRequestFullscreen();
     }
 }
 function leaveFS(elem) {
            if (document.exitFullscreen) {
                document.exitFullscreen();
     } else if (document.webkitExitFullscreen) { /* Chrome, Safari and Opera */
                document.webkitExitFullscreen();
     } else if (document.mozExitFullScreen) { /* Firefox */
                document.mozExitFullScreen();
     } else if (document.msExitFullScreen) { /* IE/Edge */
                document.msExitFullScreen();
     }
 }

/*
 from looma-alerts.js in the slideshow team code
 Description: Creates a styled translatable popup interface.
 NOTES: All methods support prompts/alerts in either text or html. If using either, any text can be converted into
 Looma's translatable spans using the provided LOOMA.translatableSpans().

 Programmer name: Thomas Woodside, Charlie Donnelly, and Sam Rosenberg
 Owner: VillageTech Solutions (villagetechsolutions.org)
 Date: 7/5/16
 Revision: 0.4

 * Makes the entire screen minus modal transparent and checks for clicks outside the modal
 */
LOOMA.makeTransparent = function($container) {
    if (!$container) $container  = $('body > div');
    $container.addClass('all-transparent');

    //NOTE: add .off('click', xxxx) to turn off click response outside the popup
    $container.css('pointerEvents','none');
//$container.off('click');

    //also set ESC key to cancel the popup
    $(document).keydown(function (e) {
        const ESC = 27;  // escape key maps to keycode `27`
        if    (e.keyCode == ESC) LOOMA.closePopup() ;
    });//end ESC listener

};  // End of makeTransparent

 // undo makeTransparent()
 LOOMA.makeOpaque = function($container) {
     if (!$container) $container = $('body > div');
     $container.removeClass('all-transparent');

     //NOTE: add .on('click', xxxx) to turn off click response outside the popup
     $container.css('pointerEvents','auto');
 };  // End of makeOpaque

/** Removes any popups on the page */
LOOMA.closePopup = function() {
        //$("#confirm-popup").off('click'); //not needed if we do remove() below
        //$("#close-popup").off('click');
        //$("#dismiss-popup").off('click');
    $('.popup').fadeOut(1000).remove();
    var $container = $('body > div');
    $container.removeClass('all-transparent');

    LOOMA.makeOpaque($container);

    //$container.off('click');
    $(document).off('keydown');  //stop listening for ESC
    //$(document).off('click');  //stop listening for CLICK
};  //end closePopup()


/* NOTE on LOOMA popups: nested calls to popups dont work - -   fix this sometime?  */

/**  LOOMA.alert()
 * This function creates a popup message box that can be dismissed by the user.
 * @param msg - The message the user is presented.
 * @param time (optional)- a delay in seconds after which the popup is automatically closed
 * @param next - function to call when the popup is dismissed or times out
 * */
LOOMA.alert = function(msg, time, notTransparent, next){
    LOOMA.closePopup();
    if (!notTransparent) LOOMA.makeTransparent();

    // Attach the popup to #fullscreen so it stays visible in fullscreen mode,
    // BUT fall back to <body> on pages that have no #fullscreen wrapper (e.g.
    // the home page). Without this fallback the popup was appended to an empty
    // jQuery set — so it never appeared, while makeTransparent() had already
    // dimmed the page (opacity .6) and set pointer-events:none. The result was
    // a darkened, frozen screen with no OK/✕ button to dismiss it.
    var $attachpoint = ($('#fullscreen').length > 0) ? $('#fullscreen') : $(document.body);

    $attachpoint.append("<div class='popup'>" +
        "<button class='popup-button dismiss-popup'><b>X</b></button>"+ msg +
        "<button id ='close-popup' class ='popup-button'>" +
        //"<img src='images/alert.jpg' class='alert-icon'" +
        LOOMA.translatableSpans("OK", "ठिक छ") + "</button></div>").hide().fadeIn(1000);

    $('#close-popup, .dismiss-popup').click(function() {
        if (next) {next();}
        LOOMA.closePopup();
    });

   if (time) {
        var timeLeft = time - 1;
        var popupButton = $('#close-popup');
        popupButton.html(LOOMA.translatableSpans("OK (" + Math.round(timeLeft + 1) + ")",
            "ठिक छ(" + Math.round(timeLeft + 1) + ")"));
        clearInterval(popupInterval);
        var popupInterval = setInterval(function() {
            if (timeLeft <= 0) {
                clearInterval(popupInterval);
                if (next) {next();}
                LOOMA.closePopup();
            }
            timeLeft -= 1;
            popupButton.html(LOOMA.translatableSpans("OK (" + Math.round(timeLeft + 1) + ")",
                "ठिक छ(" + Math.round(timeLeft + 1) + ")"));
        },1000);
   }
};  //end alert()

/**    LOOMA.confirm()
 * Prompts the user to confirm a message.
 * @param msg - The message the user is presented in question format.
 * @param confirmed - A function to call if the user confirms
 * @param canceled - A function to call if the user cancels
 * */
LOOMA.confirm = function(msg, confirmed, canceled, notTransparent) {
    LOOMA.closePopup();
    if (!notTransparent) LOOMA.makeTransparent();
    $(document.body).append("<div class='popup confirmation'>" +
        "<button class='popup-button dismiss-popup'><b>X</b></button> " + msg +
        "<button id='close-popup' class='popup-button'>" + LOOMA.translatableSpans("cancel", "रद्द गरेर") + "</button>" +
        "<button id='confirm-popup' class='popup-button'>"+
        LOOMA.translatableSpans("confirm", "निश्चय गर्नुहोस्") +"</button></div>").hide().fadeIn(1000);

    $('#confirm-popup').click(function() {
        //$("#confirm-popup").off('click');
        LOOMA.closePopup();
        confirmed();
    });

    $('.dismiss-popup, #close-popup').click(function() {
        //$("#close-popup").off('click');
        //$("#dismiss-popup").off('click');
        LOOMA.closePopup();
        canceled();
   });
};  //end confirm()


 /**     LOOMA.prompt()
 * Prompts the user to enter text.
 * @param msg - The message the user is presented, prompting them to enter text.
 * @param callback - A function where the user's text response will be sent.
 * */
LOOMA.prompt = function(msg, confirmed, canceled, notTransparent) {
    LOOMA.closePopup();
    if (!notTransparent) LOOMA.makeTransparent();
    $(document.body).append("<div class='popup textEntry'>" +
        "<button class='popup-button dismiss-popup'><b>X</b></button>" + msg +
        "<button id='close-popup' class='popup-button'>" + LOOMA.translatableSpans("cancel", "रद्द गरेर") + "</button>" +
        "<input id='popup-input' autofocus></input>" +
        "<button id='confirm-popup' class='popup-button'>"+
        LOOMA.translatableSpans("OK", "ठिक छ") +"</button></div>").hide().fadeIn(1000) ;

    $('#popup-input').focus();

    $('#popup-input').on( 'keydown', function( e ) {
                if ( e.keyCode === 13 ) {  // carriage return
                    console.log('PROMPT returned ', $('#popup-input').val());
                    confirmed($('#popup-input').val());
                    LOOMA.closePopup();
                }
    });

    $('#confirm-popup').click(function() {
       console.log('PROMPT returned ', $('#popup-input').val());
       confirmed($('#popup-input').val());
       LOOMA.closePopup();
    });

    $('.dismiss-popup, #close-popup').click(function() {
        LOOMA.closePopup();
        canceled();
   });
};  //end prompt()

 LOOMA.clean = function(text) {
     return text.replace(/[^a-zA-Z0-9 \.\-\_]/g, "").trim();
 };

 LOOMA.escapeHTML = function(text) {
     return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
 };  //end escapeHTML()

 // from www.creativejuiz.fr  this function mimics server-side(PHP) $_GET[],
// giving client-side (JS) access to URL search parameters
function $_GET(param) {
    var vars = {};
    //uses regex to take apart the ? portion of the current URL building an array "vars" of [key:value] pairs
    //
    // USAGE: if the URL is "looma.php?name=joe&school=menlo" then
    //var name = $_GET('name');  //'joe'
    //var school = $_GET('school');       //'menlo'
    //
    window.location.href.replace( location.hash, '' ).replace(
        /[?&]+([^=&]+)=?([^&]*)?/gi, // regexp
        function( m, key, value ) { // callback
            vars[key] = value !== undefined ? value : '';
        }
    );
    if ( param ) { return vars[param] ? vars[param] : null; }
    return vars;
}

LOOMA.download = function (name, path) {
    $.ajax(
        "looma-database-utilities.php",
        {   type: 'GET',
            cache: false,
            crossDomain: true,
            dataType: "json",
            data: encodeURIComponent("cmd=download&name=" + name + "&path=" + path),
            error: function() {},
            success: function() {}
        });
}  //end download()

// send the user to a different Looma page, using POST (form SUBMIT) with args = {arg1:'arg1',arg2:'arg2',,,}
 LOOMA.redirect = function (location, args)
     {
         var form = $('<form></form>');
         form.attr("method", "post");
         form.attr("action", location);
         form.attr("target", "_self");

         $.each( args, function( key, value ) {
             var field = $('<input></input>');

             field.attr("type", "hidden");
             field.attr("name", key);
             field.attr("value", value);

             form.append(field);
         });
         $(form).appendTo('body').submit().remove();
     }; //end redirect()


    //OLD LOOMA.CH_IDregex = /^([1-9]|10)(EN|S|M|SS|N|H|V)[0-9]{2}(\.[0-9]{2})?$/;
    //OLD LOOMA.CH_IDregex = /([1-9]|10)(EN|Sa|S|Ma|M|SSa|SS|N|H|V)[0-9]{2}(\.[0-9]{2})?/;
LOOMA.CH_IDregex = /([1-9]|10|11|12)(EN|ENa|Sa|S|SF|Ma|M|SSa|SS|N|H|V|CS)[0-9]{2}(\.[0-9]{2})?/;   //removed "^" and "$"

LOOMA.date = function() {return date = new Date().toJSON().slice(0, 10);};

var loginname = LOOMA.loggedIn();

 // This script is released to the public domain and may be used, modified and
 // distributed without restrictions. Attribution not necessary but appreciated.
 // Source: https://weeknumber.com/how-to/javascript

 // Returns the ISO week of the date.
 Date.prototype.getWeek = function() {
     var date = new Date(this.getTime());
     date.setHours(0, 0, 0, 0);
     // Thursday in current week decides the year.
     date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
     // January 4 is always in week 1.
     var week1 = new Date(date.getFullYear(), 0, 4);
     // Adjust to Thursday in week 1 and count number of weeks from date to week1.
     return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000
         - 3 + (week1.getDay() + 6) % 7) / 7);
 }
