// program to
//    scan through specified documents in activities collection
//    and check that all CH_IDs actually point to legal CHAPTERs
//



//  run in MONGO SHELL with: load('illegalCH_IDs.js')
//

var acts;
var chcount = 0;
var illegalcount = 0;

acts = db.activities.find();
acts.forEach(function (act) {
if (act.ch_id) {
    chcount++;
    var ch_ids = act.ch_id.toString().split(",");
    
//print (act.ch_id.toString());
    
    ch_ids.forEach( function(ch) {
        var legal = db.chapters.find({"_id":ch});
        if (legal.length() === 0 && ch) {
                print("illegal ch_id:     " + ch + '     for activity ' + act.dn + ' (type: ' + act.ft + ')');
                illegalcount++;
            };
        });
    }
});

print();
print(chcount + ' activities with ch_id\'s found');

print();
print(illegalcount + ' illegal ch_id\'s found');

