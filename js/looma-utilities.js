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
     "looma":"images/LoomaLogo_small.png"
 };
 
var LOOMA = (function() {

    //the LOOMA object defines a namespace "LOOMA" that allows us to define LOOMA.playMedia()
    // [and other LOOMA functions] that won't cause name conflicts

    // local VARs here

    // local FUNCTIONS here

    return {
    
playMedia : function(button) {
    
    var fn = encodeURIComponent(button.getAttribute('data-fn'));
    var fp = encodeURIComponent(button.getAttribute('data-fp'));
    var dn = encodeURIComponent(button.getAttribute('data-dn'));
    var ndn = encodeURIComponent(button.getAttribute('data-ndn'));
    var ch_id = encodeURIComponent(button.getAttribute('data-ch_id'));
    var language = LOOMA.readStore('language', 'cookie');
    
    switch (button.getAttribute("data-ft").toLowerCase()) {
        case "video":
        case "mp4":
        case "m4v":
        case "mov":
            window.location = 'video?' +
                 'fn=' + fn +
                '&fp=' + fp +
                '&dn=' + dn;
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
            break;

        case "pdf":      //PDF
        case "document": //DOCUMENT (some PDFs)
        case "chapter":  //CHAPTER
        case "section":  //textbook SECTIONs are 'played' if len > 0
            var pdfZoom =  button.getAttribute('data-zoom');
            if ( ! pdfZoom || pdfZoom === "undefined") pdfZoom = '2.3';
            var pdfPage =  button.getAttribute('data-page') ? button.getAttribute('data-page') : 1;
            var pdfLen =  button.getAttribute('data-page') ? button.getAttribute('data-len') : 100;
                    window.location = 'pdf?' +
                    'fn=' + encodeURIComponent(button.getAttribute('data-fn')) +
                    '&fp=' + encodeURIComponent(button.getAttribute('data-fp')) +
                    '&zoom=' + pdfZoom +
                    '&len=' + pdfLen +
                    '&page=' + pdfPage;
            break;

        case "text":
            var id = encodeURIComponent(button.getAttribute('data-mongoId'));
            var db = button.getAttribute('data-db') === 'loomalocal' ? 'loomalocal' : 'looma';
            window.location = 'text?id=' + id + '&db=' + db + '&lang=' + ((language==='native') ? 'np' : 'en');
            break;
    
        case "html":
            var fp = encodeURIComponent(button.getAttribute('data-fp'));
            var fn = encodeURIComponent(button.getAttribute('data-fn'));
            window.location = 'html?fp=' + fp + '&fn=' + fn;
            break;
    
        case "book":
            var fp = encodeURIComponent(button.getAttribute('data-fp'));
            var dn = button.getAttribute('data-dn');
            var ndn = button.getAttribute('data-ndn');
            var prefix = button.getAttribute('data-prefix');
            window.location = 'book?fp=' + fp + '&prefix=' + prefix + '&dn=' + dn + '&ndn=' + ndn;
            break;

        case "looma":
            var fp = encodeURIComponent(button.getAttribute('data-url'));
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
              //      '&lang=' + button.getAttribute("data-lang") +
                    '&lang=' + language +
                    '&sub=english' +
                '&grade=' + button.getAttribute("data-grade").substr(5,);
            } else { // version is 2022
                window.location = 'epaath?epversion=2022' +
                    '&ole=' + button.getAttribute("data-ole") +
                    '&lang=' + language +
                    '&sub=english' +
                    //      '&lang=' + button.getAttribute("data-lang") +
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
            
        default:
            console.log("ERROR: in LOOMA.playMedia(), unknown type: " +
                button.getAttribute("data-ft"));
    } //end SWITCH
}, //end LOOMA.playMedia()

        makeActivityButton: function (id, db, mongoID, appendToDiv) {
    // given an ID for an activity in the activities collection in mongo,
    // attach a button [clickable button that launches that activity] to "appendToDiv"

        // NOTE: probably want to attach ALL the attributes of the activity (as data-xxx fields) to the Activity Button
    
    //post to looma-database-utilities.php with cmd='openByID' and id=id
    // and result function makes a DIV and calls "succeed(div)"
             $.post("looma-database-utilities.php",
                {cmd: 'openByID', db: db, collection: 'activities', id: id},
                function(result) {
                    var thumbfile;
                        //var fp = (result.fp) ? 'data-fp=\"' + result.fp + '\"' : null;
                    if (result) var fp = ("fp" in result && result.fp) ? result.fp : LOOMA.filepath(result.ft, result.fn);
                    var lang = (result.lang === 'ne' || result.lang === 'np')? "np": "en";
                    var lang = (result.ft==="EP" && result.subject === "nepali")? "np": lang;
                    var fn = (result.fn) ? result.fn : result.nfn;
                    var db = (result.db) ? result.db : 'looma';
                    
                    var $newButton = $(
                                '<button class="activity play img" ' +
                                'data-id="' + id          + '" ' +
                                'data-fn="' + fn   + '" ' +
                        'data-fp="' + fp          + '" ' +
                        'data-db="' + db          + '" ' +
                                'data-ft="' + result.ft   + '" ' +
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
                                'data-mongoID="'  + mongoID     + '" >'
                        
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
                     if (thumbfile) $newButton.append($('<img alt="" loading="lazy" draggable="false" src="' + thumbfile + '">'));
                    
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
                 },
                'json'
              );
        }, //end makeActivityButton()
    
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

filepath: function(filetype, filename) {
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
            
                if (filetype == 'chapter') {
                  //  imgsrc = homedirectory + "content/textbooks/" + filepath + filename + "_thumb.jpg";
                    thumbnail_prefix = filename.substr(0, filename.lastIndexOf('.'));
                    imgsrc = homedirectory + "content/" + filepath + thumbnail_prefix + "_thumb.jpg";
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
                else if (filetype == "pdf" || filetype === "Document") { //pdf - we dont use Document type any more
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
            if (['key1','key2','key3','key4'].indexOf(item.name) === -1 )
                form[0].elements[item.name].value = item.value;
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

    console.log('LOOMA.lookup: dictionary lookup - word is "' + word + '"');

    //returns OBJECT result == {en:english, np:nepali, def:definition, ch_id:chapter}
    $.ajax(
        "looma-dictionary-utilities.php", //Looma Odroid
        {
            type: 'POST',
            cache: false,
            crossDomain: true,
            dataType: "json",
            data: "cmd=lookup&word=" + encodeURIComponent(word.toLowerCase()),
            error: fail,
            success: succeed //NOTE: provide a 'succeed' function which takes an argument "result" which will hold the translation/definition/image
        });
    return false;
}, //end lookup

reverselookup : function(nepali, succeed, fail) {

    console.log('LOOMA.reverselookup: dictionary lookup - word is "' + nepali + '"');

    //returns OBJECT result == {en:english, np:nepali, phon:phonetic, def:definition, img:picture, ch_id:chapter}
    $.ajax(
        "looma-dictionary-utilities.php", //Looma Odroid
        {
            type: 'POST',
            cache: false,
            crossDomain: true,
            dataType: "json",
            data: "cmd=reverselookup&word=" + encodeURIComponent(nepali.toLowerCase()),
            error: fail,
            success: succeed //NOTE: provide a 'succeed' function which takes an argument "result" which will hold the translation/definition/image
        });

    return false;
}, //end REVERSELOOKUP

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
        console.log(def['en'] + " DEFINED");
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
                console.log(def['np'] + " DEFINED");
                    succeed(LOOMA.defHTML(def));
             }
            function notfound() {
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
popupDefinition : function (word, time) {

      function show(html) {
          $('#popup').remove();
          var $popup =  $('<div id="popup"/>');
          $popup.append(html);
          LOOMA.alert($popup.html(), time, true);
      }; //end show()
    function fail() {};
    LOOMA.define(word, show, fail);

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
        ch_idFilepath : function(ch_id) {
            var parts = LOOMA.parseCH_ID(ch_id);
            return '../content/textbooks/Class' +
                parts['currentGradeNumber'] + '/' +
                parts['currentSubjectFull'] + '/' +
                parts['currentSubjectFull'] + '-' +
                parts['currentGradeNumber'] + '.pdf';
        },
    
    
    
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

/* LOOMA.speak()
 * Author: Akshay Srivatsan
 * Date: Summer 2015/2016
 * Description:  to use TTS import this file from your HTML file.
 * If it uses Mimic, the call can specify a Mimic voice.
 *
 * Uses the standard javascript object "speechSynthesis" if present [and browser !== Chromium],
 * otherwise, calls server-side looma-mimic.php, which uses Mimic to generate a wave file
 *
 * extended FEB 2023 by Skip to use larynx2 for Nepali TTS
 *
 * Requirements for mimic: Mimic must be installed on the Looma or server that serves
 *   this JS file. The speech synthesis PHP file must be at "/Looma/looma-mimic.php".
 */
LOOMA.speak = function(text, engine, voice, rate) {
        //speak the TEXT,
        //using [optional] ENGINE (in {'synthesis', 'mimic', 'larynx'})
        //using [optional] VOICE
        //using [optional] RATE sets the speed of speech. (rate > 1 is FASTER)
        //      in mimic  --setf duration_stretch=1/rate ( e.g. if rate === 0.5 stretch by 2x (slower))
        //      in speechSynthesis  SpeachSynthesisUtterance.rate = rate ( e.g. if rate === 0.5 speak slower)
        //  for Looma in Nepal, use default rate = 2/3
    
    const defaultspeed = 2/3;
    var   speed = rate ? rate : defaultspeed;
    
    /* requires a special regex package, like xregexp [https://www.regular-expressions.info/xregexp.html]
         const devanagari = /p{Devanagari}/u;
         if (text.match(devanagari)) text = "I cannot speak Nepali";
         
     so, we use "if (text.match(/[\u0900-\u097F]/g))" instead for detecting devanagri unicode characters
    */
    
     if (text != "" ) {
         var playPromise;
    
         if (!engine) {
                 if (text.match(/[\u0900-\u097F]/g)) engine = 'larynx'; // use 'larynx' for devanagri text
            else if (speechSynthesis && (speechSynthesis.getVoices().length !== 0))
                engine = 'synthesis';
            else
                engine = 'mimic'; //default engine is mimic
         };
     
         if (!voice) voice = LOOMA.readStore('voice', 'cookie') || 'cmu_us_bdl'; //get the currently used voice, if any. default VOICE
        
                    /* MIMIC VOICES: current default voice = cmu_us_bdl
                    Note from David: The three that seem about equal in clarity,
                    lack of low frequency rumble, lack of piercing high frequency … are
                        Scottish male	awb (has a bit of the trilled ‘r’)
                        US male 		bdl   (Haydi say maybe the best)
                        US male		    rms
                     */
    
    
         console.log('speaking : "' + text + '" using engine: ' + engine + ' and voice: ' + voice);
        
         var speechButton = document.getElementsByClassName("speak")[0];
        
         if (LOOMA.speak.animationsInProgress == null) {
             LOOMA.speak.animationsInProgress = 0;
         }
         if (LOOMA.speak.speechQueue == null) {
             LOOMA.speak.speechQueue = [];
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
             if (speechButton) {
                 LOOMA.speak.animationsInProgress += 1;
                 // If no animation is in progress, remember the button size
                 if (LOOMA.speak.animationsInProgress == 1) {
                     speechButton.oldOpacity = $(speechButton).css("opacity");
                     speechButton.oldWidth = $(speechButton).css("width");
                     speechButton.oldHeight = $(speechButton).css("height");
                    
                     $(speechButton).animate({
                         opacity: 1,
                         width: parseFloat(speechButton.oldWidth) * 2 + "px",
                         height: parseFloat(speechButton.oldHeight) * 2 + "px",
                     }, 500);
                 }
             }
         }; // end speak.activate()
        
         /*
          * speak.disable() makes the "Speak" button translucent and regular sized,
          * to show the user that the TTS is finished.
          * Only called when Mimic is used.
          */
         LOOMA.speak.disable = function () {
             if (speechButton) {
                 LOOMA.speak.animationsInProgress -= 1;
                 if (LOOMA.speak.animationsInProgress == 0) {
                     $(speechButton).animate({
                         opacity: speechButton.oldOpacity,
                         width: speechButton.oldWidth,
                         height: speechButton.oldHeight,
                     }, 500);
                 }
             }
         }; // end speak.disable()
        
         /*
          * Resets the TTS and button to their original states (only when Mimic is used).
          */
         LOOMA.speak.cleanup = function () {
             if (speechSynthesis.speaking) speechSynthesis.pause();
             else {
                 if (LOOMA.speak.playingAudio) {
                     LOOMA.speak.playingAudio.pause();
                     LOOMA.speak.playingAudio = null;
                 }
                 LOOMA.speak.speechQueue = [];
                 LOOMA.speak.disable();
             }
         }; // end speak.cleanup
    
    ////////////////////////////////
    //start of LOOMA.speak code: ///
    ////////////////////////////////
        
         if (engine === 'synthesis') {
             // we use synthesis if the user is running Safari or Chrome.
             // Firefox does have speechSynthesis, but be sure to set webspeech.synth.enabled=true in about:config
             // Chromium's speechSynthesis seems to be broken. (re-check this)
             if (speechSynthesis.speaking) {
                 if (speechSynthesis.paused)
                     speechSynthesis.resume();
                 else speechSynthesis.pause();
             } else {
                 // speechSynthesis usually accounts for latency itself, so there's no need to queue requests.
                 var speech = new SpeechSynthesisUtterance(text);
                 speech.rate = speed;   // e.g. if rate is 2/3, slow down
                 speechSynthesis.speak(speech);
             }
         }
        
         else { // engine is NOT 'synthesis', therefore call server-side looma-speech.php which uses 'mimic' or 'larynx'
             if (LOOMA.speak.playingAudio != null) {
                 // If speaking, stop the currently playing speech.
                 console.log("Stopping Audio");
                 //LOOMA.speak.playingAudio.pause();
                 LOOMA.speak.cleanup();
             } else {  //else start the new speech
                 console.log("Playing Audio: " + text);
                
                 // To reduce latency before speech starts, split the speech into sentences, and speak each separately.
                 // separating on: period, comma, question mark, exclamation mark, semicolon, colon   /[.,?!;:]/
                 // Splitting over these punctuation marks will usually work.
                 //There are a few cases where it will sound unusual ("Dr.", "Mr.", "Ms.", etc).
                 //It may lag on unusually long sentences without punctuation.
                 var splitSentences = text.split(/[.,?!;:]/);
                 console.log("Speaking " + splitSentences.length + " phrases.");
                
                 var lastAudio = null;
                 var firstAudio = null;
                
                 for (var i = 0; i < splitSentences.length; i++) {
                     var currentText = splitSentences[i];
                     var audioSource;
                     
                     audioSource = 'looma-TTS.php?' +
                         'text='    + encodeURIComponent(currentText) +
                         '&voice='  + encodeURIComponent(voice) +
                         '&rate='   + encodeURIComponent(speed) +
                         '&engine=' + encodeURIComponent(engine);
    
                     // This is like preloading images – all the requests to mimic will execute early, so there won't be lag between phrases.
                     var currentAudio = new Audio(audioSource);
                    
                     //this 'onended' handler is attached to each phrase before it is entered into the queue
                     currentAudio.onended = function () {
                         // When this phrase is over, start the next one, by popping it off the queue
                         console.log("End of Phrase");
                         var nextAudio = LOOMA.speak.speechQueue.pop(); // The equivalent of "dequeue". (Pulls from the end of the array.)
                         if (nextAudio != null) {
                             LOOMA.speak.playingAudio = nextAudio;
                             console.log("Playing Next Phrase");
                             //play the next phrase
                             playPromise = nextAudio.play();
                         } else {
                             // There's nothing else to do, just remove the flag.
                             console.log("Done with all phrases.");
                             LOOMA.speak.cleanup();
                         }
                     };
                    
                     if (lastAudio == null) { //for the first phrase, dont put it on the queue, just play it
                         firstAudio = currentAudio;
                     } else {
                         //push this phrase onto the queue
                         LOOMA.speak.speechQueue.unshift(currentAudio); // The equivalent of "enqueue". (Puts it at the beginning of the array.)
                     }
                     lastAudio = currentAudio;
                 }  // end FOR loop which builds the queue of audio phrases to play
                
                 LOOMA.speak.playingAudio = firstAudio;
                 console.log("Playing Phrase");
                 //play the first phrase
                 playPromise = firstAudio.play().then(
                     function () {
                        console.log('Play started');
                     }).catch(
                         function (error) {
                        console.log('Play promise error: ', error);
                 });
                
                 console.log('promise is ', playPromise);
                
                 // In browsers that don’t yet support this functionality,
                 // playPromise won’t be defined.
               /*  if (playPromise !== undefined) {
                     playPromise.then(function () {
                         console.log('Play started');
                     }).catch(function (error) {
                         console.log('Play promise error: ', error);
                     });
                
                 }
               */
                 LOOMA.speak.activate();
             }
         }  //end of code that calls server-side MIMIC
     } // end if (text != '')
 }; //end LOOMA.speak()

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
  //  var $attachpoint = ($('#fullscreen').length > 0) ? $('#fullscreen') : $(document.body);
    var $attachpoint = $(document.body);
    $attachpoint.append("<div class= 'popup'>" +
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