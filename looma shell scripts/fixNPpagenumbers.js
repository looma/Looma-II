// mongo terminal program to read a file containing CH ids and their  npn page numbers and enter them in db
// each line formatted as:   ch_id npn
//
// create the input file 'pagenumberfixes.txt'
// and CD to the folder holding that input file
//
//  in terminal: "mongo looma"
//  then run this file in the MONGO SHELL with: load('fixpagenumbers.js')
//
"use strict";

var input = 'pagenumberfixes.txt'
print ('Importing page numbers from ' + input);
var file = cat(input);  // read  the file (for now, specifying a path doesnt work)
var words, ch_id, npn;

var lines = file.split(/[\r\n]+/);  // split file into array of lines

lines.forEach( function(line) {
    
    if (line != '') {
        words = line.split(' ');
        ch_id = words[0];
        npn = parseInt(words[1]);
        
        print('ch_id: ' + ch_id + '    page: ' + npn);  //DEBUG
        db.chapters.update({'_id':ch_id},{$set:{'npn':npn}});
    }
});  // end for lines
print('');
