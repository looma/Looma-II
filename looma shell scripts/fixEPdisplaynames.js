// ONE TIME program to add prefix <grade><subject> to ePaath display names
//
//  run in MONGO SHELL with: load('fixEPdisplaynames')
//  SKIP    18 OCT 2024
//

var cursor, count, doc;

function grade(g) {
    return g.substr(5);
}

function subject(s) {
    const subjects = {"math":"M", "english":"EN", "nepali":"N", "science":'S'};
    return subjects[s];
};

function nepaligrade(g) {
    const nepaligrades = ['१', '२', '३', '४', '५', '६', '७', '८', '९', '१०', '११','१२'];
    return nepaligrades[grade(g) - 1];
};

function nepalisubject(s) {
    //Nepali equivalent of {M, S, EN and ने} = {ग, वि, EN and ने}
    const nepalisubjects = {"math":"ग", "english":"EN", "nepali":"ने", "science":"वि"};
    return nepalisubjects[s];
};

cursor = db.activities.find({'src':'OLE','subject':{'$in':['math','science','english','nepali']}});
count = 0;
while (cursor.hasNext()) {
    doc = cursor.next();
    count++;
    
    if (doc.dn) {
        doc.dn = grade(doc.grade) + subject(doc.subject) + ' ' + doc.dn;
    };
    
    if (doc.ndn) {
        doc.ndn = nepaligrade(doc.grade) + nepalisubject(doc.subject) + ' ' + doc.ndn;
    };
    
    if (doc.subject === 'english') delete doc.ndn;
    if (doc.subject === 'nepali') delete doc.dn;  // need to fix Search to look for NDN if no DN
    
    print('...DN changed to ' + doc['dn'] + '   ***   NDN changed to ' + doc['ndn']);
    if (param === 'run') db.activities.replaceOne({_id:doc._id}, doc);
};

print('_______________');
if (param === 'run') print(' + + + changed ' + count + ' activities');
else                 print(' "dryrun" - no changes made - would have changed ' + count + ' activities');
print('_______________');
