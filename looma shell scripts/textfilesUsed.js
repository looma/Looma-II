// ONE TIME program to
//      LIST text files that are  used in a lesson, edited video or slideshow
//
//   run in MONGO SHELL with: load('textfilesUsed.js')

var cursor;

var count = 0;
var count1 = 0;
var count2 = 0;

print('db is ' + db);
print('');

cursor = db.lessons.find({});
while (cursor.hasNext()) {
    
    var item = cursor.next();
    count++;
    count1 = 0;
    
    item.data.forEach( function(element) {
        if (element.collection === 'activities' && 'ft' in element && element.ft !== 'inline') {
        
        var activity = db.activities.findOne({'_id': ObjectId(element.id)})
        if (activity.ft === 'text') {
            print(item.dn + ' has text file ' + element.id);
            count1++;
            count2++;
        }
    }
    });
    // if (count1 === 0) print (item.dn + ' no text files found');
};

print('');
print('SUMMARY: ');
print('looked at ' + count + '  files');
print('found ' + count2 + '  text files');


