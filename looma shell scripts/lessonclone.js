//  clone lessons
//
//  file: lessonclone.js
//  run in MONGO SHELL with: load('lessonclone.js')
//      prior to running, set "param" variable:
//      var param = 'dryrun' or 'run'

//  NOTE: need to first edit 4 variable settings below
//  to set the source lesson, target lesson and the cooresponding PREFIXes to use for naming textfiles
//

function asyncInsert (collection, file) {
    return  collection.insert(file);
};


var oldlesson = '6EN Unit 1';
var oldprefix = '6EN Unit 1';
var newlesson = '6EN Unit 18';
var newprefix = '6EN Unit 18';

var lesson, lessonitem, textfile, newtext, activity, newactivity;
var textfilecount=0, activitycount=0, chaptercount=0;

var now = new Date();
var dd = now.getDate(); var mm = now.getMonth()+1; var yyyy = now.getFullYear();
if(dd<10) dd='0'+dd; if(mm<10) mm='0'+mm;
var today =  (yyyy + '.' + mm + '.' + dd);

print();  print('date is ' + today);
print();

    lesson = db.lessons.findOne({'dn':oldlesson});

    if (! lesson || ! lesson.data)
        print (" - - ERROR: old lesson not found or has no data - " + lesson.dn);
    else {
        print('**** - - Cloning ' + oldlesson + ' (' + lesson.date + ') to new lesson: ' + newlesson);
        lesson.data.forEach( function (data) {
            if (data.collection === 'chapters') {
                chaptercount++;
                //leave old chapters in place, to be replaced when editing new lesson
            } else if (data.collection === 'activities') {
                lessonitem = db.activities.findOne({'_id': ObjectId(data['id'])});
            
                if (lessonitem && lessonitem.ft === 'text') {
                    textfilecount++;
                    // create copy of textfile, rename it and save it
                    textfile = db.text_files.findOne({_id: lessonitem.mongoID});
                
                    print(' - - opening text file ' + lessonitem.dn);
                
                    var oldDN = textfile.dn;
                    textfile.dn = textfile.dn.replace(oldprefix, newprefix);
                    if (oldDN === textfile.dn)
                        textfile.dn = textfile.dn + '(' + Math.floor(999 * Math.random()) + ')';
                
                    textfile.date = today;
                    textfile.author = 'clone';
                    delete textfile._id;
                    delete textfile.translator;
                    delete textfile.nepali;
                    if (param === 'run') {
                    
                        //var result =  db.text_files.insert(textfile);
                        var result =  asyncInsert(db.text_files, textfile);
                    
                        newtext = db.text_files.findOne(textfile);
                        //data.id = newtext._id.toString();
                        print('  - - created new textfile. dn is ' + newtext.dn + ' and _id is ' + newtext._id);
                    
                    } else print(' - - - DRYRUB insert new textfile ' + textfile.dn);
                
                    // CREATE Activity for new textfile
                    activity = {};
                    activity.ft = 'text';
                    activity.dn = textfile.dn;
                    if (param === 'run') {
                        activity.mongoID = newtext['_id'];
                    
                        //db.activities.insert(activity);
                        var result =  asyncInsert(db.activities, activity);
                    
                        newactivity = db.activities.findOne(activity);
                        print('  - - - created new activity: ' + newactivity.dn);
                        data.id = newactivity['_id'].str;
                    } else {
                        print(' - - - DRYRUN new activity for textfile ' + activity.dn);
                    }
                } else activitycount++
            }
        });
    
         function finish() {
            // save new lesson
            lesson.dn = newlesson;
            delete lesson._id;
            lesson.ft = 'lesson';
            lesson.author = 'clone';
            lesson.status = 'draft';
            lesson.date = today;
            if (param === 'run') {
            
                //result =  db.lessons.insert(lesson);
                var result =  asyncInsert(db.lessons, lesson);
            
                //print('insertedId is ' + result.insertedId);
                
                if (result.acknowledged) {
                   // newlesson = db.lessons.findOne(lesson);
                    var lessonId = result.insertedIds["0"];
                    print('**** created new lesson named ' + lesson.dn + ' ( _id is ' + result.insertedIds["0"] + ')');
                } else {
                    print(' - - - - failed mongodb insert of new lesson with ');
                    printjson(result);
                }
            } else print('**** - - DRYRUN creating new lesson named ' + lesson.dn);
        
            // make an activity for the new lesson
            activity = {};
            activity.ft = 'lesson';
            if (param === 'run') activity.mongoID = lessonId;
            print ('activity.mongoID for lesson is ' + lessonId);
            activity.dn = lesson.dn;
            //NOTE: dont register the new draft lesson to the chapter until it is edited
            if (param === 'run') {
                //newactivity = db.activities.insert(activity);
                newactivity =  asyncInsert(db.activities, activity);
                var activityId = newactivity.insertedIds["0"];
                print(' - - - new activity for lesson ' + lesson.dn + '. The _id is ' + activityId);
            } else print(' - - - DRYRUB new activity for lesson ' + lesson.dn);
        }
    };
    
    finish();

print(); print('Cloned old lesson "' + oldlesson + '" to "'  + lesson.dn + '"');
print(' - -  it has ' + textfilecount + ' text files');
print(' - -  it has ' + activitycount + ' activities');
print(' - -  it has ' + chaptercount + ' chapters');
print();


