// mongo terminal program "removeBADCh_ids.js"
//      input from a TSV file
//          each line of which contains:
//              fields[0]: dn
//              fields[1..5]: ch_id.1 ch_id.2	ch_id.3	ch_id.4	ch_id.5
//
//          deletes ch_id's fields from the activity
//
//  make sure there is a file 'ch_idsToRemove.tsv' in TAB-SEPARATED format, in the current directory
//  start MONGO in LOOMA db with: 'mongo looma'
//  run in MONGO SHELL with: load('removeBADCh_ids.js')
//
//"use strict";

var changecount = 0;
var limit = 999999;

var query = {nch_id:/^y/};

if (db.activities.countDocuments(query) > 0) {
    var activities = db.activities.find(query);
    
    while (activities.hasNext() && changecount <= limit) {
        var activity = activities.next();
    
        if (activity) {
            print('removing "^y" ch_ids  from document ' + activity.dn);
            if (param === 'run') {
                db.activities.updateOne({_id: activity['_id']}, {$pull: query});
                changecount++;
            } else print (' DRYRUN: no change made');
        }
    }
}
print('');
print('+++++  ' + changecount + '  changes made');
