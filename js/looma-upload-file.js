/*
LOOMA javascript file
Filename: looma-upload-files.js
Description: JS for looma-upload-files.php

Programmer name: Skip
Owner: VillageTech Solutions (villagetechsolutions.org)
Date: 04 2018
Revision: Looma 3.0
 */

'use strict';

var loginname, loginlevel;
/*
/////////////////////////////
/////  setRootKeyword()    /////
/////////////////////////////
function setRootKeyword() {
    // reset keyword dropdowns to level one
    $.post("looma-database-utilities.php",
        {cmd: "keywordRoot"},
        function(kids) {
            var dropdown = $('#key1-menu').empty();
            if (kids) {
                dropdown.prop('disabled', false);
                //console.log('response is ' + kids);
                $('<option value="" label="Select..."/>').prop('selected', true).appendTo(dropdown);
                kids.forEach(function (kid) {
                    $('<option data-kids=' + kid.kids["$id"] + ' value="' + kid.name + '" label="' + kid.name + '"/>').appendTo(dropdown);
                });
            }
        },
        'json'
    );
    $('#key1-menu').nextAll().empty().val('').prop('disabled', true).text('');
    //$('#key2-menu').prop('disabled', true).text('');
    //$('#key3-menu').prop('disabled', true).text('');
    //$('#key4-menu').prop('disabled', true).text('');
}; // end setRootKeyword()

//////////////////////////////////////
/////  restoreKeywordDropdown()  /////
//////////////////////////////////////
function restoreKeywordDropdown(level,keys) {
    
    //function selectKey(option, name) {option.prop('selected', true);};
    var $menu, $element;
    var key = keys[level-1]?keys[level-1]:null;
    
    if (key && key !== '') {
        $menu = $('#key' + level + '-menu'); // get the dropdown option elements for this level
        
        if ($menu) {
            
            // dropdown = $menu[value=key];
            // dropdown = $menu.find(x => x.value === key);
            // dropdown = $menu['#'+key];
            //var item = $( 'option#' + key)[ 0 ];
            
            $element = $menu.children('option[value="'+key+'"]');
            $element.prop('selected', true);
            
            if (level < 4) {
                $.post("looma-database-utilities.php",
                    {cmd: "keywordList", id: $element.data('kids')},
                    function(kids) {
                        var nextLevel = level + 1;
                        var $next = $('#key' + nextLevel + '-menu').empty().val('').prop('disabled', false).text('');
                        //var next = $menu.next('select').empty().prop('disabled', false);
                        if (kids) {
                            
                            $('<option value="" label="Select..."/>').prop('selected', true).appendTo($next);
                            
                            for (var i=0;i<kids.length;i++){
                                //kids.forEach(function (kid) {
                                $('<option data-kids=' + kids[i].kids["$id"] + ' value="' + kids[i].name + '" label="' + kids[i].name + '"/>').appendTo($next);
                            };
                            
                            restoreKeywordDropdown(nextLevel, keys);
                        };
                    },
                    'json'
                );
            }
        }
    }
}; //end restoreKeywordDropdown()

///////////////////////////////////
/////  showKeywordDropdown()  /////
///////////////////////////////////
function showKeywordDropdown(event) {
    var menu  = event.target;
    var selected = menu.options[menu.selectedIndex];
    
    //clear and disable younger brothers
    $(menu).nextAll().empty().val('').prop('disabled', true).text('');
    var $val = $(menu).val();
    
    if ( $val && $val != '' && ($(menu).data('level') < 4))
    
    //console.log('asking for keyword list of ' + $(selected).data('kids'));
        $.post("looma-database-utilities.php",
            {cmd: "keywordList",
                id: $(selected).data('kids')},
            function(kids) {
                var next = $(menu).next().empty().prop('disabled', false);
                if (kids) {
                    //console.log('response is ' + kids);
                    $('<option value="" label="Select..."/>').prop('selected', true).appendTo(next);
                    kids.forEach(function (kid) {
                        $('<option data-kids=' + kid.kids["$id"] + ' value="' + kid.name + '" label="' + kid.name + '"/>').appendTo(next);
                    });
                }
            },
            'json'
        );
}; //end showKeywordDropdown()

///////////////////////////////////
/////  showChapterDropdown()  /////
///////////////////////////////////
function showChapterDropdown($div, $grades, $subjects, $chapters) {
    //if ($div) $div.hide();
    
    $chapters.empty();
    if ( ($grades.val() != '') && ($subjects.val() != ''))
        $.post("looma-database-utilities.php",
            {cmd: "textChapterList",
                class:   $grades.val(),
                subject: $subjects.val()},
            
            function(response) {
                //$('#chapter_label').show();
                if ($div) $div.show();
                $('<option/>', {value: "", label: "Select..."}).appendTo($chapters);
                
                $chapters.append(response);
            },
            'html'
        );
};  //end showChapterDropdown()
*/

function defaultfolder(src) {
    var sources = {
        "Dr Dann": "../content/Dr Dann",
        PhET:  "../content/PhET",
        TED:  "../content/TED"};
    if (sources[src]) return sources[src]; else return "../content/temp";
}  // end defaultfolder()

function legalThumb (file, thumb) {
    if (!file || !thumb) return false;
    else return thumb.includes('_thumb.jpg') && (thumb.replace('_thumb.jpg', '') === file.substring(0,file.lastIndexOf('.')));
}

var legalTypes = ['image/jpg','image/png','image/gif','image/jpeg','audio/mp3','video/mp4','video/m4v','video/mov','application/pdf'];


///////////////////////////////////
/////      confirmChanges()    /////
///////////////////////////////////
function confirmChanges (event) {
    event.preventDefault();
    
    var details = '<h3>&nbsp;&nbsp;&nbsp;&nbsp;<b>Summary of new file to import</b></h3>';
    details += '<p>File: ' + $('#upload').val().replace('C:\\fakepath\\','') + '</p>';
    details += '<p>Title: ' + $('#dn-changes').val() + '</p>';
    details += '<p>Folder: ' + $('#fp-changes').val() + '</p>';
    details += '<p>Keywords: ' + $('select[name="key1"]').val();
        if ($('select[name="key2"]').val()) details += ', ' + $('select[name="key2"]').val();
        if ($('select[name="key3"]').val()) details += ', ' + $('select[name="key3"]').val();
        if ($('select[name="key4"]').val()) details += ', ' + $('select[name="key4"]').val();
    details += '</p>';
    if ($('input[name="src[]"]:checked').val()) details += '<p>Source: ' + $('input[name="src[]"]:checked').val() + '</p>';
                            //   $('input[name="name_of_your_radiobutton"]:checked').val()   details += '<p>Chapter:</p>';
    
    details += '<p>Grades: ' + $('#cl_lo').val() + ', ' + $('#cl_hi').val() + '</p>';
    
    if ($('#grade-drop-menu').val() && $('#subject-drop-menu').val() && $('#chapter-drop-menu').val() )
        details += '<p>Chapter: ' + $('#chapter-drop-menu').val() + '</p>';
    
    $('#details #details-contents').html('<p>' + details + '</p>');
    LOOMA.makeTransparent($('#previewpanel'));
    $('#details').show();
} // end confirmChanges()


///////////////////////////////////
/////      cancelChanges()    /////
///////////////////////////////////
function cancelChanges (event) {
    LOOMA.makeOpaque($('#previewpanel'));
    $('#details').hide();
} // end cancelChanges()

///////////////////////////////////
/////      submitChanges()    /////
///////////////////////////////////
function submitChanges (event) {  //check the form entries and submit to backend
    LOOMA.makeOpaque($('#previewpanel'));
    $('#details').hide();
    var n, str, errors, ft;
    
    errors = '';
    
    if ($('#upload')[0].files.length === 0 || $('#upload-thumb')[0].files.length === 0)
        errors = '<p>Choose both a file and its thumbnail to upload</p>';

    else if (!legalThumb($('#upload')[0].files[0].name, $('#upload-thumb')[0].files[0].name)) {
        errors += '<p>Thumbnail name does not match filename</p>';
        
        if (!legalTypes.includes($('#upload')[0].files[0].type))
            errors += '<p>Illegal file type ' + $('#upload')[0].files[0].type + '</p>';
        }
    if ( ! $('#dn-changes  ').val())
        errors += '<p>Please enter a display name for this file</p>';
    
    if ($('#grade-drop-menu').val() || $('#subject-drop-menu').val() && !$('#chapter-drop-menu').val() )
        errors += '<p>Must specify a specific chapter to set</p>';
    
    if ($('#cl_lo').val() > $('#cl_hi').val())
        errors += '<p> "Low grade" must be less than or equal to  "High grade"</p>';
    
    if (errors) {  //validation here
        LOOMA.alert(errors + '<p>Modify  and re-submit</p>');
    } else {
    
        str = $('#upload')[0].files[0].type;
        n = str.lastIndexOf("/");
        ft = str.substring(n+1);
        $('#ft-changes')[0].value = ft;
        
//NOTE: the following code to submit the form with file uploads is tricky.
//  1. must use FormData object to properly encode the file update information
//  2. must use 'processData:false' to keep jQ from stringifying the form data
//  3. must use 'contentType:false' to keep jQ from overriding the contenttype of the form
//  4. see also the code in looma-database-utilities.php that handles this ajax
//
// ALSO, the server side settings, in php.ini, like file_uploads, post_max_size, and upload_max_filesize, may have to be adjusted
//
        
        LOOMA.confirm('Upload file and thumbnail?',
            function() {
                $('#details').hide();
                var formData = new FormData($('#changes')[0]);
                    $.ajax("looma-database-utilities.php",
                          {type:'post',
                           processData:false,
                           contentType:false,
                           data: formData,
                           //dataType: 'json',
                           success:function (result) {LOOMA.alert('Upload: ' + result,0,true);},
                           error:  function (result,status) {LOOMA.alert('ERROR: ' + status,0,true);}
                          }
                    );
            },
            function(){$('#details').hide(); console.log('File upload canceled by user');}
        );
        
    }
};  //  end submitChanges()

$(document).ready(function() {
    
    loginname = LOOMA.loggedIn();
    
    //$('#details').draggable();
    
    $("#keyword-changes .keyword-dropdown").change(showKeywordDropdown);
    
    $("#upload").on('change', function() {
        var fn = $(this).val().replace('C:\\fakepath\\','');
        $('#filename').text(fn);
        var src = $("#source-div input[type='radio']:checked").val();
        if (src) var fp = defaultfolder(src);
        else         fp = LOOMA.filepath(LOOMA.extension(fn));
        $('input[name="fp"]').val(fp);
    });
    
    $("#upload-thumb").on('change', function() {
        $('#thumbname').text( $(this).val().replace('C:\\fakepath\\',''));
    });
    
    // NOTE: add onchange (grade-chng-menu) -> clear subject and chapter
    $("#grade-chng-menu, #subject-chng-menu").change(function() {
        showChapterDropdown(null, $('#grade-chng-menu'), $('#subject-chng-menu'), $('#chapter-chng-menu'))
    });
    
    $('#cl_lo').change(function(){if($(this).val() < 1) $(this).val(1);}) //could also change cl_hi to stay > cl_lo
    $('#cl_hi').change(function(){if($(this).val() >10) $(this).val(10);});  //could also change cl_lo to stay < cl_hi;

    $('#source-div input').attr('disabled', false);
    
    $('#dn-clear').click(       function(e) {e.preventDefault(); $('#dn-changes').val(""); });
    $('#fp-clear').click(       function(e) {e.preventDefault(); $('#fp-changes').val(""); });
 
    $('#keyword-clear').click(  function(e) {e.preventDefault(); setRootKeyword(); });
 
    $('#source-clear').click(   function(e) {e.preventDefault(); $('input[name="src[]"]').prop('checked', false); });
    $('#textbook-clear').click( function(e) {e.preventDefault(); $('.chapter-changes').val(""); });
    $('#clear-changes').click(  function() {$('.chng-clear').click();});
    $('#submit-changes').click( confirmChanges );
    $('#user-submit').click(submitChanges);
    $('#user-cancel').click(cancelChanges);
    
    $('#dismiss').off('click').click( function() {
        LOOMA.confirm('Leave Import Content Page?',
            function() {window.history.back();},
            function() {return;});
    });
    
}); // end document.ready
