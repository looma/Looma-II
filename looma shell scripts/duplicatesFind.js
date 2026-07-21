/*
LOOMA javascript file
Filename: lxxxxxxx.js
Description: supports xxxxxxx.php

Programmer name:
Owner: VillageTech Solutions (villagetechsolutions.org)
Date:
Revision:
Looma version 3.0
 */

'use strict';

// ONE TIME program to
//    scan through specified documents in activities collection
//
//      and print out documents with duplicate DN fields
//
//  run in MONGO SHELL with: load('findduplicates')
//
//

var docs, doc, duplicates, title, count;
count=0;

//docs = db.activities.find({'src':'khan','ft':'mp4'});
docs = db.games.find({'ft':'game'});
while (docs.hasNext()) {
    doc = docs.next();
    title = doc['title'];
    //print ('***  ' + fn);

    //duplicates = db.activities.find({'dn': dn, 'src':'khan','ft':'mp4'});
    duplicates = db.games.find({'title': title});
    if (duplicates.count() > 1) {count++; print ('     dup found for: ' + title + ' with mongoID ' + doc['mongoID']);};
};
print();
print('count is ' + count);

