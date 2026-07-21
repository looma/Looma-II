// ONE TIME program to
//    scan through specified documents in games collection
//    and look for duplicates (based on same 'title')
//
//  run in MONGO SHELL with: load('duplicateGamesRemove.js')
//
// THINK before running this - - first get a mongodump or db.copyDatabase('looma', 'loomaBAK')
//

var docs, doc, deletes, deleted, fn, count, delcount, numberofduplicates;
count=0;
delcount = 0;

docs = db.games.find({});

while (docs.hasNext()) {
    doc = docs.next();

    deletes = db.games.find({'title': doc['title'],'presentation_type':doc['presentation_type']});

    count++;
    var first = deletes.next(); //dont delete the first instance
    //print ('---------- first instance is ' + first.title);

 //   if (! deletes.hasNext()) print ('========== no other instances');
    while (deletes.hasNext()) {
        deleted = deletes.next();
        print ('       deleting:           ' + deleted.title);
        delcount++;
        if (param === 'run') db.games.deleteOne(deleted);
    };
};

print();
print('deleted  ' + delcount + ' dups of ' + count + ' ' + doc.ft + ' files');

