/*
LOOMA javascript file
Filename: lessonRemoveEmptyNepali.js

scan all lessons and remove "data.nepali" fields that are "undefined" or $type !== "string"

Programmer name: Skip
Date: JUN 2024
Revision: 1.0
Looma version 7.17

run in mongo shell with
    use looma
    load('lessonRemoveEmptyNepali.js')

set var param='run' to make changes
set var param='dryrun' to test without changes

 */

'use strict';
var count, converted;
count = 0;converted = 0;

var cursor = db.lessons.find({$and:[{"data.nepali":{$exists:true}}, {"data.nepali":{ $not:{$type: "string" }}}]});

while (cursor.hasNext()) {
    var lesson = cursor.next();
    count++;
    print('processing: ' + lesson.dn);
    var changes = false;
    lesson.data.forEach( function(element) {
        delete element.nepali;
        changes++;
    });
    
    if (changes) {
        converted++;
        print("deleted " + changes + " data.nepali fields")
        if (param === 'run') db.lessons.replaceOne({'_id':lesson._id}, lesson);
    } else print('         no changes');
}

print();
if (param !== 'run') print('  DRYRUN - no changes made');
print(' processed ' + count + ' lessons, and converted ' + converted);
print();
