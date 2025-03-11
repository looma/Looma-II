// One time mongo terminal program to fix some lang field settings
// each line formatted as:   DN
//
// create the input file 'dnsToFix.txt'
// and CD to the folder holding that input file
//
//  in terminal: "mongo looma"
//  then run this file in the MONGO SHELL with: load('fixLangFields.js')
//
"use strict";

var input = 'dnsToFix.txt'
var file = cat(input);  // read  the file (for now, specifying a path doesnt work)
var lang = 'np';
var count = 0;

var dns = file.split(/[\r\n]+/);  // split file into array of dn's

dns.forEach( function(dn) {
    
    if (dn) {
   
        var activities = db.activities.find({$or:[{'dn':dn},{'ndn':dn}],ft:{$ne:'quiz'},ft:{$ne:'lesson'}});
      //  if (activities.count() > 1) print ('duplicate entries found for ' + dn);
       // else
            if (activities.count() === 0) print ('no entry found for ' + dn);
   /*
        else {
            var activity = activities.next();
            activity['lang'] = lang;
            if (param === 'run') db.activities.replaceOne({'_id':activity._id}, activity);
            count++;
            print (count + '  **** set "lang" field of ' + dn + ' to ' + lang);
        }
   */
    }
});  // end foreach dns
print('');

if (param === 'run') print('set ' + count + ' lang fields to ' + lang);
else             print('DRYRUN: would have set ' + count + ' lang fields to ' + lang);
