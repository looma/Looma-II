/*
LOOMA javascript file
Filename: lessonfixtranslations.js

scan all lessons and remove leading "HTML" from "data.nepali" fields [had been inserted by AI]
]

Programmer name: Skip
Date: JUN 2024
Revision: 1.0
Looma version 7.17

run in mongo shell with
    use looma
    load('lessonfixtranslations.js')

set var param='run' to make changes
set var param='dryrun' to test without changes

 */

'use strict';
var count, converted;
count = 0;converted = 0;

var cursor = db.lessons.find({"data.nepali":{$exists:true}});

while (cursor.hasNext()) {
    var lesson = cursor.next();
    count++;
    print(count);
    print('processing: ' + lesson.dn);
    var changes = false;
    lesson.data.forEach( function(element) {
  /*          if ('nepali' in element && element.nepali && (element.nepali.startsWith('html\n'))) {
                print('was: ' + element.nepali);
                element.nepali = element.nepali.slice(6);
                print('new:     ' + element.nepali);
                changes++;
            }
 */
        if ('nepali' in element && element.nepali && (element.nepali.startsWith('html'))) {
            print('was: ' + element.nepali);
            element.nepali = element.nepali.slice(4);
            print('new:     ' + element.nepali);
            changes++;
        }
    });
    
    if (changes) {
        converted++;
        print("modified " + changes + " data.nepali fields")
        if (param === 'run') db.lessons.replaceOne({'_id':lesson._id}, lesson);
    } else print('         no changes');
}

print();
if (param !== 'run') print('  DRYRUN - no changes made');
print(' processed ' + count + ' lessons, and changed ' + converted);
print();
