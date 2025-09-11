// mongo terminal program "removeBADCh_ids.js"
//
//          deletes illegal ch_id's fields from each activity
//
//  start MONGO in LOOMA db with: 'mongo looma'
//  run in MONGO SHELL with: load('removeBADCh_ids.js')
//
//"use strict";

/////////////////////////
//  verification function that check validity of a ch_id
////////////////////////

function legalCH_ID(ch,dn) {
    var char = ch.trim();
    if (char && char.length>0) {
        var legal = db.chapters.find({"_id": char});
        if ( !legal.hasNext() ) {
            print("************ NO CHAPTER FOUND FOR ch_id:     " + char + " named " + dn);
            illegalcount++;
            return false;
        } else return true;
    }
}

var changecount = 0;
var illegalcount = 0;

var activities = db.activities.find();
while (activities.hasNext()) {
    var activity = activities.next();

    if (activity && activity['ch_id']) {
        activity['ch_id'].forEach(function(ch, index) {
            if ( ! legalCH_ID(ch,activity['dn'])) {
                changecount++;
                if (param === 'run')
                    db.activities.updateOne({_id: activity['_id']}, {$pull: {ch_id:ch}});
                print (' *** ' +  activity['dn'] + ': removing ' + ch);
            }
        });
    }
}

print('');
if (param === 'run') print('+++++  ' + changecount + '  changes made');
else                 print('+++++  DRYRUN: ' + changecount + '  changes would have been made');
print (illegalcount + ' illegal ch_id\s');
