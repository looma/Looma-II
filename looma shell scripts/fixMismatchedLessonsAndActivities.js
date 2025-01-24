// ONE TIME program to ensure that lesson DNs match their activity entries
//
//  run in MONGO SHELL with: load('fixMismatchedLessonsAndActivitiesljs')
//  SKIP    20 DEC 2024
//

var cursor, count, bad;

cursor = db.activities.find({'ft':'lesson'});
count = 0; bad = 0;

while (cursor.hasNext()) {
    var activity = cursor.next();
    count++;
    
    var lesson = db.lessons.findOne({'_id':activity['mongoID']});
   
    if (lesson['dn'] !== activity['dn']) {
       // print(' activity ' + activity['dn'] + ' doesnt match lesson ' + lesson['dn']);
        print(' changing DN of lesson ' + lesson['dn'] + ' to ' + activity['dn']);
        bad++;
        lesson['dn'] = activity['dn'];
        if (param === 'run') db.lessons.update({_id:lesson['_id']}, lesson);
    }
};

print('_______________');
if (param === 'run') print(' + + + changed ' + count + ' activities');
else                 print(' "dryrun" - no changes made - found ' + bad + ' mismatches in ' + count + ' lessons');
print('_______________');
