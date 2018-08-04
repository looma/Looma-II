// LESSON PLAN REPORT program to
//      summarize lesson plan status by textbook
//
// in terminal: 'mongo looma'
//this sets db to the 'looma'  database
//  then run this program in MONGO SHELL with: load('lessonreport.js')
//

var lessoncursor, chaptercursor;
var count = 0;

print('DB is ' + db);
print ('*****scanning lesson plan collection');
print('');

lessoncursor = db.lessons.find({});
while (lessoncursor.hasNext()) {
        var lesson = lessoncursor.next();
        
        //print ('checking: ' + lesson.dn + ' with ch_id: ' + lesson.ch_id);
        
        //BUG: ch_id is an array - need a foreach statement
        if (lesson.ch_id)
            for (i=0;i<lesson.ch_id.length;i++)  {
            chaptercursor = db.chapters.findOne({'_id':lesson.ch_id[i]});
            if (chaptercursor) var chaptername = chaptercursor.dn;
            else chaptername='none';
            
            print('LESSON: assigned to chapter: ' +  lesson.ch_id[i] + '  (chapter named: ' + chaptername + ') has lesson named: ' + lesson.dn);
            count += 1;
        }
        else print('LESSON with no assigned chapter(s), named: ' + lesson.dn);
    
};

print('');
print('PROCESSED ' + count + ' lessons');
print('');
