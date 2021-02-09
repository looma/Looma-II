/*
Filename: looma-import-content.js
Description: version 1 [skip, Fall 2016]
Derived from looma-edit-lesson.js
Programmer name: Skip
Owner: VillageTech Solutions (villagetechsolutions.org)
 */

'use strict';

/////////////////////////// INITIALIZING  ///////////////////////////

var path;

function display_name(item) {
    var dn = item.substr(0,item.lastIndexOf('.'));
    return dn.replace( /[_\/]/g, ' ');
};

function extension(item) {
    return item.substr(item.lastIndexOf('.') + 1);
};

function display_file (item) {
    var line;
    if (item.reg.reg) { //this file is registered as an activity already
        line = '<div class="fileitem reg">';
        line += '<input type="checkbox" class="check" disabled >';
        line += 'File name: <div class="filename">' + item.fn + '</div>';
        line += 'Display name: <input type="text" disabled class="displayname" value="' + item.reg.dn + '"></div>';
     } else {
        line = '<div class="fileitem notreg">';
        line += '<input type="checkbox" class="check" value="' + item.fn + '">';
        line += 'File name: <div class="filename">' + item.fn + '</div>';
        line += 'Type: <span class="filetype">' + LOOMA.typename(extension(item.fn))  + '</span>';
        line += '&nbsp; &nbsp; &nbsp; &nbsp; &nbsp;';
        line += 'Display name: ';
        line += '<input type="text" class="dn" value="' + display_name(item.fn) + '"></div>';
    };

    $(line).appendTo($('#filelist'));
};

function get_file_list(path) {
         $('#filelist').empty();
         $('#hints').hide();
         $.post("looma-library-utilities.php",
                {cmd: "list", fp:path},
                function(filelist) {
                   if (filelist.length == 0) $('#filelist').empty().append($('<pre>        No files in this folder</pre>'));
                   else filelist.forEach(function(item) {display_file(item);});
                },
                'json'
              );
}; // end get_file_list()


function get_folder_list(path) {
         $.post("looma-library-utilities.php",
                {cmd: "open", fp:path},
                function(folderlist) {
                    var element = '<option id="parent">(' + folderlist.parent + ' ^)</option><span>(parent)</span>';
                    $(element).appendTo($('#folders'));
                  if (folderlist.list.length == 0) $('#folderlist').append($('<p>No sub-folders in this folder</p>'));
                   else {
                       folderlist.list.forEach(function(item) {
                           //ref = 'path + '/' + item + '">' + item;
                           element = '<option>' + item + '</option>';
                           $(element).appendTo( $('#folders') );
                           });
                    };
                },
                'json'
              );
}; // end get_folder_list()

function make_activities () {
        var list = [];
        $('.fileitem.notreg').each(function(index, item) { //iterate thru files that are not registered and that are checked
            if ($(item).find('.check').prop('checked')) {
             list.push({fn: $(item).find('.filename').text() ,
                 fp: path + '/' ,
                 ft:  $(item).find('.filetype').text(),
                 dn:  $(item).find('.dn').val(),
                 src:     $('#timeline #source').val()});
             
     console.log('registering: ' + $(item).find('.dn').val() + ' from file: ' + path + '/' + $(item).find('.filename').text());
             
              };
            });

        if (list.length > 0) LOOMA.confirm (
                'Registering ' + list.length + ' activities. Continue?',
                function() {
                    $.post("looma-library-utilities.php",
                        {cmd: "new_activities", list: list},
                        function(result) {console.log(result);},
                        'json'
                      );
                      get_file_list(path);
                    },
                function(){return;},
                false);
        else LOOMA.alert('No items are checked',7,true);
}; //end make_activities()

function getParent (dirname) {
    var parent = dirname.substring(0,dirname.lastIndexOf('/'));
    if (parent == '../') parent = '../content/';
    return parent;
}; //end getParent()

/////////////////////////// ONLOAD FUNCTION ///////////////////////////
window.onload = function () {
    
    path = $('#dirname').text();
    $('.foldername').text(path);

    // call looma-library.php?cmd=list&fp=path to get a list of files (not DIRs) in this folder
    get_file_list (path);
    // call looma-library.php?cmd=open&fp=path to get a list of dirs (not files) in this folder
    get_folder_list (path);

    var loginname = LOOMA.loggedIn();

    $('#folderlist').hide();
    $('#folders').change( function () {
        var destination = $('#folders').val();
        var parent = getParent($('#dirname').text());
        if (destination.indexOf('^') > -1)  window.location =  'looma-import-content.php?fp=' + parent;
        else   window.location = 'looma-import-content.php?fp=' + path + '/' + destination;
        
        /*
            if ($('#showfolders').text() == 'Change folder') {
                $('#folderlist').show();
                $('#showfolders').text('Close folder list');
            }
            else {
            $('#folderlist').hide();
            $('#showfolders').text('Change folder');
            }
            */
            return false;
        });

    $('#check').click   (function() {$('.notreg .check').prop('checked',true);});
    $('#uncheck').click (function() {$('.check').prop('checked',false);});
    
    $('#register').click (function() {make_activities();});
    $('#cancel').click (function() {$('#filelist').empty();});
    
    $('#dismiss').off('click').click( function() {
        LOOMA.confirm('Leave Import Content Page?',
            function() {window.history.back();},
            function() {return;});
    });
    
};  //end window.onload()


