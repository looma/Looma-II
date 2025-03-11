// mongo terminal program "removeCH_IDs.js"
//      input from a TSV file
//          each line of which contains:
//              fields[0]: dn
//              fields[1..5]: ch_id.1 ch_id.2	ch_id.3	ch_id.4	ch_id.5
//
//          deletes ch_id's fields from the activity
//
//  make sure there is a file 'ch_idsToRemove.tsv' in TAB-SEPARATED format, in the current directory
//  start MONGO in LOOMA db with: 'mongo looma'
//  run in MONGO SHELL with: load('removeCH_IDs.js')
//
//"use strict";

var requestcount = 0;
var changecount = 0;
var duplicates = 0;
var query;

function removeCh_id(id, document) {
    id = id.trim();
  //  print('removing ch_id '  + id + ' from document ' + document.dn);
    if (param === 'run') db.activities.updateOne({_id:document['_id']},{$pull:{ch_id:[id]}})
}

var input = 'ch_idsToRemove.tsv';
print ('Importing from file: ' + input);

var file = cat(input);  // read  the file (for now, specifying a path doesnt work)
var lines = file.split(/[\r\n]+/);  // split file into array of lines containing ()
print ('Processing ' + lines.length + ' lines');

lines.forEach( function(doc) {
    requestcount++;
    // print(requestcount + '-' + dn + '[' + ft + ']');
    
    var fields = doc.split('\t');  //split the line on tab's
    
    var dn = fields[0].trim();
    
    query = {'dn':  dn};
    //   if (ft === 'video' || ft === 'mp4' || ft === 'mov')
    //       query = {'dn': dn,'$or':[{'ft':'video'},{'ft':'mp4'},{'ft':'mov'}]};
    //   if (ft === 'audio' || ft === 'mp3' || ft === 'm4a')
    //       query = {'dn': dn,'$or':[{'ft':'audio'},{'ft':'mp3'},{'ft':'m4a'}]};
    //   if (ft === 'image' || ft === 'jpg' || ft === 'png' || ft === 'jpeg')
    //       query = {'dn': dn,'$or':[{'ft':'jpg'},{'ft':'image'},{'ft':'png'},{'ft':'jpeg'}]};
    
    var activities = db.activities.find(query);
    
    if (!activities.hasNext()) print(requestcount + ' - - - - - - - -' + dn + '       NOT FOUND');
    else
    if (activities.count() > 1) {
        if (dn) {
        //    print('*************NOTE: duplicate ACTIVITIES FOUND, DN = ' + dn );
            duplicates++;
        }
    }
    else {
        var activity = activities.next();
        
        if (activity) {
            if (fields[1]) removeCh_id(fields[1], activity);
            if (fields[2]) removeCh_id(fields[2], activity);
            if (fields[3]) removeCh_id(fields[3], activity);
            if (fields[4]) removeCh_id(fields[4], activity);
            if (fields[5]) removeCh_id(fields[5], activity);
        
            changecount++;
        }
    }
});  // end foreach doc

print('');
print('+++++  ' + requestcount + '  lines processed');
print('+++++  ' + changecount + '  changes made');
print('+++++  ' + duplicates + '  duplicates found');
