// mongo terminal program to read pairs of DISPLAY names from a TAB delimited txt/spreadsheet file
//          and replace existing display names (first in each pair)
//          with new display names (second in each pair)
//          used specifically to replace too-long DNs with shortened DNs
//
//          if the ACTIVITY whose DN is changed is a LESSON, change the lesson's DN also
//
//  start MONGO in LOOMA db with: 'mongo looma'
//  run in MONGO SHELL with: load('displaynamefixes.js')
//
"use strict";

var requestcount = 0;
var changecount = 0;
var lessonchangecount = 0;

var input = 'newdisplaynames.txt';
print ('Importing keywords from ' + input);
var file = cat(input);  // read  the file (for now, specifying a path doesnt work)

var pairs = file.split(/[\r\n]+/);  // split file into array of lines containing (oldname, newname) pairs

    print ('Processing ' + pairs.length + ' name changes');
    
pairs.forEach( function(pair) {
    var names = pair.split(/\t/);
    
    if (names[0] !== "" && names[1] !== "")
    {
        var oldname = names[0];
        var newname = names[1];
        //print (++requestcount + ' - - CHANGING ' + oldname + ' TO ' + newname);
    
        var activities = db.activities.find({'dn':oldname});
        while (activities.hasNext()) {
            var activity = activities.next();
            activity['dn'] = newname;
            db.activities.update({_id:activity._id}, activity);
            changecount++;
            print (changecount + ' - - CHANGED ACTIVITY ' + oldname + ' TO ' + newname);
        };
        
        //   ********       if the ACTIVITY whose DN is changed is a LESSON, change the lesson's DN also
        var lessons = db.lessons.find({'dn':oldname});
        while (lessons.hasNext()) {
            var lesson = lessons.next();
            lesson['dn'] = newname;
            db.lessons.update({_id:lesson._id}, lesson);
            lessonchangecount++;
            print(); print (lessonchangecount + ' - - CHANGED LESSON ****** ' + oldname + ' TO ' + newname); print();
        };
    } else print('ERROR: line is ' + requestcount + ' and pair is ' + names[0] + '  ' + names[1]);
    
});  // end foreach pair

print('');
print('  ' + changecount + '  changes to activity names (some are duplicates)');
print('  ' + lessonchangecount + '  changes to lesson names');
