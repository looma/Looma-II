//
//
// filaname: FindActivitiesWithFileNotFound
// scan all activities and list those that have associated File Not Found
//
// NOTE: run from Looma/ directory
//
function defaultFP(ft) {
    switch(ft) {
        case 'mp4':
        case 'm4v':
        case 'mov':
        case 'video':
            return '../content/videos/';
            break;
        case 'png':
        case 'jpg':
        case 'gif':
        case 'image':
            return '../content/pictures/';
            break;
        case 'pdf':
            return '../content/pdfs/';
            break;
        case 'mp3':
        case 'audio':
            return '../content/audio/';
            break;
        default:
            return "";
    }
}

/*
    // code to find if a local file exists:
    try {
	print ('trying to find README.xxx');
        print('found file with md5 ' + md5sumFile('README.xxx'));
     }
catch(e) {print('not found')};

try {
	print ('trying to find README.md');
	print('found file with md5 ' + md5sumFile('README.md'));
	}
catch(e) {print('not found')};

 */
var collection = db.activities;
var found = 0;
var count = 0;
collection.find( ).forEach(
    function (x) {// read the file
        var filename;
        var others = ['chapter', 'lesson', 'text', 'text-template','game', 'history', 'slideshow','EP','quiz','map','looma','evi','book'];
        try {
            if ( ! others.includes(x.ft) && x.src !== "CEHRD"  && x.src !== 'wikipedia') {
                var name = (x.fn) ? x.fn : x.nfn;
                var title = (x.dn) ? x.dn : x.ndn;
                var path = (x.fp) ? x.fp : x.nfp;
                filename = (path) ? (path + name) : defaultFP(x.ft) + name;
    
                var checksum = md5sumFile(filename);
               // print('* ', -1); //print w/o newline
                
                //print( ' * * *  Found: ' + md5sumFile(filename));
                //process.stdout.write('* ');
                
                //var file = cat(filename);
                // print ('******** found ' + x.fp + x.fn);
                found++;
            }
        }
        catch (e){
           print();
           print (' * * * no file found for ' + title + ' (' + x.ft + ' ' + name + ' ' + path + ') with filename = ' + filename);
           count++;
          }
    });
print();
print ( count + ' Files Not Found ');
print ( found + ' Files Found ');
print ();


