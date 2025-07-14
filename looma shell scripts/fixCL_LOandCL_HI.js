// filename: fixCL_LOandCL_HI.js
//
// ONE TIME program to fix CL_LO and CL_HI fields
//        convert string values to int32
//        find erroneous CH_LO and CH_HI fields, use them to set Cl_LO and CL_HI and then delete them
//  run in MONGO SHELL with: load('fixCL_LOandCL_HI.js')
//
var cursor, doc;
var CH_IDregex = /([1-9]|10|11|12)(EN|Ena|Sa|S|SF|Ma|M|SSa|SS|N|H|V|CS)[0-9]{2}(\.[0-9]{2})?/;

var count = 0; var fixhi = 0; var fixlo = 0;

cursor = db.activities.find();  //scan all activities

while (cursor.hasNext()) {
    doc = cursor.next();
    count++;
    
    if (doc['ch_lo']) {
        doc['cl_lo'] = parseInt(doc['ch_lo']);
        delete doc['ch_lo'];
        fixlo++;
    };
    
    if (doc['ch_hi']) {
        doc['cl_hi'] = parseInt(doc['ch_hi']);
        delete doc['ch_hi'];
        fixhi++;
    };
    if (param === 'run') db.activities.replaceOne({_id:doc['_id']},doc)
}

cursor = db.activities.find({cl_lo:{$type:'string'}});

    while (cursor.hasNext()) {
        doc = cursor.next();
        fixlo++;
        if (param === 'run')
            db.activities.updateOne(
                {_id: doc['_id']},
                {$set: {cl_lo: NumberInt(doc['cl_lo'])}}
            );
    }
    
    cursor = db.activities.find({cl_hi:{$type:'string'}});
    
    while (cursor.hasNext()) {
        doc = cursor.next();
        fixhi++;
        if (param === 'run')
            db.activities.updateOne(
                {_id: doc['_id']},
                {$set: {cl_hi: NumberInt(doc['cl_hi'])}}
            );
    }
    
print('_______________');
print(' + + + checked ' + count + ' activities');
print(' + + + found ' + fixlo + ' ch_lo fields and ' + fixhi + ' ch_hi fields and transferred them to cl_**');
print('_______________');
