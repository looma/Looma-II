// read a file of {dn, youtubeID} and add the ID to the Looma activity for that video
var changecount = 0;
var activities;

var input = 'YouTube videos on Looma - good FNs.csv';
////print ('Importing youtube IDs from ' + input);
print();

var file = cat(input);  // read  the file

var docs = file.split(/[\r\n]+/);  // split file into array of lines containing (DN, ID)

//print ('Processing ' + docs.length + ' lines');
print();

docs.forEach( function(doc) {
    var fields = doc.split(/\,/);  //split the line on comma
    if (fields[0] !== "" && fields[1] !== "") {
        var fn = fields[0];
        var ID = fields[1];
        
        activities = db.activities.find({'fn':fn});
        while (activities.hasNext()) {
            var activity = activities.next();
            print(activity['dn'] + ',' + activity['youtube']);
        }
    }
});  // end foreach doc

print('');
print('+++++  ' + changecount + '  lines processed');
