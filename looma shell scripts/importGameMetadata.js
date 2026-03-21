// mongo terminal program "importGameMetadata."
//      input from a TSV file
//          each line of which contains:
//              fields[0]: dn
//              fields[1]: ch_id  (single value)
//              fields[2]: cl_lo
//              fields[3]: cl_hi
//          inserts fields into the games and their activities documents based on matching DN and FT===game
//
//  make sure there is a file 'gameMetadataToImport.tsv' in TAB-SEPARATED format, in the current directory
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
        if (document['ch_id'] && typeof document['ch_id'] === 'string') document['ch_id'] = [document['ch_id']];

        if ( document['ch_id'] )
        {if (! document['ch_id'].includes(id)) document['ch_id'].push(id);}
        else
        { document['ch_id'] = [id]; }
    }
}

var input = 'gameMetadataToImport.tsv';
print ('Importing from file: ' + input);

var file = cat(input);  // read  the file (for now, specifying a path doesnt work)
var lines = file.split(/[\r\n]+/);  // split file into array of lines containing ()
print ('Processing ' + lines.length + ' lines');

lines.forEach( function(doc) {
    requestcount++;
    // print(requestcount + '-' + dn + '[' + ft + ']');

    var fields = doc.split('\t');  //split the line on tab's

    var dn = fields[0];
    var ch_id = fields[1].trim();
    var cl_lo = fields[2].trim();
    var cl_hi = fields[3].trim();


    query = {'title':  dn, 'ft': 'game' };    // query to look for NEW resource files

    var games = db.games.find(query);

    if (!games.hasNext()) print(requestcount + ' - - title: ' + dn + '       NOT FOUND in games collection');
    else
    if (games.length > 1) {
        print('*************NOTE: duplicate GAME FOUND, Name = ' + dn + ' ft = game');
        duplicates++;
    }
    else {
        // print (requestcount);

        var game = games.next();

        if (game) {

            var activities = db.activities.find({ft:'game',dn:dn});
            if (activities && activities.hasNext()) {
                var activity = activities.next();

            } else print (' + + + + + + + no activity found for game ' + dn);

            if (fields[1]) insertCh_id(fields[1], activity);

            if (fields[2]) game['cl_lo'] = fields[2];
            if (fields[3]) game['cl_hi'] = fields[3];

        //    if (param === 'dryrun')  print('NEW game: ' + JSON.stringify(game, null, 2));
        //    if (param === 'dryrun')  print('NEW activity: ' + JSON.stringify(activity, null, 2));

            if (param === 'run') db.games.replaceOne({_id: game._id}, game);
            changecount++;
        }
    }
});  // end foreach doc

print('');
print('+++++  ' + requestcount + '  lines processed');
if (param === 'run') print('+++++  ' + changecount + '  changes made');
else print('+++++  DRYRUN: ' + changecount + '  changes would have been made');
print('+++++  ' + duplicates + '  duplicates found');
