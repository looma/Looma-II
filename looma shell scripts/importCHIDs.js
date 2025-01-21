// mongo terminal program "importCHIDs"
//      input from a CSV file
//          each line of which is a DN, FT, CH_LO, CH_HI
//          (low and high class appropriate for this media file)
//          inserts fields into the activities fields  corresponding to the DN + FT pair
//
//  make sure there is a file 'ch_idToImport.csv' in TAB-SEPARATED format, in the current directory
//  start MONGO in LOOMA db with: 'mongo looma'
//  run in MONGO SHELL with: load('importCHIDs')
//
//"use strict";

var requestcount = 0;
var changecount = 0;

function insert(id, document) {
    if ( id )
        if ( document['ch_id]'] )
            {if (! document['ch_id'].includes(id)) document['ch_id'].push(id);}
        else
            { document['ch_id'] = []; document['ch_id'].push(id);}
    }
    
var input = 'RBS 3 to 7 games.csv';
print ('Importing from file: ' + input);
var file = cat(input);  // read  the file (for now, specifying a path doesnt work)

var lines = file.split(/[\r\n]+/);  // split file into array of lines containing (DN, FN, CH_LO, cl_HI)

print ('Processing ' + lines.length + ' lines');

lines.forEach( function(doc) {
    var fields = doc.split(/\,/);  //split the line on comma's
    if (fields[0] !== "" && fields[1] !== "") {
        var displayname = fields[0];
        var filetype = fields[1];

        if (filetype === 'mp4') filetype = "{$or:['video','mp4']}";
        
        requestcount++;
     //   print(requestcount + '-' + displayname + '[' + filetype + ']');
        
        var activities = db.activities.find({ 'ft': filetype.trim(),'dn':displayname.trim()});
        var duplicates = 0;
        if (!activities.hasNext()) print(requestcount + '-' + displayname + '[' + filetype + ']        NOT FOUND');
        while (activities.hasNext()) {
            var activity = activities.next();
            duplicates++; if (duplicates > 1) print('*************NOTE: duplicate ACTIVITY FOUND, Name = ' + displayname);
    
           // dn  ft	ch_id.1	ch_id.2	ch_id.3	cl_lo	cl_hi	key1	key2	key3	key4
            insert(fields[2],activity);
            insert(fields[3],activity);
            insert(fields[4],activity);
            
            if (fields[5])  activity['cl_lo'] = fields[5];
            if (fields[6])  activity['cl_hi'] = fields[6];
            if (fields[7])  activity['key1']  = fields[7];
            if (fields[8])  activity['key2']  = fields[8];
            if (fields[9])  activity['key3']  = fields[9];
            if (fields[10]) activity['key4']  = fields[10];
    
            if (param !== 'dryrun') db.activities.replaceOne({_id: activity._id}, activity);
            changecount++;
            print(' - - CHANGED fields for ' + displayname);
            print ('     TO ' + fields[2] + ',' + fields[3] + ',' + fields[4] + ',' + fields[5] + ',' + fields[6]+'*');
            print ('    AND ' + fields[7] + ',' + fields[8] + ',' + fields[9] + ',' + fields[10]);
        }
    } else print('*******    BAD INPUT LINE: ' + doc);
});  // end foreach doc

print('');
print('+++++  ' + requestcount + '  lines processed');
print('+++++  ' + changecount + '  changes made');
