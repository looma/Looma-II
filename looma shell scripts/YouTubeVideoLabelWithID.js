// read a file of {dn, youtubeID} and add the ID to the Looma activity for that video
var changecount = 0;
var activities;

var input = 'YouTube videos on Looma - good FNs.csv';
print ('Importing youtube IDs from ' + input);
print();

var file = cat(input);  // read  the file

var docs = file.split(/[\r\n]+/);  // split file into array of lines containing (DN, ID)

print ('Processing ' + docs.length + ' lines');
print();

docs.forEach( function(doc) {
  var fields = doc.split(/\,/);  //split the line on comma
  if (fields[0] !== "" && fields[1] !== "") {
    var fn = fields[0];
    var ID = fields[1];
    
    activities = db.activities.find({'fn':fn});
    var duplicates = 0;
   if (!activities.hasNext()) print('ACTIVITY ' + fn + ' NOT FOUND');
    while (activities.hasNext()) {
      var activity = activities.next();
 /*     duplicates++; if (duplicates > 1) {
        print('*******NOTE: duplicate fn FOUND, Name = "' + fn + '"');
      }
  */
     // activity['youtube'] = ID;
      
      // following line for adding youtube ID to the video's activity document
        //db.activities.updateOne({_id: activity._id}, {'$set':{'youtube':ID}});
        activity['fn'] = "[" + activity['youtube'] + "]" + activity['dn'] + ".quiz";
        activity['ft'] = 'quiz';
        activity['fp'] = '../content/quizzes/';
        delete activity['_id'];
      
        // following line for inserting new activity for the quiz
        //db.activities.insert(activity);
      changecount++;
      print('         for resource ' + activity['dn'] + ' adding ft=quiz with fn:=' + activity['fn']);
    }
  } else print('*******    BAD INPUT LINE: ' + doc);
});  // end foreach doc

print('');
print('+++++  ' + changecount + '  lines processed');
