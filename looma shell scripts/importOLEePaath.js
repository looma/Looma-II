// mongo terminal program to read a file containing OLE ePaath 2019 JSON descriptors
//
// read the input files 'configmath.json', 'configscience.json', and 'configenglish.json'
//
// parse the JSON and create a JSON object representing each ePaath file
//      output format: {dn:nd, ndn:ndn, grade:grade, subj:subj, thumb:thumb}
//                  and added fields: {ft:'EP', scr:'OLE2019', id:<oleID>}
//
//      oleID is a string, 1st 3 chars are subj ('sci','mat','eng'), next 3 are ID, then '01'
//
//  in terminal: "mongo looma --quiet importOLEePaath > ole.csv"
//
//  stores a CSV file in the same directory named OLEimport.csv
//
"use strict";

//NOTE: files are relative to ...www/ePaath/ePaath2022
/*var configs = { science:   'config/configscience.json',
                  math:      'config/configmath.json',
                  english:   'config/configenglish.json',
*/

/* translation from ole json to looma metadata:
    	Metadata field			JSON field

            dn						“en"
            ndn						“np"
            fn						from “levels.folder"
            thumb					“levels.thumbnail"
            fp						from “levels.folder”
            
            subject					from “subid"
            grade					?? not sure how we get this ??
            cl_lo					= grade
            cl_hi					= grade + 1
            ch_id					<enter manually>
            
            ft						EP
            src						OLE
            version					2022
            key1					“subid"
            key2					“type"
            key3					<enter manually>
            key4					<enter manually>

 */
var configs = { RTI: 'config/mainconfig.json'};

var gvalue, evalue, prefix, file;

function print(text) {console.log(text);};

print('dn, ndn, grade, subject, src, ft, version, id, OLE ID, subId, type, thumb');

for (var config in configs) {

//print();
//print('******************');

//print ('Importing keywords from ' + config);
    var fs = require('fs');
    fs.readFile(configs[config], function(err,data) {
    
        //var file = cat(configs[config]);  // read  the file (for now, specifying a path doesnt work)
        //prefix = config.substring(0,3);
    
        var subject = JSON.parse(data);
    
        //print(JSON.stringify(subject, null, 4));
    
        for (var grade in subject) {
            gvalue = subject[grade];
            //print('    GRADE: ' + grade)
            //print(':   ' + JSON.stringify(gvalue, null, 4));
        
            for (var epaath in gvalue) {
                evalue = gvalue[epaath];
                //print('         EPAATH: ' + epaath);
                var subID = (evalue["subId"] ? evalue["subId"] : evalue["subID"]);
    // output the values in this order:
    // 'dn, ndn, grade, subject, src, ft, version, id, OLE ID, subId, type, thumb');
                print(
                    evalue["en"].replace(/\,/g, " ") + ',' +
                    evalue["np"].replace(/\,/g, " ") + ',' +
                    grade + ',' +
                    subID + ',' +
                    'OLE' + ',' +
                    'EP' + ',' +
                    '2022' + ',' +
                    evalue["id"] + ',' +
                    prefix + evalue["id"] + '01' + ',' +
                    subID + ',' +
                    evalue["type"] + ',' +
                    '../ePaath/ePaath2022/' + evalue["image"]
                );
            }
        
        }  // end for in grade
    } );
};  // end for in json

print('');
