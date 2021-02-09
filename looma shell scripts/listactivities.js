// program to
//    scan through specified documents in activities collection
//    and print out DISPLAY NAMES
//
//  run in MONGO SHELL with: load('listactivities')
//
//

var docs, doc, deletes, deleted, fn, count;
count=0;


docs = db.activities.find({});  //insert query filter if required
while (docs.hasNext()) {
    doc = docs.next();
    print(doc.dn);
    count++;
};
print();
print('count is ' + count);

