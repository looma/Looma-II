// mongo terminal program "importMetadataEXISTINGresources.js"
/*
importMetadata.js is a MongoDB shell script that bulk-updates documents in the activities collection
  by reading metadata from a TSV file (metadataToImport.tsv). For each row in the TSV:

  1. It parses 17 tab-separated fields (display name, Nepali display name, chapter IDs, class range, language, keywords, filename, Nepali filename, file type).
  2. It queries db.activities to find a matching document by fn (filename) and ft (file type).
  3. If a unique match is found, it updates the document's fields (dn, ndn, ch_id, cl_lo, cl_hi, lang, key1–key4).
  4. It supports a param variable: 'run' writes changes to the DB, otherwise it's a dry run.
*/
//      input from a TSV file
//          each line of which contains:
//              fields[0..1]: dn  ndn
//              fields[2..6]: ch_id.1	ch_id.2	ch_id.3	ch_id.4 ch_id.5
//              fields[7..9]: cl_lo	cl_hi lang
//              fields[10..13]: key1	key2	key3	key4
//              fields[14..16]: fn   nfn   ft
//          looks up in activities collection based on FN and FT
//          inserts specified fields into the activity
//

//  make sure there is a file 'metadataToImport.tsv' in TAB-SEPARATED format, in the current directory
//  start MONGO in LOOMA db with: 'mongo looma'
//      set a variable named "param" to "run" to actually make changes to the database, or "dryrun" to just print the changes
//  run in MONGO SHELL with: load('importMetadata.js')
//
//"use strict";

//
//  column order for the .tsv file
//  dn,ndn,ch_id1,ch_id2,ch_id3,ch_id4,ch_id5,cl_lo,cl_hi,lang,key1,key2,key3,key4,fn,nfn,ft
//   0  1    2      3      4      5      6      7     8     9   10   11   12   13  14  15 16
//
const DN = 0,    NDN = 1;
const CH_ID1 = 2,CH_ID2 = 3, CH_ID3 = 4, CH_ID4 = 5, CH_ID5 = 6;
const CL_LO = 7, CL_HI =8,   LANG = 9;
const KEY1 = 10, KEY2 = 11,  KEY3 = 12,  KEY4 = 13;
const FN = 14,   NFN = 15,   FT = 16;

var requestcount = 0;
var changecount = 0;
var duplicates = 0;
var query;


function today () {
    const today = new Date();

    const yyyy = today.getFullYear();
    const mm   = String(today.getMonth() + 1).padStart(2, '0'); // 01-12
    const dd   = String(today.getDate()).padStart(2, '0');      // 01-31
    return `${yyyy} ${mm} ${dd}`;
};  // end today()

function insertCh_id(id, document) {
    id = id.trim();
    if ( id  && document ) {
        // next line corrects some ch_id's that are single string instead of array of strings
        if (document['ch_id'] && typeof document['ch_id'] === 'string') document['ch_id'] = [document['ch_id']];

        if ( document['ch_id'] )
            // next line inserts "id" into the ch_id array if it is not already there
        {if (! document['ch_id'].includes(id)) document['ch_id'].push(id);}
        else
        { document['ch_id'] = [id]; }
    }
}

var input = 'data files/metadataEXISTINGToImport.tsv';
print ('Importing from file: ' + input);

var file = cat(input);  // read  the file (for now, specifying a path doesnt work)
var lines = file.split(/[\r\n]+/);  // split file into array of lines containing ()
print ('Processing ' + lines.length + ' lines');

lines.forEach( function(doc) {
    if (!doc.trim()) return; // skip empty lines
    requestcount++;
    // print(requestcount + '-' + dn + '[' + ft + ']');

    var fields = doc.split('\t');  //split the line on tab's

    var dn = fields[DN].trim();
    var ndn = fields[NDN].trim();
    var ft = fields[FT].trim().toLowerCase(); if (ft === 'ep') ft = "EP";
    var fn = fields[FN].trim();
    var nfn = fields[NFN].trim();

    var display = dn ? dn : ndn;
    query = {'dn':  display, 'ft': ft };    // query to look for EXISTING resource files used DN and FT
                                            // for NEW resources it would be FN and FT
    var activities = db.activities.find(query);

    if (!activities.hasNext()) { //not found
        print(requestcount + ' - - fn: ' + fn + '- - - - - - dn: ' + dn + ' and ft: ' + ft + '       NOT FOUND');
    } else
    if (activities.count() > 1) {
        print('*************NOTE: duplicate ACTIVITY FOUND, Name = ' + dn + ' ft = ' + ft);
        duplicates++;
    }
    else {
        // print (requestcount);

        var activity = activities.next();

        if (activity) {

            activity['date'] = today();
            if (fields[DN]) activity['dn'] = fields[DN];
            if (fields[NDN]) activity['ndn'] = fields[NDN];

            if (fields[CH_ID1]) insertCh_id(fields[CH_ID1], activity);
            if (fields[CH_ID2]) insertCh_id(fields[CH_ID2], activity);
            if (fields[CH_ID3]) insertCh_id(fields[CH_ID3], activity);
            if (fields[CH_ID4]) insertCh_id(fields[CH_ID4], activity);
            if (fields[CH_ID5]) insertCh_id(fields[CH_ID5], activity);

            if (fields[CL_LO]) activity['cl_lo'] = fields[CL_LO];
            if (fields[CL_HI]) activity['cl_hi'] = fields[CL_HI];

            if (fields[LANG]) activity['lang'] = fields[LANG];

            //  the following "key" code should be modified, to:
            // only modify key<n+1> if key<n> is being set
            // if key<n> is being set and key<n+1> not being modified, delete key<n+1>, key<n+2> ...

            if (fields[KEY1]) activity['key1'] = fields[KEY1];
            if (fields[KEY2]) activity['key2'] = fields[KEY2];
            if (fields[KEY3]) activity['key3'] = fields[KEY3];
            if (fields[KEY4]) activity['key4'] = fields[KEY4];

            //  if (param === 'dryrun')  print(JSON.stringify(activity, null, 2));

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
