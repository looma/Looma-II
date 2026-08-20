//    read .tsv file with english and nepali words
//    check and report if any words are NOT in the dicitonary
//
//    run in MONGO SHELL with: load('dictionaryCheckWordsIncluded.js')

var docs, doc, dupl, duplicates, en;
var requestcount = 0;
var found = 0;
var notfound = 0;

var input = '../data files/dictionaryWordsToCheck.tsv';
print ('Importing from file: ' + input);

var file = cat(input);  // read  the file (for now, specifying a path doesnt work)
var lines = file.split(/[\r\n]+/);  // split file into array of lines containing ()
print ('Processing ' + lines.length + ' lines');

lines.forEach( function(doc) {
    if (!doc.trim()) return; // skip empty lines
    requestcount++;

    var fields = doc.split('\t');  //split the line on tab's

    var en = fields[0].trim();
    var np = fields[1].trim();

    query = {'np':  np };    // query to look for the word

    var words = db.dictionary.find(query);

    if (!words.hasNext()) { //not found
        notfound++;
        print(requestcount + ' - - Nepali word: ' + np + '  - - NOT FOUND');
    } else
       found++;
});  // end foreach doc


/*
docs = db.dictionary.find();
while (docs.hasNext()) {
    doc = docs.next();
    en = doc['en'];
    //print(en);
    def = doc['def'];

    duplicates = db.dictionary.find({'en': en, 'def': def});
    if (duplicates && duplicates.hasNext()) {
        var firstinstance = duplicates.next();
        if (duplicates.hasNext()) {
            dupl = duplicates.next();
            print('exact duplicate found for: ' + en);
            var pluralFilled = false;
            var rwFilled = false;
            var ch_idFilled = false;

            if (doc['plural'] && doc['plural'].trim() !== '') {
                pluralFilled = true;
            }
            if (doc['rw'] && doc['rw'].trim() !== '') {
                rwFilled = true;
            }
            if (doc['ch_id'] && doc['ch_id'].trim() !== '') {
                ch_idFilled = true;
            }

            while (duplicates.hasNext()) {
                dupl = duplicates.next();
                if (!pluralFilled && dupl['plural'] && dupl['plural'].trim() !== '') {
                    var duplPlural = dupl['plural'];
                    db.dictionary.update(doc, {$upsert: {plural:duplPlural}});
                    pluralFilled = true;
                }
                if (!rwFilled && dupl['rw'] && dupl['rw'].trim() !== '') {
                    var duplRw = dupl['rw'];
                    db.dictionary.update(doc, {$upsert: {rw:duplRw}});
                    rwFilled = true;
                }
                if (!ch_idFilled && dupl['ch_id'] && dupl['ch_id'].trim() !== '') {
                    var duplCh_id = dupl['ch_id'];
                    db.dictionary.update(doc, {$upsert: {ch_id:duplCh_id}});
                    ch_idFilled = true;
                }
                print(dupl.en);
                db.dictionary.remove(dupl);
                count++;
            }
        }
    };
};
*/

print('');
print('tried ' + requestcount + ' words');
print('.  Number of words not found: ' + notfound);
print('.     Number of words  found: ' + found);
