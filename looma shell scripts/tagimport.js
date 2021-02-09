// mongo terminal program to read a KEYWORD list file and create the corresponding TAGS collection in mongoDB
//
// assumptions: each keyword is described on a separate line of the input file
//      format of a line is: n.n.n.n keywordname [e.g. '1.2 Mathemetics Algebra', or '1 Science', or '1.2.3.4 Science Physics Force Gravity'
//      keywords must be in index order - index at each depth must be increasing from previous keyword
//      parent of any new keyword must already exist [no skipping levels]
//      no TABS in the input file
//
//      input file is named: keywords.txt, but can be changed by editing the "var input = " at line ~38 below
//      process for making keyword.txt:
//          1. word document in outline form,
//          2. use word to generate the index n.n.n.n for each line
//              2.a. select all
//              2.b. use Multilist Numbering button
//              2.c. choose the format with "1 Heading 1" and click
//              2.d. change to Print Layout and Save As .txt file
//          3. copy to .xls,
//          4. copy to .txt
//
//      the database schema for tags is a document in collection 'tags' for each keyword that has 'children'
//      the document for a keyword contains its 'name' and an array of children if it has any.
//      the children in turn, have their own documents if they have children
//      leaf node children have no document of their own, just are listed in their parent's children array
//
//              {name:'keywordname' or 'root',
//               parent: mongoID of parent keyword, or 'null' for 'name'='root',
//               level: 1..4 level of this keyword, integer from 1 to 4,
//               children: [{name:'nameofchildkeyword',kids:mongoID of document if this child keyword has children, else null}
//                          {name:'nextchildname', kids: ...},
//                           ...]
//
//  (for now) keyword.txt must be in the same DIR as this code
//  start MONGO in LOOMA db with: 'mongo looma'
//  run in MONGO SHELL with: load('tagimport.js')
//
"use strict";

var input = 'keywords.txt';
print ('Importing keywords from ' + input);
var file = cat(input);  // read  the file (for now, specifying a path doesnt work)

// 'levels' variables are numerical values of the keyword being processed [e.g. 2.4.5.3 has level0=2, level1=4, etc
var levels = [0,0,0,0];
// 'prev' variables store the levels of the previously processed keyword
var prev =  [0,0,0,0];
//  'documents' variables are the mongo IDs for current open documents at each level
var documents = [null, null, null, null];
// 'names' store the keyword names of current levels
var names = [null, null, null, null];
// 'nodes counts the number of keywords at each level
var nodes = [0,0,0,0];
var name;  //name of the current keyword being processed

function createDocument(name, parent, level) {
    "use strict";
    var newdoc;
    //create a new document in collection=tags, to record the children of 'name'
    // AND, add 'name' to 'parent's list of children, with the new ID of the child document
    
            ////DEBUG: print('     creating doc: ' + name + ' at level: ' + level + ' with parent: ' + parent);
    
    var obj = {'name':name, 'parent':parent, 'level':level,'children':[]};

    db.tags.insert(obj);
    newdoc = db.tags.findOne(obj)._id;  //get back the new _id because 'insert() doesnt return the id
    
            ////DEBUG: print('     newdoc is: ' + newdoc);

    if (parent) db.tags.update({'_id':parent,'children.name':name},{$set:{'children.$.kids':newdoc}});
    
    return newdoc;
};

function addChild(document, name, level ) {
    "use strict";
    // add a child (named "name") to the document
    
            ////DEBUG: print('     adding child: ' + name + ' to doc: ' + document);
    
    db.tags.update({'_id':document},{$push:{'children':{'name':name, 'kids':[]}}});
    nodes[level]++;
};

function verify(line, keywords, name) {
    // check validity of this line
    // for instance, all elements of 'keywords' should be positive integers, 'name' should not be ''
    // on error, print message and exit program
};

var lines = file.split(/[\r\n]+/);  // split file into array of lines

lines.forEach( function(line) {
    
    if (line != '')
    {
        var parts = /^([.\d]+)\s+(.*)/.exec(line);
        levels = parts[1].split('.');
        name = parts[2];
        
        //DEBUG  print('levels: ' + levels + ' || name: ' + name);
        
        if (levels.length < 4) for (var i = 3; i > levels.length - 1; i--) levels[i] = null;  // to extend levels[] to always be 4 element /*
        
        print('  processing line:    ' + line);
        
        verify(line, levels, name);
        
        if (levels[0] != prev[0]) {
            if (levels[1] != null || levels[2] != null || levels[3] != null)  //also check levels == prev+1 ???
                {print('ERROR (84) at line: ' + line);}
            ;
            
            if (documents[0] == null) {
                documents[0] = createDocument('root', null, 0);
            }
            ;
            
            addChild(documents[0], name, 0);
            
            names[0] = name;
            names[1] = names[2] = names[3] = null;
            
            prev[0] = levels[0];
            prev[1] = prev[2] = prev[3] = 0;
            documents[1] = documents[2] = documents[3] = null;
        }
        else if (levels[1] != prev[1]) {
            if (levels[2] != null || levels[3] != null)
                {print('ERROR (99) at line: ' + line);}
            ;
            
            if (documents[1] == null) {
                documents[1] = createDocument(names[0], documents[0], 1);
            }
            ;
            
            addChild(documents[1], name, 1);
            names[1] = name;
            names[2] = names[3] = null;
            
            prev[1] = levels[1];
            prev[2] = prev[3] = 0;
            documents[2] = documents[3] = null;
        }
        else if (levels[2] != prev[2]) {
            if (levels[3] != null)
              {print('ERROR (113) at line: ' + line);}
            ;
            if (documents[2] == null) {
                documents[2] = createDocument(names[1], documents[1], 2);
            }
            ;
            
            addChild(documents[2], name, 2);
            names[2] = name;
            names[3] = null;
            
            prev[2] = levels[2];
            prev[3] = 0;
            documents[3] = null;
        }
        else if (levels[3] != prev[3]) {
            
            if (documents[3] == null) {
                documents[3] = createDocument(names[2], documents[2], 3);
            }
            ;
            
            addChild(documents[3], name, 3);
            names[3] = name;
            
            prev[3] = levels[3];
        }
        else {print('ERROR (135) on line: ' + line);}
    }
});  // end for lines
print('');
print('  ' + nodes[0] + ' level0 keywords, ' + nodes[1] + ' level1 keywords, ' + nodes[2] + ' level2 keywords, ' + nodes[3] + ' level3 keywords');
