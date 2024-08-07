//  clone 'phonics' lessons to be edited for other letters
//
//  file: lessonPhonicsClone
//  run in MONGO SHELL with: load('lessonPhonicsClone.js')
//      prior to running, set "param" variable:
//      var param = 'dryrun' or 'run'

//  NOTE: need to first edit the source lesson to fix lesson DN and textfile DNs - remove ch_id and add LETTER to DNs
//
//  NOTE: edit the 4 variable settings below for different souce letter and/or target letter
//

var newchapter =   '1EN02.46';            // chapter ID for new lesson being created as a clone
var lessonnumber = 'Lesson 2';
var oldletter =          'Ee';            // letter (in format Aa) of  the old lesson
var newletter =          'Oo';            // letter (in format Aa) for the new lesson

var oldlesson = 'Letter ' + oldletter + ' Phonics ' + lessonnumber;
var newlesson = '(Draft) Letter ' + newletter + ' Phonics ' + lessonnumber;

var lesson, lessonitem, textfile, newtext, activity, newactivity;
var textfilecount=0, activitycount=0, chaptercount=0;

var now = new Date();
var dd = now.getDate(); var mm = now.getMonth()+1; var yyyy = now.getFullYear();
if(dd<10) dd='0'+dd; if(mm<10) mm='0'+mm;
var today =  (yyyy + '.' + mm + '.' + dd);
print(); print('date is ' + today);
print(); print('old lesson is ' + oldlesson + '    new lesson is ' + newlesson);

    lesson = db.lessons.findOne({'dn':oldlesson});
    print(); print ('**** - - Cloning ' + oldlesson + ' ('+ lesson.date + ') to new lesson: ' + newlesson);

    if (! lesson.data) print (" - - ERROR: old lesson has no data - " + lesson.dn);
    else
    { lesson.data.forEach ( function(data)
        { if (data.collection === 'chapters')
            {
                //replace chapter
                data.id = newchapter;
                print('timeline item of type "chapter" ' + newchapter);
                chaptercount++;
            }
        else if (data.collection === 'activities')
        {
            lessonitem = db.activities.findOne({'_id':ObjectId(data['id'])});

            //print('timeline item of type ' + lessonitem.ft);
            //printjson(lessonitem);

            if (lessonitem && lessonitem.ft === 'text')
            {
                textfilecount++;

                // create copy of textfile, rename it and save it

                //print('fetching a text file. ID is ' + lessonitem.mongoID);
                //print();

                textfile = db.text_files.findOne({_id:lessonitem.mongoID});

                print(' - - opening text file ' + lessonitem.dn);
                //printjson(textfile);

                var oldDN = textfile.dn;
                textfile.dn = textfile.dn.replace(oldletter, newletter);
                if (oldDN === textfile.dn) textfile.dn = newletter + ' ' + lessonnumber + ' ' + textfile.dn;

                textfile.date = today;
                textfile.author = 'clone';
                delete textfile._id;
                delete textfile.translator;
                delete textfile.nepali;
                if (param === 'run') {
                    var result = db.text_files.insert(textfile);
                    if (result.nInserted === 1) {
                        //printjson(newtext);

                        newtext = db.text_files.findOne(textfile);
                        //data.id = newtext._id.toString();
                        print ('  - - created new textfile. dn is ' + newtext.dn + ' and _id is ' + newtext._id);
                        } else {
                            print(' - - - - ERROR: failed mongodb insert of new text file with ');
                            printjson(result);
                    }
               } else print (' - - - inserting new textfile ' + textfile.dn);

                // CREATE Activity for new textfile
                activity = {};
                activity.ft = 'text';
                activity.dn = textfile.dn;
                if (param === 'run') {
                    activity.mongoID = newtext['_id'];
                    db.activities.insert(activity);
                    newactivity = db.activities.findOne(activity);
                    print ('  - - - created new activity: ' + newactivity.dn);

                //   print ('_id is ' + newactivity['_id']);
                //   print('$id is ' + newactivity['_id']['$id']);
                //   print('$oid is ' + newactivity['_id']['$oid']);

                    data.id = newactivity['_id'].str;
                } else {
                    print(' - - - new activity for textfile ' + activity.dn);
                    //printjson(activity);
                }
            } else activitycount++
        }
    });

    // save new lesson
        lesson.dn = newlesson;
        delete lesson._id;
        lesson.ft = 'lesson';
        lesson.author = 'clone';
        lesson.status = 'draft';
        lesson.date = today;
        if (param === 'run') {
            result = db.lessons.insert(lesson);
            if (result.nInserted === 1) {
              newlesson = db.lessons.findOne(lesson);
              print ('**** created new lesson named ' + lesson.dn + '( _id is ' + newlesson._id + ')');
            } else {
                print(' - - - - failed mongodb insert of new lesson with ');
                printjson(result);
            }
        }
        else print ('**** - - created new lesson named ' + lesson.dn);


    // make an activity for the new lesson
        activity = {};
        activity.ft = 'lesson';
        if (param === 'run') activity.mongoID = newlesson['_id'];
        activity.dn = lesson.dn;
        //NOTE: dont register the new draft lesson to the chapter until it is edited
        //activity.ch_id = [newchapter];
        activity.key1 = "Language";
        activity.key2 = "English";
        activity.key3 = "Grammar";
        activity.key4 = "Phonics";
        if (param === 'run') {
            newactivity = db.activities.insert(activity);
            print (' - - - new activity for lesson ' + lesson.dn + '. The _id is ' + newactivity._id);
        }
        else print (' - - - new activity for lesson ' + lesson.dn);
    }

print(); print('Cloned old lesson "' + oldlesson + '" to "'  + lesson.dn + '"');
print(' - -  it has ' + textfilecount + ' text files');
print(' - -  it has ' + activitycount + ' activities');
print(' - -  it has ' + chaptercount + ' chapters');
print();


