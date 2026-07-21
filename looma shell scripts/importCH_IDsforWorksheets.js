// mongo terminal program "importCH_IDsForWorksheets.js;
//      input from a tab separated file
//          each line of which is a DN, ch_id
//          inserts all the ch_ids into the activities.ch_ids array of any document(s) corresponding to the DN with FT="worksheet"
//              note: the ch_id fields may contain multiple values, separated by commas
//
//  make sure there is a file 'ch_idsToImport.txt' in the current directory
//  start MONGO in LOOMA db with: 'mongo looma'
//      enter var param = 'dryrun' to dry run, or var param = 'run' to actually make changes in the database
//  run in MONGO SHELL with: load('importCH_IDsForWorksheets.js')
//
//"use strict";


/////////////////////////
//  verification function that check validity of incoming ch_id
////////////////////////

function legalCH_ID(ch,dn) {
    var char = ch.replace(/\s/g,'');
    if (char && char.length>0) {
        var legal = db.chapters.find({"_id": char});
        if (legal.length() === 0 && char) {
            print(requestcount + "   ******************** illegal ch_id:     " + char + " for " + dn);   // + '     for activity ' + act.dn + ' (type: ' + act.ft + ')');
            illegalcount++;
            return false;
        } else return true;
    }
}
var requestcount = 0;
var changecount = 0;
var illegalcount = 0;

var input = 'ch_idsToImport.txt';  // EP
print ('Importing CH_IDs from ' + input + ' for worksheets');
var file = cat(input);  // read  the file (for now, specifying a path doesnt work)

var docs = file.split(/[\r\n]+/);  // split file into array of lines containing (DN, FN, CH_IDs)

print ('Processing ' + docs.length + ' lines');
print();

docs.forEach( function(doc) {
    var fields = doc.split(/\t/);  //split the line on TABs
    if (fields[0] !== ""  || fields[1] !== "") {
        var displayname =       fields[0]; //.trim();
        var nepalidisplayname = fields[1]; //.trim();
        dn = displayname ? displayname : nepalidisplayname;
        requestcount++;

        var query;
        query = { 'dn': dn, 'ft': 'worksheet' };

        var activities = db.activities.find(query);
        var duplicates = 0;
        if (!activities.hasNext()) print(requestcount + '   ** ACTIVITY  with ft=worksheet NOT FOUND:      "' + dn + '"');
        while (activities.hasNext()) {
            var activity = activities.next();
            duplicates++; if (duplicates > 1) print(requestcount +'   ********NOTE: duplicate ACTIVITY FOUND, Name = ' + dn + ' ' + input);

            activity['ch_id'] = [];

            var ch_ids = fields[2].split(/\,/);
            //print('.... ch_ids are ' + ch_ids.toString());
            ch_ids.forEach   (function(x){ if(x && legalCH_ID(x,activity['dn']) && activity['ch_id'].indexOf(x) === -1) activity['ch_id'].push(x);});

            if (param === 'run') db.activities.update({_id: activity._id}, activity);
            changecount++;
            print(requestcount + ' - - adding to   ' + dn + '    - - ch_id       ' + activity['ch_id'].toString());
        }
    } else print('*******    BAD INPUT LINE: ' + doc);
});  // end foreach doc

print('');
print('+++++  ' + requestcount + '  lines processed');
if (param === 'run')
    print('+++++  ' + changecount + '  changes made');
else
    print('DRYRUN ' + changecount + '  changes would have been made');
