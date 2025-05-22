// One time mongo terminal program to fix page numbers for a chapter
// each line formatted as:   ch_id, npn, nlen     NOTE: these are pages in nepali textbook
//
// create the input file '12SS new page numbers.txt'
// and CD to the folder holding that input file
//
//  in terminal: "mongo looma"
//  then run this file in the MONGO SHELL with: load('fixPageNumbers.js')
//
"use strict";

var input = '12SS new page numbers.txt'
var file = cat(input);  // read  the file (for now, specifying a path doesnt work)
var count = 0;

var pages = file.split(/[\r\n]+/);  // split file into array of dn's

pages.forEach( function(page) {
    
    if (page) {
        var fields = page.split(/\t/);  // split file into array of ch_id, npn, nlen
        
        var chapters = db.chapters.find({'_id':fields[0]});
        if (chapters.count() === 0) print ('no entry found for ' + fields[0]);
        else {
            var chapter = chapters.next();
            chapter['npn'] = fields[1];
            chapter['nlen'] = fields[2];
            if (param === 'run') {
                db.chapters.replaceOne({'_id':chapter._id}, chapter);
            };
            count++;
            print (count + '  **** set "npn" and "nlen" field of ' + fields[0] + ' (npn= ' + fields[1] + ') len= ' + fields[2]);
        }
    }
});  // end foreach dns
print('');

if (param === 'run') print('set ' + count + '  items');
else                 print('DRYRUN: would have set ' + count + '  items');
