// mongo terminal program "importMetadata."
//      input from a TSV file
//          each line of which contains:
//              fields[0..2]: dn  ft  fn
//              fields[3..11]: ch_id.1	ch_id.2	ch_id.3	ch_id.4	ch_id.5	ch_id.6	ch_id.7	ch_id.8. ch_id.9
//              fields[12..14]: cl_lo	cl_hi lang
//              fields[15..18]: key1	key2	key3	key4
//
//          inserts fields into the activities
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

function insertCh_id(id, document) {
    id = id.trim();
    if ( id  && document ) {
        if ( document['ch_id'] )
            {if (! document['ch_id'].includes(id)) document['ch_id'].push(id);}
        else
            { document['ch_id'] = []; document['ch_id'].push(id);}
      }
    }
    
var input = 'metadataToImport.tsv';
print ('Importing from file: ' + input);

var file = cat(input);  // read  the file (for now, specifying a path doesnt work)
var lines = file.split(/[\r\n]+/);  // split file into array of lines containing ()
print ('Processing ' + lines.length + ' lines');

//for (i=0,lines.length-1,i++) {
//    doc = lines[i];
lines.forEach( function(doc) {
    requestcount++;
    // print(requestcount + '-' + dn + '[' + ft + ']');
    
    var fields = doc.split('\t');  //split the line on tab's
    
    var dn = fields[0].trim();
    var ft = fields[1].trim().toLowerCase(); if (ft === 'ep') ft = "EP";
    var fn = fields[2].trim();
    
    query = {'ndn':  dn, 'ft':ft};
 //   if (ft === 'video' || ft === 'mp4' || ft === 'mov')
 //       query = {'dn': dn,'$or':[{'ft':'video'},{'ft':'mp4'},{'ft':'mov'}]};
 //   if (ft === 'audio' || ft === 'mp3' || ft === 'm4a')
 //       query = {'dn': dn,'$or':[{'ft':'audio'},{'ft':'mp3'},{'ft':'m4a'}]};
 //   if (ft === 'image' || ft === 'jpg' || ft === 'png' || ft === 'jpeg')
 //       query = {'dn': dn,'$or':[{'ft':'jpg'},{'ft':'image'},{'ft':'png'},{'ft':'jpeg'}]};
 
        var activities = db.activities.find(query);

        if (!activities.hasNext()) print(requestcount + ' - - - - - - - -' + dn + ' [' + ft + '] ' + fn + '       NOT FOUND');
        else
            if (activities.count() > 1) {
                print('*************NOTE: duplicate ACTIVITY FOUND, Name = ' + dn + ' fn = ' + fn);
                duplicates++;
            }
        else {
            var activity = activities.next();
            if (activity) {
                if (fields[3]) insertCh_id(fields[3], activity);
                if (fields[4]) insertCh_id(fields[4], activity);
                if (fields[5]) insertCh_id(fields[5], activity);
                if (fields[6]) insertCh_id(fields[6], activity);
                if (fields[7]) insertCh_id(fields[7], activity);
                if (fields[8]) insertCh_id(fields[8], activity);
                if (fields[9]) insertCh_id(fields[9], activity);
                if (fields[10]) insertCh_id(fields[10], activity);
                if (fields[11]) insertCh_id(fields[11], activity);
    
                if (fields[12]) activity['cl_lo'] = fields[12];
                if (fields[13]) activity['cl_hi'] = fields[13];
                
                if (fields[14]) activity['lang'] = fields[14];
    
   //  the following "key" code should be modified, to:
            // only modify key<n+1> if key<n> is being set
            // if key<n> is being set and key<n+1> not being modified, delete key<n+1>, key<n+2> ...
           
                if (fields[15]) activity['key1'] = fields[15];
                if (fields[16]) activity['key2'] = fields[16];
                if (fields[17]) activity['key3'] = fields[17];
                if (fields[18]) activity['key4'] = fields[18];
    
                if (param === 'run') db.activities.replaceOne({_id: activity._id}, activity);
                changecount++;
            }
                print(' * * * ' + requestcount + ' - - CHANGED fields for - - - ' + dn);
               // print('     ch_id(s) ' + fields[3] + ',' + fields[4] + ',' + fields[5] + ',' + fields[6]  + '*');
               // print('     ch_id(s) ' + fields[7] + ',' + fields[8] + ',' + fields[9] + ',' + fields[10]  +',' + fields[11]  + '*');
          //     print('     cl_lo, cl_hi lang ' + fields[12] + ',' + fields[13]  + ',' + fields[14] +'*');
          //     print('     keys ' + fields[15] + ', ' + fields[16] + ', ' + fields[17] + ', ' + fields[18]);
    
         
                print('     cl_lo, cl_hi lang ' + activity['cl_lo'] + ',' + activity['cl_hi']  + ',' + activity['lang'] +'*');
                print('     keys ' + activity['key1'] + ', ' + activity['key2'] + ', ' + activity['key3'] + ', ' + activity['key4']);
            }
});  // end foreach doc

print('');
print('+++++  ' + requestcount + '  lines processed');
print('+++++  ' + changecount + '  changes made');
print('+++++  ' + duplicates + '  duplicates found');
