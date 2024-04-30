/*
LOOMA javascript file
Filename: looma-edit-lessonOLD.js
Description: version 1 [SCU, Spring 2016]
             version 2 [skip, Fall 2016]
             version 3 [skip, MAR 2021, NEW lesson pre-configured from template]
             version 3 [skip, JUL 2023, text files edited inline, JAN 2024 bug fixes]
Programmer name: SCU
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: version 1:spring 2016, version 2: Nov 16, version 3: spring 2018, version 4: JUL 2023
 */

'use strict';
var $timeline;        // === $('#timelineDisplay')
var $previewpanel;    // === $('#previewpanel')
var $texteditbutton;  // === $('#edit-text-file')
var savedSignature = null;   //savedSignature is checkpoint of timeline for checking for modification
var loginname, loginlevel;
var homedirectory = "../";
var author, editor;
var $current_item;    // jQuery object representing the currently selected timeline item

var searchName = 'lesson-editor-search'; // used by looma-search.js
// var isnewlesson;
var textEditLanguage = 'english';

//////////////   functions used by filecommands/////////////////

///////// lessonclear  /////////
function lessonclear() {
    setname("", "");
    $timeline.empty();
    lessoncheckpoint();
    $('#previewpanel').empty();
    $('#previewpopup').empty().hide();
    $("#innerResultsMenu").empty();
    $("#innerResultsDiv").empty();
}

///////  lessonshowsearchitems  /////////
function lessonshowsearchitems() {
    $('#lesson-chk').show();
    $('#lesson-chk input')
        .attr('checked', true)
        .css('opacity', 0.5)
        .click(function() {return false;});
}

///////// lessoncheckpoint /////////
function lessoncheckpoint()       { savedSignature = signature($timeline);}

///////// lessonmodified /////////
function lessonmodified() {return ( savedSignature && signature($timeline) !== savedSignature);}

///////// signature  /////////
function signature($lesson) { //param is jQ object of the timeline ($timeline)
    var sig = '';
    $lesson.find('.activityDiv').each(function(index, x) {
        if ($(x).data('type') === 'inline') {
            sig += $(x).attr('data-html');
            if ($(x).attr('data-native')) sig += $(x).attr('data-native');
        } else sig += $(x).data('id');
    });
    return sig;
}

//  Formatted version of a popular md5 implementation
//  Original copyright (c) Paul Johnston & Greg Holt.
//  The function itself is now 42 lines long.

function md5(inputString) {
    var hc="0123456789abcdef";
    function rh(n) {var j,s="";for(j=0;j<=3;j++) s+=hc.charAt((n>>(j*8+4))&0x0F)+hc.charAt((n>>(j*8))&0x0F);return s;}
    function ad(x,y) {var l=(x&0xFFFF)+(y&0xFFFF);var m=(x>>16)+(y>>16)+(l>>16);return (m<<16)|(l&0xFFFF);}
    function rl(n,c)            {return (n<<c)|(n>>>(32-c));}
    function cm(q,a,b,x,s,t)    {return ad(rl(ad(ad(a,q),ad(x,t)),s),b);}
    function ff(a,b,c,d,x,s,t)  {return cm((b&c)|((~b)&d),a,b,x,s,t);}
    function gg(a,b,c,d,x,s,t)  {return cm((b&d)|(c&(~d)),a,b,x,s,t);}
    function hh(a,b,c,d,x,s,t)  {return cm(b^c^d,a,b,x,s,t);}
    function ii(a,b,c,d,x,s,t)  {return cm(c^(b|(~d)),a,b,x,s,t);}
    function sb(x) {
        var i;var nblk=((x.length+8)>>6)+1;var blks=new Array(nblk*16);for(i=0;i<nblk*16;i++) blks[i]=0;
        for(i=0;i<x.length;i++) blks[i>>2]|=x.charCodeAt(i)<<((i%4)*8);
        blks[i>>2]|=0x80<<((i%4)*8);blks[nblk*16-2]=x.length*8;return blks;
    }
    var i,x=sb(""+inputString),a=1732584193,b=-271733879,c=-1732584194,d=271733878,olda,oldb,oldc,oldd;
    for(i=0;i<x.length;i+=16) {olda=a;oldb=b;oldc=c;oldd=d;
        a=ff(a,b,c,d,x[i+ 0], 7, -680876936);d=ff(d,a,b,c,x[i+ 1],12, -389564586);c=ff(c,d,a,b,x[i+ 2],17,  606105819);
        b=ff(b,c,d,a,x[i+ 3],22,-1044525330);a=ff(a,b,c,d,x[i+ 4], 7, -176418897);d=ff(d,a,b,c,x[i+ 5],12, 1200080426);
        c=ff(c,d,a,b,x[i+ 6],17,-1473231341);b=ff(b,c,d,a,x[i+ 7],22,  -45705983);a=ff(a,b,c,d,x[i+ 8], 7, 1770035416);
        d=ff(d,a,b,c,x[i+ 9],12,-1958414417);c=ff(c,d,a,b,x[i+10],17,     -42063);b=ff(b,c,d,a,x[i+11],22,-1990404162);
        a=ff(a,b,c,d,x[i+12], 7, 1804603682);d=ff(d,a,b,c,x[i+13],12,  -40341101);c=ff(c,d,a,b,x[i+14],17,-1502002290);
        b=ff(b,c,d,a,x[i+15],22, 1236535329);a=gg(a,b,c,d,x[i+ 1], 5, -165796510);d=gg(d,a,b,c,x[i+ 6], 9,-1069501632);
        c=gg(c,d,a,b,x[i+11],14,  643717713);b=gg(b,c,d,a,x[i+ 0],20, -373897302);a=gg(a,b,c,d,x[i+ 5], 5, -701558691);
        d=gg(d,a,b,c,x[i+10], 9,   38016083);c=gg(c,d,a,b,x[i+15],14, -660478335);b=gg(b,c,d,a,x[i+ 4],20, -405537848);
        a=gg(a,b,c,d,x[i+ 9], 5,  568446438);d=gg(d,a,b,c,x[i+14], 9,-1019803690);c=gg(c,d,a,b,x[i+ 3],14, -187363961);
        b=gg(b,c,d,a,x[i+ 8],20, 1163531501);a=gg(a,b,c,d,x[i+13], 5,-1444681467);d=gg(d,a,b,c,x[i+ 2], 9,  -51403784);
        c=gg(c,d,a,b,x[i+ 7],14, 1735328473);b=gg(b,c,d,a,x[i+12],20,-1926607734);a=hh(a,b,c,d,x[i+ 5], 4,    -378558);
        d=hh(d,a,b,c,x[i+ 8],11,-2022574463);c=hh(c,d,a,b,x[i+11],16, 1839030562);b=hh(b,c,d,a,x[i+14],23,  -35309556);
        a=hh(a,b,c,d,x[i+ 1], 4,-1530992060);d=hh(d,a,b,c,x[i+ 4],11, 1272893353);c=hh(c,d,a,b,x[i+ 7],16, -155497632);
        b=hh(b,c,d,a,x[i+10],23,-1094730640);a=hh(a,b,c,d,x[i+13], 4,  681279174);d=hh(d,a,b,c,x[i+ 0],11, -358537222);
        c=hh(c,d,a,b,x[i+ 3],16, -722521979);b=hh(b,c,d,a,x[i+ 6],23,   76029189);a=hh(a,b,c,d,x[i+ 9], 4, -640364487);
        d=hh(d,a,b,c,x[i+12],11, -421815835);c=hh(c,d,a,b,x[i+15],16,  530742520);b=hh(b,c,d,a,x[i+ 2],23, -995338651);
        a=ii(a,b,c,d,x[i+ 0], 6, -198630844);d=ii(d,a,b,c,x[i+ 7],10, 1126891415);c=ii(c,d,a,b,x[i+14],15,-1416354905);
        b=ii(b,c,d,a,x[i+ 5],21,  -57434055);a=ii(a,b,c,d,x[i+12], 6, 1700485571);d=ii(d,a,b,c,x[i+ 3],10,-1894986606);
        c=ii(c,d,a,b,x[i+10],15,   -1051523);b=ii(b,c,d,a,x[i+ 1],21,-2054922799);a=ii(a,b,c,d,x[i+ 8], 6, 1873313359);
        d=ii(d,a,b,c,x[i+15],10,  -30611744);c=ii(c,d,a,b,x[i+ 6],15,-1560198380);b=ii(b,c,d,a,x[i+13],21, 1309151649);
        a=ii(a,b,c,d,x[i+ 4], 6, -145523070);d=ii(d,a,b,c,x[i+11],10,-1120210379);c=ii(c,d,a,b,x[i+ 2],15,  718787259);
        b=ii(b,c,d,a,x[i+ 9],21, -343485551);a=ad(a,olda);b=ad(b,oldb);c=ad(c,oldc);d=ad(d,oldd);
    }
    return rh(a)+rh(b)+rh(c)+rh(d);
}

///////// lessonpack  /////////
function lessonpack (lesson) { // pack the timeline into an array of collection/id pairs for storage
    var packitem;
    var packarray = [];
    
    $(lesson).each(function() {
        packitem = {};  //make a new object, unlinking the references already pushed into packarray
        packitem.collection = $(this).data('collection');
        if ($(this).data('type') === 'inline') {
            packitem.ft = 'inline';
            packitem.html = $(this).attr('data-html');
            if ($(this).attr('data-native')) packitem.native = $(this).attr('data-native');
        }
        packitem.id         = $(this).data('id');
        if (packitem.collection === 'chapters') packitem.lang         = $(this).data('lang');
        packarray.push(packitem);
    });
    
    return packarray;
} //end lessonpack()

///////// lessonunpack /////////
function lessonunpack (lesson) {  //un-pack the array of collection/id pairs into html to display on the timeline
    
    lessonclear();
    if (lesson.author) {
        author = lesson.author;
        editor = loginname;
    } else {
        author = loginname;
        editor = null;
    }
    setname(lesson.dn, author);
    currentDB = lesson.db ? lesson.db : 'looma';
    
    //$('#timelineDisplay').hide();
    
    var posts = [];  //we will push all the $.post() deferreds in the foreach below into posts[]
    var elements = [];
    
    //  for (var index=0;index<lesson.data.length;index++) {
    $(lesson.data).each(function(index, val) {  // param "index" is auto-generated and incremented by "each()"
        // retrieve each timeline element from mongo and add it to the current timeline
        //var newDiv = null;  //reset newDiv so previous references to it are broken
        
        if (val.ft === 'inline') {  // inline text file
            var newDiv = createActivityDiv(val);
            //add data-index to timeline element for later sorting
            //    (because the elements are delivered async, they may be out of order)
            $(newDiv.firstChild).attr('data-index', parseInt(index));
            // insertTimelineElement(newDiv.firstChild);
            elements.push(newDiv.firstChild);
        }   else
            posts.push($.post("looma-database-utilities.php",
                {cmd: "openByID", currentDB, collection: val.collection, id: val.id},
                async function(result) {
                    var newDiv = createActivityDiv(result);
                    
                    //add data-index to timeline element for later sorting
                    //    (because the elements are delivered async, they may be out of order)
                    $(newDiv.firstChild).attr('data-index', parseInt(index));
                    console.log('adding ID :' + result._id + ' with index = ' + index);
                    // insertTimelineElement(newDiv.firstChild);
                    elements.push(newDiv.firstChild);
                },
                'json'
            ));
    });
    
    //  when all the $.post's are complete, then re-order the timeline to account for out-of-order elements from asynch $.post calls
    
    // $.when.apply(null, posts).then(function(){
    
    Promise.all(posts).then (function(){
        
        orderTimeline(elements);  // puts the items in elements array into the timeline in order
        makesortable();
        
        //convert any old "text files" to "inline" text items
        $('#timelineDisplay').children().each ( async function (index, item) {
                console.log('index is ', index);
                if ( $(item).attr('data-type') === 'text') {
                    await convertTextfile( $(item) );
                    //savedSignature = null;
                }
            }
        ).promise().done ( function() {
            
            /*
             $blocks.each(function(i, elm) {
                $(elm).fadeOut(200, function() {
                   $(elm).remove();
                });
             }).promise().done( function(){ alert("All was done"); } );
           */
            
            renumberTimeline();
            lessoncheckpoint();  // save original contents of the lesson just loaded
            $('#timelineDisplay').show();
            $current_item = $('#timeline .activityDiv').first();  // select first timeline item
            preview($current_item);
        });
    });
} //end lessonunpack()


///////// lessondisplay  /////////
function lessondisplay (lesson) { lessonunpack(lesson); }


/////////  lessonsave  /////////
function lessonsave(name) {
    // isnewlesson = false;
    if (name === 'Master' && loginname !== 'skip')
        LOOMA.alert('Master lesson is Read Only', 5, true);
    else savefile(name, currentcollection, 'lesson', lessonpack($timeline.html()), "true", author);
    //note, the final param to 'savefile()' [to make an activity] set this param to 'true'
    //because lessons are recorded as  activities [for use in library-search, for instance]
} //end lessonsave()

///////////////////////////////////////////////////////////////////////
/////////////////////////// SEARCH   //////////////////////////////////
//////////////////////////////////////////////////////////////////////

function clearFilter () {
    if ($('#collection').val() === 'activities') {
        $('#searchString').val("");
        $(".filter_dropdown").each(function() { this.selectedIndex = 0; });
        $(".filter_checkbox").each(function() { $(this).prop("checked", false); });
    } else {//collection=='chapters'
        $("#dropdown_grade").val("").change();
        $("#dropdown_subject").val("").change();
    }
    
    $("#innerResultsMenu").empty();
    $("#innerResultsDiv").empty();
    $previewpanel.empty();
    
} //end clearFilter()
/////////////////////////////////////////////////

function clearResults() {
    $("#innerResultsMenu").empty();
    $("#innerResultsDiv" ).empty();
    $previewpanel =     $('#previewpanel');
    $previewpanel.empty();
    //preview($current_item);
    
} //end clearResults()

function displayResults(results) {
    var result_array = [];
    result_array['activities'] = [];  //not searching for dictionary entries
    result_array['chapters']  = [];  //not searching for textbooks
    
    for (var i=0; i < results.list.length; i++) {
        if (results.list[i]['ft'] === 'chapter')      result_array['chapters'].push(results.list[i]);
        else if (results.list[i]['ft'] !== 'section') result_array['activities'].push(results.list[i]);
    }
    
    clearResults();
    displaySearchResults(result_array);
    makedraggable();
    
} //end displayresults()


/////////////////////////////////////////////////////////////
/////////////////  FILL IN SEARCH RESULTS PANE //////////////
/////////////////////////////////////////////////////////////

function displaySearchResults(filterdata_object) {
    var currentResultDiv = document.createElement("div");
    currentResultDiv.id = "currentResultDiv";
    $(currentResultDiv).appendTo($("#innerResultsDiv"));

//***********************
// display Activities in Search Results pane
//***********************
    
    var actResultDiv = document.createElement("div");
    actResultDiv.id = "actResultDiv";
    $(actResultDiv).appendTo(currentResultDiv);
    
    var collectionTitle = document.createElement("h1");
    collectionTitle.id = "activityTitle";
    
    var activitiesarraylength = filterdata_object.activities.length;
    
    for(var i=0; i<activitiesarraylength; i++) {
        var rElement = createActivityDiv(filterdata_object.activities[i]);  //BUG: array[i-1] not defined when i==0  FIXED
        
        actResultDiv.appendChild(rElement);
        
    }

//***********************
// display Chapters in Search Results pane
//***********************
    
    var chaptersarraylength = filterdata_object.chapters.length;
    if (chaptersarraylength > 0) {
        for(i=0; i<chaptersarraylength; i++) {
            rElement = createActivityDiv(filterdata_object.chapters[i]);
            
            if (rElement) actResultDiv.appendChild(rElement);
        }
    } // end Print Chapters Array

///////////////////////////////
// Create inner results menu
//////////////////////////////
    
    $("<span/>", {
        id : "chaptersScroll",
        html : "Chapters (" + chaptersarraylength + ")&nbsp;&nbsp;&nbsp;&nbsp;"
    }).appendTo("#innerResultsMenu");
    $("<span/>", {
        id : "activitiesScroll",
        html : "Activities (" + activitiesarraylength + ')'
    }).appendTo("#innerResultsMenu");
    
    $("#innerResultsMenu").css("border-bottom","1px solid #000");
    
    $('#chaptersScroll').click(function()  {$('#innerResultsDiv').scrollTop($('#chapterTitle').position().top);});
    $('#activitiesScroll').click(function(){$('#innerResultsDiv').scrollTop($('#activityTitle').position().top);});
    
} //end displaySearchResults()


function filetype(ft) { return LOOMA.typename(ft);}

function thumbnail (item) {
    //builds a filepath/filename for the thumbnail of this "item" based on type
    var collection, filetype, filename, filepath;
    var imgsrc, idExtractArray;
    
    if ($(item).attr('thumb')) return $(item).attr('thumb');  //some activities have explicit thumbnail set
    
    if ($(item).attr('ft') === 'inline') return "images/textfile.png";
    
    collection = $(item).attr('collection');
    filetype = $(item).attr('ft');
    if ($(item).attr('fn')) filename = $(item).attr('fn');
    
    if ($(item).attr('lang') === 'np') filename = $(item).attr('nfn');
    
    if ($(item).attr('fp')) filepath = $(item).attr('fp');
    
    if (collection === "chapters" || item.pn != null) {
        //idExtractArray = extractItemId(item);
        //  filepath = idExtractArray["currentGradeFolder"] + "/" + idExtractArray["currentSubjectFull"] + "/";
        filepath = item.fp;
        //  filename = idExtractArray["currentSubjectFull"] + "-" + idExtractArray["currentGradeNumber"];
        filename = item.fn;
        imgsrc = LOOMA.thumbnail(filename, filepath, 'chapter');
    }
    else imgsrc = LOOMA.thumbnail(filename, filepath, filetype);
    
    return imgsrc;
} // end thumbnail()

function extractItemId(item) {
    if (item.ft === 'inline') return null;
    var ch_id = (item['ft'] == 'chapter')? item['_id'] : item['ch_id'];
    return LOOMA.parseCH_ID(ch_id);
}  // enc extractItemId()

function createActivityDiv (activity) {
    
    function innerActivityDiv (item) {
        
        // activityDiv looks like this:
        //      <div class="activityDiv" data-collection=collection>
        //                               data-id=_id
        //                               data-dn = dn
        //                               data-type = ft
        //                               data-db = db
        //                               if (ft='inline') data-html
        //                               if (ft='inline') data-native
        //                               if (ft='EP') data-ole and data-grade
        //                               data-fp
        //                               data-fn and/or data-nfn
        //                               data-pn or data-npn
        //                               data-lang = 'en' or 'np'
        //                               jqueryData = {'mongo': wholeMONGOdocument }>
        //          <div class="thumbnaildiv"><img src=   ></div>
        //          <div class="textdiv">
        //              <p class="result_dn"> dn </p>
        //              <span class="result_ft"> ft </span>
        //              <span class="result_ID"> ch_id </span>
        //          </div>
        //          <div class="buttondiv">
        //              <button> Preview </button>
        //              <button> Add </button>
        //              <button> Delete </button>
        //          </div>
        //      </div>
        var activityDiv = document.createElement("div");
        activityDiv.className = "activityDiv";
        
        $(activityDiv).attr("data-collection", (item.ft == 'chapter') ? 'chapters' : 'activities');
        
        if ('_id' in item) $(activityDiv).attr("data-id",
            (item.ft == 'chapter') ? item['_id'] : item['_id']['$id'] || item['_id']['$oid']);
        
        if ('dn' in item) $(activityDiv).attr("data-dn",item['dn']);
        if ('db' in item) $(activityDiv).attr("data-db",item['db']);
        
        if ('mongoID' in item) $(activityDiv).attr("data-mongoid",
            (item.ft == 'chapter') ? '' : item['mongoID']['$id'] || item['mongoID']['$oid']);
        
        var itemtype = item['ft'] === 'text-template' ? 'text-template' : item['ft'];
        $(activityDiv).attr("data-type", itemtype);
        $(activityDiv).attr("data-fp", item['fp']);
        
        if(itemtype === "EP") {
            $(activityDiv).attr("data-epversion",item['version']);
            $(activityDiv).attr("data-grade",item['grade']);
            $(activityDiv).attr("data-ole",item['oleID']);
        }
        
        var lang =  $("input:radio[name='chapter-language']:checked").val();
        $(activityDiv).attr("data-lang", lang);
        
        if (item['ft'] === 'inline') {
            $(activityDiv).attr("data-html", item['html']);
            $(activityDiv).attr("data-native", item['native']);
        } else {
            $(activityDiv).attr("data-db", item['db']);
            $(activityDiv).attr("data-fn", item['fn']);
            $(activityDiv).attr("data-pn", item['pn']);
            $(activityDiv).attr("data-nfn", item['nfn']);
            $(activityDiv).attr("data-npn", item['npn']);
            //if (lang==='np') {
            //      $(activityDiv).attr("data-fn", item['nfn'] ? item['nfn'] : null);
            //    $(activityDiv).attr("data-pn", item['npn'] ? item['npn'] : 1);
            // } else {
            //   $(activityDiv).attr("data-fn", item['fn'] ? item['fn'] : item['nfn']);
            // $(activityDiv).attr("data-pn", item['pn'] ? item['pn'] : item['npn']);
            //}
            item.collection = (item.ft == 'chapter') ? 'chapters' : 'activities';
            $.data(activityDiv, 'mongo', item);  //save the whole mongo document ("item") in the DOM element
        }
        // Thumbnail
        var thumbnaildiv = document.createElement("div");
        thumbnaildiv.className = "thumbnaildiv";
        $(thumbnaildiv).appendTo(activityDiv);
        
        $("<img/>", {
            class : "resultsimg",
            loading: "lazy",
            src : thumbnail(item, collection)
        }).appendTo(thumbnaildiv);
        
        // Result Text
        var textdiv = document.createElement("div");
        textdiv.className = "textdiv";
        $(textdiv).appendTo(activityDiv);
        
        // Display Name
        if      ('dn' in  item) var dn = item.dn;
        else if ('ndn' in item)     dn = item.ndn;
        else dn = "";
        
        $("<p/>", {
            class : "result_dn",
            html : "<b>" + dn.substring(0, 30) + "</b>"
        }).appendTo(textdiv);
        
        // File Type
        $("<span/>", {
            class : "result_ft",
            html : filetype(itemtype) + "  "
        }).appendTo(textdiv);
        
        // index
        $("<span/>", {
            class : "result_index",
            html:" (1)"
        }).appendTo(textdiv);
        
        // ID
        if ('ch_id' in item) {
            $("<span/>", {
                class : "result_ID",
                html : "[" + item.ch_id + "]"
            }).appendTo(textdiv);
        } else //CHAPTERS have their 'ch_id' as '_id'
        if (item.ft == 'chapter') {
            $("<span/>", {
                class : "result_ID",
                html : "[" + item._id + "]"
            }).appendTo(textdiv);
        }
        
        $("<br>").appendTo(textdiv);
        
        // Buttons
        var buttondiv = document.createElement("div");
        buttondiv.className = "buttondiv";
        $(buttondiv).appendTo(activityDiv);
        
        // "Add" button
        var addButton = document.createElement("button");
        addButton.innerText = "Add";
        addButton.className = "add";
        buttondiv.appendChild(addButton);
        
        // "Copy" button
        var copyButton = document.createElement("button");
        copyButton.innerText = "Copy";
        copyButton.className = "copy";
        buttondiv.appendChild(copyButton);
        
        // "Delete" button
        var removeButton = $("<button/>", {class: "remove", html:"Remove"});
        $(buttondiv).append(removeButton);
        
        // "Preview" button
        var previewButton = document.createElement("button");
        previewButton.innerText = "View";
        previewButton.className = "preview";
        buttondiv.appendChild(previewButton);
        
        return activityDiv;
    } //end innerActivityDiv()
    
    // var idExtractArray = extractItemId(activity);
    
    if (activity.ft !== 'section') {
        var div = document.createElement("div");
        div.className = "resultitem";
        
        var newDiv = innerActivityDiv(activity);
        $(newDiv).appendTo(div);
        
        return div;
    } else return null;
}  // end createActivityDiv()

///////////////////////////////////////////
///////////  scroll to item  //////////////
///////////////////////////////////////////
function scroll_to_item($item) {
    $('#timeline').animate( { scrollLeft: $item.width() * ( $item.attr('data-index') - 3 ) }, 100);
    $('#timeline .activityDiv').removeClass('playing');
    $('.resultitem').removeClass('search-preview');
    
    $item.addClass('playing');
    $current_item = $item;
    
}  //  end scroll_to_item()

///////////////////////////////////////////
/////////PREVIEW NEXT /////////////////////
///////////////////////////////////////////
function preview_next() {
    if ($current_item.next().length > 0) preview($current_item.next());
};  //  end preview_next()

///////////////////////////////////////////
/////////PREVIEW PREV /////////////////////
///////////////////////////////////////////
function preview_prev() {
    if ($current_item.prev().length > 0) preview($current_item.prev());
};  //  end preview_prev()

///////////////////////////////////////////////////////////////
/////////////////////////// PREVIEW ///////////////////////////
///////////////////////////////////////////////////////////////

// display an item (timeline or search result) in the preview panel
function preview ($item, do_not_select) {
    
    // displays an item in the preview window
    // if the item is in the timeline, scroll to the item and set class='playing' to highlight it
    
    if ( ! do_not_select ) { // for items in the timeline
        $current_item = $item;
        scroll_to_item($item);
    } else {  // for items in search results
        $('.resultitem').removeClass('search-preview');
        $item.parent().addClass('search-preview');
    }
    
    $previewpanel.empty().append($("<p/>", {html : "Loading preview..."}));
    $texteditbutton.hide();
    
    var collection = $item.attr('data-collection');
    
    var filetype = $item.attr('data-type');
    
    var filename = $item.attr('data-fn');
    var $mongo = $item.attr('data-mongoid');
    var filepath = $item.attr('data-fp');
    
    var previewSrc;
    
    /////////////////////   chapter   //////////////////////////////////////////
    if (collection == "chapters") {
        if ($item.attr('data-lang') === 'en')
            previewSrc = homedirectory + 'content/' +
                $item.attr('data-fp') + $item.attr('data-fn') +
                '#page=' + $item.attr('data-pn') + '\"  style=\"height:60vh;width:60vw;\" type=\"application/pdf\"';
        else previewSrc = homedirectory + 'content/' +
            $item.attr('data-fp') + $item.attr('data-nfn') +
            '#page=' + $item.attr('data-npn') + '\"  style=\"height:60vh;width:60vw;\" type=\"application/pdf\"';
        
        document.querySelector("div#previewpanel").innerHTML = '<embed src="' + previewSrc + '">';
    }
    
    ////////////////////   activities   ///////////////////////////////////////////
    
    else if (collection == "activities") {
        
        ////////////////////   video   ///////////////////////////////
        if( filetype == "video" ||
            filetype == "mov" ||
            filetype == "m4v" ||
            filetype == "mp4" ||
            filetype == "mp5") {
            if (!filepath) filepath = '../content/videos/';
            document.querySelector("#previewpanel").innerHTML =
                
                //		'<video controls> <source src="' + homedirectory +
                //		         'content/videos/' + filename + '" type="video/mp4"> </video>';
                
                
                // '<div id="video-player">' +
                '<div id="video-area">' +
                '<div id="video-area">' +
                '<div id="fullscreen">' +
                '<video id="video">' +
                '<source id="video-source" src="' +
                filepath + filename + '" type="video/mp4">' +
                '</video>' +
                '</div></div></div>' +
                '<div id="title-area"><h3 id="title"></h3></div>' +
                '<div id="media-controls">' +
                
                //'<button id="fullscreen-playpause"></button>' +
                '<div id="time" class="title">0:00</div>' +
                '<button type="button" class="play-pause"></button>' +
                '<input type="range" class="video seek-bar" value="0" style="display:inline-block"><br>' +
                '<button type="button" class="mute"></button>' +
                '<input type="range" class="video volume-bar" min="0" max="1" step="0.1" value="0.5" style="display:inline-block"><br>' +
                '</div>';
            
            attachMediaControls();  //hook up event listeners to the audio and video HTML
            
        }
        ////////////////////   pdf   ///////////////////////////////
        else if (filetype=="pdf") {
            if (!filepath) filepath = '../content/pdfs/';
            document.querySelector("div#previewpanel").innerHTML =
                '<iframe src="' + filepath + filename + '"' +
                ' style="height:60vh;width:60vw;" type="application/pdf">';
        }
        ////////////////////   audio   ///////////////////////////////
        else if (filetype=="mp3" || filetype=="m4a" || filetype=="audio") {
            
            if (!filepath) filepath = '../content/audio/';
            document.querySelector("div#previewpanel").innerHTML = '<br><br><br><audio id="audio"> <source src="' +
                filepath +
                filename + '" type="audio/mpeg"></audio>' +
                '<div id="media-controls">' +
                '<div id="time" class="title">0:00</div>' +
                '<button type="button" class="play-pause"></button>' +
                '<input type="range" class="video seek-bar" value="0" style="display:inline-block"><br>' +
                '<button type="button" class="mute"></button>' +
                '<input type="range" class="video volume-bar" min="0" max="1" step="0.1" value="0.5" style="display:inline-block"><br>' +
                '</div>';
            attachMediaControls();  //hook up event listeners to the audio and video HTML
            
        }
        ////////////////////   picture   ///////////////////////////////
        else if (filetype=="jpg" || filetype=="gif" || filetype=="png" || filetype=="image" || filetype=="jpeg") {
            if (!filepath) filepath = '../content/pictures/';
            document.querySelector("div#previewpanel").innerHTML = '<img src="' +
                filepath +
                filename + '"id="displayImage">';
        }
        ////////////////////   html   ///////////////////////////////
        else if (filetype == "html" || filetype == "HTML") {
            document.querySelector("div#previewpanel").innerHTML =
                '<object type="text/html" data="' + $item.attr('data-fp') +
                filename  + '" style="height:60vh;width:60vw;"> </object>';
        }
        ////////////////////   looma page   ///////////////////////////////
        else if (filetype=="looma")
            document.querySelector("div#previewpanel").innerHTML = '<img src="images/looma-screenshots/' +
                $item.attr('data-dn') + '.png" id="displayImage">';
        
        ////////////////////   map   ///////////////////////////////
        else if (filetype=="map")
            $previewpanel.html("<iframe src='map?id=" + $mongo + "'>");
        
        ////////////////////   ePaath   ///////////////////////////////
        
        else if (filetype.toLowerCase() === "ep") {
            if ($item.attr('data-epversion') === '2015') {
                $previewpanel.html("<iframe src='epaath?epversion=2015&fp=" + filepath + "&fn=" + filename + "/start.html'>");
                
            } else if($item.attr('data-epversion') === '2019') {
                $previewpanel.html("<iframe " +
                    "src='epaath?epversion=2019&ole=" + $item.attr('data-ole') +
                    "&lang=" +  $item.attr('data-lang') +
                    "&grade=" + $item.attr('data-grade').substring(5,) + "'>");
                
            } else {  // epversion 2022
                $previewpanel.html("<iframe " +
                    "src='epaath?epversion=2022&ole=" + $item.attr('data-ole') +
                    "&lang=" +  $item.attr('data-lang') +
                    "&grade=" + $item.attr('data-grade').substring(5,) + "'>");
            }
        }
        
        ////////////////////   game   ///////////////////////////////
        else if (filetype=="game")
            $previewpanel.html('<iframe src=game?id=' + $item.attr('data-mongoid') + ' zoom=0.5>');
        
        ////////////////////   history   ///////////////////////////////
        else if (filetype=="history")
            $previewpanel.html('<iframe src=history?id=' + $item.attr('data-mongoid') + '>');
        
        ////////////////////   slideshow   ///////////////////////////////
        else if (filetype=="slideshow") {
            $previewpanel.html('<iframe src=slideshow?id=' + $item.attr('data-mongoid') + '>');
        }
        ////////////////////   text and text-template   ///////////////////////////////
        else if (filetype=="text"|| filetype == "text-template") {
            var id = $item.attr('data-mongoid');
            
            $.post("looma-database-utilities.php",
                {cmd: "openByID", collection: "text", id: id},
                function(result) {
                    $previewpanel.empty().append($('<div class="textpreview text-display" data-id="' + id + '"></div>').html(result.data));
                    
                    // change DN in timeline to result.dn in case it has been RENAMEd
                    //$item.find('.textdiv .result_dn').text(result.dn);
                },
                'json'
            );
        }
        ////////////////////   inline (text)   ///////////////////////////////
        else if (filetype === 'inline') {
            $previewpanel.empty().append($('<div class="textpreview text-display"></div>').html($item.attr('data-html')));
            $('.textpreview').attr('contenteditable', 'false');
            
            $item.find('.textdiv .result_dn').text('');
            $texteditbutton.show();
        }
        else {
            document.querySelector("div#previewpanel").innerHTML = '<div class="text-display"> File not found</div>';
        }
    }
}  // end preview()


function insertTimelineElement(source, target) {
    // insert a new timeline element, after 'target' element
    var $dest = $(source).clone(true).off(); // clone(true) to retain all DATA for the element
                                             //NOTE: crucial to "off()" event handlers,
                                             //or the new element will still be linked to the old
    $('.hint').hide();
    
    if ($dest.attr('data-type') === 'text-template' || $dest.attr('data-type') === 'text') cloneTextfile($dest, target);
    else {
        $dest.removeClass('ui-draggable-handle').removeClass("ui-draggable").removeClass("ui-draggable-disabled");
        
        //$dest.addClass("ui-sortable-handle");  //  ?? this next stmt needed??
        
        if (target) $dest.insertAfter(target);   // insert after target
        else $dest.appendTo("#timelineDisplay");  // or insert at end
        
        
        //$('#timeline').animate({scrollLeft: $dest.outerWidth(true) * ($dest.index() - 4)}, 100);
    }
    $dest.addClass('timelineElement');
    preview($dest);
    
    renumberTimeline();
    
    makesortable();  //TIMELINE elements can be drag'n'dropped
} //  end insertTimelineElement()

function copyTimelineElement(source) {
    insertTimelineElement(source,source);
}; // end copyTimelineElement()

function cloneTextfile(source, target) {
    // make a clone of a text file and insert it in timeline
    var $clone = source.clone(false).off();
    
    $.post("looma-database-utilities.php",
        {   cmd: "openText",
            collection: 'text_files',
            id: $clone.attr('data-mongoid'),
            skip: 0,
            //dn: LOOMA.escapeHTML(newname),
            ft: $clone.attr('data-type')
        },
        'json'
    ).then(function(result) {
        // result has "_id" of the new ACTIVITY, and "dn", and "mongoID"
        
        result = JSON.parse(result);
        $clone.attr('data-id', result['id']);
        $clone.attr('data-html', result['data']);
        $clone.attr('data-native', result['native']);
        $clone.attr('data-dn', 'inline');
        $clone.attr('data-type', 'inline');
        
        $clone.removeClass('ui-draggable-handle')
            .removeClass("ui-draggable")
            .removeClass("ui-draggable-disabled")
            .removeClass("ui-draggable-dragging")
            .removeClass("ui-sortable-helper")
            .addClass("timelineElement");
        //$clone.addClass("ui-sortable-handle");  //  ?? this next stmt needed??
        
        $clone.find('.result_dn').text('');
        $clone.find('.result_ft').text('inline');
        
        //NOTE: this seems to be the critical section that causes the clone to appear at the end instead of in place
        // seems to be timing dependent? as if there is an async process that might not have completed
        // if (target) target.removeAttr("style");
        if (target) target.css('position', 'unset');
        //$clone.removeAttr("style");
        $clone.css('position', 'unset');
        //END NOTE
        
        if (target) target.after($clone);   // insert after target
        else $clone.appendTo("#timelineDisplay");  // or insert at end
        
        renumberTimeline();
        makesortable();
        preview($clone);
    });
}  // end cloneTextfile()


async function convertTextfile(source) {
    // "source" parameter is a lesson timeline element of type "text" [as a JS object]
    // convert a text file that has been DROPped into the timeline
    // into an 'inline' text item
    var newname = source.data('dn');
    if (currentname.match(LOOMA.CH_IDregex)) newname = currentname.match(LOOMA.CH_IDregex)[0] + " " + newname;
    
    //POST "copytext" to looma-database-utilities.php
    // THEN copy the new _id and the new mongoID into the clone
    // THEN insert clone into timeline
    
    $.post("looma-database-utilities.php",
        {   cmd: "openText",
            collection: 'text_files',
            id: source.data('mongoid'),
            //dn: LOOMA.escapeHTML(newname),
            skip: 0,
            ft: 'text'
        },
        'json'
    ).then(function(result) {
        // result has "_id" of the new ACTIVITY, and "dn", and "mongoID"
        
        result = JSON.parse(result);
        source.attr('data-id', result['id']);
        source.attr('data-html', result['data']);
        source.attr('data-native', result['native']);
        source.attr('data-dn', 'inline');
        source.attr('data-type', 'inline');
        
        source.removeClass('ui-draggable-handle')
            .removeClass("ui-draggable")
            .removeClass("ui-draggable-disabled")
            .removeClass("ui-draggable-dragging")
            .removeClass("ui-sortable-helper")
            .addClass('timelineElement');
        
        source.find('.result_dn').text('');
        source.find('.result_ft').text('inline');
        
        //NOTE: this seems to be the critical section that causes the clone to appear at the end instead of in place
        // seems to be timing dependent? as if there is an async process that might not have completed
        // if (target) target.removeAttr("style");
        // if (target) target.css('position', 'unset');
        source.removeAttr("style");
        //$clone.css('position', 'unset');
        //END NOTE
        
        makesortable();
        preview($current_item);
    });
    
}  // end convertTextfile()

function removeTimelineElement (elem) {
    var $thisElement = $(elem).closest('.activityDiv')
    var $neighbor = $thisElement.prev();
    $('#timeline').animate( { scrollLeft: $thisElement.outerWidth(true) * ( $(elem).closest('.activityDiv').index() - 4 ) }, 100);
    $thisElement.remove();
    if ($neighbor)
        preview($neighbor);
    else
        preview($timeline.first());
    
    renumberTimeline();
    
    ``} // end removeTimelineElement()

function getSorted(selector, attrName) {
    return $($(selector).toArray().sort(function(a, b){
        var aVal = parseInt(a.getAttribute(attrName)),
            bVal = parseInt(b.getAttribute(attrName));
        return aVal - bVal;
    }));
}

function orderTimeline (elements){  // "elements" is an array of items that arrived [.activityDiv] acsynchronously by AJAX from the [mongo] server
    // a 'data-index' attribute is stored with each  item
    // this function [re-]orders the array based on those data-index values
    // then inserts them in order into the lesson timeline
    //  $timeline is $('#timelineDisplay');
    
    $('#timelineDisplay').empty();
    
    elements.sort(function(a, b) {  // "elements" is an JS array. using JS "sort()" to order it
        return parseInt($(a).attr('data-index')) - parseInt($(b).attr('data-index'));
    });
    
    $(elements).each(function(index) {  // append each array element to the timeline in sorted order. each() preserves ordering
        // let number = index + 1;
        // $(this).find(".result_index").html(' (' + number + ')');
        $('#timelineDisplay').append($(this));
        console.log('appending ' + index);
    });
    
    //renumberTimeline();
    
} // end orderTimeline()

function renumberTimeline () {
    $timeline.children().each(function(index, item) {
        let number = index + 1;
        $(item).find(".result_index").html(' (' + number + ')');
        
        $(item).attr('data-index', index); // FEB 1 2024
        
    });
}  // end renumberTimeline()


/////////////////////////// SORTABLE UI ////////  requires jQuery UI  ///////////////////
function makesortable (){
    //$('timelineDisplay').sortable( "destroy" ); //remove previous sortable state
    
    //NOTE: next line souldnt be needed (??)
    // it removes 'position:absolute' and other style settings from a cloned text-template -> text element after drag'n'drop
    
    $("#timelineDisplay").sortable({
        opacity: 0.7,   // makes dragged element transparent
        revert: true,   //Animates the drop
        axis:   "x",
        containment: "#timelineDisplay",
        helper: "clone",
        //stop:   function ( e, ui ) { convertTextfile(ui.helper);}, // the convert is done in the droppable 'drop' fn, not here
        update: function( event, ui ) {
            console.log('in makesorttable "update" function line 862');
            ui.item.addClass('timelineElement');
            renumberTimeline();
            scroll_to_item(ui.item);
        },
        scroll: true,   //Allows page to scroll when dragging. Good for wide pages.
        handle: $(".activityDiv")  //restricts elements that can be clicked to drag to sort
    }).disableSelection();
    //    });
    
    $('#timelineDisplay .activityDiv').addClass('ui-sortable-handle');
    
    //renumberTimeline();
    
} // end makesortable()

/////////////////////////// DRAGGABLE UI ////////  requires jQuery UI  ///////////////////
//set up Drag'n'Drop  - -  code borrowed from looma-slideshow.js [T. Woodside, summer 2016]

function makedraggable() {
    $('.resultitem  .activityDiv').draggable({
        connectToSortable: "#timelineDisplay",
        //connectWith: "#timelineDisplay .activityDiv",
        // opacity: 0.5,
        scope:'.activityDiv',
        helper: "clone",
        addClasses: false,
        //cursorAt: 0,
        //containment:'#timelineDisplay'
    });
}; //end makedraggable()

function makedroppable() {
    $('#timelineDisplay').droppable ({
        accept: '.activityDiv',
        scope:  '.activityDiv',
        drop: async function(event, ui) {
            console.log('in makedroppable "drop" function line 892');
            $(ui.helper).addClass('timelineElement');
            if ($(ui.helper).data('type') === 'text' ||
                $(ui.helper).data('type') === 'text-template')
                await convertTextfile(ui.helper);
            renumberTimeline();
            scroll_to_item($(ui.helper));
            preview($(ui.helper));
            makesortable();
        }
    });
}; //end makedroppable()


/////////////////////////// TEXT EDIT SECTION ////////////////////

function openTextEditor () {
    var $textpreview = $('.textpreview');
    // turn OFF clicks on timeline elements [ and other visible parts?]
    $('#search-bar').hide();
    $('#filecommands').hide();
    $('#text-editor-buttons').show();
    $textpreview.attr("contentEditable", "true");
    $texteditbutton.hide();
    LOOMA.makeTransparent($('#timeline'));
    
    // disable SAVE button until contents change
    $("#text-edit-save").prop("disabled",true);
    $("#text-edit-translate").prop("disabled",false);
    $textpreview.on('input', function() {
        $("#text-edit-save").prop("disabled",false);
        $("#text-edit-translate").prop("disabled",true);
        
        // NOTE: next line set 'modified' for the lesson
        //       if the inline text element doesnt actually get changed, the modified stays set
        //       would be better to save the 'inline' contents when opening the text editor
        //       and checking the current contents against those initial contents when closing the text editor
        savedSignature = ' ';
        
    });
    $textpreview.attr('user-select', 'contain');
    textEditLanguage = 'english';
    
} // end openTextEditor()


function openTextTranslator (e) {
    var $textpreview = $('.textpreview');
    
    $textpreview.attr("contentEditable", "true");
    
    $('#previewpopup').html($('#textpreview').html()).show();
    
    if ($($current_item).attr('data-native')) $('.textpreview').html($($current_item).attr('data-native'));
    else $('.textpreview').html('');
    
    // disable SAVE button until contents change
    $("#text-edit-save").prop("disabled",true);
    $textpreview.on('input', function() {
        $("#text-edit-save").prop("disabled",false);
        //  savedSignature = ' ';
    });
    $textpreview.attr('user-select', 'contain');
    textEditLanguage = 'native';
    
} // end openTextTranslator()


function saveTextEdits() {
    // html of preview pane gets copied into current inline text element
    if ( textEditLanguage === 'english') $($current_item).attr('data-html', $('#previewpanel .text-display').html());
    else {
        $($current_item).attr('data-html', $('#previewpopup').html());
        $($current_item).attr('data-native', $('#previewpanel .text-display').html());
    }
    // set lesson MODIFIED flag to TRUE
    
    cancelEdit();
};  // end saveTextEdits()

function cancelEdit() {
    var $textpreview = $('.textpreview');
    
    $('#previewpanel .text-display').html($($current_item).attr('data-html'));
    
    $('#text-editor-buttons').hide();
    $textpreview.attr("contentEditable", "false");
    $texteditbutton.show();
    $('#search-bar').show();
    $('#filecommands').show();
    LOOMA.makeOpaque($('#timeline'));
    
    $textpreview.attr('user-select', 'none');
    
    preview($current_item);
    // turn ON clicks on timeline elements
};  // end cancelEdit()

function edit(editbutton) {
    
    function color (color) {
        document.execCommand('styleWithCSS', false, 'true');
        document.execCommand('foreColor', false, color);
    };
    
    function highlight (color) {
        document.execCommand('styleWithCSS', false, 'true');
        document.execCommand('hiliteColor', false, color);
    };
    
    function justify (direction) {
        document.execCommand('styleWithCSS', false, 'true');
        switch (direction) {
            case 'left':
                document.execCommand('justifyLeft', false, null);
                break;
            case 'center':
                document.execCommand('justifyCenter', false, null);
                break;
            case 'right':
                document.execCommand('justifyRight', false, null);
                break;
        }
    };
    
    console.log(' edit button ' + $(editbutton).data('edit') + ' clicked');
    
    switch ($(editbutton).data('edit')) {
        case 'highlight':
            highlight($(editbutton).data('color'));
            break;
        case 'color':
            color($(editbutton).data('color'));
            break;
        case 'underline':
            document.execCommand('underline',false,null);
            break;
        case 'center':
            justify('center');
            break;
        case 'right':
            justify('right');
            break;
        case 'left':
            justify('left');
            break;
        case 'undo':
            document.execCommand('undo',false,null);
            break;
        case 'redo':
            document.execCommand('redo',false,null);
            break;
        case 'save':
            saveTextEdits();
            break;
        case 'translate':
            openTextTranslator();
            break;
        case 'cancel':
            cancelEdit();
            break;
    }
    $('.edit-menu').hide();
    return false;
}; // end edit()  performs EDIT button operations


function lessonopen() {
    LOOMA.makeOpaque($('#main-container'));
    $('.setup-panel').hide();
    performSearch("lessons", "lesson");
}  // end lessonopen()

function lessonnew () {
    LOOMA.makeTransparent($('#main-container'));
    $('#setup-panel').show();
    $('#setup-panel #grade-chng-menu').prop('selectedIndex', 0);
    $('#setup-panel #subject-chng-menu').empty();
    $('#setup-panel #chapter-chng-menu').empty();
    $('#setup-panel-select').prop("disabled",true);
}  // end lessonnew()


//////////////////////////////////////////
//////     CLONE MASTER LESSON       /////
//////////////////////////////////////////
function cloneMasterLesson($chapter) {
    // create a new lesson from lesson "Master" [db="looma"] and insert the requested chapter in the timeline
    var ch_id = $chapter.text().match(LOOMA.CH_IDregex)[0];
    
    // First, open the "Master" lesson
    $.post("looma-database-utilities.php",
        {cmd: "openByName", db: 'looma', dn: 'Master', collection: 'lessons', ft: 'lesson'},
        function(response) {
            var newlesson = {};
            if (response['error'])
                LOOMA.alert(response['error'] + ': ' + dn, 3, true);
            else {
                console.log("Cloning 'Master' to " + $chapter.text());
                owner = true;
                currentname = $chapter.text();
                setname(currentname, loginname);
                
                newlesson['dn'] = $chapter.text();
                newlesson['ft'] = 'lesson';
                newlesson['author'] = loginname;
                newlesson['data'] = response['data'];
                newlesson['db'] = 'loomalocal';
                
                newlesson['data'].forEach(function(timeline_item, index) {
                    if (timeline_item.collection === 'chapters') {
                        timeline_item.id = ch_id;
                        $(timeline_item).attr('data-index', index);
                    }
                });
                
            }
            
            //    isnewlesson = true;
            lessondisplay(newlesson);
        },
        'json'
    );
    
    savedSignature = null;
}  // end cloneMasterLesson()

function makeNewLesson($chapter) {
    // build a new lesson using "Master" lesson as a template
    console.log ('making new lesson for: ' + $chapter.text());
    $('.setup-panel').hide();
    LOOMA.makeOpaque($('#main-container'));
    cloneMasterLesson($chapter);
} //end makeNewLesson()

/* phonics clone code needs to be updated for new "inline" text files format - NOT USED FOR NOW
//////////////////////////////////////////
//////     CLONE Phonics LESSON       /////
//////////////////////////////////////////
function clonePhonicsLesson(letter, master, number) {
    //NOTE: letter is a letter smallCap, like Gg, master is one of Aa or Bb, number is 1 or 2
    //var mastername =  "Letter " + master + " Phonics Lesson" + number;
    
    // First, open the "Phonics Master" lesson
    $.post("looma-database-utilities.php",
        {cmd: "openByName", dn: master, collection: 'lessons', ft: 'lesson'},
        function(response) {
            var newlesson = {};
            if (response['error'])
                LOOMA.alert(response['error'] + ': ' + dn, 3, true);
            else {
                console.log("Cloning " + master + " for " + letter);
                owner = true;
                currentname = "Letter " + letter + " Phonics Lesson " + number;
                setname(currentname, loginname);
                
                newlesson['dn'] = currentname;
                newlesson['ft'] = 'lesson';
                newlesson['author'] = 'kathy';
                newlesson['data'] = [];
                
      
                
                var count = 0; var limit = response.data.length;
                
                var textclones = [];  //we will push all the $.post() deferreds in the foreach below into textclones[]
                // then, for each item in the Master timeline, clone a copy for the new lesson
                response.data.forEach(function(timeline_item, index) {
                    if (timeline_item.collection === 'chapters') {
                        timeline_item.id = ch_id;
                        timeline_item.index = index;
                        newlesson.data.push(timeline_item);
                        count++;
                    } else {
                        // open the Master timeline activity
                        $.post("looma-database-utilities.php",
                            {cmd: "openByID", collection: 'activities', id: timeline_item.id},
                            function (item_activity) {
                                
                                // if the item not a chapter, nor a text file, just copy it into the new lesson timeline
                                if (item_activity.ft !== 'text') {  //copy any non-text timeline items
                                    newlesson.data.push(item_activity);
                                    count++;
                                }
                                else {  //lookup the text file and clone it
                                    // if the item is a text file, open its text_files document from Mongo
                                    //   NOTE: for mongo 2.6 a mongoID has field $id  *************
                                    //   NOTE: for mongo 4.0 a mongoID has field $oid  *************
                                    var item_id = item_activity.mongoID.$oid || item_activity.mongoID.$id;
                                    $.post("looma-database-utilities.php",
                                        {cmd: "openByID", collection: 'text_files', id: item_id},
                                        function (item_textfile) {
                                            //save the cloned text file
                                            textclones.push($.post("looma-database-utilities.php",
                                                {   cmd: "save",
                                                    collection: 'text_files',
                                                    dn: LOOMA.escapeHTML(item_textfile.dn.replace(master, letter)),
                                                    ft: 'text',
                                                    data: item_textfile.data,
                                                    activity: "true"      // NOTE: this is a STRING, either "false" or "true"
                                                },
                                                function (result) {  // record the id in the activityDiv
                                                    // add the cloned text file to the new lesson timeline
                                                    //   NOTE: for mongo 2.6 a mongoID has field $id  *************
                                                    //   NOTE: for mongo 4.0 a mongoID has field $oid  *************
                                                    var text_id = result.activity._id.$oid || result.activity._id.$id;
                                                    newlesson.data.push(
                                                        {id:text_id,
                                                            collection:'activities',
                                                            index: index});
                                                    count++;
                                                    
                                                    if (count === limit) {
                                                        newlesson.data = orderNewLesson(newlesson.data);
                                                        isnewlesson = true;
                                                        lessondisplay(newlesson);
                                                        savedSignature = null;
                                                    }
                                                    
                                                },
                                                'json'
                                            ));
                                        },
                                        'json'
                                    );
                                }
                            },
                            'json'
                        );
                    } });
            }
        },
        'json'
    );
}  // end clonePhonicsLesson()

function makePhonicsLesson(letter, number) {
    var master;
    // build a new lesson using Aa or Bb phonics lesson as a template
    console.log ('making new phonics lesson ' + number + ' for: ' + letter);
    $('.setup-panel').hide();
    LOOMA.makeOpaque($('#main-container'));
    var capSmall = letter.toUpperCase() + letter;
    if (['a','e','i','o','u'].includes(letter))
        master = "Aa";
    else master = "Bb";
    //NOTE: first param is a smallCap, like Gg, master is one of Aa or Bb, number is 1 or 2
    clonePhonicsLesson(capSmall, master, number);
} //end makePhonicsLesson()
*/

function showOptions (item) {
    item.append($('<div class="options">' + currentname + '</div>'));
}

function openPreview ($item) {
    $('#previewpopup').html($item.attr('data-html')).show();
};  // end openPreview()

///////////////////////////////////////////////////////////////////////
/////////////////////////// ONLOAD FUNCTION ///////////////////////////

window.onload = function () {
    
    $searchResultsDiv = $('#innerResultsDiv');  //sets a global variable used by looma-search.js
    $timeline =         $('#timelineDisplay');  //the DIV where the timeline is being edited
    $previewpanel =     $('#previewpanel');
    
    loginname = LOOMA.loggedIn();
    author = loginname;
    
    var loginlevel = LOOMA.readStore('login-level','cookie')
    var loginteam  = LOOMA.readStore('login-team','cookie')
    //  if (loginname && loginlevel === 'admin' )   $('.admin').show();
    //  if (loginname && loginlevel === 'exec' )  { $('.admin').show(); $('.exec').show(); }
    
    $('#setup-panel .cancel').click(function(){
        $('.setup-panel').hide();
        LOOMA.makeOpaque($('#main-container'));
    });

//////////////////////////////////////////
    // text books
    
    $('.lang').change(function() {
        $('#setup-panel-select').prop("disabled",true);
    });
    
    $("#grade-chng-menu").change(function() {
        $('#warning').text("");
        showTextSubjectDropdown($('#grade-chng-menu'),
            $('#subject-chng-menu'),
            $('#chapter-chng-menu'),
            $("input:radio[name='lang']:checked").val());
        $('#setup-panel-select').prop("disabled",true);
    });  //end drop-menu.change()
    
    $("#subject-chng-menu").change(function() {
        $('#warning').text("");
        showTextChapterDropdown($('#grade-chng-menu'),
            $('#subject-chng-menu'),
            $('#chapter-chng-menu'),
            $("input:radio[name='lang']:checked").val());
        $('#setup-panel-select').prop("disabled",true);
    });  //end drop-menu.change()
    
    $('#chapter-chng-menu').change(function() {
        $('#warning').text("");
        if (!$('#chapter-chng-menu').val() ||$('#chapter-chng-menu :selected').text() === '(any)...')
            $('#setup-panel-select').prop("disabled",true);
        else  if ($('#chapter-chng-menu :selected').hasClass('hasLesson')) {// this chapter has an existing lesson
            $('#warning').text('This chapter already has a lesson');
            $('#setup-panel-select')
                .prop("disabled",false)
                .text('Open existing lesson')
                .off('click')
                .click(function() {
                    $('.setup-panel').hide();
                    LOOMA.makeOpaque($('#main-container'));
                    openfile($('#chapter-chng-menu :selected').data('mongo'),
                        $('#chapter-chng-menu :selected').data('db'),'lessons', 'lesson');
                });
        }
        else $('#setup-panel-select')  // this chapter does not have an existing lesson
                .prop("disabled",false)
                .text('Create new lesson')
                .off('click')
                .click(function() {makeNewLesson($('#chapter-chng-menu :selected'));});
    });
    
    $('#setup-panel-select').click(function() {makeNewLesson($('#chapter-chng-menu :selected'));});
    
    $("input[type=radio][name='lang']").change(function() {
        $('#warning').text("");
        $('#grade-chng-menu').prop('selectedIndex', 0); // reset grade select field
        $('#subject-chng-menu').empty(); $('#chapter-chng-menu').empty();
    });
    
    $('#clear_button').click(clearFilter);
    
    $('#search').change(function() {
        $("#innerResultsMenu").empty();
        $("#innerResultsDiv").empty();
        $previewpanel.empty();
    });
    
    pagesz=100;
    
    $('.chapterFilter').prop('disabled', true);
    $('.mediaFilter').prop('disabled',   false);
    
    $('#lesson-checkbox').prop('disabled' , true).hide();
    $('#includeLesson').val(false);

///////////////////////////////
// click handlers for '.add', '.preview' buttons
///////////////////////////////
    
    //$(elementlist).on(event, selector, handler).
    //  ************   ADD   ****************
    $('#innerResultsDiv'           ).on('click', '.add',        function() {
        insertTimelineElement($(this).closest('.activityDiv'));
        //renumberTimeline();
        return false;});
    
    //   ************   PREVIEW   ****************
    $('#innerResultsDiv').on('click', '.preview',    function() {
        preview($(this).closest('.activityDiv'), true); return false;});
    $('#innerResultsDiv').on('click', '.resultsimg', function() {
        preview($(this).closest('.activityDiv'), true); return false;});
    
    $('#timeline').on('click', '.preview',    function() {
        preview($(this).closest('.activityDiv')); return false;});
    $('#timeline').on('click', '.resultsimg', function()  {
        preview($(this).closest('.activityDiv'));return false;});
    
    //   ************   REMOVE   ****************
    $('#timeline').on('click', '.remove',     function() {
        removeTimelineElement(this); return false;});
    
    //   ************   COPY   ****************
    $('#timeline').on('click', '.copy',     function() {
        copyTimelineElement($(this).closest('.activityDiv')); return false;
    });

//////////////////////////////////////
/////////FILE COMMANDS setup /////////
//////////////////////////////////////
    
    /*  callback functions expected by looma-filecommands.js:  */
    callbacks ['clear'] =           lessonclear;
    callbacks ['save']  =           lessonsave;
    //callbacks ['savetemplate']  =   lessontemplatesave;
    callbacks ['open']  =           lessonopen;
    callbacks ['new']  =            lessonclear;
    callbacks ['display'] =         lessondisplay;
    callbacks ['modified'] =        lessonmodified;
    callbacks ['showsearchitems'] = lessonshowsearchitems;
    callbacks ['checkpoint'] =      lessoncheckpoint;
    //callbacks ['quit'] not overridden - use default action from filecommands.js
    
    /*  variable assignments expected by looma-filecommands.js:  */
    currentname = "";                    //currentname is defined in looma-filecommands.js and is used there
    currentfiletype =   'lesson';        //currentfiletype   is defined in looma-filecommands.js and is used there
    currentcollection = 'lessons';       //currentcollection is an index into $collections (mongo-connect.php)
    currentDB = 'loomalocal';
    
    //////
    $('.file-cmd#saveas').click(function(){currentcollection = 'lessons';  currentDB = 'loomalocal'});
    //////
    
    // set file search box title
    $('.filesearch-collectionname').text('Lesson Plans');
    // set collection in filesearch form
    $('#filesearch  #collection').val('lesson');  // should be 'lessons'  ???
    
    makedroppable(); // sets the timeline to accept activityDiv drops
    makesortable();  // makes the timeline sortable
    
    $('#timelineLeft' ).on('click',  function(){ preview_prev();});
    $('#timelineRight').on('click', function(){ preview_next();});
    
    $('#timeline').on('mouseover', '.activityDiv',  function () { //handlerIn
        //var $btn = $(this).closest('button');
        if ($(this).attr('data-type') === 'inline') openPreview($(this));
        else
            $('#subtitle').text($(this).attr('data-dn') + ' (' + LOOMA.typename($(this).attr('data-type')) + ')');
    });
    
    $('#timeline').on('mouseout', '.activityDiv',  function () { //handlerOut
        $('#subtitle').text('');
        $('#previewpopup').hide();
    });
    
    $('#text-editor-buttons').hide();
    
    $texteditbutton = $('#edit-text-file');
    $texteditbutton.click(openTextEditor);
    
    $('.button-group')
        .on( "mouseenter", function(x) {$(x.target).find('.edit-menu').show()} )
        .on( "mouseleave", function(x) {$(x.target).find('.edit-menu').hide()} );
    
    $('button.text-edit').click(function () { edit(this);});
    
    // QUIT
    $('#dismiss-editor').on('click', quit );  //disable default DISMISS btn function and substitute QUIT()
    
    // lessoncheckpoint();
    
    $('.dropdown-item#chapter').css("display", "block").click(lessonnew);
    
};  //end window.onload()


