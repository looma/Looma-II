// mongo terminal program to read a file containing EN keywords and their NP translations
// each line formatted as:   english,nepali
// and add translations to TAGS collection in mongoDB
//
// create the input file 'keyword-translations.txt'
// and CD to the folder holding that input file
//
//  in terminal: "mongo looma"
//  then run this file in the MONGO SHELL with: load('tag-translate.js')
//
"use strict";

var input = 'keyword-translations.txt';
print ('Importing keywords from ' + input);
var file = cat(input);  // read  the file (for now, specifying a path doesnt work)
var words, english, nepali;

var lines = file.split(/[\r\n]+/);  // split file into array of lines

lines.forEach( function(line) {
    
    if (line != '')
    {
        words = line.split(',');
        english = words[0];
        nepali = words[1];
        
        print('english: ' + english + ' || nepali: ' + nepali);  //DEBUG
        
        db.tags.update({'name':english},{$set:{'ndn':nepali}},{multi:true});
        
    }
});  // end for lines
print('');

// this program has a BIG bug - it updates 'ndn' but not the 'ndn' of 'children' of 'name'
/*
The code needs to have something like this added (given <name> and <ndn>):

db.tags.update({'name':'Agriculture','children.name':/Farming/},{$set:{'children.$.ndn':'XXXXX'}})

     db.tags.update (
        { "name": "<name>", "children.name": "<childname>" },
        {  $set: { "children.$.ndn": "<ndn>" }},
        {multi:true}
     );
 */