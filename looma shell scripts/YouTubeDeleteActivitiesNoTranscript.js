var changecount = 0;

var input = 'YouTubeNoTranscriptIDs.txt';
print ('Importing youtube IDs from ' + input);
print();

var file = cat(input);  // read  the file

var docs = file.split(/[\r\n]+/);  // split file into array of lines containing (DN, ID)

print ('Processing ' + docs.length + ' lines');
print();

docs.forEach( function(ID) {
    print('  delecting activities with ID=' + ID);
    db.activities.remove({ft:'quiz',youtube:ID});
    changecount++;
});  // end foreach doc

print('');
print('+++++  ' + changecount + '  lines processed');
