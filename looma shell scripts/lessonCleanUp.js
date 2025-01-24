/*
LOOMA javascript file
Filename: lessonCleanUp.js

delete "collection" and "id" fields from all lesson elements that are INLINE text

Programmer name: Skip
Date: Jan 2025
Revision: 1.0
Looma version 7.0

run in mongo shell with
    use looma
    load('lessonCleanUp.js')

set var param='run' to make changes
set var param='dryrun' to test without changes

 */

'use strict';
var count, converted;
count = 0;converted = 0;

var cursor = db.lessons.find({});

while (cursor.hasNext()) {
    var lesson = cursor.next();
    count++;
    //print('processing: ' + lesson.dn);
    var changes = false;
    lesson.data.forEach( function(element) {
        if ('ft' in element && element.ft === 'inline') {
            if (element.id || element.collection) {
                delete element.id;
                delete element.collection;
                changes = true;
            }
        }
    });
    
    if (changes) {
        converted++;
        if (param === 'run') db.lessons.replaceOne({'_id':lesson._id}, lesson);
        print ('changed ' + lesson.dn);
    } else print('         no conversions');
}


print();
if (param !== 'run') print('  DRYRUN - no changes made');
print(' processed ' + count + ' lessons, and converted ' + converted);
print();