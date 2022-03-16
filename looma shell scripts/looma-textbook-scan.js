/*
    PURPOSE: scan a textbook and extract a list of unique words
        augmented with def, part, rw, np for that word
        marked with ch_id, pn of first appearance for that word
        
    - extract all words
    - sort, then 'uniq', then list
    - discard non-words [??]
    - look up with internat APIs for def, part, np
    - if in dictionary
        - if existing ch_id is "greater than" this ch_id, overwrite ch_id and pn with new ch_id and pn
    - else if not in dictionary
        - enter into dictionary
        - mark with ch_id [and pn]
     - check for picture
        - if no picture, add a line to file: "pictures needed"

//  run in MONGO SHELL with: load('looma shell scripts/looma-textbook-scan.js')
 */

// get functions from nikhil's code