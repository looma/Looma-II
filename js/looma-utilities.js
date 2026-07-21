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

            window.location = 'pdf?' +
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
            }
            break;

        case "text":
            var id = encodeURIComponent(button.getAttribute('data-mongoId'));
            var db = button.getAttribute('data-db') === 'loomalocal' ? 'loomalocal' : 'looma';
            window.location = 'text?id=' + id + '&db=' + db + '&lang=' + ((language==='native') ? 'np' : 'en');
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

LOOMA.isWordDigit = function (ch) {
    return /[0-9०-९]/.test(ch || '');
};

/* LOOMA.strayDigitIndexes(chars)
 * Positions, in an array of single characters, of every digit with a word letter
 * (see above) on BOTH sides — "so1me". Those digits are never part of the word,
 * so they get dropped. Digits that start or end a word are left alone, which
 * keeps "COVID-19", "2nd", "Class 7" and "1051" intact.
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
        if (LOOMA.isWordLetter(i > 0 ? chars[i - 1] : '') &&
            LOOMA.isWordLetter(end < chars.length ? chars[end] : '')) {
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
 */
LOOMA.cleanSelectedText = function (text) {
    var chars = String(text == null ? '' : text).replace(/\|/g, ' ').split('');
    var drop = LOOMA.strayDigitIndexes(chars);
    for (var i = drop.length - 1; i >= 0; i--) chars.splice(drop[i], 1);
    return chars.join('').replace(/\s+/g, ' ').trim();
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
 * If it uses piper or mimic, the call can specify a  voice.
 *
 * Uses the standard javascript object "speechSynthesis" if present [and browser !== Chromium],
 * otherwise, calls server-side looma-TTS.php, which uses piper to generate a wave file
 *
 * extended FEB 2023 by Skip to use larynx2 for Nepali TTS
 * extended JUN 2025 by Skip to use piper for Nepali TTS
 */
LOOMA.speak = function(text, engine, voice, rate) {
        //speak the TEXT,
        //using [optional] ENGINE (in {'piper', 'synthesis', 'mimic'})
        //using [optional] VOICE
        //using [optional] RATE sets the speed of speech. (rate > 1 is FASTER)
        //      in mimic  --setf duration_stretch=1/rate ( e.g. if rate === 0.5 stretch by 2x (slower))
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
       function rateForText(t)    { return /[ऀ-ॿ]/.test(t || '') ? rateNp : rateEn; }
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
    // (cloud). Mimic and the browser speechSynthesis engine were removed, so any
    // stale/other value is coerced to Piper.
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
         * Only called when Mimic is used.
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
          * Only called when Mimic is used.
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
          * Resets the TTS and button to their original states (only when Mimic is used).
          */
         LOOMA.speak.cleanup = function () {
             // A new run invalidates any old fetches, object URLs and highlight state.
             LOOMA.speak.runId += 1;
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

         LOOMA.speak.clearBlockHighlight = function () {
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
             // Whitespace and "|" are dropped first (LOOMA.cleanSelectedText turns "|"
             // into a space, which would survive here and not on the page side), and
             // only then the stray digits — which is the order that catches a digit
             // living in a span of its own, "so" + "1" + "me".
             var compact = String(str == null ? '' : str).toLowerCase().replace(/[\s|]+/g, '');
             return LOOMA.cleanSelectedText(compact);
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
                     if (range && inRange(current, i)) {
                         if (windowStart === -1) windowStart = chars.length;
                         windowEnd = chars.length + 1;
                     }
                     chars.push(ch.toLowerCase());
                     map.push({node: current, offset: i});
                 }
             }

             // Drop the digits that were never in the book from the map too, not just
             // from a string, so the page and the spoken text stay aligned character
             // for character. See LOOMA.cleanSelectedText().
             var drop = LOOMA.strayDigitIndexes(chars);
             for (var d = drop.length - 1; d >= 0; d--) {
                 chars.splice(drop[d], 1);
                 map.splice(drop[d], 1);
                 if (windowStart > drop[d]) windowStart--;
                 if (windowEnd > drop[d]) windowEnd--;
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
             var startIndex = context.aggregate.indexOf(target, context.searchIndex || 0);
             if (startIndex === -1) startIndex = context.aggregate.indexOf(target, context.windowStart || 0);
             if (startIndex === -1) startIndex = context.aggregate.indexOf(target);
             if (startIndex === -1) return;

             context.searchIndex = startIndex + target.length;
             var endIndex = startIndex + target.length - 1;
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
                 mark.style.backgroundColor = '#ffe44d';
                 mark.style.color = '#111';
                 mark.style.fontWeight = '700';
                 mark.style.borderRadius = '0.18em';
                 mark.style.padding = '0 0.03em';
                 mark.style.boxShadow = '0 0 0 0.08em rgba(255, 212, 0, 0.45)';
                 fragment.appendChild(mark);

                 if (after) fragment.appendChild(ownerDocument.createTextNode(after));

                 node.parentNode.replaceChild(fragment, node);
                 LOOMA.speak.highlightMarks.push(mark);
             });
         };

    ////////////////////////////////
    //start of LOOMA.speak code: ///
    ////////////////////////////////

         // Shared by every engine that highlights as it reads (Piper/Mimic and
         // ResponsiveVoice): short sentence-level chunks so the highlight can
         // follow along, instead of one giant utterance highlighted all at once
         // (or, before this fix, not highlighted at all — see the ResponsiveVoice
         // branch below).
         function splitIntoPlaybackSegments(sourceText) {
             var normalized = sourceText
                 .replace(/\r/g, ' ')
                 .replace(/\n+/g, ' ')
                 .replace(/\s+/g, ' ')
                 .trim();
             if (!normalized) return [];

             return (normalized.match(/[^.!?।]+[.!?।]?/g) || [normalized])
                 .map(function (part) { return part.replace(/\s+/g, ' ').trim(); })
                 .filter(function (part) { return part.length > 0; });
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
                 var rvUnavailLang = /[ऀ-ॿ]/.test(text) ? 'np' : 'en';
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
                 LOOMA.speak(text, 'piper', voice, rate);
             } else {
                 // Pressing Speak again while it is talking stops it (toggle),
                 // matching how the other engines behave.
                 var rvPlaying = false;
                 try { rvPlaying = (typeof responsiveVoice.isPlaying === 'function') && responsiveVoice.isPlaying(); } catch (e) {}
                 if (rvPlaying) {
                     responsiveVoice.cancel();
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
                     var rvLang = /[ऀ-ॿ]/.test(text) ? 'np' : 'en';
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
                     // Speak sentence-by-sentence (like Piper/Mimic below) instead of
                     // handing the WHOLE text to ResponsiveVoice as one utterance —
                     // that old shape never called highlightBlock() at all, so the
                     // reading highlight only ever showed up with Piper, never with
                     // ResponsiveVoice. rvRunId (shared LOOMA.speak.runId counter,
                     // same one Piper/Mimic use) stops a stale chain the moment a
                     // new speak() call or cancel() supersedes it.
                     var rvRunId = ++LOOMA.speak.runId;
                     var rvSegments = splitIntoPlaybackSegments(text);
                     LOOMA.speak.highlightContext = LOOMA.speak.buildHighlightContext();

                     function speakNextRvSegment(index) {
                         if (rvRunId !== LOOMA.speak.runId) return;
                         var segment = rvSegments[index];
                         if (!segment) {
                             LOOMA.speak.clearBlockHighlight();
                             LOOMA.speak.disable();
                             return;
                         }

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

                         responsiveVoice.speak(segment, rvVoice, {
                             rate: rvRate,
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
                         LOOMA.speak.disable();
                     } else {
                         speakNextRvSegment(0);
                     }
                 }
             }
             });
         }

         else { // default path is Flask/Piper
             // Include engine settings so the same text can switch between Piper and Mimic.
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

                 var useMimic = engine === 'mimic';
                 // Always call the Looma PHP endpoint. It proxies Piper (Flask) and can also serve Mimic.
                 // Calling http://127.0.0.1:5002/tts from the browser would hit the *client* machine, not the server/container.
                 var ttsEndpoint = 'looma-TTS.php';

                 function detectSegmentLanguage(segment) {
                     // Mixed English/Nepali content is routed sentence-by-sentence to the right Piper worker.
                     var devanagariCount = (segment.match(/[\u0900-\u097F]/g) || []).length;
                     var latinCount = (segment.match(/[A-Za-z]/g) || []).length;
                     if (devanagariCount >= 4 && devanagariCount > latinCount) return 'ne';
                     return 'en';
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
                     var request;
                     if (useMimic) {
                         // Mimic is English-only, so the English voice always applies.
                         request = fetch(ttsEndpoint + '?' + $.param({
                             text: segmentText,
                             engine: 'mimic',
                             voice: voiceEn || 'cmu_us_axb',
                             rate: rateEn
                         }));
                     } else {
                         var piperParams = {
                             text: segmentText,
                             engine: 'piper',
                             lang: detectSegmentLanguage(segmentText),
                             rate: rateForLang(detectSegmentLanguage(segmentText))
                         };
                         // A specific Piper voice model (e.g. picked on the TTS test page)
                         // overrides the server's language-based default. Each segment uses
                         // the voice for its detected language; when omitted, the Piper
                         // server auto-selects the voice from the detected language.
                         var segVoice = (piperParams.lang === 'ne') ? voiceNp : voiceEn;
                         if (segVoice) piperParams.voice = segVoice;
                         request = fetch(ttsEndpoint + '?' + $.param(piperParams));
                     }

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
                             playPreparedBlock(nextPreparedBlock, nextIndex);
                         }).catch(function (error) {
                             console.log('Browser playback error: ', error);
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
                 console.log("Playing " + playbackSegments.length + " segments in browser using " + (useMimic ? "Mimic" : "Piper"));
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
         }  //end of code that calls server-side MIMIC
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

LOOMA.speak.normalizeSpeakKey = function (text) {
    return (text || '').replace(/\s+/g, ' ').trim().toLowerCase();
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

LOOMA.speak.updateButtonAvailability = function () {
    // The button stays usable for live selection, paused audio and replay of the last completed reading.
    var isBusy = !!LOOMA.speak.buttonActive;
    var isPending = !!LOOMA.speak.buttonPending;
    var selectable = LOOMA.speak.hasSelection() || !!LOOMA.speak.currentSourceText || !!LOOMA.speak.lastCompletedText;

    LOOMA.speak.getButtons().forEach(function (speechButton) {
        var $button = $(speechButton);
        $button.toggleClass('tts-busy', isBusy);
        $button.toggleClass('tts-pending', isPending && !isBusy);

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

    document.addEventListener('click', function (event) {
        var button = findSpeakButton(event.target);
        if (!button) return;

        if (LOOMA.speak.playingAudio) {
            var selectedText = (LOOMA.speak.getSelectedText ? LOOMA.speak.getSelectedText() : '');
            var selectedKey = LOOMA.speak.normalizeSpeakKey ? LOOMA.speak.normalizeSpeakKey(selectedText) : (selectedText || '').toLowerCase();
            var currentKey = LOOMA.speak.currentSourceKey || '';
            var hasNewSelection = !!selectedKey && selectedKey !== currentKey;

            if (hasNewSelection) {
                LOOMA.speak.cleanup();
                return;
            }

            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();

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
