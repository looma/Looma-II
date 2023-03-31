// ONE TIME program to
// given a list of filenames, see which are included in a Looma lesson
//
//  file: lesson-scan-for-youtube-videos.js
//  run in MONGO SHELL with: load('lesson-scan-for-youtube-videos.js')
//

var input = 'youtube-videos-on-looma.txt';

var file = cat(input);  // read  the file

var docs = file.split(/[\r\n]+/);  // split file into array of lines containing (DN, FN, CH_LO, cl_HI)
var count = 0;
var xcount = 0;
var video, lesson;

print ('Processing ' + docs.length + ' lines');
docs.forEach( function(doc) {
        //print ('processing ' + doc);
        video =  db.activities.findOne({fn:doc});
        if (! video) {
            //print (" *** CANT FIND *** " + doc);
            xcount++;
        }
       else
       {
            var id = video['_id'].str;
            //print ('id for ' + doc + ' is ' + id);
            lesson = db.lessons.findOne({'data.id': id});
            //if (video) print ('found ' + video.dn);
            if (lesson) {
                count++;
                print(doc + ' - - - -  ' + lesson.dn);
            }
            ;
        }
}

);

print('');
print(count + ' YouTube videos are in lessons ');
print(xcount + ' YouTube videos are not found ');


