// file: tagchapters.js
//
// mongo terminal program to read a CHAPTER ID & KEYWORDS list file and register the keywords with the chapters in  mongoDB
//
// assumptions: each chapter is described on a separate line of the input file
//      format of a line is: ch_id,keyword1,keyword2,keyword3,keyword4
//      OR, if not all keywords are used trailing commas are OK [e.g. ch_id,key1,key2,,]
//      fields separated by comma, no TABS in the input file. spaces are considered part of the keyword name
//      ch_id must be correct Looma format chapter ID, this is not verified by the program
//
//      process for making chapterkeywords.txt:
//          1. excel document
//          3. select all
//          4. paste to keyword.txt
//
//  (for now) chapterkeywords.txt must be in the same DIR as this code
//  process many chapters at once, or a few at a time
//  start MONGO in LOOMA db with: 'mongo looma'
//  run in MONGO SHELL with: load('tagchapters.js')
//
"use strict";

var input = "chapterkeywords.csv";  //NOTE: change this to specify filename as a calling parameter
print ('********************');
print ('Importing keywords for chapters from ' + input);
print ('********************');

var file = cat(input);  // read  the file (for now, file must be in the current working directory, specifying a path doesnt work)

var count = 0;
var chapter;
var keys = [null, null, null, null];

function addKeywords(ch_id, keys ) {
    "use strict";
    var keywords ={};
    //DEBUG: print('   FOR ' + ch_id + ' adding key1: *' + keys[1] + '* key2: *' + keys[2] + '* key3: *' + keys[3] + '* key4: *' + keys[4] + '*');
    for  (var i=1; i<=4; i++) {  //NOTE: start at keys[1], because keys[0] is the ch_id
        if ( keys[i] && keys[i] !=='' && keys[i].length > 0) keywords['key' + i] = keys[i];
    }
    print (ch_id);
    for (var key in keywords) print('**/' + key + ':' + keywords[key] +'/**');
    
    db.chapters.update({'_id':ch_id},{$set:keywords});
    
    count++;
};

function verify(chapter, keys) {
    // check validity of this line
    //  regex match CH_ID, parts.length > 0, etc
    // on error, print message and exit program
    return true; };

var lines = file.split(/[\r\n]+/);  // split file into array of lines

lines.forEach( function(line) {
    
    if (line != '')
    {
        // strip off trailing commas
        while (line.charAt(line.length - 1) === ",") line = line.slice(0,-1);
        print('  cleaned    line:    ' + line);
      
        keys = line.split(',');  // split line into array of keywords
        chapter = keys[0];       // first word of the line is the CH_ID
        
        if (verify(line)) { addKeywords(chapter, keys) }
        else {print('ERROR on line (' + count + ') ' + line);}
    }
});  // end foreach lines
print ('********************');
print('DONE: ' + count + ' lines processed');
print ('********************');
