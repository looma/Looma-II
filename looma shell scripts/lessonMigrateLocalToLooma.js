/*
LOOMA javascript file
file: lessonMigrateLocalToLooma.js

    moves  lessons in db=loomalocal and their activities into db=looma
    only moves lessons with field "publish"
 */

'use strict';
var count = 0;

var lesson, activity;
var dbName = db.getName();

print('DB is ' + dbName);
if (dbName !== 'loomalocal') {
    print(' must "use loomalocal" before running this script');
    exit;
}

var cursor = db.lessons.find({publish:true});

while (cursor.hasNext()) {
    lesson = cursor.next();
    count++;
    print('processing ' + db + ' lesson: ' + lesson.dn);
    activity = db.activities.findOne({"mongoID":lesson._id});
    if (! activity ) {
        print("activity not found");
        count--;
    } else if (param === 'run') {
        
        delete lesson['publish'];
        lesson['db']='looma';
        db.getSiblingDB("looma").lessons.insertOne(lesson);
        db.lessons.deleteOne({_id:lesson['_id']});
    
        activity['db']='looma';
        db.getSiblingDB("looma").activities.insertOne(activity);
        db.activities.deleteOne({_id:activity['_id']});
        
    } else {
        print('DRYRUN: would have moved lesson ' + lesson.dn + ' and activity ' + activity.dn + ' from loomalocal to looma DB');
    }
}

print();
if (param !== 'run') print('  DRYRUN - no changes made');
print(' processed ' + count + ' lessons');
print();
