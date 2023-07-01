// ONE TIME program to
// given a list of filenames, see which are included in a Looma lesson
//
//  file: YouTubeScanLessonsForUse.js
//  run in MONGO SHELL with: load('YouTubeScanLessonsForUse.js')
//

var input = 'youtube-videos-on-looma.txt';

var file = cat(input);  // read  the file

var docs = file.split(/[\r\n]+/);
var count = 0;
var xcount = 0;
var video, lessons, lesson;

print ('Processing ' + docs.length + ' lines');
docs.forEach( function(doc) {
        //print ('processing ' + doc);
        video =  db.activities.findOne({fn:doc,youtube:{$exists:true}});
        if (! video) {
            print (" *** CANT FIND *** " + doc);
            xcount++;
        }
       else
       {
            var id = video['_id'].str;
            lessons = db.lessons.find({'data.id': id});
            lessons.forEach( function(lesson) {
                if (lesson) {
                    count++;
                    print(doc + ' - - - - - - -  ' + lesson.dn);
                }
            });
        }
});

print('');
print(count + ' YouTube videos are in lessons ');
print(xcount + ' YouTube videos are not found ');


