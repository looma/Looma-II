/*
LOOMA javascript file
file: slideshowMigrateLocalToLooma.js

    moves  slideshows in db=loomalocal and their activities into db=looma
    only moves slideshows with field "publish"
 */

'use strict';
var count = 0;

var slideshow, activity;
var dbName = db.getName();

print('DB is ' + dbName);
if (dbName !== 'loomalocal') {
    print(' must "use loomalocal" before running this script');
    quit();
}

var cursor = db.slideshows.find({publish:'true'});

while (cursor.hasNext()) {
    slideshow = cursor.next();
    count++;
    print('processing ' + db + ' slideshow: ' + slideshow.dn);
    activity = db.activities.findOne({"mongoID":slideshow._id});
    if (! activity ) {
        print("activity not found");
        count--;
    } else if (param === 'run') {

        delete slideshow['publish'];
        slideshow['db']='looma';
        db.getSiblingDB("looma").slideshows.insertOne(slideshow);
        db.slideshows.deleteOne({_id:slideshow['_id']});

        activity['db']='looma';
        db.getSiblingDB("looma").activities.insertOne(activity);
        db.activities.deleteOne({_id:activity['_id']});

    } else {
        print('DRYRUN: would have moved slideshow ' + slideshow.dn + ' and activity ' + activity.dn + ' from loomalocal to looma DB');
    }
}

print();
if (param !== 'run') print('  DRYRUN - no changes made');
print(' processed ' + count + ' slideshows');
print();
