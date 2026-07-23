// mongo terminal program "importCH_IDsForWorksheets.js"
//      input from a tab separated file
//          each line of which has:
//          DN 	NDN  CH_ID  SUBJECT  LANG  CL_LO  CL_HI  FN  FT  LOT
//           0    1     2       3       4     5      6    7   8   9
//
//      looks up FN + FT in activities collection, and inserts the other fields into that document
//
//  make sure there is a file 'ch_idsToImportforWorksheets.txt' in the current directory
//  start MONGO in LOOMA db with: 'mongo looma'
//      enter var param = 'dryrun' to dry run, or var param = 'run' to actually make changes in the database
//  run in MONGO SHELL with: load('importCH_IDsForWorksheets.js')
//

//"use strict";


/////////////////////////
//  verification function that check validity of incoming ch_id
////////////////////////

function today () {
    const today = new Date();

    const yyyy = today.getFullYear();
    const mm   = String(today.getMonth() + 1).padStart(2, '0'); // 01-12
    const dd   = String(today.getDate()).padStart(2, '0');      // 01-31
    return `${yyyy} ${mm} ${dd}`;
};  // end today()


function legalCH_ID(ch,dn) {
    var char = ch.replace(/\s/g,'');
    if (char && char.length>0) {
        var legal = db.chapters.find({"_id": char});
        if (legal.length() === 0 && char) {
            print(requestcount + "      ************************** illegal ch_id:     " + char + " for " + dn);   // + '     for activity ' + act.dn + ' (type: ' + act.ft + ')');
            illegalcount++;
            return false;
        } else return true;
    }
}
var requestcount = 0;
var changecount  = 0;
var illegalcount = 0;

var input = 'ch_idsToImportforWorksheets.txt';
print ('Importing CH_IDs from ' + input);
var file = cat(input);  // read  the file (for now, specifying a path doesnt work)

var docs = file.split(/[\r\n]+/);  // split file into array of lines containing (DN, FN, CH_IDs)

print ('Processing ' + docs.length + ' lines');
print();

docs.forEach( function(doc) {
    var cl_lo, cl_hi, dn, ndn, ch_id, subject, lang, fn, ft, lot;
    var fields = doc.split(/\t/);  //split the line on TABs
    fn = fields[7]; ft = fields[8];
    requestcount++;
    if (fn !==  "" && ft === 'worksheet') {
        dn = fields[0]; ndn = fields[1];
        ch_id = fields[2]; subject = fields[3]; lang = fields[4];
        cl_lo = fields[5];  cl_hi = fields[6];  lot = fields[9];


        var query = { 'fn': fn, 'ft': ft };

        var activities = db.activities.find(query);
        var duplicates = 0;
        if (!activities.hasNext()) print('ACTIVITY NOT FOUND     ' + fn );
        while (activities.hasNext()) {
            var activity = activities.next();
            duplicates++; if (duplicates > 1) print(requestcount + '     *************NOTE: duplicate ACTIVITY FOUND, Name =      ' + fn );

            if (dn) activity['dn'] = dn;
            if (ndn) activity['ndn'] = ndn;
            if (ch_id) activity['ch_id'] = [ch_id];
            if (subject) activity['subject'] = [subject];
            if (lang) activity['lang'] = lang;
            if (cl_lo) activity['cl_lo'] = Int32(cl_lo);
            if (cl_hi) activity['cl_hi'] = Int32(cl_hi);
            if (lot) activity['lot'] = lot;
            activity['date'] = today();

            if (param === 'run') db.activities.update({_id: activity._id}, activity);

            changecount++;
            print(requestcount + ' - - CHANGING              ' + fn );
        }
    } else print('*******    BAD INPUT LINE: ' + doc);
});  // end foreach doc

print('');
print('+++++  ' + requestcount + '  lines processed');
print('+++++  ' + changecount + '  changes made');

