/*
LOOMA javascript file
Filename: lessonmerge

Programmer name: Skip
Date: SEP 2024
Revision: 1.0
Looma version 7.0

run in mongo shell with
    use looma
    load('lessonconvert')

reads in all lessons, converts text_file references to "inline" texts and writes the lesson

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
    print('processing: ' + lesson.dn);
    var changes = false;
    lesson.data.forEach( function(element) {
       
      // print (element.ft + '   ' + element.collection);
       
       if ( ! ('ft' in element && element.ft === 'inline') && element.collection === 'activities') {
    
           //print('   checking for activity with _id = ' + element.id);
    
           var contents = db.activities.findOne({'_id':ObjectId(element.id)});
           
           if (contents) {
              // print('  contents = ' + contents);
               if ('ft' in contents && contents.ft === 'text') {
                   //print('FOUND CONTENTS');
        
                   //print('   checking for text_file ' + contents.dn + '  with _id = ' + contents.mongoID);
        
                   var text = db.text_files.findOne({_id: contents.mongoID});
                   if (text) {
                       element.ft = 'inline';
                       element.html = text.data;
                       element.nepali = text.nepali;
                       changes = true;
                       print('         converted: ' + text.dn);
                   }
               }
           }
       }
    });
    
    if (changes) {
        converted++;
        if (param === 'run') db.lessons.replaceOne({'_id':lesson._id}, lesson);
    } else print('         no conversions');
}

print();
if (param !== 'run') print('  DRYRUN - no changes made');
print(' processed ' + count + ' lessons, and converted ' + converted);
print();