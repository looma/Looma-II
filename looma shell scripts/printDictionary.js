// program to
//    scan through dictionary
//    and print out ENGLISH WORDS
//
//  run in MONGO SHELL with: load('printDictionary.js')
//
//

var docs, doc, deletes, deleted, fn, count;
count=0;


docs = db.dictionary.find({});  //insert query filter if required
while (docs.hasNext()) {
    doc = docs.next();

        print(doc.en);
        count++;
};
print();
print('count is ' + count);


