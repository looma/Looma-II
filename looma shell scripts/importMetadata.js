// mongo terminal program "importMetadata."
//      input from a TSV file
//          each line of which contains:
//              fields[0..1]: dn  ndn
//              fields[2..6]: ch_id.1	ch_id.2	ch_id.3	ch_id.4 ch_id.5
//              fields[7..9]: cl_lo	cl_hi lang
//              fields[10..13]: key1	key2	key3	key4
//              fields[14..16]: fn   nfn   ft
//          inserts fields into the activities based on matching DN and FT
//
//  make sure there is a file 'metadataToImport.tsv' in TAB-SEPARATED format, in the current directory
//  start MONGO in LOOMA db with: 'mongo looma'
//  run in MONGO SHELL with: load('importMetadata.js')
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

function insertCh_id(id, document) {
    id = id.trim();
    if ( id  && document ) {
        if (document['ch_id'] && typeof document['ch_id'] === 'string') document['ch_id'] = [document['ch_id']];

        if ( document['ch_id'] )
            {if (! document['ch_id'].includes(id)) document['ch_id'].push(id);}
        else
            { document['ch_id'] = [id]; }
      }
    }

var input = 'metadataToImport.tsv';
print ('Importing from file: ' + input);

var file = cat(input);  // read  the file (for now, specifying a path doesnt work)
var lines = file.split(/[\r\n]+/);  // split file into array of lines containing ()
print ('Processing ' + lines.length + ' lines');

lines.forEach( function(doc) {
    requestcount++;
    // print(requestcount + '-' + dn + '[' + ft + ']');

    var fields = doc.split('\t');  //split the line on tab's

    var dn = fields[0].trim();
    var ndn = fields[1].trim();
    var ft = fields[16].trim().toLowerCase(); if (ft === 'ep') ft = "EP";
    var fn = fields[14].trim();
    var nfn = fields[15].trim();

    query = {'fn':  fn, 'ft': ft };    // query to look for NEW resource files
    //query = {'dn':  dn, 'ft': ft };      // query to look for existing resource files

    var activities = db.activities.find(query);

        if (!activities.hasNext()) print(requestcount + ' - - fn: ' + fn + '- - - - - - dn: ' + dn + ' and ft: ' + ft + '       NOT FOUND');
        else
            if (activities.length > 1) {
                print('*************NOTE: duplicate ACTIVITY FOUND, Name = ' + dn + ' ft = ' + ft);
                duplicates++;
            }
        else {
           // print (requestcount);

            var activity = activities.next();

            if (activity) {
                if (fields[0]) activity['dn'] = fields[0];
                if (fields[1]) activity['ndn'] = fields[1];

                if (fields[2]) insertCh_id(fields[2], activity);
                if (fields[3]) insertCh_id(fields[3], activity);
                if (fields[4]) insertCh_id(fields[4], activity);
                if (fields[5]) insertCh_id(fields[5], activity);
                if (fields[6]) insertCh_id(fields[6], activity);

                if (fields[7]) activity['cl_lo'] = fields[7];
                if (fields[8]) activity['cl_hi'] = fields[8];

                if (fields[9]) activity['lang'] = fields[9];

            //  the following "key" code should be modified, to:
            // only modify key<n+1> if key<n> is being set
            // if key<n> is being set and key<n+1> not being modified, delete key<n+1>, key<n+2> ...

                if (fields[10]) activity['key1'] = fields[10];
                if (fields[11]) activity['key2'] = fields[11];
                if (fields[12]) activity['key3'] = fields[12];
                if (fields[13]) activity['key4'] = fields[13];

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
