// mongo terminal program "deleteCH_IDs.js"
//      input from a TSV file
//          each line of which contains:
//              fields[0..1]: dn  ch_id    // might need FT  ????
//          finds the resource named DN and removes the CH_ID from its metadata
//
//  make sure there is a file 'ch_idsToDelete.tsv' in TAB-SEPARATED format, in the current directory
//  start MONGO in LOOMA db with: 'mongo looma'
//  run in MONGO SHELL with: load('deleteCH_IDs.js')
//
//"use strict";

var requestcount = 0;
var changecount = 0;
var duplicates = 0;
var query;

//
//  column order for the .tsv file
//  dn,ndn,ch_id1,ch_id2,ch_id3,ch_id4,ch_id5,cl_lo,cl_hi,lang,key1,key2,key3,key4,fn,nfn,ft
//   0  1    2      3      4      5      6      7     8     9   10   11   12   13  14  15 16
//

function deleteCH_ID(ch_id, activity) {
    ch_id = ch_id.trim();
    if ( ch_id  && activity && activity['ch_id']) {
            const index = activity['ch_id'].indexOf(ch_id);
            if (index !== -1) activity['ch_id'].splice(index, 1); // remove 1 element at that index
        }
    };  // end deleteCH_ID()

var input = 'ch_idsToDelete.tsv';
print ('reading from file: ' + input);

var file = cat(input);  // read  the file (for now, specifying a path doesnt work)
var lines = file.split(/[\r\n]+/);  // split file into array of lines containing ()
print ('Processing ' + lines.length + ' lines');

lines.forEach( function(doc) {
    requestcount++;
    // print(requestcount + '-' + dn + '[' + ft + ']');

    var fields = doc.split('\t');  //split the line on tab's

    var dn = fields[0].trim();
    var ch_id = fields[1].trim();


    query = {'ndn':  dn };    // query to look for matching resource files
    var activities = db.activities.find(query);

    if (!activities.hasNext()) print(requestcount + '- - - - - - dn: ' + dn + '       NOT FOUND');
    else
    if (activities.length > 1) {
        print('*************NOTE: duplicate ACTIVITY FOUND, Name = ' + dn + ' ch_id = ' + ch_id);
        duplicates++;
    }
    else {
        // print (requestcount);

        var activity = activities.next();

        if (activity) {
            if (ch_id) deleteCH_ID(ch_id, activity);

            //  if (param === 'dryrun')  print(JSON.stringify(activity, null, 2));
              if (param === 'dryrun')  print(requestcount + '  activity ' + activity['dn'] + ' ch_id ' + activity['ch_id'] + ' deleted');

            if (param === 'run') db.activities.replaceOne({_id: activity._id}, activity);
            changecount++;
        }
    }
});  // end foreach doc

print('');
print('+++++  ' + requestcount + '  lines processed');
if (param === 'run') print('+++++  ' + changecount + '  changes made');
else print('+++++  DRYRUN: ' + changecount + '  changes would have been made');
print('+++++  ' + duplicates + '  duplicates found');
