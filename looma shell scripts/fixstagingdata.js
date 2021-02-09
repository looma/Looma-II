// ONE TIME program to
//    clean correct bad settings of 'added', 'modified', 'accepted' tags in stagingData array of staging dictionary database
//
//  run MONGO SHELL with: mongo staging
//  run in MONGO SHELL with: load('fixstagingdata.js')
//
// THINK before running this - - first save a mongodump
//

var cursor = db['staging'].find();

while (cursor.hasNext()) {
    var doc = cursor.next();
    if (doc["stagingData"]["accepted"] === true) {
        doc["stagingData"]["added"] = false;
        doc["stagingData"]["modified"] = false;
    } else if (doc["stagingData"]["modified"] === true) {
        doc["stagingData"]["added"] = false;
    }
    db['staging'].update({_id: doc._id},doc);
}
