// One time mongo terminal program to fix DNs
// each line formatted as:   ch_id, DN, NDN
//
// create the input file 'ndnsToFix.txt'
// and CD to the folder holding that input file
//
//  in terminal: "mongo looma"
//  then run this file in the MONGO SHELL with: load('fixDnsL.js')
//
"use strict";

var input = 'ndnsToFix.txt'
var file = cat(input);  // read  the file (for now, specifying a path doesnt work)
var count = 0;

var dns = file.split(/[\r\n]+/);  // split file into array of dn's

dns.forEach( function(dn) {
    
    if (dn) {
        var fields = dn.split(/\t/);  // split file into array of ch_id, dn, ndn
    
        var chapters = db.chapters.find({'_id':fields[0],$or:[{ft:'chapter'},{ft:'section'}]});
        if (chapters.count() === 0) print ('no entry found for ' + fields[0] + ' (' + fields[8] + ')');
         else {
             var chapter = chapters.next();
            chapter['ndn'] = fields[9];
             if (param === 'run') {
                 db.chapters.replaceOne({'_id':chapter._id}, chapter);
                 db.activities.updateOne({'ID':chapter._id},{$set:{'ndn':fields[9]}});
             };
             count++;
             print (count + '  **** set "ndn" field of ' + fields[0] + ' (' + fields[8] + ') to ' + fields[9]);
         }
    }
});  // end foreach dns
print('');

if (param === 'run') print('set ' + count + ' ndn fields');
else                 print('DRYRUN: would have set ' + count + ' ndn fields');
